'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('routes');
var template = require('./helpers/template');
var game = require('./models/game');
var room = require('./models/room');

module.exports = function(app, db) {
  // GET - / (homepage).
  app.get('/', function(req, res) {
    // render homepage.
    res.render('index', {
      title: app.get('title'),
      body: template.render('home', {
        form: template.render('form')
      })
    });
    // remove cookie.
    res.clearCookie('position');
  });
  // GET - /room/:id where :id is room id.
  app.get('/room/:id', function(req, res) {
    var position = req.cookies.position;
    if (!position) {
      var id = req.params.id;
      // update room.
      room.modify(db, {
        id: id,
        left: NaN
      }, function(error, db) {
        // return callback - passing error object.
        if (error) {
          return debug(error);
        }
        // debug route.
        debug('room #%d has been closed.', id);
      });
    }
    // render room page.
    res.render('index', { 
      title: app.get('title'),
      body: template.render('room', {
        form: !position ? template.render('form') : ''
      })
    });
  });
  // POST - /join.
  app.post('/join', function(req, res, next) {
    // get name.
    var name = req.body.name;
    // name field isn't empty && matches regex ?
    if (name && /^[A-Za-z]{1,8}$/.test(name)) {
      // continue.
      next();
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