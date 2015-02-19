'use strict';

var MongoClient = require('mongodb').MongoClient;
var config = require('config');
var url = require('url');

var Database = function() {
  if (config.has('tictactoe.db')) {
    this.config = config.get('tictactoe.db');
    this.url = url.format({
      protocol: 'mongodb',
      host: this.config.host,
      pathname: this.config.name,
      port: this.config.port,
      slashes: true
    });
  }
  else {
    throw new Error('No Connection');
  }
};

Database.prototype = {
  connect: function(callback) {
    this.mongo.connect(this.url, function(err, db) {
      if (err) throw err;
      callback(db);
    });
  },
  setCollection: function(db, collection) {
    this.collection = db.collection(collection);
    return this;
  },
  getCollection: function() {
    return this.collection;
  },
  selectOne: function(query, callback) {
    this.getCollection().findOne(query, function(err, document) {
      if (err) throw err;
      callback(document);
    });
  },
  select: function(query, callback) {
    this.getCollection().find(query).toArray(function(err, documents) {
      if (err) throw err;
      callback(documents);
    });
  },
  insert: function(document, callback) {
    this.getCollection().insert(document, function(err, documents) {
      if (err) throw err;
      callback(documents);
    }); 
  },
  count: function(callback) {
    this.getCollection().count(function(err, count) {
      if (err) throw err;
      callback(count);
    })
  },
  modify: function(criteria, sort, update, options, callback) {
    this.getCollection().findAndModify(criteria, sort, update, options, function(err, documents) {
      if (err) throw err;
      callback(documents);
    });
  }
};

module.exports = Database;