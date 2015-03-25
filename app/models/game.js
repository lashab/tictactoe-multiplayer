'use strict';

/**
 * Module dependencies.
 */
var join = require('path').join
var Room = require(join(__dirname, 'room'));
var db = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

function Game(app, io, socket) {
  Room.call(this);
  this.app = app;
  this.io = io || null;
  this.socket = socket || null;
};

Game.prototype = Object.create(Room.prototype);

Game.prototype.join = function(player, cb) {
  var self = this;
  var app = this.app;
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
            var _id = new objectID();
            self.setPlayer({
              _id: _id,
              room: id,
              name: player,
              active: true
            }).addPlayer(db, function(db, isPlayer) {
              if (isPlayer) {
                console.log('%s has joined', player); //LOG
                if (ensure) {
                  var collection = db.collection(self.p_collection);
                  collection.ensureIndex({
                    room: 1
                  }, function(err, document) {
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
                cb({
                  player: _id,
                  path: join('room', id.toString())
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
                  var _id = new objectID();
                  self.setPlayer({
                    _id: _id,
                    room: id,
                    name: player,
                    active: false
                  }).addPlayer(db, function(db, isPlayer) {
                    if (isPlayer) {
                      console.log('%s has joined', player); //LOG
                      db.close();
                      cb({
                        player: _id,
                        path: join('room', id.toString())
                      });
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

Game.prototype.init = function(io, socket, app, self) {
  return function(data) {
    if (data.room) {
      var room = data.room;
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
            var client = false;
            var emit = 'ready';
            players.map(function(_player) {
              if (_player._id.toString() === data.player && _player.active) {
                client = true; 
              }
            });
            if (client) {
              socket.emit(emit);
            }
            db.close();
          });
        });
      });
    }
  }
}

Game.prototype.play = function(io, socket, app, self) {
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

Game.prototype.pushFigures = function(db, room, figures, cb) {
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
    cb(db, room);
  });
}

Game.prototype.removeFigures = function(db, room, cb) {
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
    cb(db, room);
  });
}

Game.prototype.setActiveFigure = function(db, room, figure, cb) {
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
    cb(db, room);
  });
}

Game.prototype.execute = function(event) {
  var socket = this.socket;
  var map = {
    init: 'init',
    play: 'play'
  };
  var cb = map[event] && typeof this[map[event]] === 'function' ? this[map[event]] : (function() {
    throw new Error(event + ' ' + 'function not found')
  })();
  socket.on(event, cb(this.io, socket, this.app, this));
  return this;
}

Game.prototype.run = function() {
  this
    .execute('init')
    .execute('play');
}

module.exports = Game;