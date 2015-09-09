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
var config = require('config');
var cookieParser = require('cookie-parser');
var database = require('mongodb').MongoClient;
var debug = require('debug')('app');

var routes = require('./app/routes');
var game = require('./app/models/game');

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(cookieParser());
app.use(express.session({ secret: 'tictactoeqwerty' }))
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var room = require('./app/models/room');

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

  room._add(db, {
    _id: 12,
  }, function(error, db, data) {
    if (error) {
      debug(error);
    }
  });
});

// Server listens to port.
server.listen(app.get('port'));

// SocketIO.
io.on('connection', function (socket) {
  database.connect(app.get('mongodb'), function(error, db) {
    // debug error.
    if (error) {
      debug(error);
    }
    // run game.
    game.run(db, io, socket, function(error) {
      // if error happens debug it.
      if (error) {
        debug(error);
      }
    });
  });
});


