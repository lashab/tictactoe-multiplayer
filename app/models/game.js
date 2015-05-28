'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('game');
var player = require('./player');
var room = require('./room');
var $ = require('./../helpers/common');

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
        targets: []
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
   * get game by room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  getGameByRoom: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // find game.
    collection.findOne({
      room: id
    }, function(error, game) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, game object.
      return callback(null, db, game);
    });
  },
  /**
   * join game.
   *
   * @param {Object} db
   * @param {String} _player
   * @param {Function} callback
   * @return {Function} callback
   */
  join: function(db, _player, callback) {
    var _this = this;
    // create || update room.
    room.add(db, function(error, db, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // room has been created || updated ?
      if (room) {
        // add player.
        player.add(db, _player, room, function(error, db, player) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // player has been added ?
          if (player) {
            // get room id.
            var id = room._id;
            // prepare redirect object.
            var redirect = {
              redirect: join('room', '' + id),
              position: player.position
            };
            // add game.
            _this.add(db, room, function(error, db, done) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // game has been added ?
              if (done) {
                // debug game.
                debug('%s has joined to #%d room', player.name, id);
                // return callback - passing database object, redirect object.
                return callback(null, db, redirect);
              }
              // :
              // debug game.
              debug('player couldn\'t be joined');
              // return callback - passing database object.
              return callback(null, db, null);
            });
          }
          // :
          else {
            // return callback - passing database object.
            return callback(null, db, null);
          }
        });
      }
      // :
      else {
        // return callback - passing database object.
        return callback(null, db, null);
      }
    });
  },
  /**
   * leave game.
   *
   * @param {Object} db
   * @param {Object} _player
   * @param {Object} _room
   * @param {Function} callback
   * @return {Function} callback
   */
  leave: function(db, _player, _room, callback) {
    var _this = this;
    // remove player.
    player.remove(db, _player, function(error, db, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // player has been removed ? 
      if (done) {
        // room is avaialable ?
        if (_room.available) {
          // remove room.
          room.remove(db, _room, function(error, db, done) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // room has been removed ? 
            if (done) {
              // remove game.
              _this.remove(db, _room, function(error, db, done) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // debug message
                var message = done
                  ? '%s has left #%d room'
                    : 'player is playing';
                // debug player.
                debug(message, player.name, room._id);
                // return callback - passing database object, done boolean.
                return callback(null, db, done);
              });
            }
            // :
            else {
              // return callback - passing database object.
              return callback(null, db, null);
            }
          });
        }
        // :
        else {
          // open room (make room avaialable).
          room.open(db, _room, function(error, db, done) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // return callback - passing database object, done boolean.
            return callback(null, db, done);
          });
        }
      }
      // :
      else {
        // return callback - passing database object.
        return callback(null, db, null);
      }
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
  changeActiveFigure: function(db, room, callback) {
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
   * modify game state.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Object} target
   * @param {String} action
   * @param {Function} callback
   * @return {Function} callback
   */
  modifyGameState: function(db, room, target, action, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // get taget.
    target = target || [];
    // prepare update object.
    var update = {};
    // prepare update object.
    update[action] = {
      targets: target
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
        ? 'room #%d - targets has been updated'
         : 'room #%d - targets hasn\'t been updated';
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
    var _this = this;
    // socket event - player:join.
    socket.on('player:join', function(_room) {
      // get room id.
      var id = _room.id;
      // get room by id.
      room.getRoomById(db, id, function(error, db, room) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug game.
        debug('room initialize');
        // socket join by room id.
        socket.join(id);
        // socket emit - room:init - passing room object.
        socket.emit('room:init', room);
        // get game by room.
        _this.getGameByRoom(db, room, function(error, db, game) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // debug game.
          debug('game initialize');
          // socket emit - game:init - passing room object.
          socket.emit('game:init', game);
          // get players by room.
          player.getPlayersByRoom(db, room, function(error, db, players) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // debug game.
            debug('players initialize');
            // players === 1 ? 
            if (players.length === 1) {
              // get waiting object.
              var waiting = player.waiting(1);
              // socket emit - player:waiting - passing waiting object.
              socket.emit('player:waiting', waiting);
              // debug game.
              debug('player %s is waiting in #%d room', players[0].name, id);
            }
            // socket emit - player:init - passing players object.
            io.in(id).emit('players:init', players);
          });
        });
      });
    })
    // socket event - game:play.
    .on('game:play', function(data) {
      // get room object.
      var room = data.room;
      // get target object.
      var target = data.target;
      // modify game state.
      _this.modifyGameState(db, room, target, '$push', function(error, db, game) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // get room id.
        var id = room._id;
        // debug game.
        debug('#%d room - targets: %s', id, game.targets);
        // socket emit - game:play - passing object.
        socket.broadcast.in(id).emit('game:play', {
          key: target.key
        });
      });
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