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
   * add() adds new room
   * or updates existent one.
   *
   * @param <Object> db
   * @param <Object> options
   * @param <Function> callback
   * @return <Function> callback
   */
  add: function(db, options, callback) {
    console.log(options);
    // get collection.
    var collection = this.getCollection(db);
    // initialize room.
    var _options = this.init(options);
    // save room.
    collection.save(_options, function(err, check) {
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
      // no available room(s) found.
      return callback(null, db, null);
    });
  },
  /**
   * open() opens room.
   *
   * @param <Object> db
   * @param <Function> callback
   * @return <Function> callback
   */
  open: function(db, callback) {
    var _this = this;
    // count rooms.
    this.count(db, null, function(err, db, count) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // increment id.
      var id = count + 1;
      // anonymous function for creating
      // or updating existent room.
      var add = function(db, id, available) {
        // if id is a existent room id then
        // it will update room and makes
        // the room unavailable else it
        // will create new room.
        _this.add(db, {
          _id: id,
          available: available
        }, function(err, db, check) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // if it succeeds pass the
          // id within the callback.
          if (check) {
            return callback(null, db, id);
          }
        });
      }
      // if count is more than zero go
      // through avaiable rooms else
      // create very first room.
      if (count) {
        // if available room found
        // make this room unavailable
        // else create another room.
        _this.getRandomAvailableRoom(db, function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // available room exists.
          if (room) {
            // update existent room.
            add(db, room, false);
          }
          else {
            // add another new room.
            add(db, id, true);
          }
        });
      }
      else {
        // fresh room.
        add(db, id, true);
      }
    });
  }
};