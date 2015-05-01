'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join
var debug = require('debug')('game');
var Room = require(join(__dirname, 'room'));
var Player = require(join(__dirname, 'player'));

module.exports = {
  /**
   * joins player to the game.
   *
   * @param <Object> db
   * @param <String> player
   * @param <Function> callback
   * @return <Function> callback
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
  run: function(db, io, socket, callback) {
    // room event.
    socket.on('init', function(data) {
      // check whether the data
      // has room property with
      // the value room id.
      if ('room' in data && data.room) {
        // define room id.
        var id = data.room;
        // get room by id.
        Room.getRoomById(db, id, function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // socket rooms join.
          socket.join(id);
          // emit client to initialize room.
          // passing room object.
          socket.emit('init', room);
          // get players by room id.
          Player.getPlayersByRoomId(db, id, function(err, db, players) {
            // set loader image path.
            var image = join('..', 'images', 'loading.gif');
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
            // check for players existence.
            if (players.length) {
              // if there is only one player
              // wait for another player.
              if (players.length === 1) {
                // emit client to wait next
                // player pass player wait
                // seat position and wait
                // image.
                socket.emit('waiting for player', {
                  position: 1,
                  image: image
                });
              }
              // emit client to join player passing
              // players array-object.
              io.in(id).emit('join players', players);
            }
            else {
              // debug if players could not
              // be found in database.
              debug('players could\'t be found.')
            }
          });
        });
      }
      else {
        // debug if the data do not have
        // property room with the value
        // room id.
        debug('room property couldn\'t be found.');
      }
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