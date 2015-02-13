
/*
 * GET home page.
 */

// 'use strict';

var ejs = require('ejs');
var fs = require('fs');
var join = require('path').join;

exports.index = function(req, res){
  var file = fs.readFileSync(join(__dirname, '../views/homepage.ejs'), 'utf-8');
  var template = ejs.compile(file);
  res.render('index', { 
    title: 'Tictactoe',
    body: template()
  });
};

exports.play = function(req, res) {
  var file = fs.readFileSync(join(__dirname, '../views/tictactoe.ejs'), 'utf-8');
  var template = ejs.compile(file);
  res.render('index', { 
    title: 'Tictactoe',
    body: template()
  });
}

exports.join = function(req, res) {
  res.redirect('/room');
}

exports.leave = function(req, res) {

}
