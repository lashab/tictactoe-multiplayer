'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('routes');
var template = require('./helpers/template');
var game = require('./models/game');


module.exports = function(app, db) {
  // GET - homepage
  app.get('/', function(req, res) {
    // render homepage.
    res.render('index', {
      title: app.get('title'),
      body: template.render('home')
    });
    // remove cookie.
    res.clearCookie('position');
  });
  // GET - room page where :id is room id.
  app.get('/room/:id', function(req, res) {
    // render room page.
    res.render('index', { 
      title: app.get('title'),
      body: template.render('room'),
      $class: 'room'
    });
  });
  // POST - join player.
  app.post('/join', function(req, res, next) {
    // name has been chosen ?
    if (req.body.name) {
      // continue from next callback.
      next()
    }
    // :
    else {
      // back to homepage.
      res.redirect('/');
    }
  }, function(req, res) {
    // open database connection.
    db.connect(app.get('mongodb'), function(error, db) {
      // debug route - error.
      if (error) {
        debug(error);
      }
      // debug route - open database connection.
      debug('open connection');
      // join player to the game.
      game.join(db, req.body.name, function(error, db, player) {
        // debug error.
        if (error) {
          debug(error);
        }
        // player has been joined ?
        if (player) {
          // set cookie.
          res.cookie('position', player.position);
          // redirect.
          res.redirect(player.redirect);
        }
        // :
        else {
          // debug route.
          debug('response end');
          // end response.
          res.end();
        }
      });
    });
  });
}