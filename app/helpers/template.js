'use strict';

var join = require('path').join;
var fs = require('fs');
var ejs = require('ejs');

module.exports = {
  prepare: function(template) {
    if (template) {
      var file = fs.readFileSync(join(__dirname, '../views', template + '.ejs'), 'utf-8');
      return ejs.compile(file);
    }
  }
, render: function(template, data) {
    var template = this.prepare(template);
    return template(data);
  }
}