'use strict';

var join = require('path').join;
var url = require('url');
var Template = require('../models/template');
var Room = require('../models/room');
var Mongo = require('../models/database');
var db = new Mongo();

exports.index = function(req, res) {
  var template = new Template('../views/homepage.ejs')
  res.render('index', { 
    title: 'Tic Tac Toe',
    body: template.render()
  });
};

exports.play = function(req, res) {
  db.connect(function(connection) {
    var template = new Template('../views/tictactoe.ejs');
    var room = new Room();
    room.getPlayersByRoomId(connection, room.getRoomIdByPath(req.path), function(players) {
      res.render('index', { 
        title: 'Tic Tac Toe',
        body: template.render({ players: players })
      });
      connection.close();
    });
  });
}

exports.leave = function(req, res) {}
