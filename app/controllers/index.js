'use strict';

var join = require('path').join;
var url = require('url');
var Game = require('../models/game');
var Player = require('../models/player');
var Template = require('../models/template');
var Room = require('../models/room');

exports.index = function(req, res){
  var template = new Template('../views/homepage.ejs')
  res.render('index', { 
    title: 'Tictactoe',
    body: template.render()
  });};

exports.play = function(req, res) {
  var template = new Template('../views/tictactoe.ejs');
  var room = new Room();
  Room.getRoomPlayers(room.getRoomIdByPath(req.path), function(_players, connection) {
    res.render('index', { 
      title: 'Tictactoe',
      body: template.render({ users: _players })
    });
  });
}

exports.join = function(req, res) {
  if (req.body.name) {
    var game = new Game();
    game.join(req.body.name, function(room) {
      res.redirect(join('room', room.toString()));
    });
  }
  else {
    res.redirect('/');
  }
}

exports.leave = function(req, res) {}
