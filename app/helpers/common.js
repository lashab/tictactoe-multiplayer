'use strict';

module.exports = {
  isEmptyObject: function(object) {
    var name;
    for (name in object) {
      return false;
    }
    return true;
  }
};