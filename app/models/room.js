'use strict';

var join = require('path').join
  , Player = require(join(__dirname, 'player'))
  , Mongo = require(join(__dirname, 'database'))
  , db = new Mongo();

var Room = function() {
  Player.call(this);
  this.roomCollection = 'rooms';
}

Room.prototype = Object.create(Player.prototype);

Room.prototype.setRoom = function(room) {
  this.room = {
    _id: room._id,
    available: room.available,
    figure: 1,
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
  db.setCollection(connection, this.getRoomCollection()).save(this.getRoom(), function(document) {
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

module.exports = Room;












