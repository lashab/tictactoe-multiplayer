'use strict';

var join = require('path').join;
var template = require(join(__dirname, 'helpers/template'));
var Game = require(join(__dirname, 'models/game'));

module.exports = function(app, db) {
  app.get('/', function(req, res) {
    res.render('index', {
      title: app.get('title'),
      body: template.render('home')
    });
  });

  app.get('/room/:id', function(req, res) {
    res.render('index', { 
      title: app.get('title'),
      body: template.render('room'),
      $class: 'rooms'
    });
  });

  app.post('/join', function(req, res) {
    if (req.body.name) {
      new Game(app).join(req.body.name, function(room) {
        res.cookie('player', room.player);
        res.redirect(room.path);
      });
    }
  });
}