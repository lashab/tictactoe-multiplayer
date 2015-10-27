// ----------------------------------------------
// Project: Tictactoe
// File: routes.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// ----------------------------------------------

'use strict';
/**
 * Module dependencies.
 */
var join = require('path').join;
var debug = require('debug')('route');
var template = require('./helpers/template');
var player = require('./models/player');
var room = require('./models/room');
var game = require('./models/game');

module.exports = function(db, app, callback) {
  // GET - / (homepage).
  app.get('/', function(request, response) {
    // debug route.
    debug('clearing cookie id.');
    // remove cookie id.
    response.clearCookie('id');
    // debug route.
    debug('clearing cookie position.');
    // remove cookie position.
    response.clearCookie('position');
    // debug route.
    debug('rendering homepage.');
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
      // player length ?
      if (players.length) {
        // cookie position couldn't be found ?
        if (!request.cookies.position) {
          // get room.
          room.getRoomById(db, id, function(error, db, _room) {
            // return callback - passing error object.
            if (error) {
              return callback(error);
            }
            // room is available ?
            if (_room.available) {
              // close room.
              room.close(db, {
                _id: id
              }, function(error, db, room) {
                // return callback - passing error object.
                if (error) {
                  return callback(error);
                }
                // debug route.
                debug('setting cookie id.');
                // set cookie - id.
                response.cookie('id', id);
                // continue.
                next();
              });
            }
            // :
            else {
              // debug route.
              debug('room #%d is full.', id);
              // debug route.
              debug('back to homepage.');
              // back to homepage.
              response.redirect('..');
            }
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
    // debug route.
    debug('rendering room page.');
    // render room page.
    response.render('index', {
      title: app.get('title'),
      body: template.render('room', {
        form: !request.cookies.position ? true : false
      })
    });
  });
  // POST - /join.
  app.post('/join', function(request, response, next) {
    // get player name.
    var name = request.body.name;
    // name field isn't empty && matches regex ?
    if (name && /^[A-Za-z]{1,8}$/.test(name)) {
      // debug route.
      debug('name middleware check has been passed.');
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
      // return callback - passing error object.
      if (error) {
        return callback(error);
      }
      // player has joined ?
      if (player) {
        // id === 0 ?
        if (!id) {
          // debug route.
          debug('setting cookie id.');
          // set cookie id.
          response.cookie('id', player.room);
        }
        // debug route.
        debug('setting cookie position.');
        // set cookie - position.
        response.cookie('position', player.position);
        // debug route.
        debug('redirecting to #%d room.', player.room);
        // redirect.
        response.redirect(player.redirect);
      }
      // :
      else {
        // debug route.
        debug('response end.');
        // end response.
        response.end();
      }
    });
  });
}
