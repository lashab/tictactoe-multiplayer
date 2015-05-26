'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = path.join;
var objectID = require('mongodb').ObjectID;
var debug = require('debug')('player');

module.exports = function (Room, Game) {
  return {
    collection: 'players',
    /**
     * get players collection.
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
     * add player.
     *
     * @param {Object} db
     * @param {String} player
     * @param {Object} room
     * @param {Function} callback
     * @return {Function} callback
     */
    add: function(db, player, room, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id.
      var id = room._id;
      // casting id.
      id = id >> 0;
      // prepare player object.
      var _player = {
        room: id,
        name: player,
        active: room.available ? true : false,
        position: room.available ? 0 : 1,
        score: 0
      };
      // add new player.
      collection.save(_player, function(error, done) {
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
            // debug player.
            debug('room field has been indexed.');
          }
          // :
          else {
            // debug player.
            debug('room field hasn\'t been indexed.');
            // return callback - passing database object.
            return callback(null, db, null);
          }
        });
        // player has been added ? 
        if (done) {
          // debug player.
          debug('%s has been added.', player);
          // return callback - passing database object, player object.
          return callback(null, db, _player);
        }
        // :
        // debug player.
        debug('player hasn\'t been added.');
        // return callback - passing database object.
        return callback(null, db, null);
      });
    },
    /**
     * remove player.
     *
     * @param {Object} db
     * @param {Object} player
     * @param {Function} callback
     * @return {Function} callback
     */
    remove: function(db, player, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // remove player by id.
      collection.remove({
        _id: new objectID(player._id)
      }, {
        single: true
      }, function(error, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? '%s has been removed'
            : '%s hasn\'t been removed';
        // debug player.
        debug(message, player.name);
        // return callback - passing database object done boolean.
        return callback(null, db, done);
      });
    },
    /**
     * join player.
     *
     * @param {Object} db
     * @param {String} player
     * @param {Function} callback
     * @return {Function} callback
     */
    join: function(db, player, callback) {
      var _this = this;
      // create || update room.
      Room.add(db, function(error, db, room) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // room has been created || updated ?
        if (room) {
          // add player.
          _this.add(db, player, room, function(error, db, player) {
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
              Game.add(db, room, function(error, db, done) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // game has been added ?
                if (done) {
                  // debug player.
                  debug('%s has joined to #%d room', player.name, id);
                  // return callback - passing database object, redirect object.
                  return callback(null, db, redirect);
                }
                // :
                // debug player.
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
     * leave player.
     *
     * @param {Object} db
     * @param {Object} player
     * @param {Object} room
     * @param {Function} callback
     * @return {Function} callback
     */
    leave: function(db, player, room, callback) {
      var _this = this;
      // remove player.
      this.remove(db, player, function(error, db, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // player has been removed ? 
        if (done) {
          // room is avaialable ?
          if (room.available) {
            // remove room.
            Room.remove(db, room, function(error, db, done) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // room has been removed ? 
              if (done) {
                // remove game.
                Game.remove(db, room, function(error, db, done) {
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
            Room.open(db, room, function(error, db, done) {
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
     * get player by id.
     *
     * @param {Object} db
     * @param {String} id
     * @param {Function} callback
     * @return {Function} callback
     */
    getPlayerById: function(db, id, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // find player by id.
      collection.findOne({
        _id: new objectID(id)
      }, function(error, player) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // return callback - passing database object, player object.
        return callback(null, db, player);
      });
    },
    /**
     * get players by room.
     *
     * @param {Object} db
     * @param {Object} room
     * @param {Function} callback
     * @return {Function} callback
     */
    getPlayersByRoom: function(db, room, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // get room id && casting id.
      var id = room._id >> 0;
      // find players by room id.
      collection.find({
        room: id
      }, function(error, players) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug player.
        debug('%d found in #%d room', players.length, id);
        // return callback - passing database object, players object.
        return callback(null, db, players);
      });
    },
    /**
     * get player waiting object.
     *
     * @param {Object} player
     * @return {Object} waiting
     */
    waiting: function(position) {
      // get waiting (loading) image.
      var image = join('..', 'images', 'loading.gif');
      // prepare waiting object.
      var waiting = {
        position: position,
        image: image
      };
      // return waiting object.
      return waiting;
    },
    /**
     * switch player.
     *
     * @param {Object} db
     * @param {Array} players
     * @param {Function} callback
     * @return {Function} callback
     */
    switch: function(db, players, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // loop through players.
      players.forEach(function(player) {
        // change active player.
        player.active = !player.active ? true : false;
        // update player.
        collection.save(player, function(error, done) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // debug message.
          var message = done
            ? '#%d room - player %s has been switched.'
              : '#%d room - player could\'t not be switched.';
          // debug player.
          debug(message, player.room, player.name);
        });
      });
      // return callback - passing database object, players array.
      return callback(null, db, players);
    },
    /**
     * update player score.
     *
     * @param {Object} db
     * @param {String} id
     * @param {Function} callback
     * @return {Function} callback
     */
    updateScore: function(db, id, callback) {
      // get collection.
      var collection = this.getCollection(db);
      // do not update score if the id
      // is null pass database object
      // to the callback and return. 
      if (!id) {
        return callback(null, db);
      }
      // find player by id and increment score by 1.
      collection.findAndModify({
        _id: new objectID(id)
      }, [], {
        $inc: {
          score: 1
        }
      }, {}, function(err) {
        // if error happens pass it to
        // the callback and return.
        if (err) {
          return callback(err);
        }
        // pass database object to the callback
        // and return.
        return callback(null, db);
      });
    },
  }
};