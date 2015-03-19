'use strict';
/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var url = require('url');
var join = path.join;

var app = express();
var sio = require('http').Server(app);
var io = require('socket.io')(sio);

var Game = require(join(__dirname, 'app/models/game'));
var Routes = require(join(__dirname, 'app/routes'));

var config = require('config');

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  app.locals.delimiters = '{{ }}';
}

// Routes
Routes(app);

sio.listen(app.get('port'));
 
// SocketIO 
io.on('connection', function (socket) {
  new Game(io, socket).run();
});


