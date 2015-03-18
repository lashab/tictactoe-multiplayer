'use strict';
/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , join = path.join

  , app = express()
  , sio = require('http').Server(app)
  , io = require('socket.io')(sio)
  , Controllers = require('./app/controllers')
  , Game = require('./app/models/game');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app/views');
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
}

app.get('/', Controllers.index);
app.get('/room/:id', Controllers.play);

sio.listen(app.get('port'));

io.on('connection', function (socket) {
  new Game(io, socket).run();
});


