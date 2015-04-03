'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('player');
var objectID = require('mongodb').ObjectID;

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
    // pass the player data
    // to the callback and
    // return.
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
        // data to the callback and
        // return.
        if (check) {
          return callback(null, db, player);
        }
        // if fails pass the null
        // to the callback and
        // return.
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
      // add index to the
      // room property.
      if (room.fresh) {
        // add index.
        collection.ensureIndex({
          room: 1
        }, function(err, index) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // debug added index.
          if (index) {
            debug('index has been added for %s.', index);
          }
          else {
            // if the index has not been added
            // add debug string, passing null
            // to the callback and return.
            debug('index has not been added.');
            return callback(null, db, null);
          }
        });
      }
      // if player has been added add
      // debug string, passing player
      // object to the callback and
      // return. 
      if (player) {
        // if player is a fresh player
        // append 'fresh' word to 
        // the debug string.
        var fresh = room.fresh ? 'fresh' : '';
        debug('%s player %s has been added.', fresh, player.name);
        return callback(null, db, player);
      }
      else {
        // if player has not been added
        // add debug string, passing 
        // null to the callback and
        // return.
        debug('player hasn\'t been added.');
        return callback(null, db, null);
      }
    });
  },
  /**
   * get player by id.
   *
   * @param <Object> db
   * @param <String> id
   * @param <Function> callback
   * @return <Function> callback
   */
  getPlayerById: function(db, id, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // find player.
    collection.findOne({
      _id: new objectID(id)
    }, function(err, player) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass player object to
      // the callback and
      // return.
      return callback(null, db, player);
    });
  },
  /**
   * get players by room id.
   *
   * @param <Object> db
   * @param <Number|String> id
   * @param <Function> callback
   * @return <Function> callback
   */
  getPlayersByRoomId: function(db, id, callback) {
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
    }).toArray(function(err, players) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass players object to
      // the callback and
      // return.
      return callback(null, db, players);
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
  switch: function(db, id, callback) {
    var _this = this;
    // get players by room.
    this.getPlayersByRoomId(db, id, function(err, db, players) {
      // define active player
      // defaults to empty
      // object.
      var _player = {};
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
          if (player.active) {
            player.active = false;
          }
          else {
            player.active = true;
            // set active player object.
            _player = player;
          }
          // player.active = player.active ? false : true;
          // update player.
          _this.add(db, player, function(err, db, player) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
          });
        });
        // pass updated players object 
        // to the callback and return.
        return callback(null, db, _player);
      }
    });
  }
};