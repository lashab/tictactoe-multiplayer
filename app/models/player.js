'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var objectID = require('mongodb').ObjectID;
var debug = require('debug')('player');
var join = path.join;

module.exports = {
  collection: 'players',
  /**
   * get players collection.
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
   * adds new or updates 
   * existent player.
   *
   * @param {Object} db
   * @param {Object} options
   * @param {Boolean} update
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, player, callback) {
    // get collection.
    var collection = this.getCollection(db);
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
  },
  /**
   * removes player.
   *
   * @param {Object} db
   * @param {String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  remove: function(db, id, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // remove player by id.
    collection.remove({
      _id: new objectID(id)
    }, function(err, done) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }

      return callback(null, db);
    });
  },
  /**
   * adds new player to 
   * specified room.
   *
   * @param {Object} db
   * @param {String} player
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
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
   * @param {Object} db
   * @param {String} id
   * @param {Function} callback
   * @return {Function} callback
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
   * @param {Object} db
   * @param {Number|String} id
   * @param {Function} callback
   * @return {Function} callback
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
      room: id
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
   * get player waiting object.
   *
   * @param {Object} player
   * @return {Object} waiting
   */
  waiting: function(position) {
    // get waiting (loading) image.
    var image = join('..', 'images', 'loading.gif');
    // prepare waiting object.
    var waiting = {
      position: position,
      image: image
    }
    // return waiting object.
    return waiting;
  },
  /**
   * switches active player.
   *
   * @param {Object} db
   * @param {Number|String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  switchActivePlayer: function(db, id, callback) {
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
        players.forEach(function(player) {
          // change active player.
          player.active = player.active ? false : true;
          // modify player.
          _this.add(db, player, function(err, db, player) {
            // if error happens pass it to
            // the callback and return.
            if (err) {
              return callback(err);
            }
          });
        });
        // passing modified players object 
        // to the callback and return.
        return callback(null, db, players);
      }
    });
  },
  /**
   * updates player score.
   *
   * @param {Object} db
   * @param {String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  updatePlayerScore: function(db, id, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // do not update score if the id
    // is null pass database object
    // to the callback and return. 
    if (!id) {
      return callback(null, db);
    }
    // find player by id and increment score by 1.
    collection.findAndModify({
      _id: new objectID(id)
    }, [], {
      $inc: {
        score: 1
      }
    }, {}, function(err) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      // pass database object to the callback
      // and return.
      return callback(null, db);
    });
  },
};