  
/**
 * Module dependencies.
 */
var express = require('express')
  , controllers = require('./app/controllers')
  , http = require('http')
  , path = require('path');

var app = express();
var sio = require('http').Server(app);
var io = require('socket.io')(sio);

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

app.get('/', controllers.index);
app.get('/room', controllers.play);
app.post('/join', controllers.join);

sio.listen(app.get('port'));

io.on('connection', function (socket) {
  socket.on('set', function(data) {
    socket.broadcast.emit('get', data);
  });
});

