'use strict';

var join = require('path').join;
var validator = require('validator');
var Room = require(join(__dirname, 'room'));

var Player = function() {
  this.players = 'players';
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

Player.prototype.playerEnsureIndex = function(connection, callback) {
  db.setCollection(connection, this.getPlayerCollection()).setIndex({ _rid: 1 }, function(document) {
    callback(document);
  });
  return this;
}

Player.prototype.getPlayersByRoomId = function(connection, _id, callback) {
  db.setCollection(connection, this.getPlayerCollection()).select({ _rid: parseInt(_id) }, function(documents) {
    callback(documents);
  });
  return this;
};

Player.prototype.addPlayer = function(connection, callback) {
  db.setCollection(connection, this.getPlayerCollection()).save(this.getPlayer(), function(document) {
    callback(document);
  });
  return this;
}

Player.prototype.switchActivePlayer = function(connection, _id, callback) {
  var that = this;
  db.setCollection(connection, this.getPlayerCollection()).select({_rid: parseInt(_id)}, function(documents) {
    documents.map(function(document) {
      document.active = document.active ? false : true;
      db.setCollection(connection, that.getPlayerCollection()).save(document, function(document) {});
    })
    if (documents.length) {
      callback(documents);
    }
  });
}

module.exports = Player;
