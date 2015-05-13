'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('room');
var Player = require(join(__dirname, 'player'));

module.exports = {
  collection: 'rooms',
  /**
   * get rooms collection.
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
   * count rooms.
   *
   * @param {Object} db
   * @param {Object} query
   * @param {Function} callback
   * @return {Function} callback
   */
  count: function(db, query, callback) {
    // optional query variable.
    var query = query || {};
    // get collection.
    var collection = this.getCollection(db);
    // count data by query.
    collection.count(query, function(error, count) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, count number.
      return callback(null, db, count);
    });
  },
  /**
   * adds new | modifys room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // save room.
    collection.save(room, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, done boolean.
      return callback(null, db, done);
    });
  },
  /**
   * removes room by id.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  remove: function(db, id, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // remove room by id.
    collection.remove({
      _id: id
    }, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object.
      return callback(null, db);
    });
  },
  /**
   * creates | updates room.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  create: function(db, callback) {
    var _this = this;
    // count rooms.
    this.count(db, null, function(error, db, count) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // increment id by 1.
      var id = count + 1;
      // function for creating or updating room.
      var add = function(db, _room, callback) {
        // prepare room object.
        var room = {
          _id: _room.id,
          available: _room.available,
          fresh: _room.fresh || false
        };
        // id is an existent room ? update
        // room make the room unavailable 
        // : create new room. 
        _this.add(db, room, function(error, db, done) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // New room has been created or updated ?
          if (done) {
            // return callback - passing database object, room object.
            return callback(null, db, room);
          }
          // :
          // debug room.
          debug('something went wrong, new rooms hasn\'t been created or updated.');
          // return callback - passing database object.
          return callback(null, db, null);
        });
      }
      // count is more than zero ? create | update room
      // : create fresh room.
      if (count) {
        // available room found ? make this room 
        // unavailable : create new room.
        _this.getRandomAvailableRoom(db, function(error, db, room) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // room is avaiable ? close room.
          if (room) {
            // update room.
            add(db, {
              id: room,
              available: false
            }, function(error, db, room) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // debug room.
              debug('room %d has been closed.', room);
              // return callback - passing database object, room object.
              return callback(null, db, room);
            });
          }
          else {
            // create room.
            add(db, {
              id: id,
              available: true
            }, function(error, db, room) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // debug room.
              debug('room %d has been created.', id);
              // return callback - passing database object, room object.
              return callback(null, db, room);
            });
          }
        });
      }
      else {
        // create fresh room.
        add(db, {
          id: id,
          available: true,
          fresh: true
        }, function(error, db, room) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // debug fresh room.
          debug('fresh room %d has been created.', id);
          // return callback - passing database object, room object.
          return callback(null, db, room);
        });
      }
    });
  },
  /**
   * joins player to the room.
   *
   * @param {Object} db
   * @param {String} player
   * @param {Function} callback
   * @return {Function} callback
   */
  join: function(db, player, callback) {
    // create | update room.
    this.create(db, function(error, db, room) {
      // passing error to the callback and return.
      if (error) {
        return callback(err);
      }
      if (room) {
        // get room id.
        var id = room._id;
        // join player.
        Player.join(db, {
          room: id,
          name: player,
          active: room.available ? true : false,
          position: room.available ? 0 : 1,
          score: 0
        }, room, function(err, db, player) {
          // return callback - passing error object.
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
        debug('room couldn\'t be created or updated.');
        return callback(null, db, null);
      }
    });
  },
  /**
   * get room by id.
   *
   * @param {Object} db
   * @param {Number|String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  getRoomById: function(db, id, callback) {
    // if the id type is a string
    // cast it to the number.
    if (typeof id === 'string') {
      // Bitshifting casting is 
      // a lot faster.
      id = id >> 0;
    }
    // get collection.
    var collection = this.getCollection(db);
    // find room.
    collection.findOne({
      _id: id,
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
   * make room avaiable by id.
   *
   * @param {Object} db
   * @param {Number} id
   * @param {Function} callback
   * @return {Function} callback
   */
  open: function(db, id, callback) {
    // update room.
    this.add(db, {
      _id: id,
      available: true
    }, function(error, db, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      
      return callback(null, db, room);
    });
  },
  /**
   * get random avaiable room.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  getRandomAvailableRoom: function(db, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // prepare query.
    var query = {
      available: true
    };
    // find available room.
    collection.find(query).toArray(function(err, rooms) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // object ids.
      var ids = [];
      // if available room(s) found.
      if (rooms.length) {
        // loop through available rooms.
        rooms.map(function(room, index) {
          // push object ids.
          ids.push(room._id);
        });
        // pass random room to
        // the callback and 
        // return.
        return callback(null, db, ids[Math.floor(Math.random() * ids.length)]);
      }
      // if there is no avaiable
      // room pass null to the
      // callback and return.
      return callback(null, db, null);
    });
  }
};