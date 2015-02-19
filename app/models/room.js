'use strict';

var Room = function() {};

Room.prototype = {
  getRoomIdByPath: function(path) {
    return parseInt(path.split('/')[2]);
  },
  setRoomCollection: function(collection) {
    this.collection = collection;
    return this;
  },
  getRoomCollection: function() {
    return this.collection;
  }
};

module.exports = Room;