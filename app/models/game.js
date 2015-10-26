// --------------------------------------------------------
// Project: Tictactoe
// File: game.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// --------------------------------------------------------

'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var cookie = require('cookie');
var debug = require('debug')('game');
var _ = require('underscore');
var player = require('./player');
var room = require('./room');

var rooms = {};

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
    // room is avaiable ?
    if (room.available) {
      // add game.
      collection.save({
        room: id,
        figure: 1,
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
            debug('room field couldn\'t be indexed.');
            // return callback - passing database object.
            return callback(null, db, null);
          }
        });
        // debug message.
        var message = done
          ? 'for #%d room has been added.'
            : 'for #%d room couldn\'t be added.';
        // debug game.
        debug(message, id);
        // return callback - passing database object, done boolean.
        return callback(null, db, done);
      });
    }
    // :
    else {
      // debug game.
      debug('for #%d room exists.');
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
    }, function(error, game) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = game.result.ok;
      // debug message.
      var message = ok
        ? 'for #%d has been removed.'
          : 'for #%d couldn\'t be removed.';
      // debug game.
      debug(message, id);
      // return callback - passing database object, done boolean.
      return callback(null, db, ok);
    });
  },
  /**
   * reset game.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  reset: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // update game.
    collection.findAndModify({
      room: id
    }, [], {
      $set: {
        figure: 1,
        targets: []
      }
    }, {
      new: true
    }, function(error, game) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = game.ok;
      // get players object.
      var _game = game.value;
      // debug message.
      var message = ok
        ? 'has been reseted for #%d room - %o'
          : 'couldn\'t be reseted for #%d room - %o';
      // debug game.
      debug(message, id, _game);
      // return callback - passing database object, game object.
      return callback(null, db, _game);
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
      // debug game.
      debug('object for #%d room - %o', id, game);
      // return callback - passing database object, game object.
      return callback(null, db, game);
    });
  },
  /**
   * join game.
   *
   * @param {Object} db
   * @param {String} _player
   * @param {Number} id
   * @param {Function} callback
   * @return {Function} callback
   */
  join: function(db, _player, id, callback) {
    var _this = this;
    // create || update room.
    room.add(db, id, function(error, db, room) {
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
              room: id,
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
                // debug game.
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
          // open room.
          room.open(db, _player, _room, function(error, db, room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // reset player.
            player.reset(db, _room, function(error, db, players) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // reset game.
              _this.reset(db, _room, function(error, db, game) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                var _data = {
                  room: room,
                  game: game,
                  players: players
                };
                // return callback - passing database object, data object.
                return callback(null, db, _data);
              });
            });
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
      // get ok value.
      var ok = game.ok;
      // get game object.
      var _game = game.value;
      // debug message.
      var message = ok
        ? 'room #%d - figure has changed to #%d - %o'
          : 'room #%d - figure couldn\'t be changed.';
      // debug game.
      debug(message, id, figure, _game);
      // return callback - passing database object, game object.
      return callback(null, db, _game);
    });
  },
  /**
   * modify game state.
   *
   * @param {Object} db
   * @param {Object} game
   * @param {Object} target
   * @param {String} action
   * @param {Function} callback
   * @return {Function} callback
   */
  modifyGameState: function(db, game, target, action, callback) {
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
      targets: target
    };
    // push target || remove target.
    collection.findAndModify({
      room: id
    }, [], update, {
      new: true
    }, function(error, game) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = game.ok;
      // get game object.
      var _game = game.value;
      // debug message.
      var message = done
        ? 'targets has been updated in room #%d - %o'
         : 'targets couldn\'t be updated in room #%d - %o';
      // debug game.
      debug(message, id, _game);
      // return callback passing database object, game object.
      return callback(null, db, _game);
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
        // pushing rooms.
        rooms = io.sockets.adapter.rooms;
        // socket emit - room:init - passing room object.
        io.in(id).emit('room:init', room);
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
              // socket emit - player:waiting - passing waiting object.
              socket.emit('player:waiting', {
                position: ~~!players[0].position
              });
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
      var game = data.game;
      // get target object.
      var target = data.target;
      // modify game state.
      _this.modifyGameState(db, game, target, '$push', function(error, db, game) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // get room id.
        var id = game.room;
        // debug game.
        debug('#%d room - targets: %s', id, JSON.stringify(game.targets));
        // socket emit - game:play - passing object.
        socket.broadcast.in(id).emit('game:play', target);
      });
    })
    // socket event - players:switch.
    .on('players:switch', function(data) {
      // get room object.
      var game = data.game;
      // get target object.
      var players = data.players;
      // switch players.
      player.switch(db, players, function(error, db, players) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // change active figure.
        _this.changeActiveFigure(db, game, function(error, db, game) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // get room id.
          var id = game.room;
          // socket emit - players:switch - passing object.
          io.in(id).emit('players:switch', {
            game: game,
            players: players
          });
        });
      });
    })
    // socket event - game:restart.
    .on('game:restart', function(data) {
      // get game object.
      var game = data.game;
      // modify state.
      _this.modifyGameState(db, game, null, '$set', function(error, db, game) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // reset figure.
        game.figure = 0;
        // change active figure.
        _this.changeActiveFigure(db, game, function(error, db, game) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // get room object.
          var room = data.room;
          // update player score.
          player.updateScore(db, room, data.wins, function(error, db, players) {
            // get players by room.
            _this.getPlayersByRoom(db, room, function(error, db, players) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // return callback - passing database object, players object.
              return callback(null, db, players);
            });
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // socket emit - game:restart - passing object.
            io.in(game.room).emit('game:restart', {
              game: game,
              players: players,
              combination: data.combination
            });
          });
        });
      });
    })
    .on('disconnect', function() {
      // cookies isn't empty ?
      if (socket.handshake.headers.cookie) {
        // get cookie object.
        var _cookie = cookie.parse(socket.handshake.headers.cookie);
        // get room id.
        var id = _cookie.id;
        // get position.
        var position = _cookie.position;
        // get rooms object size.
        var _size = !_.isEmpty(rooms) ? _.size(rooms[id]) : 0;
        // 5s.
        setTimeout(function() {
          // get rooms object size.
          var size = _.size(rooms[id]);
          // size === _size ?
          if (size === _size) {
            // get player object by query object.
            player.getPlayersByObject(db, {
              room: id,
              position: position
            }, function(error, db, player) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // get room object by id.
              room.getRoomById(db, id, function(error, db, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // leave game.
                _this.leave(db, player, room, function(error, db, data) {
                  // return callback - passing error object.
                  if (error) {
                    return callback(error);
                  }
                  if (!room.available && typeof data === 'object') {
                    // add waiting object.
                    data.position = _player.position;
                    // socket emit - player:waiting - passing waiting object.
                    socket.broadcast.in(room._id).emit('player:waiting', data);
                  }
                });
              });
            });
          }
          // :
          else {
            // debug game.
            debug('is on.');
          }
        }, 5000);
      }
      // :
      else {
        // debug game.
        debug('cookie is empty.');
      }
    })
  }
};
