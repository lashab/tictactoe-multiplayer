;(function($) {
  'use strict';

  /**
   * Game constructor.
   *
   * @param <Object> canvas
   */
  var Game = function(canvas) {
    // create new fabric object.
    this.__canvas = new fabric.Canvas(canvas.id);
    // set canvas width.
    this.__canvas.setWidth(canvas.width);
    // set canvas height.
    this.__canvas.setHeight(canvas.height);
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
   * @param <String> property
   * @return <Object> this
   */
  Game.prototype.get = function(property) {
    // get value.
    return this[property];
  }
  /**
   * get room id by pathname.
   *
   * @return <Number|Boolean> room|false
   */
  Game.prototype.getRoomIdByPathName = function() {
    var pathname = ''; 
    // regular expression for instance:
    // room/1, room/2 etc.
    var regex = /^\/room\/(\d+)$/;
    try {
      // check for pathname.
      if (window.location.pathname) {
        // get pathname.
        pathname = window.location.pathname;
      }
      else {
        // throws error if pathname
        // couldn't be found.
        throw new Error('pathname couldn\'t be found.');
      }
    }
    catch (e) {
      // debug.
      console.error(e.message);

      return false;
    }
    // check whether the pathname
    // matches to the regex if
    // matches return room id.
    var matches = pathname.match(regex);
    if (matches) {
      // cast it to the number.
      var room = matches[1] >> 0;
      return room;
    }
    // debug.
    console.debug('you\'re not joined to the room.');

    return false;
  }
  /**
   * get player position.
   *
   * @return <Number> position
   */
  Game.prototype.getPlayerPosition = function() {
    // get player position from cookie.
    // cast it to the number.
    var position = docCookies.getItem('position') >> 0;
    try {
      // throw TypeError if position
      // type is not number.
      if ($.type(position) !== 'number') {
        throw TypeError('cookie position couldn\'t be found.');
      }
    }
    catch(e) {
      // debug.
      console.error(e.message);

      return -1; 
    }
    
    return position;
  }
  /**
   * let the server know about
   * this room.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.room = function(socket) {
    var room = this.getRoomIdByPathName();
    if (room) {
      // emit server room id.
      socket.emit('room', {
        room: room
      });
    }

    return this;
  }
  /**
   * initializes squares.
   *
   * @return <Object> this
   */
  Game.prototype.initSquares = function() {
    // loop over each drawn
    // square and set index
    // and figure defaults
    // to NaN.
    this.__canvas.forEachObject(function(object, index) {
      object.set({
        index: index,
        figure: NaN
      });
    });
    // set count.
    this.set('count', this.getCanvasCountObjects());

    return this;
  }
  /**
   * updates target (square).
   *
   * @return <Object> this
   */
  Game.prototype.updateSquare = function(target, index, figure) {
    // set index and figure
    // to the target and 
    // set evented to 
    // false.
    target.set({
      index: index,
      figure: figure
    }).set('evented', false);

    return this;
  }
  /**
   * count canvas objects.
   *
   * @return <Number> count
   */
  Game.prototype.getCanvasCountObjects = function() {
    var count = this.__canvas.getObjects().length - 1;

    return count;
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
      this.drawGroup([
        this.drawLine([x * 3, y * 2, x * 3, y * 3]),
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
    if (win.length) {
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
      }
    }

    return this;
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
  /**
   * plays game.
   *
   * @param <Object> socket
   * @param <Object> target
   * @return <Object> this
   */
  Game.prototype.play = function(target, callback) {
    // get room object.
    var room = this.get('room');
    // get active figure;
    var figure = room.figure;
    // get count objects.
    var count = this.get('count');
    // figures array defaults to empty array.
    var figures = [];
    // get index.
    var index = target.get('index');
    // game object.
    var game = {
      target: {
        index: index,
        figure: figure,
      },
      over: false,
      won: []
    };
    // combinations.
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
    this
      // draw figure.
      .drawFigure(this.getSquareData(target), figure)
      // update square state and
      // prevent this square to
      // be clickable.
      .updateSquare(target, index, figure);
    // loop while count doesn't 
    // equals to -1.
    while (count !== -1) {
      // get figures.
      var _figure = this.__canvas.item(count).get('figure');
      // pushing NaN figures 
      // into array.
      if (isNaN(_figure)) {
        figures.push(_figure);
      }
      count--;
    }
    // if theres is no more NaN figures
    // this means that all the squares
    // have already filled game is 
    // over but without winner.
    if (!figures.length) {
      game.over = true;
    }
    // if theres is a match in this
    // combination this means that
    // game is over and game has 
    // a winner.
    for (var i in combinations) {
      var combination = combinations[i];
      var a = this.__canvas.item(combination[0]).get('figure');
      var b = this.__canvas.item(combination[1]).get('figure');
      var c = this.__canvas.item(combination[2]).get('figure');
      if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c)) {
        game.over = true;
        game.won = combination;
      }
    }
    // calling callback function
    // if it is provided.
    if (callback && $.isFunction(callback)) {
      callback.call(this, game);
    }

    return this;
  }
  /**
   * starts playing on target
   * click event.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype._play = function(socket) {
    var _this = this;
    this.__canvas.on({
      'mouse:down': function(e) {
        // check for target.
        if ($.type(e.target) !== 'undefined' && $.type(e.target) == 'object') {
          // get target.
          var target = e.target;
          // get room.
          var room = _this.getRoomIdByPathName();
          // check for room.
          if (room) {
            // start playing.
            _this.play(target, function(game) {
              // get target;
              var _target = game.target;
              // emit server to play game
              // passing room id and 
              // target object.
              socket.emit('play', {
                room: room,
                target: _target
              });
              // check for game over.
              if (!game.over) {
                // emit server to switch player
                // and figure, passing room id
                // and active figure.
                socket.emit('switch', {
                  room: room,
                  figure: _target.figure
                });
              }
              else {
                // emit server that game is over
                // passing room id and winner
                // object.
                socket.emit('game over', {
                  room: room,
                  won: game.won
                });
              }
            });
          }
        }
        else {
          // debug.
          console.debug('its not your turn!');
        }
      }
    });

    return this;
  }

  Game.prototype.setActiveState = function(evented) {
    this.__canvas.forEachObject(function(object, index) {
      if (object.hasOwnProperty('figure') && isNaN(object.figure)) {
        object.set('evented', evented);
      }
    });

    return this;
  }

  Game.prototype.getSquareData = function(object) {
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

  /**
   * draws figures state.
   *
   * @return <Object> this
   */
  Game.prototype.drawStateSquares = function() {
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
        .drawFigure(_this.getSquareData(target), value)
        // set square state.
        .updateSquare(target, index, value);
    });

    return this;
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
   * restarts the game.
   *
   * @param <Object> data
   * @return <Object> this
   */
  Game.prototype.restart = function(data) {
    var _this = this;
    // get room object.
    var room = data.room;
    // get players object.
    var players = data.players;
    // get winner combination object.
    var won = data.won;
    // get player position.
    var position = this.getPlayerPosition();
    // check for position.
    if (position !== -1) {
      // get player.
      var player = players[position];
      this
        // set room.
        .set('room', room)
        // set players.
        .set('players', players)
        // draw cross out.
        .drawCrossOut(won)
        // set active player.
      // execute after 1s.
      setTimeout(function() {
        // get count.
        var count = _this.getCanvasCountObjects();
        while (count !== _this.count) {
          _this.__canvas.fxRemove(_this.__canvas.item(count), {
            onComplete: function() {
              _this
                .initSquares()
                .setActivePlayer(player);
            }
          });
          count--;
        }
      }, 1000);
    }

    return this;
  }

  /**
   * runs game.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.run = function(socket) {
    var _this = this;
    // notify server about
    // this room.
    this.room(socket);
    socket.on('connect', function() {
      // init room event.
      socket.on('init room', function(room) {
        _this
          // set room object.
          .set('room', room)
          // draw game.
          .drawGame()
          // initialize squares.
          .initSquares()
          // // draw squares state.
          .drawStateSquares()
          // play game.
          ._play(socket);
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
        // check for position.
        if (position !== -1) {
          // get player by position.
          var player = players[position];
          // set active player.
          _this.setActivePlayer(player);
        }
      });
      // switch event.
      socket.on('switch', function(data) {
        // get room object.
        var room = data.room;
        // get players object.
        var players = data.players;
        // get player position.
        var position = _this.getPlayerPosition();
        // check for position.
        if (position !== -1) {
          // get player by position.
          var player = players[position];
          _this
            // set room.
            .set('room', room)
            // set players.
            .set('players', players)
            // set active player.
            .setActivePlayer(player)
        }
      });
      // play event.
      socket.on('play', function(index) {
        // get target.
        var target = _this.__canvas.item(index);
        // play game.
        _this.play(target);
      });
      // restart event.
      socket.on('restart', function(data) {
        // restart game.
        _this.restart(data);
      });
   });
  
   return this; 
  }

  // make sure page is loaded.
  $(function() {
    // create new game object.
    new Game({
      id: 'tictactoe',
      width: window.innerWidth - (window.innerWidth - window.innerHeight),
      height: window.innerHeight
    }).run(io());
  });

})(jQuery);