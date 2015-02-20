'use strict';

var v = require('validator');
var join = require('path').join
var Mongo = require(join(__dirname, 'database'));
var Room = require(join(__dirname, 'room'));
var db = new Mongo();

function Game() {};

Game.prototype = {
  constructor: Game,
  join: function(player, callback) {
    db.connect(function(connection) {
      var room = new Room(connection);
      room.count(connection, function(count) {
        if(count) {

        }
        else {
          var _id = count + 1;
          room.setRoom({
            _id: _id,
            players: _id,
            available: true
          }).create(function(document) {
            if (document) {
              var _id = document._id;
              console.log('%d room created', _id);
              room.setPlayer({
                _rid: _id,
                player: room.playersValidate(player),
                video: false,
                status: 1
              }).add(function(document) {
                if (document) {
                  console.log('%s has joined', document.player);
                  room.playerEnsureIndex(function(document) {
                    if (document) {
                      console.log('')
                    }
                  })
                }
              });
            }
          });
        }
      });
    });
  }
}

module.exports = Game;

    // var collection = 'rooms';
    // var user = v.escape(v.trim(user));
    // var create = function(count) {
    //   db.insert(collection, {
    //     _id: count + 1,
    //     users: [ user ],
    //     available: true,
    //   }, function(document, connection) {
    //     if (document) {
    //       console.log('%s has joined', user);
    //       callback(document[0]._id);
    //       connection.close();
    //     }
    //   });
    // }
    // db.count(collection, function(count) {
    //   if (count) {
    //     db.select(collection, { available: true }, function(documents, connection) {
    //       if (documents.length) {
    //         var _ids = [];
    //         documents.forEach(function(document) {
    //           _ids.push(document._id);
    //         });
    //         var _id = _ids[Math.floor(Math.random() * _ids.length)];
    //         db.modify(collection,
    //           { _id: _id },
    //           [],
    //           { $push: { users: user }, $set: { available: false } },
    //           { new: true },
    //           function(document, connection) {
    //             if (document) {
    //               console.log(document);
    //               console.log('%s has joined', user);
    //               callback(document._id);
    //               connection.close();
    //             }
    //           }
    //         );
    //       }
    //       else {
    //         create(count);
    //       }
    //     });
    //   }
    //   else {
    //     create(count);
    //   }
    // });