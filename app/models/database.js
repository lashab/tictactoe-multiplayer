'use strict';

var MongoClient = require('mongodb').MongoClient

var Database = function(uri, mongo) {
  this.mongo = mongo;
  this.uri = uri;
};

Database.prototype = {
  connect: function(cb) {
    this.mongo.connect(this.uri, function(err, db) {
      if (err) throw err;
      cb(db);
    });
  }
, select: function(collection, query, callback) {
    this.connect(function(db) {
      var _collection = db.collection(collection);
      _collection.find(query).toArray(function(err, documents) {
        if (err) throw err;
        callback(documents, db);
      });
    });
    return this;
  }
, save: function(collection, query, insert, callback) {
    this.connect(function(db) {
      var _collection = db.collection(collection);
      _collection.save(insert, query, function(err, documents) {
        if (err) throw err;
        callback(documents, db);
      }); 
    });
  }
, insert: function(collection, document, callback) {
    this.connect(function(db) {
      var _collection = db.collection(collection);
      _collection.insert(document, function(err, documents) {
        if (err) throw err;
        callback(documents, db);
      }); 
    });
  }
, inc: function(collection, $id, field, by, callback) {
    var _inc = {};
    _inc[field] = by;
    this.connect(function(db) {
      var _collection = db.collection(collection);
      _collection.findAndModify({
        query: { _id: $id },
        update: { $inc: _inc },
        new: true
      }, function(err, document) {
        if (err) throw err;
        callback(document, db);
      });
    });
  }
};

var config = require('config');
var url = require('url');

if (config.has('tictactoe.db')) {
  var _config = config.get('tictactoe.db');
  module.exports = new Database(url.format({
    protocol: 'mongodb',
    host: _config.host,
    pathname: _config.name,
    port: _config.port,
    slashes: true
  }), require('mongodb').MongoClient);
}