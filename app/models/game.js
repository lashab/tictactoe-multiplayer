'use strict';

var Schema = require('../models/schema');
var v = require('validator');
var mongoose = require('mongoose');

function Game() {};

Game.prototype = {
  join: function(room, user) {
    var _user = v.escape(v.trim(user));
    room.count(function(err, count) { 
      if (err) throw err;
      if (count) {
        room.find({ available: true }, function(err, documents) {
          if (err) throw err;
          if (documents) {
            var _ids = [];
            documents.forEach(function(doc) {
              _ids.push(doc._id);
            });
            var random = _ids[Math.floor(Math.random() * _ids.length)];
          }
          else {
            room.create({ users: [_user]}, function(err, document) {
              if (err) throw err;
              if ( document ) {
                console.log( '%s has joined', _user )
              }
            });
          }
        });
      }
      else {
        room.create({ users: [_user] }, function( err, document ) {
          if (err) throw err;
          if ( document ) {
            console.log( '%s has joined', _user );
          }
        });
      }
    });
  }
}

module.exports = new Game();