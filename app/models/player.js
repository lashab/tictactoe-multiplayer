'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;

module.exports = {
  collection: 'players',
  /**
   * get players collection.
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
   * initialize players data merged
   * with default data.
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
    // loop through data.
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
    // passes the player data 
    // to the callback.
    return callback(player);
  },
  /**
   * adds new or updates 
   * existent player.
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
          return callback(null, db, player);
        }
        // otherwise pass the null
        // to the callback.
        return callback(null, db, null);
      });
    });
  },
  /**
   * adds new player to 
   * specified room.
   *
   * @param <Object> db
   * @param <String> player
   * @param <Object> room
   * @param <Function> callback
   * @return <Function> callback
   */
  in : function(db, player, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // add new player.
    this.add(db, player, function(err, db, player) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // if its fresh room
      // set index to the
      // room property.
      if (room.fresh) {
        // set index.
        collection.ensureIndex({
          room: 1
        }, function(err, index) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // if fresh player is added
          // pass setted index and 
          // player object to the 
          // callback.
          if (index && player) {
            return callback(null, index, db, player);
          }
          // otherwise pass null
          // to the callback.
          return callback(null, null, db, null);
        });
      }
      else {
        // if new player added
        // pass player to the
        // callback. 
        if (player) {
          return callback(null, null, db, player);
        }
        else {
          // if new player is not
          // added pass the null
          // to the callback.
          return callback(null, null, db, null);
        }
      }
    });
  },
  /**
   * get players data by 
   * room id.
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
      // otherwise pass room object
      // to the callback.
      return callback(null, db, room);
    });
  },
  /**
   * switches active player.
   *
   * @param <Object> db
   * @param <Number|String> id
   * @param <Function> callback
   * @return <Function> callback
   */
  switchActive: function(db, id, callback) {
    var _this = this;
    // get players by room.
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
          _this.add(db, player, function(err, db, check) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
          });
        });
        // pass updated players object 
        // to the callback.
        return callback(null, db, players);
      }
    });
  }
};