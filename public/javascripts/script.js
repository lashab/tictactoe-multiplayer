(function() {
  'use strict'; 
  var canvas = new fabric.Canvas('tictactoe');
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);

  var x = canvas.getWidth() / 3;
  var y = canvas.getHeight() / 3;
  x = x - (x - y);

  var which = true;
  var _box = {};

  function Draw() {
    this.fabric = fabric;
  };

  Draw.prototype = {
    line: function(coords) {
      var options = {
        stroke: 'black',
        strokeWidth: 1,
        selectable: false,
        evented: false
      };
      return new this.fabric.Line(coords, options);
    }
    , circle: function(left, top, radius) {
      var options = {
        radius: radius, 
        fill: '#fff',
        left: left,
        top: top,
        stroke: 'black',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false      
      };  
      return new this.fabric.Circle(options);
    }
    , group: function(groups, evented) {
      var options = {
        selectable: false,
        hoverCursor: 'pointer',
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      };
      return new this.fabric.Group(groups, options);
    }
  }

  var draw = new Draw();

  canvas.add(
    draw.group([draw.line([x, 0, x, y]), draw.line([0, y, x, y])]),
    draw.group([draw.line([x * 2, 0, x * 2, y]), draw.line([x * 2, y, x, y])]),
    draw.group([draw.line([x * 3, 0, x * 3, y]), draw.line([x * 3, y, x * 2, y])]),
    draw.group([draw.line([x, y, x, y * 2]), draw.line([0, y * 2, x, y * 2])]),
    draw.group([draw.line([x * 2, y, x * 2, y * 2]), draw.line([x, y * 2, x * 2, y * 2])]),
    draw.group([draw.line([x * 3, y, x * 3, y * 2]), draw.line([x * 3, y * 2, x * 2, y * 2])]),
    draw.group([draw.line([x, y * 2, x, y * 3]), draw.line([0, y * 3, x, y * 3])]),
    draw.group([draw.line([x * 2, y * 2, x * 2, y * 3]), draw.line([x, y * 3, x * 2, y * 3])]),
    draw.group([draw.line([x * 3, y * 2, x * 3, y * 3]), draw.line([x * 2, y * 3, x * 3, y * 3])])
    );

  var _group = '_group';

  canvas.forEachObject(function(object, index) {
    object.set(_group, {
      key: index,
      value: NaN
    });
  });

  var play = function(group, options, callback) {
    if (group) {
      // group = group.set('evented', false);
      var left = group.getLeft();
      var top = group.getTop();
      var width = group.getWidth();
      var height = group.getHeight();
      var offset = width / 4;
      if ( which ) {
        which = false;
        canvas.add(draw.group([
          draw.line([left + offset, top + offset, left + width - offset, top + height - offset]), 
          draw.line([left + width - offset, top + offset, left + offset, top + height - offset])
        ]).set('evented', false));
      }
      else {
        which = true;
        var centerX = left + ( width / 2 );
        var centerY = top + ( height / 2 );
        var radius  = width / 3;
        canvas.add(draw.circle(centerX, centerY, radius));
      }
      var key = group.get(_group).key;
      group.set(_group, {
        key: key,
        value: ~~which
      });
      var j = 8;
      var property = 'value';
      var combinations = {
        0: [0, 1, 2],
        1: [3, 4, 5],
        2: [6, 7, 8],
        3: [0, 3, 6],
        4: [1, 4, 7],
        5: [2, 5, 8],
        6: [0, 4, 8],
        7: [2, 4, 6]
      };
      while ( j !== -1 ) {
        canvas.item(j).set('evented', options.evented);
        j--;
      }
      for (var i in combinations) {
        var combination = combinations[i];
        var a = canvas.item(combination[0]).get(_group).value;
        var b = canvas.item(combination[1]).get(_group).value;
        var c = canvas.item(combination[2]).get(_group).value;          
        if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c )) {
          alert();
        }
      }
      if (callback && typeof callback === 'function') {
        callback(key);
      }
    }
  };

  var sio = io();

  sio.on('get', function(options) {
    play(canvas.item(options.key), {
      evented: true
    })
  });

  canvas.on({
    'mouse:down': function(e) {
      play(e.target, {
        evented: false
      }, function(key) {
        sio.emit('set', { key: key });
      })
    }
  })
  canvas.renderAll();
})();