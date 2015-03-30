'use strict';

var join = require('path').join;
var debug = require('debug')('routes');
var template = require(join(__dirname, 'helpers/template'));
var Game = require(join(__dirname, 'models/game'));
var Player = require(join(__dirname, 'models/player'));

module.exports = function(app, db) {
  app.get('/', function(req, res) {
    // render homepage.
    res.render('index', {
      title: app.get('title'),
      body: template.render('home')
    });
  });

  app.get('/room/:id', function(req, res) {
    db.connect(app.get('mongodb'), function(err, db) {
      if (err) {
        debug(err);
      }
      Player.getPlayersByRoomPath(db, req.path, function(err, db, players) {
        if (err) {
          debug(err);
        }
        console.log(players);
        // render room.
        res.render('index', { 
          title: app.get('title'),
          body: template.render('room'),
          $class: 'rooms'
        });
      });
    });
  });

  app.post('/join', function(req, res) {
    // check whether the name was provided
    // successfuly otherwise back to the
    // homepage.
    if (req.body.name) {
      // connects to the databade.
      db.connect(app.get('mongodb'), function(err, db) {
        // if error happens debug it.
        if (err) {
          debug(err);
        }
        // join player to the game.
        Game.join(db, req.body.name, function(err, db, room) {
          // if error happens debug it.
          if (err) {
            debug(err);
          }
          // if succeeds set cookie
          // and redirect to the
          // room otherwise back
          // to the homepage.
          if (room) {
            // close connection.
            db.close();
            // set cookie.
            res.cookie('player', room.player);
            // do redirect.
            res.redirect(room.redirect);
          }
          else {
            // close connection.
            db.close();
            // back to homepage.
            res.redirect('/');
          }
        });
      });
    }
    else {
      // close connection.
      db.close();
      // back to homepage
      res.redirect('/');
    }
  });
}