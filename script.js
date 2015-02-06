(function() {
  'use strict'; 
  var canvas = new fabric.Canvas('tictactoe');
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);

  var x = canvas.getWidth() / 3;
  var y = canvas.getHeight() / 3;
  x = x - (x - y);

  var cross = true;

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
        originY: 'center'
      };  
      return new this.fabric.Circle(options);
    }
    , group: function(groups) {
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
    ).on({
      'mouse:down': function(e) {
        if (e.target) {
          var box = e.target;
          var left = box.getLeft();
          var top = box.getTop();
          var width = box.getWidth();
          var height = box.getHeight();
          var offset = width / 4;
          if (cross) {
            cross = false;
            canvas.add(draw.group([draw.line([left + offset, top + offset, left + width - offset, top + height - offset]), draw.line([left + width - offset, top + offset, left + offset, top + height - offset])]));
          } 
          else {
            cross = true;
            var centerX = left + ( width / 2 );
            var centerY = top + ( height / 2 );
            var radius  = width / 3;
            canvas.add(draw.circle(centerX, centerY, radius));
          }
          box.set('evented', false);
        }
      }
    }).renderAll();
  })();