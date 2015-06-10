'use strict';
/**
 * Module dependencies.
 */
var path = require('path');
var join = path.join;
var objectID = require('mongodb').ObjectID;
var debug = require('debug')('player');

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
    var id = room._id;
    // casting id.
    id = id >> 0;
    // prepare player object.
    var _player = {
      room: id,
      name: player,
      active: room.available ? true : false,
      position: room.available ? 0 : 1,
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
        debug('%s has been added.', player);
        // return callback - passing database object, player object.
        return callback(null, db, _player);
      }
      // :
      // debug player.
      debug('player hasn\'t been added.');
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
    }, function(error, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // debug message.
      var message = done
        ? '%s has been removed'
          : '%s hasn\'t been removed';
      // debug player.
      debug(message, player.name);
      // return callback - passing database object done boolean.
      return callback(null, db, done);
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
   * get players by room.
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
      debug('%d found in #%d room', players.length, id);
      // return callback - passing database object, players object.
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
    // loop in players.
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
          ? '#%d room - player %s has been switched.'
            : '#%d room - player could\'t not be switched.';
        // debug player.
        debug(message, player.room, player.name);
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
      room: room._id
    }, [], {
      $set: {
        position: 0,
        active: true
      }
    }, {
      new: true
    } ,function(error, players, done) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      var data = {
        players: [players],
        reset: done.ok
      };
      // return callback - passing database object, data object.
      return callback(null, db, data);
    });
  },
  /**
   * update player score.
   *
   * @param {Object} db
   * @param {Object} room
   * @param {Object} player
   * @param {Function} callback
   * @return {Function} callback
   */
  updateScore: function(db, room, player, callback) {
    // get collection.
    var collection = this.getCollection(db);
    // player object is empty ?
    if (!player) {
      // get players by room.
      this.getPlayersByRoom(db, room, function(error, db, players) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // return callback - passing database object, players object.
        return callback(null, db, players);
      });
    }
    // : update score && get players.
    else {
      var _this = this;
      // increment player score by 1.
      collection.findAndModify({
        _id: new objectID(player._id)
      }, [], {
        $inc: {
          score: 1
        }
      }, {
        new: true
      }, function(error, player, done) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug message.
        var message = done
          ? '#%d room - %s\'s score has been updated.'
            : '#%d room - %s\'s score couldn\'t be updated.';
        // debug player.
        debug(message, player.room, player.name);
        // get players by room.
        _this.getPlayersByRoom(db, room, function(error, db, players) {
          // return callback - passing error object.
          if (error) {
            return callback(error);
          }
          // return callback - passing database object, players object.
          return callback(null, db, players);
        });
      });
    }
  }
};