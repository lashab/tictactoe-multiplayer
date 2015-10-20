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
   * @param {Object} database
   * @return {Object} collection
   */
  getCollection: function(database) {
    // get collection.
    var collection = database.collection(this.collection);
    return collection;
  },
  /**
   * add || update room.
   *
   * @param {Object} database
   * @param {Number} id
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(database, id, callback) {
    var _this = this;
    // get collection.
    var collection = this.getCollection(database);
    // id is more then 0 ?
    if (id) {
      // get room object by id.
      this.getRoomById(database, id, function(error, database, room) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // return callback - passing database object, room object.
        return callback(null, database, room);
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
          _this.getRandomRoom(database, function(error, database, room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // room is available ?
            if (room) {
              // get room id.
              var _id = room._id;
              // close room.
              _this.close(database, {
                _id: _id
              }, function(error, database, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // return callback - passing database object, room object.
                return callback(null, database, room);
              });
            }
            // :
            else {
              // create room.
              _this._add(database, {
                _id: id
              }, function(error, database, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // return callback - passing database object, room object.
                return callback(null, database, room);
              });
            }
          });
        }
        // :
        else {
          // debug room.
          debug('id couldn\'t be found.');
          // return callback - passing database object.
          return callback(null, database, null);
        }
      });
    }
  },
  /**
   * add room.
   *
   * @param {Object} database
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  _add: function(database, room, callback) {
    // get collection.
    var collection = this.getCollection(database);
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
      return callback(null, database, room.ops[0]);
    });
  },
  /**
   * remove room.
   *
   * @param {Object} database
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  remove: function(database, room, callback) {
    // get collection.
    var collection = this.getCollection(database);
    // get room id && casting id.
    var id = room._id >> 0;
    // remove room by id.
    collection.remove({
      _id: id
    }, {
      single: true
    }, function(error, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var done = room.result.ok;
      // debug message.
      var message = done
        ? '#%d has been removed.'
          : '#%d hasn\'t been removed.';
      // debug room.
      debug(message, id);
      // return callback - passing database object, done boolean.
      return callback(null, database, done);
    });
  },
  /**
   * open room.
   *
   * @param {Object} database
   * @param {Object} player
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  open: function(database, player, room, callback) {
    // get collection.
    var collection = this.getCollection(database);
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
      // debug message.
      var message = done
        ? '#%d has been opened.'
         : '#%d hasn\'t been opened.';
      // debug room.
      debug(message, id);
      // return callback - passing database object, room object.
      return callback(null, database, room.value);
    });
  },
  /**
   * close room.
   *
   * @param {Object} database
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  close: function(database, room, callback) {
    // get collection.
    var collection = this.getCollection(database);
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
      // debug message.
      var message = done
        ? '#%d has been closed.'
         : '#%d hasn\'t been closed.';
      // debug room.
      debug(message, id);
      // return callback - passing database object, room object.
      return callback(null, database, room.value);
    });
  },
  /**
   * get room object by id.
   *
   * @param {Object} database
   * @param {Number|String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  getRoomById: function(database, id, callback) {
    // get collection.
    var collection = this.getCollection(database);
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
      debug('get #%d room object.', room._id);
      // return callback - passing database object, room object.
      return callback(null, database, room);
    });
  },
  /**
   * get random room object.
   *
   * @param {Object} database
   * @param {Function} callback
   * @return {Function} callback
   */
  getRandomRoom: function(database, callback) {
    // get collection.
    var collection = this.getCollection(database);;
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
        debug('random room #%d has been chosen.', room._id);
        // return callback - passing database object, room object.
        return callback(null, database, room);
      }
      // return callback - passing database object.
      return callback(null, database, null);
    });
  }
};
