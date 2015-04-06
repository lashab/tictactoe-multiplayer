'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join
var debug = require('debug')('game');
var Room = require(join(__dirname, 'room'));
var Player = require(join(__dirname, 'player'));

module.exports = {
  /**
   * joins player to the game.
   *
   * @param <Object> db
   * @param <String> player
   * @param <Function> callback
   * @return <Function> callback
   */
  join: function(db, player, callback) {
    // open room.
    Room.open(db, function(err, db, room) {
      // if error happens pass it to
      // the callback and return.
      if (err) {
        return callback(err);
      }
      if (room) {
        // room id.
        var id = room._id;
        // join player.
        Player.in(db, {
          room: id,
          name: player,
          active: room.available ? true : false,
          position: room.available ? 0 : 1
        }, room, function(err, db, player) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // if player has been added pass
          // the redirect path, player id
          // to the callback and return.
          if (player) {
            debug('%s has joined %d room', player.name, id);
            return callback(null, db, {
              redirect: join('room', '' + id),
              position: player.position
            });
          }
          else {
            // if player has not been added
            // pass null to the callback
            // and return.
            debug('player could not join %d room', id);
            return callback(null, db, null);
          }
        });
      }
      else {
        // if room has not been added
        // pass null to the callback
        // and return.
        debug('room could not be opened');
        return callback(null, db, null);
      }
    });
  },
  run: function(db, io, socket, callback) {
    // initialize gameplay.
    socket.on('room', function(data) {
      // check whether the data
      // has room property with
      // the value room id.
      if (data.hasOwnProperty('room') && data.room) {
        // define room id.
        var id = data.room;
        // get room by id.
        Room.getRoomById(db, id, function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // socket rooms join.
          socket.join(id);
          // emit client room object.
          socket.emit('init room', room);
        });
        // get players by room id.
        Player.getPlayersByRoomId(db, id, function(err, db, players) {
          // set loader image path.
          var image = join('..', 'images', 'loading.gif');
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
          // check for players existence.
          if (players) {
            // if there is only one player
            // wait for another player.
            if (players.length === 1) {
              // emit client to wait next
              // player pass player wait
              // seat position and wait
              // image.
              socket.emit('waiting for player', {
                position: ~~!players[0].position,
                image: image
              });
            }
            // emit client to add players
            // pass players object.
            io.in(id).emit('add players', players);
            // emit client to set
            // active player pass
            // players object.
            socket.emit('set active player', players);
          }
          else {
            // debug if players could not
            // be found in database.
            debug('players could\'t be found.')
          }
        });
      }
      else {
        // debug if the data do not have
        // property room with the value
        // room id.
        debug('room property couldn\'t be found.');
      }
    }).on('play', function(data) {
      // get room id.
      var id = data._id;
      // switch active players.
      Player.switch(db, id, function(err, db, players) {
        // if error happens pass it to
        // the callback and return.
        if (err) {
          return callback(err);
        }
        // emit client to switch
        // active players.
        io.in(id).emit('switch active player', players);
      });
      // save state
      Room.state(db, id, data.figures, '$push', function(err, db, room) {
        // if error happens pass it to
        // the callback and return.
        if (err) {
          return callback(err);
        }
      });
      // if game is over.
      if (data.over) {
        // dalete state
        Room.state(db, id, null, '$set', function(err, db, room) {
          // if error happens pass it to
          // the callback and return.
          if (err) {
            return callback(err);
          }
        });
      }
      // emit client to play.
      socket.broadcast.in(id).emit('play', data);
    });
  }
};

// Game.prototype.play = function(io, socket, app, self) {
//   return function(game) {
//     db.connect(app.get('mongodb'), function(err, db) {
//       if (err) throw err;
//       var room = game.roomid;
//       self.switchActivePlayer(db, room, function(db, players) {
//         var figures = game.figures;
//         io.in(room).emit('switch', players);
//         self.pushFigures(db, room, figures, function(db, document) {
//           game.figure = game.figure ? 0 : 1;
//           self.setActiveFigure(db, room, game.figure, function(db, document) {
//             socket.broadcast.in(room).emit('play', game);
//             if (game.over) {
//               self.removeFigures(db, room, function(db, document) {
//                 db.close();
//               });
//             }
//             else {
//               db.close();
//             }
//           });
//         });
//       });
//     });
//   }
// }


// Game.prototype.setActiveFigure = function(db, room, figure, cb) {
//   var collection = db.collection(this.r_collection);
//   collection.findAndModify({
//     _id: parseInt(room)
//   }, [], {
//     $set: {
//       figure: figure
//     }
//   }, {
//     new: true
//   }, function(err, room) {
//     if (err) throw err;
//     cb(db, room);
//   });
// }
