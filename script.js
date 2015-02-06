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

  canvas.forEachObject(function(object, index) {
    object.set('_box', {
      key: index + 1,
      value: NaN
    });
  });

  canvas.on({
    'mouse:down': function(e) {
      if (e.target) {

        var box = e.target.set('evented', false);
        var left = box.getLeft();
        var top = box.getTop();
        var width = box.getWidth();
        var height = box.getHeight();
        var offset = width / 4;
        if (which) {
          which = false;
          canvas.add(draw.group([draw.line([left + offset, top + offset, left + width - offset, top + height - offset]), draw.line([left + width - offset, top + offset, left + offset, top + height - offset])]).set({evented: false,
          }));
          box.set('_box', {
            key: box.get('_box').key,
            value: 1
          });
        }
        else {
          which = true;
          var centerX = left + ( width / 2 );
          var centerY = top + ( height / 2 );
          var radius  = width / 3;
          canvas.add(draw.circle(centerX, centerY, radius));
        }
        var _group = '_box';
        box.set(_group, {
          key: box.get(_group).key,
          value: ~~which
        });
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
        for (var i in combinations) {
          var combination = combinations[i];
          var a = canvas.item(combination[0])._box.value;
          var b = canvas.item(combination[1])._box.value;
          var c = canvas.item(combination[2])._box.value;

          console.log('a = ' + a + ' b = ' + b + ' c = ' + c );
          
          if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c )) {
            alert();
          }
        }
      }
    }
  }).renderAll();
})();