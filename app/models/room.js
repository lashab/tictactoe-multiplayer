'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('room');

module.exports = {
  collection: 'rooms',
  /**
   * get room collection.
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
   * add || update room.
   *
   * @param {Object} db
   * @param {Number} id 
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, id, callback) {
    var _this = this;
    // get collection.
    var collection = this.getCollection(db);
    // id is more then 0 ? 
    if (id) {
      // get room by id.
      this.getRoomById(db, id, function(error, db, room) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // return callback - passing database object, room object.
        return callback(null, db, room);
      });
    }
    // :
    else {
      // find room.
      collection.findOne({}, {
        _id: 1,
        sort: {
          $natural: -1
        }
      }, function(error, room) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // room id set.
        var id = room ? room._id : 0;
        // casting id.
        id = id >> 0;
        // debug room.
        debug('- %d', id);
        //increment id by 1.
        id++;
        // id is more then zero ? create || update room
        if (id) {
          // available room found ? make this room 
          // unavailable : create new room.
          _this.getRandomRoom(db, function(error, db, room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // room is avaiable ? close room.
            if (room) {
              // get room id.
              var _id = room._id;
              // update room.
              _this.modify(db, {
                id: _id,
                left: room.left
              }, function(error, db, _room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // debug room.
                debug('#%d has been closed.', _id);
                // return callback - passing database object, room object.
                return callback(null, db, _room);
              });
            }
            // :
            else {
              // create room.
              _this.modify(db, {
                id: id,
                available: true,
                left: NaN
              }, function(error, db, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // debug room.
                debug('#%d has been added.', id);
                // return callback - passing database object, room object.
                return callback(null, db, room);
              });
            }
          });
        }
        // :
        else {
          // debug room.
          debug('id couldn\'t be found.');
          // return callback - passing database object.
          return callback(null, db, null); 
        }
      });
    }
  },
  /**
   * remove room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  remove: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id.
    var id = room._id;
    // casting id.
    id = id >> 0;
    // remove room by id.
    collection.remove({
      _id: id
    }, {
      single: true
    }, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // debug message.
      var message = done 
        ? '#%d has been removed'
          : '#%d hasn\'t been removed';
      // debug player.
      debug(message, id);
      // return callback - passing database object done boolean.
      return callback(null, db, done);
    });
  },
  /**
   * create || update room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  modify: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // prepare room object.
    var _room = {
      _id: room.id,
      available: room.available || false,
      left: room.left
    };
    // id is an existent room ? update
    // room make the room unavailable
    // : create new room.
    collection.save(_room, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // new room has been created || updated ?
      if (done) {
        // return callback - passing database object, room object.
        return callback(null, db, _room);
      }
      // :
      // debug room.
      debug('room hasn\'t been created || updated.');
      // return callback - passing database object.
      return callback(null, db, null);
    });
  },
  /**
   * open room.
   *
   * @param {Object} db
   * @param {Object} player
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  open: function(db, player, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room
    var id = room._id;
    // casting id.
    id = id >> 0;
    // update room.
    collection.update({
      _id: id
    }, {
      $set: {
        available: true,
        left: player.position
      }
    }, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // debug message.
      var message = done
        ? '#%d has been opened'
         : '#%d hasn\'t been opened';
      // debug room.
      debug(message, id);
      // return callback - passing database object, done boolean.
      return callback(null, db, done);
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
    // get collection.
    var collection = this.getCollection(db);
    // casting id.
    id = id >> 0;
    // find room.
    collection.findOne({
      _id: id
    }, function(error, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, room object.
      return callback(null, db, room);
    });
  },
  /**
   * get random available room.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  getRandomRoom: function(db, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // prepare query object.
    var query = {
      available: true
    };
    // find available rooms.
    collection.find(query).toArray(function(error, rooms) {
      // rooms size.
      var _rooms = rooms.length;
      // debug room.
      debug('available rooms - %d', _rooms);
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      if (_rooms) {
        // return callback - passing database object, random room object.
        return callback(null, db, rooms[Math.floor(Math.random() * _rooms)]);
      }
      // return callback - passing database object.
      return callback(null, db, null);
    });
  }
};