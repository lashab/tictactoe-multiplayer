'use strict';

var v = require('validator');
var join = require('path').join
var db = require(join(__dirname, 'database'));

function Game() {};

Game.prototype = {
  join: function(user, callback) {
    var collection = 'rooms';
    var user = v.escape(v.trim(user));
    var create = function(count) {
      db.insert(collection, {
        _id: count + 1,
        users: [ user ],
        available: true,
      }, function(document, connection) {
        if (document) {
          console.log('%s has joined', user);
          callback(document[0]._id);
          connection.close();
        }
      });
    }
    db.count(collection, function(count) {
      if (count) {
        db.select(collection, { available: true }, function(documents, connection) {
          if (documents.length) {
            var _ids = [];
            documents.forEach(function(document) {
              _ids.push(document._id);
            });
            var _id = _ids[Math.floor(Math.random() * _ids.length)];
            db.modify(collection,
              { _id: _id },
              [],
              { $push: { users: user }, $set: { available: false } },
              { new: true },
              function(document, connection) {
                if (document) {
                  console.log(document);
                  console.log('%s has joined', user);
                  callback(document._id);
                  connection.close();
                }
              }
            );
          }
          else {
            create(count);
          }
        });
      }
      else {
        create(count);
      }
    });
  }
}

module.exports = Game;