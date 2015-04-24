;(function($) {
  'use strict';

  /**
   * constructor.
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
   * @return <Mixed> value
   */
  Game.prototype.get = function(property) {
    // get value.
    var value = this[property];

    return value;
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
   * let the server know about
   * this room.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.init = function(socket) {
    var room = this.getRoomIdByPathName();
    if (room) {
      // emit server room id.
      socket.emit('init', {
        room: room
      });
    }

    return this;
  }
  /**
   * get player position from cookie.
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
   * adds player.
   *
   * @return <Object> this
   */
  Game.prototype.addPlayers = function() {
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
  Game.prototype.waitForPlayer = function(player) {
    // add loading animation 
    // acoording to player
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
   * @param <Object> players
   * @return <Object> this
   */
  Game.prototype.setActivePlayer = function(players) {
    // get this player position.
    var _position = this.getPlayerPosition();
    // check for position.
    if (_position !== -1) {
      // get player by position.
      var player = players[_position];
      // get active player position.
      var position = player.position;
      // tell both player who's
      // active player.
      position = player.active ? position : ~~!position;
      // if player is active allow 
      // this player to play game
      // otherwise deactivate it.
      player.active ? this.setActiveState(true) : this.setActiveState(false);

      // fade class.
      var fade = 'whole-in';
      // active player class;
      var active = 'active';
      var _player = $('div[class*="id-player-"]');
      var _progress = $('div[class*="id-progress-"]');

      _player.filter(function(_position) {
        return _position === position;
      })
      .addClass(fade)
      .addClass(active)
      .addBack()
      // set default opacity to non-active
      // player.
      .filter(function(_position) {
        return _position !== position;
      }).removeClass(fade);

      setTimeout(function() {
        _progress.filter(function(_position) {
          return _position === position;
        }).addClass(fade);
      }, 1000);

      _progress.filter(function(_position) {
        return _position !== position;
      }).removeClass(fade);
    }

    return this;
  }
  /**
   * auto play.
   *
   * @return <Object> this
   */
  Game.prototype.autoPlay = function() {
    var _this = this;
    // start after 1ms.
    setTimeout(function() {
      // init autoplay value defaults
      // to true.
      _this.set('autoplay', true);
      // get players object.
      var players = _this.get('players');
      // check for players length
      // if both players are in
      // then attach timer.
      if (players.length > 1) {
        // // get player position.
        var _position = _this.getPlayerPosition();
        // check for position.
        if (_position !== -1) {
          // get player by position.
          var player = players[_position];
          // get active player postion.
          var position = player.active ? player.position : ~~!player.position;
          // get progress bar.
          var progress = $('.id-progress-' + position).children('.progress-bar');
          // get width in percentage.
          var width = (100 * parseFloat(progress.width()) / parseFloat(progress.parent().width()));
          // get auto play value check 
          // whether its allowed or
          // not.
          // get avaiable targets.
          // set time interval repeat after
          // each 100ms.
          
          var time = setInterval(function() {
            var targets = _this.getAvaiableTargets();
            var autoplay = _this.get('autoplay');
              if (autoplay) {
                progress.width(width-- + '%');
                if (width < 0) {
                  var random = targets[Math.floor(Math.random() * targets.length)];
                  console.log(random);
                  var target = _this.__canvas.item(random);
                  if (isNaN(target.figure) && position === _position) {
                    _this.__canvas.trigger('mouse:down', {
                      target: target
                    });
                  }
                }
              }
            if (!autoplay || width < 0) {
              progress.width(100 + '%');
              _this.autoPlay();
              clearInterval(time);
            }
          }, 100);
        }
      }
      else {
        // debug.
        console.debug('timer could\'t be attached.');
      }
    }, 1000);

    return this;
  }
  /**
   * set game active state.
   *
   * @param {Boolean} evented
   * @return {Object} this
   */
  Game.prototype.setActiveState = function(evented) {
    var evented = evented || false;
    // loop through each avaiable object
    // and set evented property.
    this.getAvaiableTargets(function(object) {
      object.set('evented', evented);
    });

    return this;
  }
  Game.prototype.activate = function() {
    // activate game.
    this.setActiveState(true);

    return this;
  }
  Game.prototype.deActivate = function() {
    // deactivate game.
    this.setActiveState();

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
    // update index and figure values
    // to the specified target and 
    // set evented to false.
    target.set({
      index: index,
      figure: figure
    }).set('evented', false);

    return this;
  }
  /**
   * plays game.
   *
   * @param <Object> target
   * @param <Function> callback
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
      combination: []
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
      .drawFigure(target, figure)
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
        game.combination = combination;
      }
    }
    // calling callback function
    // if it is provided.
    if (callback && $.isFunction(callback)) {
      callback.call(this, game);
    }

    this.set('autoplay', false);

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
                // emit server to restart the game
                // passing room id and winner
                // combination object.
                socket.emit('restart', {
                  room: room,
                  combination: game.combination
                });
              }
            });
          }
        }
        else {
          // debug.
          console.debug('this target has already have figure or its not your turn!');
        }
      }
    });

    return this;
  }
  /**
   * switches player.
   *
   * @param <Object> data
   * @return <Object> this
   */
  Game.prototype.switchActivePlayer = function(data) {
    // get room object.
    var room = data.room;
    // get players object.
    var players = data.players;
    this
      // set room.
      .set('room', room)
      // set players.
      .set('players', players)
      // set active player.
      .setActivePlayer(players);

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
    var combination = data.combination;
    this
      // set room.
      .set('room', room)
      // set players.
      .set('players', players)
      // draw cross out.
      .drawCrossOut(combination)
    // execute after 1s.
    setTimeout(function() {
      // get count.
      var count = _this.getCanvasCountObjects();
      // loop until current count doesn't
      // equals to the initial count.
      while (count !== _this.count) {
        // game is over remove all figures
        // from canvas.
        _this.__canvas.fxRemove(_this.__canvas.item(count), {
          // on complete reset squares
          // and set active player.
          onComplete: function() {
            _this
              // initialize squares.
              .initSquares()
              // set active player.
              .setActivePlayer(players);
          }
        });
        count--;
      }
    }, 1000);

    return this;
  }
  /**
   * count canvas objects.
   *
   * @return <Number> count
   */
  Game.prototype.getCanvasCountObjects = function() {
    // get count.
    var count = this.__canvas.size() - 1;

    return count;
  }
  /**
   * get avaiable targets.
   *
   * @return <Array> targets 
   */
  Game.prototype.getAvaiableTargets = function(callback) {
    var targets = [];
    this.__canvas.forEachObject(function(object, index) {
      if ('figure' in object && isNaN(object.figure)) {
        targets.push(object.index);

        if (callback && $.isFunction(callback)) {
          callback(object);
        }
      }
    });

    return targets;
    
  }
  /**
   * draws line.
   *
   * @param <Array> coords
   * @return <Object> line
   */
  Game.prototype.drawLine = function(coords) {
    // set options.
    var options = {
      stroke: 'black',
      strokeWidth: 1,
      selectable: false,
      evented: false
    };
    // create new line.
    var line = new fabric.Line(coords, options);

    return line;
  }
  /**
   * draws circle.
   *
   * @param <Number> top
   * @param <Number> left
   * @param <Number> radius
   * @return <Object> circle
   */
  Game.prototype.drawCircle = function(top, left, radius) {
    // set options.
    var options = {
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
    };
    // create new circle.
    var circle = new fabric.Circle(options);

    return circle;
  }
  /**
   * draws group.
   *
   * @param <Array> groups
   * @return <Object> group
   */
  Game.prototype.drawGroup = function(groups) {
    // set options.
    var options = {
      hasBorders: false,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
      evented: false
    };
    // create new group.
    var group = new fabric.Group(groups, options);

    return group;
  }
  /**
   * draws game.
   *
   * @return <Object> this
   */
  Game.prototype.drawGame = function() {
    // get x.
    var x = this.__canvas.getWidth() / 3;
    // get y.
    var y = this.__canvas.getHeight() / 3;
    // add new groups onto the canvas 
    // combined with two lines.
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
  /**
   * draws figure.
   *
   * @param <Object> target
   * @param <Number> figure
   * @return <Object> this
   */
  Game.prototype.drawFigure = function(target, figure) {
    // get top.
    var top = target.getTop()
    // get left.
    var left = target.getLeft();
    // get width.
    var width = target.getWidth();
    // get height.
    var height = target.getHeight();
    // get radius.
    var radius = width / 3;
    // get gap.
    var gap = width / 4;
    // get center points.
    var center = target.getPointByOrigin('center', 'center');
    // get center X point.
    var centerX = center.x;
    // get center Y point.
    var centerY = center.y;
    // if the figure is 1 draw cross
    // otherwise draw circle.
    if (figure) {      
      // prepare cross.
      var cross = this.drawGroup([
        this.drawLine([left + gap, top + gap, left + width - gap, top + height - gap]),
        this.drawLine([left + width - gap, top + gap, left + gap, top + height - gap])
      ]);
      // add cross onto the canvas.
      this.__canvas.add(this.figureFadeIn(cross, 0.5, 1, 200));
    }
    else {
      // prepare circle.
      var circle = this.drawCircle(centerY, centerX, radius);
      // add circle onto the canvas.
      this.__canvas.add(this.figureFadeIn(circle, 0.5, 1, 200));
    }

    return this;
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
    room.figures.map(function(target) {
      // get target index.
      var index = target.index;
      // get target figure.
      var figure = target.figure;
      // get target.
      var _target = _this.__canvas.item(index);
      _this
        // draw figures.
        .drawFigure(_target, figure)
        // update square state.
        .updateSquare(_target, index, figure);
    });

    return this;
  }
  /**
   * figures fade in.
   *
   * @param <Object> figure
   * @param <Number> from
   * @param <Number> to
   * @param <Number> duration
   * @return <Object> this
   */
  Game.prototype.figureFadeIn = function(figure, from, to, duration) {
    // set opacity (from where to start).
    figure.set('opacity', from);
    // add animation onto the figure increase
    // opacity to the provided point.
    figure.animate('opacity', to, {
      duration: duration,
      onChange: this.__canvas.renderAll.bind(this.__canvas)
    });

    return figure;
  }
  /**
   * draws cross out.
   *
   * @param <Object> combination
   * @return <Object> this
   */
  Game.prototype.drawCrossOut = function(combination) {
    // check for combination object.
    if (combination.length) {
      // get first index from combination.
      var a = combination[0];
      // get last index from combination. 
      var b = combination[2];
      // diff among first and last index.
      var c = b - a;
      // get first square by index.
      var _a_square = this.__canvas.item(a);
      // get last square by index.
      var _c_square = this.__canvas.item(b);
      // get first square width.
      var _a_squareWidth = _a_square.getWidth() / 2.5;
      // get last square width.
      var _c_squareWidth = _c_square.getWidth() / 2.5;
      // get first square height.
      var _a_squareHeight = _a_square.getHeight() / 2.5;
      // get last square height.
      var _c_squareHeight = _c_square.getHeight() / 2.5;
      // get first square center points.
      var _a_groupOriginCenter = _a_square.getPointByOrigin('center', 'center');
      // get last square center points.
      var _c_groupOriginCenter = _c_square.getPointByOrigin('center', 'center');
      // coordinates object.
      var coordinates = {};
      // set coordinates for c = 2 case.
      if (c === 2) {
        coordinates = {
          x1: _a_groupOriginCenter.x - _a_squareWidth,
          y1: _a_groupOriginCenter.y,
          x2: _c_groupOriginCenter.x + _c_squareWidth,
          y2: _c_groupOriginCenter.y
        };
      }
      // set coordinates for c = 4 case.
      else if (c === 4) {
        coordinates = {
          x1: _a_groupOriginCenter.x + _a_squareWidth,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x - _c_squareWidth,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // set coordinates for c = 6 case.
      else if (c === 6) {
        coordinates = {
          x1: _a_groupOriginCenter.x,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // set coordinates for c = 8 case.
      else if (c === 8) {
        coordinates = {
          x1: _a_groupOriginCenter.x - _a_squareWidth,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x + _c_squareWidth,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // add cross out onto the canvas.
      this.__canvas.add(this.drawGroup([this.drawLine([coordinates.x1, coordinates.y1, coordinates.x2, coordinates.y2])]));
    }

    return this;
  }
  /**
   * runs the game.
   *
   * @param <Object> socket
   * @return <Object> this
   */
  Game.prototype.run = function(socket) {
    var _this = this;
    // notify server about
    // this room.
    this.init(socket);
    // connect event.
    socket.on('connect', function() {
      // init room event.
      socket.on('init', function(room) {
        _this
          // set room object.
          .set('room', room)
          // draw game.
          .drawGame()
          // initialize squares.
          .initSquares()
          // draw squares state.
          .drawStateSquares()
          // play game.
          ._play(socket);
      })
      // add players event.
      .on('add players', function(players) {
        _this
          // set players object.
          .set('players', players)
          // add players.
          .addPlayers()
      })
      // waiting for player event.
      .on('waiting for player', function(player) {
        // waiting for player.
        _this.waitForPlayer(player);
      })
      // set active player event.
      .on('set active player', function(players) {
        // set active player.
        _this.setActivePlayer(players);

        _this.autoPlay(true);

      })
      // play event.
      .on('play', function(data) {
        // check for data.
        if (!$.isEmptyObject(data)) {
          // get target.
          var target = _this.__canvas.item(data.index);
          // play game.
          _this.play(target);
        }
        else {
          // debug.
          console.debug('play event - data couldn\t be found.');
        }
      })
      // switch event.
      .on('switch', function(data) {
        if (!$.isEmptyObject(data)) {
          _this
            // switch player.
            .switchActivePlayer(data)
        }
        else {
          // debug.
          console.debug('switch event - data couldn\t be found.');
        }
      })
      // restart event.
      .on('restart', function(data) {
        // restart game.
        _this.restart(data);
      });
   });
  
   return this; 
  }

  // make sure page is loaded.
  $(function() {
    new Game({
      id: 'tictactoe',
      width: window.innerWidth - (window.innerWidth - window.innerHeight),
      height: window.innerHeight
    }).run(io());
  });

})(jQuery);