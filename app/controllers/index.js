'use strict';

var ejs = require('ejs');
var fs = require('fs');
var join = require('path').join;
var url = require('url');
var Game = require('../models/game');
var Players = require('../models/players');

exports.index = function(req, res){
  var file = fs.readFileSync(join(__dirname, '../views/homepage.ejs'), 'utf-8');
  var template = ejs.compile(file);
  res.render('index', { 
    title: 'Tictactoe',
    body: template()
  });};

exports.play = function(req, res) {
  var file = fs.readFileSync(join(__dirname, '../views/tictactoe.ejs'), 'utf-8');
  var template = ejs.compile(file);
  var room = req.path.split('/')[2];
    Players.getRoomPlayers(room, function(_players, connection) {
      res.render('index', { 
        title: 'Tictactoe',
        body: template({
          users: _players
        })
      });
    });
  }

exports.join = function(req, res) {
  if (req.body.name) { 
    Game.join(req.body.name, function(room) {
      res.redirect(join('room', room.toString()));
    });
  }
  else {
    res.redirect('/');
  }}

exports.leave = function(req, res) {}
