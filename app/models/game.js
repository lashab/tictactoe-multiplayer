'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = require('path').join
var debug = require('debug')('game');
var Player = require(join(__dirname, 'player'));
var Room = require(join(__dirname, 'room'));
var c = require(join(__dirname, '..', 'helpers', 'common'));

module.exports = {
  /**
   * joins player to the game.
   *
   * @param {Object} db
   * @param {String} player
   * @param {Function} callback
   * @return {Function} callback
   */
  join: function(db, player, callback) {
    // open room.
    Room.open(db, function(err, db, room) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      if (room) {
        // room id.
        var id = room._id;
        // join player.
        Player.in(db, {
          room: id,
          name: player,
          active: room.available ? true : false,
          position: room.available ? 0 : 1,
          score: 0
        }, room, function(err, db, player) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // if player has been added pass
          // the redirect path, player id
          // to the callback and return.
          if (player) {
            debug('%s has joined %d room', player.name, id);
            return callback(null, db, {
              redirect: join('room', '' + id),
              position: player.position
            });
          }
          else {
            // if player has not been added
            // pass null to the callback
            // and return.
            debug('player could not join %d room', id);
            return callback(null, db, null);
          }
        });
      }
      else {
        // if room has not been added
        // pass null to the callback
        // and return.
        debug('room could not be opened');
        return callback(null, db, null);
      }
    });
  },
  /**
   * runs the game.
   *
   * @param {Object} db
   * @param {Object} io
   * @param {Object} socket
   * @return {Function} callback
   */
  run: function(db, io, socket, callback) {
    // player:join event.
    socket.on('player:join', function(room) {
      // check for room object.
      if (!c.isEmptyObject(room)) {
        // get room id.
        var room = room.id;
        // get room by id.
        Room.getRoomById(db, room, function(err, db, _room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // socket rooms join by id.
          socket.join(room);
          // emit client to initialize room.
          // passing room object.
          socket.emit('room:init', _room);
          // get players by room id.
          Player.getPlayersByRoomId(db, room, function(err, db, players) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
            // check for players.
            if (players.length) {
              // check for players, if only one player found
              // emit to wait for oppononet.
              if (players.length === 1) {
                // get waiting object.
                var waiting = Player.waiting(1);
                // emit client to wait next player passing
                // waiting object.
                socket.emit('player:waiting', waiting);
              }
              // emit clients to initialize players passing
              // players object.
              io.in(room).emit('players:init', players);
            }
            else {
              // debug if the players object couldn't be found.
              debug('players could\'t be found.');
            }
          });
        });
      }
      else {
        // debug if the room object couldn't be found.
        debug('room couldn\'t be found.');
      }
    })
    // player:leave event.
    .on('player:leave', function(data) {
      // check for data object.
      if (!c.isEmptyObject(data)) {
        // get room object.
        var room = data.room;
        // get player object.
        var player = data.player;
        // get waiting.
        var isWaiting = data.isWaiting;
        // get room id.
        var id = room._id;
        // if the room is in waiting state
        // remove room.
        if (isWaiting) {
          // remove room.
          Room.remove(db, id, function(err, db) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
          });
        }
        // remove player.
        Player.remove(db, player._id, function(err, db) {
          // get waiting object.
          var waiting = Player.waiting(player.position);
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // disconnect.
          socket.disconnect();

          socket.broadcast.in(id).emit('player:waiting', waiting);

          return callback(null, db);

        });
      }
    })
    .on('error', function() {

    })
    // play event.
    .on('play', function(data) {
      // check whether the data
      // has room property with
      // the value room id.
      if ('room' in data && data.room) {
        // get room id.
        var id = data.room;
        // get target.
        var target = data.target;
        // update figures state.
        Room.updateFiguresState(db, id, target, '$push', function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
        });
        // emit clients play game
        // passing target index.
        socket.broadcast.in(id).emit('play', {
          index: target.index
        });
      }
      else {
        // debug if the data has not have
        // property room with the value
        // room id.
        debug('room couldn\'t be found.');
      }
    })
    // switch event.
    .on('switch', function(data) {
      // check whether the data
      // has room property with
      // the value room id.
      if ('room' in data && data.room) {
        // get room id.
        var id = data.room;
        // switch player.
        Player.switchActivePlayer(db, id, function(err, db, players) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // switch figure.
          Room.switchActiveFigure(db, id, data.figure, function(err, db, room) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
            // emit client to switch
            // figure and player.
            io.in(id).emit('switch', {
              room: room,
              players: players
            });
          });
        });
      }
      else {
        // debug if the data has not have
        // property room with the value
        // room id.
        debug('room couldn\'t be found.');
      }
    })
    // restart event.
    .on('restart', function(data) {
      // check whether the data
      // has room property with
      // the value room id.
      if ('room' in data && data.room) {
        // get room id.
        var id = data.room;
        // get winner player id.
        var player = data.wins;
        // dalete state.
        Room.updateFiguresState(db, id, null, '$set', function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // reset figure.
          Room.switchActiveFigure(db, id, 0, function(err, db, room) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
            // update player score.
            Player.updatePlayerScore(db, player, function(err, db) {
              // if error happens pass it to
              // the callback and return.
              if (err) {
                return callback(err);
              }
              // get players by id.
              Player.getPlayersByRoomId(db, id, function(err, db, players) {
                // if error happens pass it to
                // the callback and return.
                if (err) {
                  return callback(err);
                }
                // emit clients to restart game, passing
                // room, players and winner combination 
                // objects.
                io.in(id).emit('restart', {
                  room: room,
                  players: players, 
                  combination: data.combination
                });
              });
            });
          });
        });
      }
      else {
        // debug if the data has not have
        // property room with the value
        // room id.
        debug('room couldn\'t be found.');
      }
    });
  }
};