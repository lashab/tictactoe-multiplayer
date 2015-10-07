'use strict';
/**
 * Module dependencies.
 */
var http = require('http');
var join = require('path').join;
var url = require('url');

var express = require('express');
var app = express();

var server = http.Server(app);
var io = require('socket.io')(server);

var favicon = require('serve-favicon');
var bodyParse = require('body-parser');
var cookieParse = require('cookie-parser');
var methodOverride = require('method-override');

var debug = require('debug')('app');
var config = require('config');
var database = require('mongodb').MongoClient;

var routes = require('./app/routes');
var game = require('./app/models/game');

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('ckey', config.get('tictactoe.cookie.key'));
app.set('view engine', 'ejs');
app.use(favicon(join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(cookieParse(app.get('ckey')));
app.use(bodyParse.urlencoded({
  extended: true
}));
app.use(bodyParse.json());
app.use(methodOverride());
app.use(express.static(join(__dirname, 'public')));

database.connect(app.get('mongodb'), function(error, db) {
  // debug app - passing error object.
  if (error) {
    debug(error);
  }
  // routes.
  routes(db, app, function(error) {
    // debug app - passing error object.
    if (error) {
      debug(error);
    }
  });
});

// server listens to port.
server.listen(app.get('port'));
// socket.io;
io.on('connection', function(socket) {
  database.connect(app.get('mongodb'), function(error, db) {
    // debug error passing error object.
    if (error) {
      debug(error);
    }
    // routes.
    routes(db, app, function(error) {
      // debug app - passing error object.
      if (error) {
        debug(error);
      }
    });
    // run game.
    game.run(db, io, socket, function(error) {
      // debug error passing error object.
      if (error) {
        debug(error);
      }
    });
  });
});
