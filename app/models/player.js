'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var objectID = require('mongodb').ObjectID;

module.exports = {
  collection: 'players',
  /**
   * getCollection() returns players collection.
   *
   * @param <Object> db
   * @return <Object> collection
   */
  getCollection: function(db) {
    var collection = db.collection(this.collection);
    return collection;
  },
  /**
   * init() returns player data merged
   * with provided data.
   *
   * @param <Object> data
   * @param <Function> callback
   * @return <Function> callback
   */
  init: function(data, callback) {
    // default data.
    var player = {
      score: 0
    };
    for (var i in data) {
      // check whether the default data
      // has provided property.
      if (!player.hasOwnProperty(i)) {
        player[i] = data[i];
      }
      else {
        // don't push existent property
        // debug if it happens.
        debug('Property %s already exists', i);
      }
    }
    // passes the room data 
    // to the callback.
    return callback(player);
  },
  /**
   * add() adds new player
   * or updates existent one.
   *
   * @param <Object> db
   * @param <Object> options
   * @param <Boolean> update
   * @param <Function> callback
   * @return <Function> callback
   */
  add: function(db, player, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // initialize room.
    this.init(player, function(player) {
      // save room.
      collection.save(player, function(err, check) {
        // if error happens pass it to
        // the callback and return.
        if (err) {
          return callback(err);
        }
        // if succeeds pass the player
        // data to the callback.
        if (check) {
          return callback(null, db, options);
        }
        // otherwise pass the null
        // to the callback.
        return callback(null, db, null);
      });
    });
  },
  /**
   * in() adds new player to 
   * the room.
   *
   * @param <Object> db
   * @param <String> player
   * @param <Object> room
   * @param <Function> callback
   * @return <Function> callback
   */
  in: function(db, player, room, callback) {
    //get collection.
    var collection = this.getCollection(db);

  }
  /**
   * getPlayersByRoom() returns the room
   * with specified id.
   *
   * @param <Object> db
   * @param <Number|String> id
   * @param <Function> callback
   * @return <Function> callback
   */
  getPlayersByRoom: function(db, id, callback) {
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
    collection.find({
      room: id,
    }).toArray(function(err, room) {
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
   * switchActive() switches 
   * active player.
   *
   * @param <Object> db
   * @param <Number|String> id
   * @param <Function> callback
   * @return <Function> callback
   */
  switchActive: function(db, id, callback) {
    var _this = this;
    //get players by room.
    this.getPlayersByRoom(db, id, function(err, db, players) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // if players exists on specified
      // room id then loop through them
      // change active state and save.
      if (players.length) {
        // loop through players.
        players.map(function(player) {
          // change active player.
          player.active = player.active ? false : true;
          // update player.
          _this.add(db, player, true, function(err, db, check) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
          });
        });
        // passing updated players within callback.
        return callback(null, db, players);
      }
    });
  }
};