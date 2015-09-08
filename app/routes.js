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
      body: template.render('home')
    });
    // debug route.
    debug('homepage has been rendered.');
    // remove cookie id.
    response.clearCookie('id');
    // debug route.
    debug('cookie id has been removed.');
    // remove cookie position.
    response.clearCookie('position');
    // debug route.
    debug('cookie position has been removed.');
  });
  // GET - /room/:id where :id is room id.
  app.get('/room/:id', function(request, response, next) {
    // cookies position couldn't be found ?
    if (!request.cookies.position) {
      // get room id && casting id.
      var id = request.params.id >> 0;
      // update room (close room).
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
        // set cookie - id.
        response.cookie('id', id);
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
        form: !request.cookies.position ? true : false
      })
    });
    // debug route.
    debug('room page has been rendered.');
  });
  // POST - /join.
  app.post('/join', function(request, response, next) {
    // get name.
    var name = request.body.name;
    // name field isn't empty && matches regex ?
    if (name && /^[A-Za-z]{1,8}$/.test(name)) {
      // debug route.
      debug('name middleware check has been passed.')
      // continue.
      next();
    }
    // :
    else {
      // debug route.
      debug('name middleware check failed, getting back to the home page.')
      // back to homepage.
      response.redirect('/');
    }
  }, function(request, response) {
    // get room id.
    var id = request.cookies.id ? request.cookies.id : 0;
    // join player to the game.
    game.join(db, request.body.name, id, function(error, db, player) {
      // debug error.
      if (error) {
        return callback(error);
      }
      // player has been joined ?
      if (player) {
        // debug route.
        debug('cookie position has been setted.');
        // set cookie - position.
        response.cookie('position', player.position);
        // debug route.
        debug('redirecting to #%d room.', player.redirect);
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