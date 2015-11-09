// ----------------------------------------------
// Project: Tictactoe
// File: app.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// ----------------------------------------------

'use strict';
/**
 * Module dependencies.
 */
var http = require('http');
var join = require('path').join;
var url = require('url');

var express = require('express');
var app = express();

var Server = http.Server(app);
var io = require('socket.io')(Server);

var favicon = require('serve-favicon');
var bodyParse = require('body-parser');
var cookieParse = require('cookie-parser');
var methodOverride = require('method-override');

var debug = require('debug')('app');
var config = require('config');
var database = require('mongodb').MongoClient;

var routes = require('./app/routes');
var game = require('./app/models/game');
var player = require('./app/models/player');

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('view engine', 'ejs');
app.use(favicon(join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(cookieParse('hello'));
app.use(bodyParse.urlencoded({
  extended: true
}));
app.use(bodyParse.json());
app.use(methodOverride());
app.use(express.static(join(__dirname, 'public')));

// server listens to port.
Server.listen(app.get('port'));

database.connect(app.get('mongodb'), function(error, db) {
  // routes.
  routes(db, app, function(error) {
    // debug app - passing error object.
    if (error) {
      debug(error);
    }
  });
  // socket.io;
  io.on('connection', function(socket) {
    // debug app - passing error object.
    if (error) {
      debug(error);
    }
    // run game.
    game.run(db, io, socket, function(error) {
      // debug app - passing error object.
      if (error) {
        debug(error);
      }
    });
  });
});
