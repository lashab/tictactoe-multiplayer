'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('room');

module.exports = {
  collection: 'rooms',

  /**
   * getCollection() returns rooms collection.
   *
   * @param <Object> db
   * @return <Object> collection
   */
  getCollection: function(db) {
    var collection = db.collection(this.collection);
    return collection;
  },

  /**
   * init() returns default room options
   * merged with provided options.
   *
   * @param <Object> options
   * @return <Object> defaults
   */
  init: function(options) {
    // default options.
    var defaults = {
      figure: 1,
      figures: []
    };
    for (var i in options) {
      // check whether default options
      // have provided property.
      if (!defaults.hasOwnProperty(i)) {
        defaults[i] = options[i];   
      }
      else {
        // don't push existent property
        // debug if it happens.
        debug('Property %s already exists', i);
      }
    }
    return defaults;
  },

  /**
   * count() counts rooms.
   *
   * @param <Object> db
   * @param <Object> query
   * @param <Function> callback
   * @return <Function> callback
   */
  count: function(db, query, callback) {
    //optional query variable.
    var query = query || {};
    // get collection.
    var collection = this.getCollection(db);
    collection.count(query, function(err, count) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // otherwise return rooms count.
      return callback(null, db, count);
    });
  },

  /**
   * add() adds new room.
   *
   * @param <Object> db
   * @param <Object> options
   * @param <Function> callback
   * @return <Function> callback
   */
  add: function(db, options, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // initialize room.
    var room_options = this.init(options);
    // save room.
    collection.save(room_options, function(err, check) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // otherwise return the callback 
      // with check argument to test 
      // whether the data is being saved.
      return callback(null, db, check);
    }); 
  },

  /**
   * getRoomById() returns the room
   * with specified id.
   *
   * @param <Object> db
   * @param <Number|String> id
   * @param <Function> callback
   * @return <Function> callback
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
      // otherwise return last
      // added room object.
      return callback(null, db, room);
    });
  },

  /**
   * getRandomAvailableRoom() returns 
   * random available room.
   *
   * @param <Object> db
   * @param <Function> callback
   * @return <Function> callback
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
        // get random room.
        return callback(null, db, ids[Math.floor(Math.random() * ids.length)]);
      }
      // No available room(s) found.
      return callback(null, db, null);
    });
  }
};