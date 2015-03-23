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
      db.connect(app.get('mongodb'), function(err, db) {
        if (err) throw err;
        self.getRoomById(db, room, function(db, document) {
          self.getPlayersByRoomId(db, room, function(db, players) {
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
    db.connect(app.get('mongodb'), function(err, db) {
      if (err) throw err;
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
                room: id,
                name: player.name,
                active: true
              }).addPlayer(db, function(db, isPlayer) {
                if (isPlayer) {
                  console.log('%s has joined', player.name); //LOG
                  if (ensure) {
                    var collection = db.collection(self.p_collection);
                    collection.ensureIndex({ room: 1 }, function(err, document) {
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
                      room: id,
                      name: player.name,
                      active: false
                    }).addPlayer(db, function(db, isPlayer) {
                      if (isPlayer) {
                        console.log('%s has joined', player.name); //LOG
                        socket.emit('join', {
                          redirect: join('room', id.toString())
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

Game.prototype.play = function(io, socket, app, db, self) {
  return function(game) {
    db.connect(app.get('mongodb'), function(err, db) {
      if (err) throw err;
      var room = game.roomid;
      self.switchActivePlayer(db, room, function(db, players) {
        var figures = game.figures;
        io.in(room).emit('switch', players);
        self.pushFigures(db, room, figures, function(db, document) {
          game.figure = game.figure ? 0 : 1;
          self.setActiveFigure(db, room, game.figure, function(db, document) {
            socket.broadcast.in(room).emit('play', game);
            if (game.over) {
              self.removeFigures(db, room, function(db, document) {
                db.close();
              });
            }
            else {
              db.close();
            }
          });
        });
      });
    });
  }
}

Game.prototype.pushFigures = function(db, room, figures, callback) {
  var collection = db.collection(this.r_collection);
  collection.findAndModify({
    _id: parseInt(room)
  }, [], {
    $push: {
      figures: figures
    }
  }, {
    new: true
  }, function(err, room) {
    if (err) throw err;
    callback(db, room);
  });
}

Game.prototype.removeFigures = function(db, room, callback) {
  var collection = db.collection(this.r_collection);
  collection.findAndModify({
    _id: parseInt(room)
  }, [], {
    $set: {
      figures: []
    }
  }, {
    new: true
  }, function(err, room) {
    if (err) throw err;
    callback(db, room);
  });
}

Game.prototype.setActiveFigure = function(db, room, figure, callback) {
  var collection = db.collection(this.r_collection);
  collection.findAndModify({
    _id: parseInt(room)
  }, [], {
    $set: {
      figure: figure
    }
  }, {
    new: true
  }, function(err, room) {
    if (err) throw err;
    callback(db, room);
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