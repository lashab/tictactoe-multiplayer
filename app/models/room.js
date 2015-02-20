'use strict';

var join = require('path').join; 
var Mongo = require(join(__dirname, 'database'));
var Player = require(join(__dirname, 'player'));
var db = new Mongo();

var Room = function(connection, room, player) {
  Player.call(this, player);
  this.connection = connection || {};
  this.room = room || {};
  this.roomCollection = 'rooms';
}

Room.prototype = Object.create(Player.prototype);

Room.prototype.setRoom = function(room) {
  this.room = room;
  return this;
}

Room.prototype.getRoom = function() {
  return this.room;
}

Room.prototype.getRoomIdByPath = function(path) {
  return parseInt(path.split('/')[2]);
}

Room.prototype.setRoomCollection = function(collection) {
  this.roomCollection = collection;
  return this;
}

Room.prototype.getRoomCollection = function() {
  return this.roomCollection;
}

Room.prototype.count = function(callback) {
  db.setCollection(this.connection, this.getRoomCollection()).count(function(count) {
    callback(count);
  });
  return this;
}

Room.prototype.create = function(callback) {
  db.setCollection(this.connection, this.getRoomCollection()).insert(this.getRoom(), function(document) {
    callback(document);
  });
  return this;
}

module.exports = Room;