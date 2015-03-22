'use strict';

var join = require('path').join;
var validator = require('validator');
var Room = require(join(__dirname, 'room'));

var Player = function() {
  this.p_collection = 'players';
}

Player.prototype.setPlayer = function(player) {
  this.player = {
    room: player.room,
    name: this.playersValidate(player.name),
    active: player.active
  };
  return this;
}

Player.prototype.getPlayer = function() {
  return this.player;
}

Player.prototype.playersValidate = function(player) {
  return validator.escape(validator.trim(player));
}

// Player.prototype.playerEnsureIndex = function(connection, callback) {
//   db.setCollection(connection, this.getPlayerCollection()).setIndex({ _rid: 1 }, function(document) {
//     callback(document);
//   });
//   return this;
// }

Player.prototype.getPlayersByRoomId = function(db, id, callback) {
  var collection = db.collection(this.p_collection);
  collection.find({
    rid: parseInt(id)
  }, function(err, players) {
    if (err) throw err;
    callback(db, players);
  });
};

Player.prototype.addPlayer = function(db, callback) {
  var collection = db.collection(this.p_collection);
  collection.save(this.getPlayer(), function(err, document) {
    if (err) throw err;
    callback(db, document);
  });
}

Player.prototype.switchActivePlayer = function(db, id, callback) {
  var collection = db.collection(this.p_collection);
  collection.find({
    rid: parseInt(_id)
  }, function(err, players) {
    if (err) throw err;
    players.map(function(player) {
      player.active = player.active ? false : true;
      collection.save(player, function(err) {
        if (err) throw err;
      });
    })
    if (players.length) {
      callback(db, players);
    }
  });
}

module.exports = Player;
