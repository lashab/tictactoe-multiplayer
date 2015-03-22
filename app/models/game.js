'use strict';

var join = require('path').join
var Room = require(join(__dirname, 'room'));

function Game(io, socket, app, db) {
  Room.call(this);
  this.io = io;
  this.socket = socket;
  this.app = app;
  this.db = db;
};

Game.prototype = Object.create(Room.prototype);

Game.prototype.init = function(io, socket, app, db, self) {
  return function(room) {
    if (room.id) {
      var room = room.id;
      db.connect(app.get('mongodb'), function(db) {
        self.getRoomById(db, room, function(document) {
          self.getPlayersByRoomId(db, room, function(players) {
            socket.join(room);
            socket.emit('init', {
              room: document
            });
            if (players.length === 1) {
              socket.emit('waiting', players.length);
            }
            io.in(room).emit('players', {
              players: players
            });
            db.close();
          });
        });
      });
    }
  }
}

Game.prototype.join = function(io, socket, app, db, self) {
  return function(player) {
    db.connect(app.get('mongodb'), function(db) {
      self.countRooms(db, function(db, count) {
        var create = function(ensure) {
          var ensure = ensure || false;
          var id = count + 1;
          self.setRoom({
            _id: id,
            available: true
          }).addRoom(db, function(db, isRoom) {
            if (isRoom) {
              console.log('Room #%d created', id); //LOG
              self.setPlayer({
                rid: id,
                name: player.name,
                active: true
              }).addPlayer(db, function(db, isPlayer) {
                if (isPlayer) {
                  console.log('%s has joined', player.name); //LOG
                  if (ensure) {
                    var collection = db.collection(self.p_collection);
                    collection.ensureIndex({ rid: 1 }, function(err, document) {
                      if (err) throw err;
                      if (document) {
                        console.log('created index for %s', document); //LOG
                        db.close();   
                      }
                    });
                  }
                  else {
                    db.close();
                  }
                  socket.emit('join', {
                    redirect: join('room', id.toString())
                  });
                }
              });
            }
          });
        }
        if (count) {
          self.getAvailableRooms(db, function(db, rooms) {
            if (rooms.length) {
              self.getRandomRoom(rooms, function(id) {
                self.setRoom({
                  _id: id,
                  available: false
                }).addRoom(db, function(db, isRoom) {
                  if (isRoom) {                 
                    self.setPlayer({
                      rid: id,
                      name: player.name,
                      active: false
                    }).addPlayer(db, function(db, isplayer) {
                      if (isPlayer) {
                        console.log('%s has joined', player.name); //LOG
                        socket.emit('join', {
                          redirect: join('room', _id.toString())
                        });
                        db.close();
                      }
                    });
                  }
                });
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

Game.prototype.play = function(self) {
  return function(game) {
    db.connect(function(connection) {
      var room = game.roomid;
      that.switchActivePlayer(connection, room, function(players) {
        var figures = game.figures;
        io.in(room).emit('switch', players);
        that.pushDrawnFigures(connection, room, figures, function(document) {
          var index = Object.keys(figures);
          game.figure = figures[index] ? false : true;
          socket.broadcast.in(room).emit('play', game);
          if (game.over) {
            that.removeDrawnFigures(connection, room, function(document) {
              connection.close();
            });
          }
          else {
            connection.close();
          }
        });
      });
    });
  }
}

Game.prototype.pushDrawnFigures = function() {
  if (typeof figures === 'object') {
    db.setCollection(connection, this.getRoomCollection()).modify({
      _id: parseInt(_id)
    }, [], {
      $push: {
        figures: figures
      }
    }, {
      new: true
    }, function(document) {
      callback(document);
    });
  }
}

Game.prototype.removeDrawnFigures = function() {
  db.setCollection(connection, this.getRoomCollection()).modify({
    _id: parseInt(_id)
  }, [], {
    $set: {
      figures: []
    }
  }, {
    new: true
  }, function(document) {
    callback(document);
  });
}

Game.prototype.execute = function(event) {
  var socket = this.socket;
  var map = {
    init: 'init',
    join: 'join',
    play: 'play'
  };
  var callback = map[event] && typeof this[map[event]] === 'function' ? this[map[event]] : (function() {
    throw new Error(event + ' ' + 'function not found')
  })();
  socket.on(event, callback(this.io, socket, this.app, this.db, this));
  return this;
}

Game.prototype.run = function() {
  this
    .execute('join')
    .execute('init')
    .execute('play');
}

module.exports = Game;