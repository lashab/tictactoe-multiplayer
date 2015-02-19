'use strict';

var join = require('path').join;
var validator = require('validator');
var db = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));

var Players = function() {};

Players.prototype = {
  setPlayer: function(player) {
    this.player = this.playersValidate(player);
    return this;
  },
  getPlayer: function(player) {
    return this.player;
  },
  getPlayersByRoomId: function(room, callback) {
    db.selectOne(this.room, {_id: room}, function(document, connection) {
      callback(document.users);
      connection.close();
    });
  },
  playersValidate: function(player) {
    return validator.escape(validator.trim(player));
  }
};

module.exports = Player;