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
    var template = new Template('../views/room.ejs');
    var room = new Room();
    res.render('index', { 
      title: 'Tic Tac Toe',
      body: template.render(),
      $class: 'rooms'
    });
  });
}

exports.leave = function(req, res) {}
