'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('routes');
var template = require('./helpers/template');
var player = require('./models/player');
var room = require('./models/room');
var game = require('./models/game');

module.exports = function(db, app, callback) {
  // GET - / (homepage).
  app.get('/', function(request, response) {
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
    // render homepage.
    response.render('index', {
      title: app.get('title'),
      body: template.render('home')
    });
  });
  // GET - /room/:id where :id is room id.
  app.get('/room/:id', function(request, response, next) {
    // get room id.
    var id = request.params.id;
    // get players by room.
    player.getPlayersByRoom(db, {
      _id: id
    }, function(error, db, players) {
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // player length > 0 
      if (players.length) {
        // cookie position couldn't be found ?
        if (!request.cookies.position) {
          // close room.
          room.close(db, id, function(error, db, room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // set cookie - id.
            response.cookie('id', id);
            // debug route.
            debug('cookie id has been setted.')
            // continue.
            next();
          });
        }
        // :
        else {
          // continue.
          next();
        }
      }
      // :
      else {
        // debug route.
        debug('players couldn\'t found in #%d room.', id);
        // debug route.
        debug('back to homepage.');
        // back to homepage.
        response.redirect('..');
      }
    });
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
      response.redirect('..');
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
        debug('cookie position has been added.');
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