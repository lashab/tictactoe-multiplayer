(function($) {
  'use strict';

  var Game = function(canvas) {
    this.__canvas = new fabric.Canvas(canvas);
    this.__canvas.setWidth(window.innerWidth - (window.innerWidth - window.innerHeight));
    this.__canvas.setHeight(window.innerHeight);
  }

  /**
   * setter.
   *
   * @param <String> property
   * @param <Mixed> value
   * @return <Object> this
   */
  Game.prototype.set = function(property, value) {
    // set value.
    this[property] = value;

    return this;
  }
  /**
   * getter.
   *
   * @param <String> prototype
   * @return <Object> this
   */
  Game.prototype.get = function(property) {
    // get value.
    return this[property];
  }
  /**
   * let the server know about
   * this room.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.room = function(socket) {
    // check whether the regex
    // matches to the given
    // room path.
    if (window.location.pathname && /^\/room\/\d+$/.test(window.location.pathname)) {
      // emit server room id.
      socket.emit('room', {
        room: this.getRoomId()
      });
    }

    return this;
  }

  Game.prototype.drawLine = function(coords) {
    return new fabric.Line(coords, {
      stroke: 'black',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });
  }

  Game.prototype.drawCircle = function(top, left, radius) {
    return new fabric.Circle({
      top: top,
      left: left,
      radius: radius,
      fill: '#fff',
      stroke: 'black',
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
  }

  Game.prototype.drawGroup = function(groups) {
    return new fabric.Group(groups, {
      hasBorders: false,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
      evented: false
    });
  }

  Game.prototype.drawGame = function() {
    var x = this.__canvas.getWidth() / 3;
    var y = this.__canvas.getHeight() / 3;
    this.__canvas.add(
      this.drawGroup([
        this.drawLine([x, 0, x, y]),
        this.drawLine([0, y, x, y])
      ]),
      this.drawGroup([
        this.drawLine([x * 2, 0, x * 2, y]),
        this.drawLine([x * 2, y, x, y])
      ]),
      this.drawGroup([
        this.drawLine([x * 3, 0, x * 3, y]),
        this.drawLine([x * 3, y, x * 2, y])
      ]),
      this.drawGroup([
        this.drawLine([x, y, x, y * 2]),
        this.drawLine([0, y * 2, x, y * 2])
      ]),
      this.drawGroup([
        this.drawLine([x * 2, y, x * 2, y * 2]),
        this.drawLine([x, y * 2, x * 2, y * 2])
      ]),
      this.drawGroup([
        this.drawLine([x * 3, y, x * 3, y * 2]),
        this.drawLine([x * 3, y * 2, x * 2, y * 2])
      ]),
      this.drawGroup([
        this.drawLine([x, y * 2, x, y * 3]),
        this.drawLine([0, y * 3, x, y * 3])
      ]),
      this.drawGroup([
        this.drawLine([x * 2, y * 2, x * 2, y * 3]),
        this.drawLine([x, y * 3, x * 2, y * 3])
      ]),
      this.drawGroup([this.drawLine([
          x * 3, y * 2, x * 3, y * 3
        ]),
        this.drawLine([x * 2, y * 3, x * 3, y * 3])
      ])
    );
    return this;
  }

  Game.prototype.drawFigure = function(data, figure) {
    if (figure) {
      var top = data.top;
      var left = data.left;
      var width = data.width;
      var height = data.height;
      var gap = data.gap;
      var cross = this.drawGroup([
        this.drawLine([left + gap, top + gap, left + width - gap, top + height - gap]),
        this.drawLine([left + width - gap, top + gap, left + gap, top + height - gap])
      ]);
      this.__canvas.add(this.figureFadeIn(cross, 0.5, 1, 200));
    }
    else {
      var centerX = data.center.x;
      var centerY = data.center.y;
      var radius = data.radius;
      var circle = this.drawCircle(centerY, centerX, radius);
      this.__canvas.add(this.figureFadeIn(circle, 0.5, 1, 200));
    }
    return this;
  }

  Game.prototype.drawCrossOut = function(win) {
    var a = win[0];
    var b = win[2];
    var c = b - a;

    var _a_group = this.__canvas.item(a);
    var _c_group = this.__canvas.item(b);

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
      for (var i in coords) {
        coords_default[i] = coords[i];
      }
      return coords_default;
    }

    if (c === 2) {
      coords = setCoords({
        x1: _a_groupOriginCenter.x - _a_groupWidth,
        x2: _c_groupOriginCenter.x + _c_groupWidth
      });
    }
    else if (c === 4) {
      coords = setCoords({
        x1: _a_groupOriginCenter.x + _a_groupWidth,
        y1: _a_groupOriginCenter.y - _a_groupHeight,
        x2: _c_groupOriginCenter.x - _c_groupWidth,
        y2: _c_groupOriginCenter.y + _c_groupHeight
      });
    }
    else if (c === 6) {
      coords = setCoords({
        y1: _a_groupOriginCenter.y - _a_groupHeight,
        y2: _c_groupOriginCenter.y + _a_groupHeight
      });
    }
    else if (c === 8) {
      coords = setCoords({
        x1: _a_groupOriginCenter.x - _a_groupWidth,
        y1: _a_groupOriginCenter.y - _a_groupHeight,
        x2: _c_groupOriginCenter.x + _c_groupWidth,
        y2: _c_groupOriginCenter.y + _c_groupHeight
      });
    }

    if (coords) {
      this.__canvas.add(this.drawGroup([this.drawLine([coords.x1, coords.y1, coords.x2, coords.y2])]));
      return true;
    }
    return false;
  }

  Game.prototype.figureFadeIn = function(figure, from, to, duration) {
    var that = this;
    figure.set('opacity', from);
    figure.animate('opacity', to, {
      duration: duration,
      onChange: this.__canvas.renderAll.bind(this.__canvas)
    });
    return figure;
  }

  Game.prototype.play = function(target, callback) {
    var figure = this.get('figure');
    var j = this.count;
    var values = [];
    var game = { over: false };
    var index = target.get('square').index;
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

    this.setSquareState(target, index, figure);

    while (j !== -1) {
      var square = this.__canvas.item(j);
      var value = square.get('square').value;
      if (isNaN(value)) {
        values.push(value);
      }
      j--;
    }

    if (!values.length) {
      game.over = true;
      game.isWinner = false;
      game.won = {}
    }

    for (var i in combinations) {
      var combination = combinations[i];
      var a = this.__canvas.item(combination[0]).get('square').value;
      var b = this.__canvas.item(combination[1]).get('square').value;
      var c = this.__canvas.item(combination[2]).get('square').value;
      if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c)) {
        game.over = true;
        game.isWinner = true;
        game.won = combination;
      }
    }

    if (game.over) {
      if (game.isWinner && this.drawCrossOut(game.won)) {
        this.restart();
      }
      else if (!game.isWinner){
        this.restart();
      }
    }

    if (callback && $.isFunction(callback)) {
      var data = {
        _id: this.getRoomId(),
        figure: figure,
        figures: {},
        over: game.over
      }
      data['figures'][index] = figure;
      callback.call(this, data);
    }

    this.set('figure', ~~!figure);

    return this;
  }

  Game.prototype.ready = function() {
    var room = this.get('room');
    this.count = this.countCanvasObjects();
    this.__canvas.forEachObject(function(object, index) {
      object.set({
        square: {
          index: index,
          value: NaN
        }
      });
    });
    return this;
  }

  Game.prototype.setActiveState = function(evented) {
    this.__canvas.forEachObject(function(object, index) {
      if (object.square && isNaN(object.square.value)) {
        object.set('evented', evented);
      }
    });
    return this;
  }



  Game.prototype.restart = function() {
    var count = this.countCanvasObjects();
    var that = this;
    setTimeout(function() {
      while (count !== that.count) {
        that.__canvas.fxRemove(that.__canvas.item(count), {
          onComplete: function() {
            that.ready();
          }
        });
        count--;
      }
    }, 1000);
  }

  Game.prototype.manipulate = function(socket) {
    var _this = this;
    this.__canvas.on({
      'mouse:down': function(e) {
        if ($.type(e.target) !== 'undefined') {
          var target = e.target;
          // get figure data.
          var data = _this.getFigureData(target);
          _this
            // draws figure.
            .drawFigure(data, _this.get('figure'))
            // play game.
            .play(target, function(data) {
              socket.emit('play', data);
            })
        }
      }
    });
    return this;
  }

  Game.prototype.getFigureData = function(object) {
    return {
      top: object.getTop(),
      left: object.getLeft(),
      width: object.getWidth(),
      height: object.getHeight(),
      radius: object.getWidth() / 3,
      gap: object.getWidth() / 4,
      center: object.getPointByOrigin('center', 'center')
    }
  }

  Game.prototype.countCanvasObjects = function() {
    return this.__canvas.getObjects().length - 1;
  }

  Game.prototype.setSquareState = function(target, index, value) {
    target.set('square', {
      index: index,
      value: ~~value
    }).set('evented', false);
    
    return this;
  }

  Game.prototype.getRoomId = function() {
    var path = window.location.pathname;
    if (path) {
      return path.split('/')[2];
    }
  }
  /**
   * draws figures state.
   *
   * @return <Object> this
   */
  Game.prototype.drawStateFigures = function() {
    var _this = this;
    // get room object.
    var room = this.get('room');
    // map figures, draw each
    // figure, setting state.
    room.figures.map(function(figure) {
      // square index.
      var index = Object.keys(figure)[0];
      // figure value.
      var value = figure[index];
      // get square.
      var target = _this.__canvas.item(index);
      _this
        // draw figures.
        .drawFigure(_this.getFigureData(target), value)
        // set square state.
        .setSquareState(target, index, value);
    });

    return this;
  }

  /**
   * get player position.
   *
   * @return <Number> position|NaN
   */
  Game.prototype.getPlayerPosition = function() {
    // get player position from cookie.
    // cast it to the number.
    var position = Cookies.getItem('position') >> 0;
    // if cookie position type is
    // number return cookie.
    if ($.type(position) === 'number') {
      return position;
    }
    // debug if cookie position
    // could not be found and
    // return NaN.
    console.log('cookie position couldn\'t be found.');

    return NaN;
  }

  /**
   * add players.
   *
   * @param <Object> room
   * @return <Object> this
   */
  Game.prototype.addPlayers = function(room) {
    // get players.
    var players = this.get('players');
    if (players.length > 1) $('.players.wait').removeClass('wait');
    // map each player and
    // add image and name.
    players.map(function(player, position) {
      $('.id-player-' + position)
        .children('img')
        // TODO: remove image path from client.
        .prop('src', '../images/default.png') 
          .next()
            .children()
              .text(player.name)
            .end()
          .end()
        .end()
      .addClass('show');
    });
    
    return this;
  }

  /**
   * waits for next player.
   *
   * @param <Object> waiting
   * @return <Object> this
   */
  Game.prototype.waiting = function(player) {
    // add loading animation 
    // acoording to seat
    // position.
    $('.id-player-' + player.position)
      .children('img')
        .prop('src', player.image)
        .end()
      .addClass('wait')
      .addClass('show');

    return this;
  }

  /**
   * sets active player.
   *
   * @param <Object> waiting
   * @return <Object> this
   */
  Game.prototype.setActivePlayer = function(player) {
    // get player position.
    var position = player.position;
    // tell both players who's
    // active player.
    position = player.active ? position : ~~!position;
    // if player is active
    // allow this player
    // to play game.
    if (player.active) {
      // activate game.
      this.setActiveState(true);
    }
    else {
      // deactivate game.
      this.setActiveState(false);
    }
    // set opacity 1 to
    // active player.
    $('.id-player-' + position).addClass('whole-in');
    // set opacity 0.5 to
    // non-active player
    $('div[class*="id-player-"]').filter(function(index) {
      return index !== position;
    }).removeClass('whole-in');

    return this;
  }

  /**
   * runs game.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.run = function(socket) {
    // define this object.
    var _this = this;
    // notify server about
    // this room.
    this.room(socket);
    // init room event
    socket.on('init room', function(room) {
      _this
        // set room object.
        .set('room', room)
        // draws game.
        .drawGame()
        // ready figures.
        .ready()
        // figures state.
        .drawStateFigures()
        // set active figure.
        .set('figure', _this.get('room').figure)
        // make it clickable.
        .manipulate(socket);
    });
    // add players event.
    socket.on('add players', function(players) {
      _this
        // set players object.
        .set('players', players)
        // add players.
        .addPlayers()
    });
    // waiting for player event.
    socket.on('waiting for player', function(player) {
      // waiting for player.
      _this.waiting(player);
    });
    // set active player event.
    socket.on('set active player', function(players) {
      // get player position.
      var position = _this.getPlayerPosition();
      // check whether the position
      // exists or not.
      if (!isNaN(position)) {
        // get player by position.
        var player = players[position];
        // set active player.
        _this.setActivePlayer(player);
      }
      else {
        // debug if position could
        // not be found.
        console.log('unable to set active player.');
      }
    });
    // switch active player event.
    socket.on('switch active player', function(players) {
      // get player position.
      var position = _this.getPlayerPosition();
      // check whether the position
      // exists or not.
      if (!isNaN(position)) {
        // get player by position.
        var player = players[position];
        // set active player.
        _this.setActivePlayer(player);
      }
      else {
        // debug if position could
        // not be found.
        console.log('unable to switch active player.');
      }
    });
    // play event.
    socket.on('play', function(data) {
      // get target by target index.
      var target = _this.__canvas.item(Object.keys(data.figures));
      _this
        // draw figure.
        .drawFigure(_this.getFigureData(target), _this.get('figure'))
        // play game.
        .play(target);
    });
  }

  $(function() {
    // instantiate game.
    new Game('tictactoe').run(io());
  });

})(jQuery);