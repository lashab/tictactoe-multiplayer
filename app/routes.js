'use strict';

var join = require('path').join;
var debug = require('debug')('routes');
var Template = require(join(__dirname, 'helpers/template'));
var Room = require(join(__dirname, 'models/room'));

module.exports = function(app, db) {
  app.get('/', function(req, res) {
    // render homepage.
    res.render('index', {
      title: app.get('title'),
      body: Template.render('home')
    });
  });

  app.get('/room/:id', function(req, res) {
    res.render('index', { 
      title: app.get('title'),
      body: Template.render('room'),
      $class: 'room'
    });
  });

  app.post('/join', function(req, res) {
    // check for name.
    if (req.body.name) {
      // open database connection.
      db.connect(app.get('mongodb'), function(err, db) {
        // if error happens debug it.
        if (err) {
          debug(err);
        }
        // join player to the room.
        Room.join(db, req.body.name, function(err, db, room) {
          // if error happens debug it.
          if (err) {
            debug(err);
          }
          // if succeeds set cookie
          // and redirect to the
          // room otherwise back
          // to the homepage.
          if (room) {
            // set cookie.
            res.cookie('position', room.position);
            // do redirect.
            res.redirect(room.redirect);
            // close connection.
            db.close();
          }
          else {
            // back to the homepage.
            res.redirect('/');
            // close connection.
            db.close();
          }
        });
      });
    }
    else {
      // back to the homepage
      res.redirect('/');
    }
  });
}