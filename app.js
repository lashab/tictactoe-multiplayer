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

var Routes = require(join(__dirname, 'app/routes'));
var Player = require(join(__dirname, 'app/models/player'));
var Game = require(join(__dirname, 'app/models/game'));

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes.
Routes(app, database);

// Server listens to port.
server.listen(app.get('port'));

// SocketIO.
io.on('connection', function (socket) {

  database.connect(app.get('mongodb'), function(err, db) {
    // if error happens debug it.
    if (err) {
      debug(err);
    }
    // run game.
    Game.run(db, io, socket, function(err) {
      // if error happens debug it.
      if (err) {
        debug(err);
      }
    });
  });
});


