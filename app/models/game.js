'use strict';
var join = require('path').join
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

function Game(io, socket) {
  this.io = io;
  this.socket = socket;
};

Game.prototype = {
  constructor: Game,
  init: function(io, socket, that) {
    return function(room) {
      if (room) {
        that.room = room;
        var _room_id = room.id;
        db.connect(function(connection) {
          socket.join(_room_id);
          var _room = new Room();
          _room.getPlayersByRoomId(connection, _room_id, function(players) {
            if (players.length === 1) {
              io.in(_room_id).emit('waiting', players.length);
            }
            io.in(_room_id).emit('init', players);
          });
        });
      }
    }
  },
  join: function(io, socket) {
    return function(player) {
      db.connect(function(connection) {
        var room = new Room();
        room.countRooms(connection, function(count) {
          var create = function(ensure) {
            var ensure = ensure || false;
            var _id = count + 1;
            room.setRoom({
              _id: _id,
              available: true,
              status: 0
            }).addRoom(connection, function(document) {
              if (document) {
                var _rid = document[0]._id;
                console.log('Room #%d created', _rid); //LOG
                room.setPlayer({
                  _rid: _rid,
                  name: player.name,
                  video: false, //TODO
                  status: 1,
                  score: 0
                }).addPlayer(connection, function(document) {
                  if (document) {
                    console.log('%s has joined', document[0].name); //LOG
                    if (ensure) {
                      room.playerEnsureIndex(connection, function(document) {
                        if (document) {
                          console.log('created index for %s', document); //LOG
                          socket.emit('join', { redirect: join('room', _rid.toString()) });
                          connection.close();
                        }
                      });
                    }
                    else {
                      socket.emit('join', { redirect: join('room', _rid.toString()) });
                      connection.close();
                    }
                  }
                });
              }
            });
          }
          if (count) {
            room.getAvailableRooms(connection, function(documents) {
              if (documents.length) {
                room.getRandomRoom(documents, function(_rid) {
                  if (_rid) {
                    room.updateRoomById(connection, _rid, function(document) {
                      if (document) {
                        var _rid = document._id;
                        room.setPlayer({
                          _rid: _rid,
                          name: player.name,
                          video: false, //TODO
                          status: 1
                        }).addPlayer(connection, function(document) {
                          if (document) {
                            console.log('%s has joined', document[0].name); //LOG
                            socket.emit('join', { redirect: join('room', _rid.toString()) });
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
  },
  play: function(io, socket, that) {
    return function(data) {
      if (that.room) {
        socket.broadcast.in(that.room.id).emit('play', data);
      }
    }
  },
  execute: function(event) {
    var io = this.io;
    var socket = this.socket;
    var map = {
      init: 'init',
      join: 'join',
      play: 'play'
    };
    var callback = map[event] && typeof this[map[event]] === 'function' 
      ? this[map[event]] 
        : (function () { 
          throw new Error(event + ' ' + 'function not found')
        })();
    socket.on(event, callback(io, socket, this));
    return this;
  },
  run: function() {
    this
      .execute('join')
      .execute('init')
      .execute('play');
  }
}
module.exports = Game;