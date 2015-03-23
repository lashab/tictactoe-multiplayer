'use strict';

var join = require('path').join;
var Player = require(join(__dirname, 'player'));

var Room = function() {
  Player.call(this);
  this.r_collection = 'rooms';
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

Room.prototype.countRooms = function(db, callback) {
  var collection = db.collection(this.r_collection);
  collection.count(function(err, count) {
    if (err) throw err;
    callback(db, count);
  });
}

Room.prototype.addRoom = function(db, callback) {
  var collection = db.collection(this.r_collection);
  collection.save(this.getRoom(), function(err, document) {
    if (err) throw err;
    callback(db, document);
  });
}

Room.prototype.getRoomById = function(db, id, callback) {
  var collection = db.collection(this.r_collection);
  collection.findOne({ _id: parseInt(id) }, function(err, room) {
    if (err) throw err;
    callback(db, room);
  });
}

Room.prototype.getAvailableRooms = function(db, callback) {
  var collection = db.collection(this.r_collection);
  collection.find({ available: true }).toArray(function(err, rooms) {
    if (err) throw err;
    callback(db, rooms);
  });
}

Room.prototype.getRandomRoom = function(rooms, callback) {
  var ids = [];
  rooms.map(function(room) {
    ids.push(room._id);
  });
  callback(ids[Math.floor(Math.random() * ids.length)]);
}

module.exports = Room;












