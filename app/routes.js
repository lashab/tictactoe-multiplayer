'use strict';

var join = require('path').join;
var template = require(join(__dirname, 'helpers/template'));

module.exports = function(app) {

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
}