'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = path.join;
var objectID = require('mongodb').ObjectID;
var debug = require('debug')('player');
var Room = require(join(__dirname, 'room'));

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
   * adds player.
   *
   * @param {Object} db
   * @param {String} player
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  add: function(db, player, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // add new player.
    collection.save(player, function(error, done) {
      // room is fresh.
      var fresh = room.fresh && room.available;
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // fresh room & room is available ? add index to the room field.
      if (fresh) {
        // add index.
        collection.ensureIndex({
          room: 1
        }, function(error, index) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // index has been added ?
          if (index) {
            // debug player.
            debug('index has been added to the room field.');
          }
          // :
          else {
            // debug player.
            debug('index has not been added.');
            // return callback passing database object.
            return callback(null, db, null);
          }
        });
      }
      // player has been added ? 
      if (done) {
        // fresh player ? append fresh debug string.
        var _fresh = fresh ? '(fresh player)' : '';
        // debug player.
        debug('%s %s has been added.', _fresh, player.name);
        // return callback - passing database object, player object.
        return callback(null, db, player);
      }
      // :
      else {
        // debug player.
        debug('player hasn\'t been added.');
        // return callback - passing database object.
        return callback(null, db, null);
      }
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
    }, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object.
      return callback(null, db);
    });
  },
  /**
   * joins player.
   *
   * @param {Object} db
   * @param {String} player
   * @param {Function} callback
   * @return {Function} callback
   */
  join: function(db, player, callback) {
    var _this = this;
    // create | update room.
    Room.add(db, function(error, db, room) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // room has been created | updated ?
      if (room) {
        // get room id.
        var id = room._id;
        // add player.
        _this.add(db, {
          room: id,
          name: player,
          active: room.available ? true : false,
          position: room.available ? 0 : 1,
          score: 0
        }, room, function(error, db, player) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // player has been added ?
          if (player) {
            // prepare redirect object.
            var redirect = {
              redirect: join('room', '' + id),
              position: player.position
            };
            // debug room.
            debug('%s has joined to #%d room', player.name, id);
            // return callback - passing database object, redirect object.
            return callback(null, db, redirect);
          }
          else {
            // debug room.
            debug('player could\'t be joined to #%d room', id);
            // return callback - passing database object.
            return callback(null, db, null);
          }
        });
      }
      else {
        // debug room.
        debug('room couldn\'t be created or updated.');
        // return callback - passing database object.
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
    // find player by id.
    collection.findOne({
      _id: new objectID(id)
    }, function(error, player) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, player object.
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
    // casting id.
    id = id >> 0;
    // get collection.
    var collection = this.getCollection(db);
    // find room.
    collection.find({
      room: id
    }).toArray(function(err, players) {
      // return callback - passing error object.
      if (err) {
        return callback(err);
      }
      // return callback - passing database object, player object.
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
    };
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