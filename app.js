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

var Routes = require(join(__dirname, 'app/routes'));
var Game = require(join(__dirname, 'app/models/game'));
var Room = require(join(__dirname, 'app/models/room'));

// database.connect(config.get('tictactoe.mongodb.url'), function(err, db) {
//   Room.open(db, function(err, db, room) {
//     if (err) {
//       console.log('aq ar var'); 
//       console.log(err);
//     }

//     if (room) {
//       console.log('aq var');
//     }
//     else {
//       console.log('aq ar var');
//     }

//   });
// });

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(cookieParser('foo'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
Routes(app, database);

// Server listens to port.
server.listen(app.get('port'));

// SocketIO.
io.on('connection', function (socket) {
  //new Game(app, io, socket).run();
});


