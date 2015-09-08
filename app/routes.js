'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('routes');
var template = require('./helpers/template');
var game = require('./models/game');
var room = require('./models/room');

module.exports = function(db, app) {
  // GET - / (homepage).
  app.get('/', function(request, response) {
    // render homepage.
    response.render('index', {
      title: app.get('title'),
      body: template.render('home', {
        form: template.render('form')
      })
    });
    // remove cookie.
    response.clearCookie('position');
  });
  // GET - /room/:id where :id is room id.
  app.get('/room/:id', function(request, response, next) {
    // cookies position couldn't be found ?
    if (!request.cookies.position) {
      // get room id.
      var id = request.params.id;
      // update room.
      room.modify(db, {
        id: id,
        left: NaN
      }, function(error, db) {
        // return callback - passing error object.
        if (error) {
          return callback(error);
        }
        // debug route.
        debug('room #%d has been closed.', id);
        // continue.
        next();
      });
    }
    else {
      // continue.
      next();
    }
  }, function(request, response) {
    // render room page.
    response.render('index', { 
      title: app.get('title'),
      body: template.render('room', {
        form: !request.cookies.position ? template.render('form') : ''
      })
    });
  });
  // POST - /join.
  app.post('/join', function(request, response, next) {
    // get name.
    var name = request.body.name;
    // name field isn't empty && matches regex ?
    if (name && /^[A-Za-z]{1,8}$/.test(name)) {
      // continue.
      next();
    }
    // :
    else {
      // back to homepage.
      response.redirect('/');
    }
  }, function(request, response) {
    // join player to the game.
    game.join(db, request.body.name, function(error, db, player) {
      // debug error.
      if (error) {
        return callback(error);
      }
      // player has been joined ?
      if (player) {
        // set cookie.
        response.cookie('position', player.position);
        // redirect.
        response.redirect(player.redirect);
      }
      // :
      else {
        // debug route.
        debug('response end');
        // end response.
        response.end();
      }
    });
  });
}