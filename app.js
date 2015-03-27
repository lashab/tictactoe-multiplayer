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

var db = require('mongodb').MongoClient;
db.connect(config.get('tictactoe.mongodb.url'), function(err, db) {
  Room.open(db, function(err, db, room) {
    if (err) {
      // debug 
      console.log(err);
    }
    if (room) {
      Player.in(db, {
        room: room._id,
        name: 'lasha',
        active: room.available ? true : false
      }, room, function(err, index, db, player) {
        if (err) {
          // debug
          console.log(err);
        }
        if (index) {
          console.log('fresh player added!');
          console.log('added index to %s', index);
          console.log(player);
        }
        else if(player) {
          console.log('new player added!');
          console.log(player);
        }
        else {
          console.log('no player added');
        }
      });
    }
    else {
      // debug
      console.log('no room added!');
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


