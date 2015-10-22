// ----------------------------------------------
// Project: Tictactoe
// File: room.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// ----------------------------------------------

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
      // get room object by id.
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
        // increment id by 1.
        id++;
        // id is more then zero ?
        if (id) {
          // get random room object.
          _this.getRandomRoom(db, function(error, db, room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // room is available ?
            if (room) {
              // get room id.
              var _id = room._id;
              // close room.
              _this.close(db, {
                _id: _id
              }, function(error, db, room) {
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
              // create room.
              _this._add(db, {
                _id: id
              }, function(error, db, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
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
   * add room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  _add: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id.
    var id = room._id;
    // add room.
    collection.insertOne({
      _id: id,
      available: true,
      left: -1
    }, function(error, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var done = room.result.ok;
      // debug message.
      var message = done
        ? '#%d has been added.'
          : '#%d hasn\'t been added.';
      // debug room.
      debug(message, id);
      // return callback - passing database object, room object.
      return callback(null, db, room.ops[0]);
    });
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
    // get room id && casting id.
    var id = room._id >> 0;
    // remove room by id.
    collection.remove({
      _id: id
    }, {
      single: true
    }, function(error, _room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = _room.result.ok;
      // debug message.
      var message = ok
        ? '#%d has been removed - %o'
          : '#%d hasn\'t been removed - %o';
      // debug room.
      debug(message, id, room);
      // return callback - passing database object, ok boolean.
      return callback(null, db, ok);
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
    // get room && casting id.
    var id = room._id >> 0;
    // update room.
    collection.findAndModify({
      _id: id
    }, [], {
      $set: {
        available: true,
        left: player.position
      }
    }, {
      new: true
    }, function(error, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var done = room.ok;
      // get room object.
      var _room = room.value;
      // debug message.
      var message = done
        ? '#%d has been opened - %o'
         : '#%d hasn\'t been opened - %o';
      // debug room.
      debug(message, id, _room);
      // return callback - passing database object, room object.
      return callback(null, db, _room);
    });
  },
  /**
   * close room.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  close: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // update room.
    collection.findAndModify({
      _id: id
    }, [], {
      $set: {
        available: false
      }
    }, {
      new: true
    }, function(error, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var done = room.ok;
      // get room object.
      var _room = room.value;
      // debug message.
      var message = done
        ? '#%d has been closed - %o'
         : '#%d couldn\'t been closed - %o';
      // debug room.
      debug(message, id, _room);
      // return callback - passing database object, room object.
      return callback(null, db, _room);
    });
  },
  /**
   * get room object by id.
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
      // debug room.
      debug('get #%d room object - %o', id, room);
      // return callback - passing database object, room object.
      return callback(null, db, room);
    });
  },
  /**
   * get random room object.
   *
   * @param {Object} db
   * @param {Function} callback
   * @return {Function} callback
   */
  getRandomRoom: function(db, callback) {
    // get collection.
    var collection = this.getCollection(db);;
    // find available rooms.
    collection.find({
      available: true
    }).toArray(function(error, rooms) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // rooms size.
      var size = rooms.length;
      // size > 0 ?
      if (size) {
        // get random room object.
        var room = rooms[Math.floor(Math.random() * size)];
        // debug room.
        debug('random room #%d has been chosen - %o', room._id, room);
        // return callback - passing database object, room object.
        return callback(null, db, room);
      }
      // return callback - passing database object.
      return callback(null, db, null);
    });
  }
};
