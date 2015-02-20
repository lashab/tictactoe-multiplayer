'use strict';
var join = require('path').join
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

function Game() {};

Game.prototype = {
  constructor: Game,
  join: function(player, callback) {
    db.connect(function(connection) {
      var room = new Room();
      room.countRooms(connection, function(count) {
        var create = function(ensure) {
          var ensure = ensure || false;
          var _id = count + 1;
          room.setRoom({
            _id: _id,
            players: _id,
            available: true
          }).addRoom(connection, function(document) {
            if (document) {
              var _rid = document[0]._id;
              console.log('Room #%d created', _rid);
              room.setPlayer({
                _rid: _rid,
                name: player,
                video: false, //TODO
                status: 1,
                score: 0
              }).addPlayer(connection, function(document) {
                if (document) {
                  console.log('%s has joined', document[0].player);
                  if (ensure) {
                    room.playerEnsureIndex(connection, function(document) {
                      if (document) {
                        console.log('created index for %s', document);
                        callback(_rid);
                        connection.close();
                      }
                    });
                  }
                  else {
                    callback(_rid);
                    connection.close();
                  }
                }
              });
            }
          });
        }
        if (count) {
          room.getAvailableRooms(connection, function(documents) {
            if (documents) {
              room.getRandomRoom(documents, function(_rid) {
                if (_rid) {
                  room.updateRoomById(connection, _rid, function(document) {
                    if (document) {
                      var _id = document._id; 
                      room.setPlayer({
                        _rid: _id,
                        name: player,
                        video: false, //TODO
                        status: 1
                      }).addPlayer(connection, function(document) {
                        if (document) {
                          console.log('%s has joined', document[0].player);
                          callback(_id);
                          connection.close();
                        }
                      });
                    }
                  });
                }
              });
            }
            else {
              create();
            }
          });
        }
        else {
          create(true);
        }
      });
    });
  }
}
module.exports = Game;