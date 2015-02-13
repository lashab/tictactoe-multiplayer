'use strict';

var mongoose = require('mongoose');
var config = require('config');
var url = require('url');

if ( config.has('tictactoe.db') ) {
  var settings = config.get('tictactoe.db');
  var Schema = mongoose.Schema;

  var _room = new Schema({
    rid: {
      type: Number,
      default: 1,
      unique: true
    },
    available: {
      type: Boolean,
      default: true
    },
    users: [
      { type: String, 
        default: null 
      },
      { 
        type: String,
        default: null 
      }
    ]
  });

  var uri = url.format({
    protocol: 'mongodb',
    host: settings.host,
    pathname: settings.name,
    port: settings.port,
    slashes: true
  });

  mongoose.connect(uri);

  exports.room = mongoose.model('Room', _room);
}