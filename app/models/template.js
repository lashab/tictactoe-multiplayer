'use strict';

var join = require('path').join;
var fs = require('fs');
var ejs = require('ejs');

var Template = function(template) {
  this.template = template; 
}

Template.prototype = {
  ready: function() {
    var file = fs.readFileSync(join(__dirname, this.template), 'utf-8');
    return ejs.compile(file);
  },
  render: function(data) {
    var template = this.ready();
    return template(data);
  } 
}

module.exports = Template;