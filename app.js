'use strict';
/**
 * Module dependencies.
 */
 var express = require('express');
 var http = require('http');
 var join = require('path').join;
 var url = require('url');
 var config = require('config');

 var app = express();
 var sio = http.Server(app);
 var io = require('socket.io')(sio);

 var routes = require(join(__dirname, 'app/routes'));
 var Game = require(join(__dirname, 'app/models/game'));

 var session = require('express-session');
 var cookieParser = require('cookie-parser');
 var Cookies = require('cookies');

 var MongoStore = require('connect-mongo')(session);
 var MongoSessionStore = new MongoStore({url: config.get('tictactoe.mongodb.url')});

// all environments
app.set('port', process.env.PORT || config.get('tictactoe.port'));
app.set('views', join(__dirname, config.get('tictactoe.views.path')));
app.set('title', config.get('tictactoe.title'));
app.set('mongodb', config.get('tictactoe.mongodb.url'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(cookieParser('foo'));
app.use(session({
  store: MongoSessionStore,
  key: 'connect.sid',
  secret: 'foo',
  resave: true,
  saveUninitialized: true
}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
routes(app);

sio.listen(app.get('port'));

io.on('connection', function (socket) {
  new Game(app, io, socket).run();
});


