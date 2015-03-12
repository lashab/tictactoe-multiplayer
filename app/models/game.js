'use strict';
var join = require('path').join
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

function Game(io, socket) {
  Room.call(this);
  this.io = io;
  this.socket = socket;
};

Game.prototype = Object.create(Room.prototype);

Game.prototype.constructor = Game;

Game.prototype.init = function(io, socket, that) {
  return function(room) {
    if (room.id) {
      var room = room.id;
      db.connect(function(connection) {
        that.getRoomById(connection, room, function(document) {
          that.getPlayersByRoomId(connection, room, function(players) {
            console.log(players);
            socket.join(room);
            if (players.length === 1) {
              io.in(room).emit('waiting', players.length);
            }
            io.in(room).emit('init', {
              room: document,
              players: players
            });
            socket.emit('activate')
            that.room = room;
            connection.close();
          });
        });
      });
    }
  }
}

Game.prototype.join = function(io, socket, that) {
  return function(player) {
    db.connect(function(connection) {
      that.countRooms(connection, function(count) {
        var create = function(ensure) {
          var ensure = ensure || false;
          var _id = count + 1;
          that.setRoom({
            _id: _id,
            available: true,
            status: 0
          }).addRoom(connection, function(document) {
            if (document) {
              var _rid = document[0]._id;
              console.log('Room #%d created', _rid); //LOG
              that.setPlayer({
                _rid: _rid,
                name: player.name,
                video: false, //TODO
                active: true,
                status: 1,
                score: 0
              }).addPlayer(connection, function(document) {
                if (document) {
                  console.log('%s has joined', document[0].name); //LOG
                  if (ensure) {
                    that.playerEnsureIndex(connection, function(document) {
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
          that.getAvailableRooms(connection, function(documents) {
            if (documents.length) {
              that.getRandomRoom(documents, function(_rid) {
                if (_rid) {
                  that.updateRoomById(connection, _rid, function(document) {
                    if (document) {
                      var _rid = document._id;
                      that.setPlayer({
                        _rid: _rid,
                        name: player.name,
                        video: false, //TODO
                        active: false,
                        status: 1,
                        score: 0
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
}

Game.prototype.play = function(io, socket, that) {
  return function(game) {
    if (that.room && game) {
      db.connect(function(connection) {
        that.pushDrawnFigures(connection, that.room.id, game.figures, function(document) {
          socket.broadcast.in(that.room.id).emit('play', game);
          if (game.over) {
            that.removeDrawnFigures(connection, that.room.id, function(document) {
              connection.close();
            });
          }
          else {
            connection.close();
          }
        });
      });
    }
  }
}

Game.prototype.pushDrawnFigures = function(connection, _id, figures, callback) {
  if (typeof figures === 'object') {
    db.setCollection(connection, this.getRoomCollection()).modify({ _id: parseInt(_id) }, [], { $push: { figures: figures } }, { new: true }, function(document) {
      callback(document);
    });
  }
}

Game.prototype.removeDrawnFigures = function(connection, _id, callback) {
  db.setCollection(connection, this.getRoomCollection()).modify({ _id: parseInt(_id) }, [], { $set: { figures: [] } }, { new: true }, function(document) {
    callback(document);
  });
}

Game.prototype.execute = function(event) {
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
}

Game.prototype.run = function() {
  this
    .execute('join')
    .execute('init')
    .execute('play');
}

module.exports = Game;