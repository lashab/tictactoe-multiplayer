  
/**
 * Module dependencies.
 */
var express = require('express')
  , controllers = require('./app/controllers')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , join = path.join;

var app = express();
var sio = require('http').Server(app);
var io = require('socket.io')(sio);
var db = require('./app/models/database');

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
app.get('/room/:id', controllers.play);
app.post('/join', controllers.join);

sio.listen(app.get('port'));

io.on('connection', function (socket) {
  // socket.on('join', function(room) {
  //   if (room) {
  //     db.selectOne('rooms', {_id: parseInt(room)}, function(document, connection) {
  //       if (document.users.length > 1) {
  //         socket.broadcast.emit('join', document.users);
  //       }
  //       connection.close();
  //     });
  //   }
  // });
  // socket.on('set', function(data) {
  //   socket.broadcast.to('room').emit('get', data);
  // });
});


