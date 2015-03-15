'use strict';

var join = require('path').join;
var validator = require('validator');
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

var Player = function() {
  this.playerCollection = 'players';
}

Player.prototype.setPlayer = function(player) {
  this.player = {
    _rid: player._rid,
    name: this.playersValidate(player.name),
    video: player.video,
    active: player.active,
    status: player.status,
    score: player.score
  };
  return this;
}

Player.prototype.getPlayer = function() {
  return this.player;
}

Player.prototype.setPlayerCollection = function(collection) {
  this.playerCollection = collection;
}

Player.prototype.getPlayerCollection = function() {
  return this.playerCollection;
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
    var players = [];
    documents.map(function(document) {
      players.push({
        name: document.name,
        active: document.active
      });
    })
    callback(players);
  });
  return this;
};

Player.prototype.addPlayer = function(connection, callback) {
  db.setCollection(connection, this.getPlayerCollection()).insert(this.getPlayer(), function(document) {
    callback(document);
  });
  return this;
}

Player.prototype.switchActivePlayer = function(connection, _id, callback) {
  db.setCollection(connection, this.getPlayerCollection()).select({_rid: parseInt(_id)}, function(documents) {
    callback(documents);
  });
}

module.exports = Player;
