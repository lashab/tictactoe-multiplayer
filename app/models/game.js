'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = require('path').join
var debug = require('debug')('game');
var Player = require(join(__dirname, 'player'));
var Room = require(join(__dirname, 'room'));
var $ = require(join(__dirname, '..', 'helpers', 'common'));

module.exports = {
  collection: 'games',
  /**
   * get game collection.
   *
   * @param {Object} db
   * @return {Object} collection
   */
  getCollection: function(db) {
    // get collection.
    var collection = db.collection(this.collection);
    return collection;
  },
  /**
   * add game.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id.
    var id = room._id;
    // room is available.
    var available = room.available;
    // room is avaiable ?
    if (available) {
      // room is fresh.
      var fresh = room.fresh && available;
      // add game.
      collection.save({
        room: id,
        figure: 0,
        figures: [],
        fresh: fresh ? true : false
      }, function(error, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // room is fresh ?
        if (fresh) {
          // add index.
          collection.ensureIndex({
            room: 1
          }, function(error, index) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // index has been added ?
            if (index) {
              // debug game.
              debug('index has been added');
            }
            // :
            else {
              // debug game.
              debug('index has not been added.');
              // return callback - passing database object.
              return callback(null, db, null);
            }
          });
        }
        var _fresh = fresh ? '(fresh game)' : '';
        // debug message.
        var message = done 
          ? '%s for #%d room has been added.' 
            : 'for #%d room hasn\'t been added.';
        // debug game.
        debug(message, _fresh, id);
        // return callback - passing database object.
        return callback(null, db, done);
      });
    }
    // :
    else {
      debug('for #%d room already exists.', id);
      // return callback - passing database object, boolean true.
      return callback(null, db, true);
    }
  },
  /**
   * changes active figure.
   *
   * @param {Object} db
   * @param {Object} id
   * @param {Object} figure
   * @param {Function} callback
   * @return {Function} callback
   */
  changeActiveFigure: function(db, id, figure, callback) {
    // change figure.
    var figure = !figure ? 1 : 0;
    // if the id type is a string
    // cast it to the number.
    if (typeof id === 'string') {
      // Bitshifting casting is 
      // a lot faster.
      id = id >> 0;
    }
    // get collection.
    var collection = this.getCollection(db);
    // update figure.
    collection.findAndModify({
      _id: id
    }, [], {
      $set: {
        figure: figure
      }
    }, {
      new: true
    }, function(err, room) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass the room data to
      // the callback and
      // return.
      return callback(null, db, room);
    });
  },
  /**
   * modifys room state.
   *
   * @param {Object} db
   * @param {Object} id
   * @param {Object} target
   * @param {String} action
   * @param {Function} callback
   * @return {Function} callback
   */
  changeFiguresState: function(db, id, target, action, callback) {
    // define figures array like object
    // assign empty array if target is
    // emtpy.
    var figures = target || [];
    // define update variable
    // defaults to empty 
    // object.
    var update = {};
    // if the id type is a string
    // cast it to the number.
    if (typeof id === 'string') {
      // Bitshifting casting is 
      // a lot faster.
      id = id >> 0;
    }
    // get collection.
    var collection = this.getCollection(db);
    // prepare update.
    update[action] = {
      figures: figures
    }
    // find room by id and
    // push figures.
    collection.findAndModify({
      _id: id
    }, [], update, {
      new: true
    }, function(err, room) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass the room data to
      // the callback and
      // return.
      return callback(null, db, room);
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
      if (!$.isEmptyObject(room)) {
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
        else {
          // Room.setAvaiable
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

          socket.broadcast.in(id).emit('player:waiting', waiting);

          socket.disconnect();

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