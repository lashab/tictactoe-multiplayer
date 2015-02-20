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
    player: this.playersValidate(player.name),
    video: player.video,
    status: player.status
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
  db.setCollection(connection, this.getPlayerCollection()).setIndex({ player: 1 }, function(document) {
    callback(document);
  });
  return this;
}

Player.prototype.getPlayersByRoomId = function(connection, room, callback) {
  db.setCollection(connection, this.getPlayerCollection()).select({ _rid: room }, function(documents) {
    var players = [];
    documents.map(function(document) {
      players.push(document.player);
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

module.exports = Player;