'use strict';

var join = require('path').join;
var db = require(join(__dirname, 'database'));

var Players = function() {};

Players.prototype = {
  getRoomPlayers: function(room, callback) {
    db.selectOne('rooms', {_id: room}, function(document, connection) {
      callback(document.users);
      connection.close();
    });
  }
};

module.exports = new Players();