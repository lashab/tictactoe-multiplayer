'use strict';

var join = require('path').join; 
var Mongo = require(join(__dirname, 'database'));
var Player = require(join(__dirname, 'player'));
var db = new Mongo();

var Room = function() {
  Player.call(this);
  this.roomCollection = 'rooms';
}

Room.prototype = Object.create(Player.prototype);

Room.prototype.constructor = Room;

Room.prototype.setRoom = function(room) {
  this.room = {
    _id: room._id,
    players: room._id,
    available: room.available,
    status: room.status,
    figures: []
  };
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

Room.prototype.countRooms = function(connection, callback) {
  db.setCollection(connection, this.getRoomCollection()).count(function(count) {
    callback(count);
  });
  return this;
}

Room.prototype.addRoom = function(connection, callback) {
  db.setCollection(connection, this.getRoomCollection()).insert(this.getRoom(), function(document) {
    callback(document);
  });
  return this;
}

Room.prototype.getRoomById = function(connection, _id, callback) {
  db.setCollection(connection, this.getRoomCollection()).selectOne({ _id: parseInt(_id) }, function(document) {
    callback(document);
  });
  return this; 
}

Room.prototype.getAvailableRooms = function(connection, callback) {
  db.setCollection(connection, this.getRoomCollection()).select({ available: true }, function(documents) {
    callback(documents);
  });
  return this;
}

Room.prototype.getRandomRoom = function(documents, callback) {
  var ids = [];
  documents.map(function(document) {
    ids.push(document._id);
  });
  callback(ids[Math.floor(Math.random() * ids.length)]);
  return this;
}

Room.prototype.updateRoomById = function(connection, _id, callback) {
  db.setCollection(connection, this.getRoomCollection()).modify({ _id: _id }, [], { $set: { available: false } }, { new: true }, function (document) {
    callback(document);
  });
}

module.exports = Room;












