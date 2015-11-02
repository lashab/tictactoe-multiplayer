// ----------------------------------------------
// Project: Tictactoe
// File: player.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// ----------------------------------------------

'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = path.join;
var objectID = require('mongodb').ObjectID;
var debug = require('debug')('player');
var _ = require('underscore');

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
   * add player.
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
    // get room id.
    var id = room._id >> 0;
    // get position.
    var position = room.left < 0 ? room.available ? 0 : 1 : room.left;
    // prepare player object.
    var _player = {
      room: id,
      name: player,
      active: room.available ? true : false,
      position: position,
      score: 0
    };
    // add new player.
    collection.save(_player, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
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
          debug('room field has been indexed.');
        }
        // :
        else {
          // debug player.
          debug('room field hasn\'t been indexed.');
          // return callback - passing database object.
          return callback(null, db, null);
        }
      });
      // player has been added ?
      if (done) {
        // debug player.
        debug('%s has been added. - %o.', player, _player);
        // return callback - passing database object, player object.
        return callback(null, db, _player);
      }
      // :
      // debug player.
      debug('player couldn\'t be added.');
      // return callback - passing database object.
      return callback(null, db, null);
    });
  },
  /**
   * remove player.
   *
   * @param {Object} db
   * @param {Object} player
   * @param {Function} callback
   * @return {Function} callback
   */
  remove: function(db, player, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // remove player by id.
    collection.remove({
      _id: new objectID(player._id)
    }, {
      single: true
    }, function(error, _player) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = _player.result.ok;
      // debug message.
      var message = ok
        ? '%s has been removed - %o'
          : '%s couldn\'t be removed - %o';
      // debug player.
      debug(message, player.name, player);
      // return callback - passing database object, ok boolean.
      return callback(null, db, ok);
    });
  },
  /**
   * get player by query object.
   *
   * @param {Object} db
   * @param {String} query
   * @param {Function} callback
   * @return {Function} callback
   */
  getPlayerByObject: function(db, query, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // find player by query.
    collection.findOne(query, function(error, player) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // debug message.
      var message = player
        ? 'get player object - %o'
          : 'object couldn\'t be found - %o';
      // debug player.
      debug(message, player);
      // return callback - passing database object, player object.
      return callback(null, db, player);
    });
  },
  /**
   * get player object by id.
   *
   * @param {Object} db
   * @param {String} id
   * @param {Function} callback
   * @return {Function} callback
   */
  getPlayerById: function(db, id, callback) {
    // get player by id.
    this.getPlayerByObject(db, {
      _id: new objectID(id)
    }, function(error, db, player) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // return callback - passing database object, player object.
      return callback(null, db, player);
    });
  },
  /**
   * get players by room object.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  getPlayersByRoom: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // find players by room id.
    collection.find({
      room: id
    }).toArray(function(error, players) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // debug player.
      debug('get players object %o', players);
      // return callback - passing database object, players object.
      return callback(null, db, players);
    });
  },
  /**
   * switch players.
   *
   * @param {Object} db
   * @param {Array} players
   * @param {Function} callback
   * @return {Function} callback
   */
  switch: function(db, players, callback) {
    // get collection.
    var collection = this.getCollection(db);
    players.forEach(function(player) {
      // change active player.
      player.active = !player.active ? true : false;
      player._id = new objectID(player._id);
      // update player.
      collection.save(player, function(error, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? '#%d room - players %s has been switched - %o'
            : '#%d room - players couldn\'t be switched - %o';
        // debug player.
        debug(message, player.room, player.name, player);
      });
    });
    // return callback - passing database object, players array.
    return callback(null, db, players);
  },
  /**
   * reset player.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Function} callback
   * @return {Function} callback
   */
  reset: function(db, room, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // get room id && casting id.
    var id = room._id >> 0;
    // update player.
    collection.findAndModify({
      room: id
    }, [], {
      $set: {
        active: true,
        score: 0
      }
    }, {
      new: true
    }, function(error, players) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // get ok value.
      var ok = players.ok;
      // get players object.
      var _players = players.value;
      // debug message.
      var message = ok
        ? '#%d room - players has been reseted - %o'
          : '#%d room - players couldn\'t be reseted - %o';
      // debug players.
      debug(message, id, _players);
      // return callback - passing database object, players object.
      return callback(null, db, [_players]);
    });
  },
  /**
   * update player score.
   *
   * @param {Object} db
   * @param {Object} player
   * @param {Function} callback
   * @return {Function} callback
   */
  updateScore: function(db, player, callback) {
    var _this = this;
    // get collection.
    var collection = this.getCollection(db);
    // player object isn't empty ?
    if (!_.isEmpty(player)) {
      // increment player score by 1.
      collection.findAndModify({
        _id: new objectID(player._id)
      }, [], {
        $inc: {
          score: 1
        }
      }, {
        new: true
      }, function(error, player) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // get ok value.
        var ok = player.ok;
        // get player object.
        var _player = player.value;
        // debug message.
        var message = ok
          ? '#%d room - %s\'s score has been updated - %o'
            : '#%d room - %s\'s score couldn\'t be updated. - %o';
        // debug player.
        debug(message, _player.room, _player.name, _player);
        // return callback - passing database object.
        return callback(null, db, _player);
      });
    }
    // :
    else {
      // return callback - passing database object.
      return callback(null, db, null);
    }
  }
};
