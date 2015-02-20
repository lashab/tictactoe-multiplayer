'use strict';

var join = require('path').join;
var validator = require('validator');
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

var Player = function(connection, player) {
  this.connection = connection || {};
  this.player = player || {};
  this.playerCollection = 'players';
}

Player.prototype.setPlayer = function(player) {
  this.player = player;
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

Player.prototype.playersValidate = function() {
  return validator.escape(validator.trim(player));
}

Player.prototype.playerEnsureIndex = function(callback) {
  db.setCollection(this.connection, this.getPlayerCollection()).setIndex('player', function(document) {
    callback(document);
  });
}

Player.prototype.getPlayersByRoomId = function(room, callback) {
  db.setCollection(this.connection, this.getPlayerCollection()).selectOne({ _id: room }, function(document) {
    callback(document.players);
  });
};

Player.prototype.add = function() {
  db.setCollection(this.connection, this.getPlayerCollection()).insert(this.getPlayer(), function(document) {
    callback(document);
  });
}

module.exports = Player;