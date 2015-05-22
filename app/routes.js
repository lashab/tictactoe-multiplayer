'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('route');
var Template = require(join(__dirname, 'helpers/template'));
var Player = require(join(__dirname, 'models/player'));

module.exports = function(app, db) {
  // GET - homepage
  app.get('/', function(req, res) {
    // render homepage.
    res.render('index', {
      title: app.get('title'),
      body: Template.render('home')
    });
  });
  // GET - room page where :id is room id.
  app.get('/room/:id', function(req, res) {
    // render room page.
    res.render('index', { 
      title: app.get('title'),
      body: Template.render('room'),
      $class: 'room'
    });
  });
  // POST - join player.
  app.post('/join', function(req, res) {
    // player name ?
    if (req.body.name) {
      // open database connection.
      db.connect(app.get('mongodb'), function(error, db) {
        // debug route - error.
        if (error) {
          debug(error);
        }
        // debug route - open database connection.
        debug('open connection');
        // join player to the room.
        Player.join(db, req.body.name, function(error, db, player) {
          // debug error.
          if (error) {
            debug(error);
          }
          // player has joined ?
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
            debug('close connection');
            // end response.
            res.end();
            // close database connection.
            db.close();
          }
        });
      });
    }
    //: 
    else {
      // debug route.
      debug('response end');
      // end response.
      res.end();
    }
  });
}