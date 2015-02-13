  
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./app/routes')
  , http = require('http')
  , path = require('path');

var app = express();
var sio = require('http').Server(app);
var io = require('socket.io')(sio);
var Schema = require('./app/models/schema');

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

app.get('/', routes.index);
app.get('/room', routes.play);
app.post('/join', routes.join);

sio.listen(app.get('port'));

io.on('connection', function (socket) {
  socket.on('set', function(data) {
    socket.broadcast.emit('get', data);
  });
});

