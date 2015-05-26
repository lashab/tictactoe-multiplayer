'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var debug = require('debug')('game');

module.exports = function(Room, Player) {
  return {
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
     * @param {Object} room
     * @param {Function} callback
     * @return {Function} callback
     */
    add: function(db, room, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id && casting id.
      var id = room._id >> 0;
      // room is available.
      var available = room.available;
      // room is avaiable ?
      if (available) {
        // add game.
        collection.save({
          room: id,
          figure: 0,
          figures: []
        }, function(error, done) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
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
              debug('room field has been indexed.');
            }
            // :
            else {
              // debug game.
              debug('room field hasn\'t been indexed.');
              // return callback - passing database object.
              return callback(null, db, null);
            }
          });
          // debug message.
          var message = done 
            ? 'for #%d room has been added.' 
              : 'for #%d room hasn\'t been added.';
          // debug game.
          debug(message, id);
          // return callback - passing database object.
          return callback(null, db, done);
        });
      }
      // :
      else {
        debug('for #%d room has already been added.', id);
        // return callback - passing database object, boolean true.
        return callback(null, db, true);
      }
    },
    /**
     * remove game.
     *
     * @param {Object} db
     * @param {Object} room
     * @param {Function} callback
     * @return {Function} callback
     */
    remove: function(db, room, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id && casting id.
      var id = room._id >> 0;
      // remove player by id.
      collection.remove({
        room: id
      }, {
        single: true
      }, function(error, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? 'for #%d has been removed'
            : 'for #%d hasn\'t been removed';
        // debug game.
        debug(message, id);
        // return callback - passing database object, done boolean.
        return callback(null, db, done);
      });
    },
    /**
     * change active figure.
     *
     * @param {Object} db
     * @param {Object} game
     * @param {Function} callback
     * @return {Function} callback
     */
    changeActiveFigure: function(db, game, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id && casting id.
      var id = game.room >> 0;
      // change active figure.
      var figure = !game.figure ? 1 : 0;
      // update figure.
      collection.findAndModify({
        room: id
      }, [], {
        $set: {
          figure: figure
        }
      }, {
        new: true
      }, function(error, game, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? 'room #%d - figure has been updated'
            : 'room #%d - figure hasn\'t updated';
        // debug game.
        debug(message, id);
        // return callback - passing database object, game object.
        return callback(null, db, game);
      });
    },
    /**
     * change game state.
     *
     * @param {Object} db
     * @param {Object} game
     * @param {Object} target
     * @param {String} action
     * @param {Function} callback
     * @return {Function} callback
     */
    changeGameState: function(db, game, target, action, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id && casting id.
      var id = game.room >> 0;
      // get taget.
      target = target || [];
      // prepare update object.
      var update = {};
      // prepare update object.
      update[action] = {
        figures: target
      };
      // push target || remove target.
      collection.findAndModify({
        room: id
      }, [], update, {
        new: true
      }, function(error, game, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? 'room #%d - figures has been updated'
           : 'room #%d - figures hasn\'t been updated';
        // debug game.
        debug(message, id);
        // return callback passing database object, game object. 
        return callback(null, db, game);
      });
    },
    /**
     * run game.
     *
     * @param {Object} db
     * @param {Object} io
     * @param {Object} socket
     * @return {Function} callback
     */
    run: function(db, io, socket, callback) {
      // socket event - player:join.
      socket.on('player:join', function(room) {
        // room object is not empty ?
        if (!$.isEmptyObject(room)) {
          // get room id.
          var room = room.id;
          // get room by id.
          Room.getRoomById(db, room, function(error, db, _room) {
            console.log(_room);
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // socket join by room id.
            socket.join(room);
            // socket emit - room:init - passing _room object.
            socket.emit('room:open', _room);
            // get players by room id.
            console.log(Player);
            Player.getPlayersByRoom(db, _room, function(error, db, players) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // players > 0 ?
              if (players.length) {
                // players === 1 ? 
                if (players.length === 1) {
                  // get waiting object.
                  var waiting = Player.waiting(1);
                  // socket emit - player:waiting - passing waiting object.
                  socket.emit('player:waiting', waiting);
                  // debug game.
                  debug('player %s is waiting in #%d room', players[0].name, room);
                }
                // socket emit - player:init - passing players object.
                io.in(room).emit('players:init', players);
              }
              // :
              else {
                // debug game.
                debug('players could\'t be found.');
              }
            });
          });
        }
        // :
        else {
          // debug game.
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
  }
};