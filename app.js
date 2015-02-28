  
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
var Mongo = require('./app/models/database');
var db = new Mongo();

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
  //     db.connect(function(connection) {
  //       db.setCollection(connection, 'rooms').selectOne({_id: parseInt(room)}, function(document) {
  //         db.setCollection(connection, 'players').select({_rid: document.players}, function(documents) {
  //           var size = documents.length;
  //           var status = document.status;
  //           socket.join(room);
  //           if (size > 1 && !status) {
  //             db.setCollection(connection, 'rooms').modify({_id: parseInt(room)}, [], {$set: {status: 1}}, {new: true}, function(document) {
  //               console.log(document);
  //               socket.broadcast.in(room).emit('join', documents[1]);
  //               connection.close();
  //             });
  //           }
  //         });
  //       });
  //     });
  //     // db.selectOne('rooms', {_id: parseInt(room)}, function(document, connection) {
  //     //   if (document.users.length > 1) {
  //     //     socket.broadcast.emit('join', document.users);
  //     //   }
  //     //   connection.close();
  //     // });
  //   }
  // });


  // socket.on('set', function(data) {
  //   socket.broadcast.in(data.room).emit('get', data);
  // });
});


