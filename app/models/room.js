'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('room');

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
   * adds | updates room.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, callback) {
    var _this = this;
    // get collection.
    var collection = this.getCollection(db);
    // count rooms.
    this.count(db, null, function(error, db, count) {
      // debug room.
      debug('counts - %d', count);
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
        collection.save(room, function(error, done) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // New room has been created | updated ?
          if (done) {
            // return callback - passing database object, room object.
            return callback(null, db, room);
          }
          // :
          // debug room.
          debug('something went wrong, new room hasn\'t been created or updated.');
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
              available: false,
              fresh: room === 1 ? true : false
            }, function(error, db, _room) {
              // return callback - passing error object.
              if (error) {
                return callback(error);
              }
              // debug room.
              debug('#%d has been closed.', room);
              // return callback - passing database object, room object.
              return callback(null, db, _room);
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
              debug('#%d has been created.', id);
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
          // debug room.
          debug('(fresh room) #%d has been created.', id);
          // return callback - passing database object, room object.
          return callback(null, db, room);
        });
      }
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
   * opens room (makes it avaiable).
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
        rooms.forEach(function(room, index) {
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