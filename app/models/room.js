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
   * @param <Object> db
   * @return <Object> collection
   */
  getCollection: function(db) {
    // get collection.
    var collection = db.collection(this.collection);
    return collection;
  },
  /**
   * initialize rooms data merged
   * with default data.
   *
   * @param <Object> data
   * @return <Function> callback
   */
  init: function(data, callback) {
    // default data.
    var room = {
      figure: 1,
      figures: []
    };
    // loop through data.
    for (var i in data) {
      // check whether the default data
      // has provided property.
      if (!room.hasOwnProperty(i)) {
        room[i] = data[i];
      }
      else {
        // don't push existent property
        // debug if it happens.
        debug('Property %s already exists', i);
      }
    }
    // pass room data to
    // the callback and
    // return.
    return callback(room);
  },
  /**
   * count rooms.
   *
   * @param <Object> db
   * @param <Object> query
   * @param <Function> callback
   * @return <Function> callback
   */
  count: function(db, query, callback) {
    // optional query variable.
    var query = query || {};
    // get collection.
    var collection = this.getCollection(db);
    collection.count(query, function(err, count) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass count to the callback
      // and return.
      return callback(null, db, count);
    });
  },
  /**
   * adds new or updates 
   * existent room.
   *
   * @param <Object> db
   * @param <Object> room
   * @param <Function> callback
   * @return <Function> callback
   */
  add: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // initialize room.
    this.init(room, function(room) {
      // save room.
      collection.save(room, function(err, check) {
        // if error happens pass it to
        // the callback and return.
        if (err) {
          return callback(err);
        }
        // if succeeds pass the room
        // data to the callback and
        // return.
        if (check) {
          return callback(null, db, room);
        }
        // if fails pass the null
        // to the callback and
        // return.
        return callback(null, db, null);
      });
    });
  },
  /**
   * get room by id.
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
      // pass the room data to
      // the callback and
      // return.
      return callback(null, db, room);
    });
  },
  /**
   * get random avaiable room.
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
  },
  /**
   * opens room.
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
      var add = function(db, _room) {
        // if id is a existent room id then
        // it will update room and makes
        // the room unavailable else it
        // will create new room.
        _this.add(db, {
          _id: _room.id,
          available: _room.available
        }, function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // if the new room has been created 
          // or existent one has been updated
          // pass the room object to the
          // callback and return. 
          if (room) {
            // append fresh property to
            // the room data.
            room['fresh'] = _room.hasOwnProperty('fresh') ? _room.fresh : false
            return callback(null, db, room);
          }
          // if the new room hasn't been created
          // or existent room hasn't been 
          // updated add debug string and
          // pass null to the callback.
          debug('something went wrong no new rooms created or updated.');
          return callback(null, db, null);
        });
      }
      // if count is more than zero go
      // through avaiable rooms else
      // create very first room.
      if (count) {
        // if available room found make
        // this room unavailable else
        // create another room.
        _this.getRandomAvailableRoom(db, function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // available room exists.
          if (room) {
            // add debug string and
            // update existent room.
            debug('room %d has been closed.', room);
            add(db, {
              id: room,
              available: false
            });
          }
          else {
            // add debug string and
            // another new room.
            debug('room %d has been created.', id);
            add(db, {
              id: id,
              available: true
            });
          }
        });
      }
      else {
        // add debug string and
        // fresh room.
        debug('fresh room %d has been created.', id);
        add(db, {
          id: id,
          available: true,
          fresh: true
        });
      }
    });
  }
};