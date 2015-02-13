'use strict';

var mongoose = require('mongoose');
var config = require('config');
var url = require('url');

if ( config.has('tictactoe.db') ) {
  var Schema = mongoose.Schema;
  var settings = config.get('tictactoe.db');
  var uri = url.format({
    protocol: 'mongodb',
    host: settings.host,
    pathname: settings.name,
    port: settings.port,
    slashes: true
  });

  var _room = new Schema({
    rid: Number,
    users: Array,
    available: Boolean
  });

  mongoose.connect(uri);

  exports.room = mongoose.model('Room', _room);

}