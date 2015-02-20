'use strict';

var join = require('path').join;
var url = require('url');
var Game = require('../models/game');
var Player = require('../models/player');
var Template = require('../models/template');
var Room = require('../models/room');
var Mongo = require('../models/database');
var db = new Mongo();

exports.index = function(req, res) {
  var template = new Template('../views/homepage.ejs')
  res.render('index', { 
    title: 'Tictactoe',
    body: template.render()
  });
};

exports.play = function(req, res) {
  db.connect(function(connection) {
    var template = new Template('../views/tictactoe.ejs');
    var room = new Room();
    room.getPlayersByRoomId(room.getRoomIdByPath(req.path), function(players) {
      res.render('index', { 
        title: 'Tictactoe',
        body: template.render({ players: players })
      });
      connection.close();
    });
  });
}

exports.join = function(req, res) {
  if (req.body.name) {
    var game = new Game();
    game.join(req.body.name, function(room) {
      // res.redirect(join('room', room.toString()));
    });
  }
  else {
    res.redirect('/');
  }
}

exports.leave = function(req, res) {}
