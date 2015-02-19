'use strict';

var join = require('path').join; 
var db = new require(join(__dirname, 'database'))();

var Room = function() {
  this.roomCollection = 'rooms';
};

Room.prototype = {
  getRoomIdByPath: function(path) {
    return parseInt(path.split('/')[2]);
  },
  setRoomCollection: function(collection) {
    this.roomCollection = room;
    return this;
  },
  getRoomCollection: function() {
    return this.roomCollection;
  },
  getPlayersByRoomId: function(room, callback) {
    db.connect(function(connection) {
      db.setCollection(connection, this.getRoomCollection()).selectOne({ _id: room }, function(document) {
        callback(document.players);
        connection.close();
      });
    });
  },
  addPlayer: function() {
    db.connect(function(connection) {
      
    });
  }
};

module.exports = Room;