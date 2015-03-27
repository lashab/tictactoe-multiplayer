'use strict';
/**
 * Module dependencies.
 */
 var http = require('http');
 var join = require('path').join;
 var url = require('url');
 var config = require('config');

 var express = require('express');
 var app = express();
 var server = http.Server(app);
 var io = require('socket.io')(server);

 var cookieParser = require('cookie-parser');

 var Routes = require(join(__dirname, 'app/routes'));
 var Game = require(join(__dirname, 'app/models/game'));
 var Room = require(join(__dirname, 'app/models/room'));
 var Player = require(join(__dirname, 'app/models/player'));
 // Room.init({ id: 1, figure: 2});
 // Room.collection_get();
var db = require('mongodb').MongoClient;
db.connect(config.get('tictactoe.mongodb.url'), function(err, db) {
  // Room.open(db, function(err, db, room, fresh) {
  //   if (fresh) {
  //     console.log('this is fresh room.');
  //   }
  //   console.log(room);
  // })
  Room.open(db, function(err, db, room) {
    if (err) {
      //debug err
      console.log(err);
    }
    if (room) {
      if (room.fresh) {
        console.log('its fresh room by id %d', room._id);
      }
      else {
        console.log('its room by id %d', room._id);
      }
      console.log(room);
    }
    else {
      console.log('smthng goes wrong');
    }
  });
});

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
Routes(app);

// Server listens to port.
server.listen(app.get('port'));

// SocketIO.
io.on('connection', function (socket) {
  //new Game(app, io, socket).run();
});


