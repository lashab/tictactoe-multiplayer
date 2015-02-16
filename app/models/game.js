'use strict';

var v = require('validator');
var join = require('path').join
var db = require(join(__dirname, 'database'));

db.insert('rooms', {}, { _id: 1, users: ["data", "dachi"], rid: 4 }, function(docs, db) {
  db.close();
});

function Game() {};
Game.prototype = {
  join: function(room, user, callback) {
  //   var _user = v.escape(v.trim(user));
  //   room.count(function(err, count) { 
  //     if (err) throw err;
  //     if (count) {
  //       room.find({ available: true }, function(err, documents) {
  //         if (err) throw err;
  //           console.log(typeof documents);            
  //         if (documents.length) {

  //           var _ids = [];
  //           documents.forEach(function(doc) {
  //             _ids.push(doc._id);
  //           });
  //           var rid = _ids[Math.floor(Math.random() * _ids.length)];
  //           room.findByIdAndUpdate(rid, {
  //             $push: { users: _user },
  //             $set: { available: false },
  //             $inc: { rid: 1 }
  //           }, function(err, doc) {
  //             if (err) throw err;
  //             console.log(doc);
  //           });
  //         }
  //         else {
  //           room.find().sort({_id: -1}).limit(1).exec(function(err, document) {
  //             room.create({ users: [_user]}, function(err, document) {
  //               if (err) throw err;
  //               if ( document ) {
  //                 console.log( '%s has joined', _user )
  //               }
  //             });
  //           });
  //         }
  //       });
  //     }
  //     else {

  //     }
  //   });
  // }
  }
}

module.exports = new Game();