(function() {
  'use strict';

  var canvas = new fabric.Canvas('tictactoe');

  canvas.setWidth( window.innerWidth - (window.innerWidth - window.innerHeight));
  canvas.setHeight( window.innerHeight );

  var x = canvas.getWidth() / 3;
  var y = canvas.getHeight() / 3;

  var figure = true;
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

  var Draw = new Draw();
  
  canvas.add(
    Draw.group([Draw.line([ x, 0, x, y ]), Draw.line([ 0, y, x, y ])]),
    Draw.group([Draw.line([ x * 2, 0, x * 2, y ]), Draw.line([ x * 2, y, x, y ])]),
    Draw.group([Draw.line([ x * 3, 0, x * 3, y ]), Draw.line([ x * 3, y, x * 2, y ])]),
    Draw.group([Draw.line([ x, y, x, y * 2 ]), Draw.line([ 0, y * 2, x, y * 2 ])]),
    Draw.group([Draw.line([ x * 2, y, x * 2, y * 2 ]), Draw.line([ x, y * 2, x * 2, y * 2 ])]),
    Draw.group([Draw.line([ x * 3, y, x * 3, y * 2 ]), Draw.line([ x * 3, y * 2, x * 2, y * 2 ])]),
    Draw.group([Draw.line([ x, y * 2, x, y * 3 ]), Draw.line([ 0, y * 3, x, y * 3 ])]),
    Draw.group([Draw.line([ x * 2, y * 2, x * 2, y * 3 ]), Draw.line([ x, y * 3, x * 2, y * 3 ])]),
    Draw.group([Draw.line([ x * 3, y * 2, x * 3, y * 3 ]), Draw.line([ x * 2, y * 3, x * 3, y * 3 ])])
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

  var play = function(group, options, callback) {
    if (group) {
      group = group.set('evented', false);

      var left = group.getLeft();
      var top = group.getTop();
      var width = group.getWidth();
      var height = group.getHeight();
      var offset = width / 4;

      if (figure) {
        var cross = Draw.group([
          Draw.line([ left + offset, top + offset, left + width - offset, top + height - offset ]), 
          Draw.line([ left + width - offset, top + offset, left + offset, top + height - offset ])
        ]);

        cross.set('opacity', 0.5);
        cross.animate('opacity', 1, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas)
        });
        canvas.add(cross);

        figure = false;
      }
      else {
        var centerX = left + (width / 2);
        var centerY = top + (height / 2);
        var radius  = width / 3;
        var circle = Draw.circle(centerX, centerY, radius);

        circle.set('opacity', 0.5);
        circle.animate('opacity', 1, {
          duration: 200,
          onChange: canvas.renderAll.bind(canvas)
        });

        canvas.add(circle);

        figure = true;
      }

      var key = group.get( _group ).key;
      var j = _group_c;
      var property = 'value';
      var game = {
        over: false,
        won: []
      };

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
        value: ~~figure
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
          game = {
            over: true,
            won: combination
          } 
        }
      }

      if (game.over) {

        var _a = game.won[0];
        var _b = game.won[2];
        var _c = _b - _a;

        var _a_group = canvas.item(_a);
        var _c_group = canvas.item(_b);

        var _a_groupWidth = _a_group.getWidth() / 2.5;
        var _c_groupWidth = _c_group.getWidth() / 2.5;

        var _a_groupHeight = _a_group.getHeight() / 2.5;
        var _c_groupHeight = _c_group.getHeight() / 2.5; 

        var _a_groupOriginCenter = _a_group.getPointByOrigin('center', 'center');
        var _c_groupOriginCenter = _c_group.getPointByOrigin('center', 'center');

        var coords = null;

        var setCoords = function(coords) {
          var coords_default = {
            x1: _a_groupOriginCenter.x,
            y1: _a_groupOriginCenter.y,
            x2: _c_groupOriginCenter.x,
            y2: _c_groupOriginCenter.y
          };
          for ( i in coords ) {
            coords_default[i] = coords[i];
          }
          return coords_default;
        }

        if(_c === 2) {
          coords = setCoords({
            x1: _a_groupOriginCenter.x - _a_groupWidth,
            x2: _c_groupOriginCenter.x + _c_groupWidth
          });
        }
        else if (_c === 4) {
          coords = setCoords({
            x1: _a_groupOriginCenter.x + _a_groupWidth,
            y1: _a_groupOriginCenter.y - _a_groupHeight,
            x2: _c_groupOriginCenter.x - _c_groupWidth,
            y2: _c_groupOriginCenter.y + _c_groupHeight
          });
        }
        else if (_c === 6) {
          coords = setCoords({
            y1: _a_groupOriginCenter.y - _a_groupHeight,
            y2: _c_groupOriginCenter.y + _a_groupHeight
          });
        }
        else if (_c === 8) {
          coords = setCoords({
            x1: _a_groupOriginCenter.x - _a_groupWidth,
            y1: _a_groupOriginCenter.y - _a_groupHeight,
            x2: _c_groupOriginCenter.x + _c_groupWidth,
            y2: _c_groupOriginCenter.y + _c_groupHeight
          });
        }

        if( coords ) {
          canvas.add(Draw.group([Draw.line([coords.x1, coords.y1, coords.x2, coords.y2])]));
        }

        var count = canvas.getObjects().length - 1;

        setTimeout(function() {
          while ( count !== _group_c ) {
            canvas.fxRemove(canvas.item(count));
            count--;
          }
        init();
        }, 1000);

      }

      if ( callback && typeof callback === 'function' ) {
        callback.call( this, key );
      }
    }
  };

  var Game = function(socket) {
    this.socket = socket;
  };

  Game.prototype.init = function() {

    this.socket.emit('join', this.getRoomId());

    $('.seats')
      .fadeIn()
      .show()
      .next()
        .toggleClass('col-md-10')
      .end()
    .end()

    return this;
  }

  Game.prototype.join = function() {
    this.socket.on('join', function(player) {
      console.log(player);
      var image_default = '../images/default.png';
      var caption = $('<div/>', { class: 'caption' }).append($('<h4/>', { class: 'text-center', text: player.name }));
      $('.id-seat-2')
        .hide()
        .children('img')
          .prop('src', image_default)
        .end()
        .append(caption)
        .fadeIn()
        .show()
      .end()
    });

    return this;
  }

  Game.prototype.getRoomId = function() {
    var path = window.location.pathname;
    return path.split('/')[2];
  }

  $(function() {

    var game = new Game(io());
    var sio = io();

    game.init();
    game.join();

    sio.on('get', function(options) {
      play(canvas.item( options.key ), {
        evented: true
      });
    });

    canvas.on({
      'mouse:down': function(e) {
        play(e.target, {
          evented: false
        }, function(key) {
          sio.emit('set', { 
            key: key,
            room: game.getRoomId()
          });
        })
      }
    });
    
    canvas.renderAll();
  });
})();
