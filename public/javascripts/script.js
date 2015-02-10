(function() {
  'use strict';

  var canvas = new fabric.Canvas('tictactoe');
  canvas.setWidth( window.innerWidth - (window.innerWidth - window.innerHeight));
  canvas.setHeight( window.innerHeight );

  var x = canvas.getWidth() / 3;
  var y = canvas.getHeight() / 3;

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
    , group: function(groups) {
      var options = {
        selectable: false,
        hasBorders: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        evented: false
      };
      return new this.fabric.Group(groups, options);
    }
  }

  var draw = new Draw();
  
  canvas.add(
    draw.group([draw.line([ x, 0, x, y ]), draw.line([ 0, y, x, y ])]),
    draw.group([draw.line([ x * 2, 0, x * 2, y ]), draw.line([ x * 2, y, x, y ])]),
    draw.group([draw.line([ x * 3, 0, x * 3, y ]), draw.line([ x * 3, y, x * 2, y ])]),
    draw.group([draw.line([ x, y, x, y * 2 ]), draw.line([ 0, y * 2, x, y * 2 ])]),
    draw.group([draw.line([ x * 2, y, x * 2, y * 2 ]), draw.line([ x, y * 2, x * 2, y * 2 ])]),
    draw.group([draw.line([ x * 3, y, x * 3, y * 2 ]), draw.line([ x * 3, y * 2, x * 2, y * 2 ])]),
    draw.group([draw.line([ x, y * 2, x, y * 3 ]), draw.line([ 0, y * 3, x, y * 3 ])]),
    draw.group([draw.line([ x * 2, y * 2, x * 2, y * 3 ]), draw.line([ x, y * 3, x * 2, y * 3 ])]),
    draw.group([draw.line([ x * 3, y * 2, x * 3, y * 3 ]), draw.line([ x * 2, y * 3, x * 3, y * 3 ])])
  );

  var _group = '_group';
  var _group_c = canvas.getObjects().length - 1;

  var init = function() {
    canvas.forEachObject(function( object, index ) {
      object.set({
        _group: {
          key: index,
          value: NaN 
        },
        evented: true,
      });
    });
  }

  init();

  var play = function( group, options, callback ) {
    if ( group ) {
      group = group.set( 'evented', false );

      var left = group.getLeft();
      var top = group.getTop();
      var width = group.getWidth();
      var height = group.getHeight();
      var offset = width / 4;

      if ( which ) {
        which = false;
        canvas.add(draw.group([
          draw.line([ left + offset, top + offset, left + width - offset, top + height - offset ]), 
          draw.line([ left + width - offset, top + offset, left + offset, top + height - offset ])
        ]).set('opacity', 0.5).animate('opacity', 1, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas)
        }));
      }
      else {
        which = true;
        var centerX = left + ( width / 2 );
        var centerY = top + ( height / 2 );
        var radius  = width / 3;
        canvas.add(draw.circle( centerX, centerY, radius ).set('opacity', 0.5).animate('opacity', 1, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas)
        }));
      }

      var key = group.get( _group ).key;
      var j = _group_c;
      var property = 'value';
      var over = false;

      var combinations = {
        0: [ 0, 1, 2 ],
        1: [ 3, 4, 5 ],
        2: [ 6, 7, 8 ],
        3: [ 0, 3, 6 ],
        4: [ 1, 4, 7 ],
        5: [ 2, 5, 8 ],
        6: [ 0, 4, 8 ],
        7: [ 2, 4, 6 ]
      };

      group.set(_group, {
        key: key,
        value: ~~which
      });

      while ( j !== -1 ) {
        if ( isNaN( canvas.item(j).get( _group )[ property ] ) ) {
          canvas.item( j ).set( 'evented', options.evented );
        }
        j--;
      }

      for ( var i in combinations ) {
        var combination = combinations[i];
        var a = canvas.item( combination[0] ).get( _group )[ property ];
        var b = canvas.item( combination[1] ).get(_group)[ property ];
        var c = canvas.item( combination[2] ).get(_group)[ property ];
        if ( ( !isNaN( a ) && !isNaN( b ) && !isNaN( c ) ) && ( a === b && b === c ) ) {
          over = true;
        }
      }

      if (over) {
        var count = canvas.getObjects().length - 1;
        while (count !== _group_c) {
          canvas.fxRemove(canvas.item(count));
          count--;
        }
        init();
      }

      if ( callback && typeof callback === 'function' ) {
        callback( key );
      }
    }
  };

  var sio = io();

  sio.on( 'get', function( options ) {
    play( canvas.item( options.key ), {
      evented: true
    })
  });

  canvas.on({
    'mouse:down': function( e ) {
      play(e.target, {
        evented: false
      }, function(key) {
        sio.emit( 'set', { key: key } );
      })
    }
  });

  canvas.renderAll();
})();