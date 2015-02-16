'use strict';

var ejs = require('ejs');
var fs = require('fs');
var join = require('path').join;
var Game = require('../models/game');

exports.index = function(req, res){
  var file = fs.readFileSync(join(__dirname, '../views/homepage.ejs'), 'utf-8');
  var template = ejs.compile(file);
  res.render('index', { 
    title: 'Tictactoe',
    body: template()
  });
};

exports.play = function(req, res) {
  var file = fs.readFileSync(join(__dirname, '../views/tictactoe.ejs'), 'utf-8');
  var template = ejs.compile(file);
  res.render('index', { 
    title: 'Tictactoe',
    body: template()
  });
}

exports.join = function(req, res) {
  if (req.body.name) { 
    Game.join(req.body.name);
  }
}

exports.leave = function(req, res) {

}
