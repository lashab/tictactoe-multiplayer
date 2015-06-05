;(function($) {
  'use strict';

  /**
   * constructor.
   *
   * @param {Object} canvas
   */
  var Game = function(canvas, socket) {
    // create new fabric object.
    this.__canvas = new fabric.Canvas(canvas.id);
    // set canvas width.
    this.__canvas.setWidth(canvas.width);
    // set canvas height.
    this.__canvas.setHeight(canvas.height);
    // set socket.
    this.socket = socket;
  }
  /**
   * setter.
   *
   * @param {String} property
   * @param {Mixed} value
   * @return {Object} this
   */
  Game.prototype.set = function(property, value) {
    // set value.
    this[property] = value;

    return this;
  }
  /**
   * getter.
   *
   * @param {String} property
   * @return {Mixed} value
   */
  Game.prototype.get = function(property) {
    // get value.
    var value = this[property];

    return value;
  }
  /**
   * get room object.
   *
   * @return {Object} room
   */
  Game.prototype.getRoom = function() {
    // get room object.
    var room = this.get('room') || {};
    // room object is empty ?
    if ($.isEmptyObject(room)) {
      // debug game.
      console.debug('room object could\'t be found.');
    }

    return room;
  }
  /**
   * get game object.
   *
   * @return {Object} game
   */
  Game.prototype.getGame = function() {
    // get game object.
    var game = this.get('game') || {};
    // game object is empty ?
    if ($.isEmptyObject(game)) {
      // debug game.
      console.debug('game object could\'t be found.');
    }

    return game;
  }
  /**
   * get players object.
   *
   * @return {Array} players
   */
  Game.prototype.getPlayers = function() {
    // get players object.
    var players = this.get('players') || [];
    // players object is empty ?
    if (!players.length) {
      // debug game.
      console.debug('players could\'t be found.');
    }

    return players;
  }
  /**
   * get waiting state.
   *
   * @return {Boolean} true|false
   */
  Game.prototype.isWaiting = function() {
    // get waiting.
    var waiting = this.get('waiting') || false;

    return waiting;
  }
  /**
   * get room id by pathname.
   *
   * @return {Number|Boolean} room|false
   */
  Game.prototype.getRoomIdByPathName = function () {
    var pathname = '';
    // regular expression that matches to the following 
    // paths example: room/1, room/2 room/3 etc.
    var regex = /^\/room\/(\d+)$/;
    try {
      // check for pathname.
      if (window.location.pathname) {
        // get pathname.
        pathname = window.location.pathname;
      }
      else {
        // throws error if the pathname couldn't be found.
        throw new Error('pathname couldn\'t be found.');
      }
    }
    catch (e) {
      // debug.
      console.error(e.message);

      return false;
    }
    // if the pathname matches to the regex return room id.
    var matches = pathname.match(regex);
    if (matches) {
      // get room id and cast it to the number.
      var room = matches[1] >> 0;

      return room;
    }

    return false;
  }
  /**
   * get player position from cookie.
   *
   * @return {Number} position
   */
  Game.prototype.getPlayerPosition = function () {
    // get player position from cookie.
    var position = docCookies.getItem('position');
    try {
      // cast position to the number if the position 
      // is provided otherwise throw error.
      position = position ? position >> 0 : (function() {
        throw new Error('cookie position couldn\'t be found.')
      })();
    }
    catch(e) {
      // debug.
      console.error(e.message);

      return -1; 
    }
    
    return position;
  }
  /**
   * get player by position.
   *
   * @param {Number|String} position
   * @return {Object} player
   */
  Game.prototype.getPlayerByPosition = function(position) {
    var player = {};
    // get player position from cookie if position 
    // is not provided.
    var position = position || this.getPlayerPosition();
    // cast position to the number.
    position = position >> 0;
    // check for position.
    if (position !== -1) {
      // get players.
      var players = this.getPlayers();
      // get player object by position.
      player = players[position];
    }

    return player;
  }
  /**
   * join game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.playerJoin = function() {
    // get room id.
    var room = this.getRoomIdByPathName();
    // room id ?
    if (room) {
      // socket emit - player:join - passing room object.
      this.socket.emit('player:join', {
        id: room
      });
    }

    return this;
  }
  /**
   * leave game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.playerLeave = function() {
    var _this = this;
    // add click event.
    $('.room .glyphicon-log-out').click(function(e) {
      e.preventDefault();
      // get room object.
      var room = _this.getRoom();
      // get player object.
      var player = _this.getPlayerByPosition();
      // socket emit - player:leave - passing object.
      _this.socket.emit('player:leave', {
        room: room,
        player: player
      });
    });

    return this;
  }
  /**
   * adds player.
   *
   * @return {Object} this
   */
  Game.prototype.addPlayers = function () {
    // get players.
    var players = this.get('players');
    // check for players length.
    if (players.length > 1) {
      // set waiting value.
      this.set('waiting', false);
      // remove waiting class.
      $('.players.player-waiting').removeClass('player-waiting');
      $('.players.player-hidden').removeClass('player-hidden');
      setTimeout(function() {
        $('.tic-tac-toe-m').modal('hide');
      }, 1000);
    }
    // loop in players add image && player name.
    players.forEach(function(player, position) {
      $('.id-player-' + position)
        .children(':first-child')
          // TODO: remove image path from client.
          .prop('src', '../images/default.png')
          .next()
            .children(':first-child')
              .text(player.name)
              .end()
            .addClass('whole-in')
            .end()
          .end()
          .addClass('show');
    });
    
    return this;
  }
  /**
   * wait for next player.
   *
   * @param {Object} player
   * @return {Object} this
   */
  Game.prototype.waitForPlayer = function (player) {
    var position = player.position;
    $('.tic-tac-toe-m').modal({
      keyboard: false,
      backdrop: 'static'
    });
    $('.players:not(.is-tic-tac-toe-m)').addClass('player-hidden');
    // add loader according to player position.
    $('.id-player-' + player.position)
      .children(':first-child')
        .prop('src', player.image)
        .next()
          .removeClass('whole-in')
          .end()
        .end()
      .children(':last-child')
        .removeClass('whole-in')
        .end()
      .addClass('player-waiting')
      .addClass('show');

    return this;
  }
  /**
   * set active player.
   *
   * @return {Object} this
   */
  Game.prototype.setActivePlayer = function () {
    // get player object by position.
    var player = this.getPlayerByPosition();
    // get active player position.
    var position = player.active ? player.position : ~~!player.position;
    // get waiting value.
    var isWaiting = this.isWaiting();
    // prepare fade-in class.
    var fadeIn = 'whole-in';
    // prepare fade-out class.
    var fadeOut = 'half-in';
    // get player element(s).
    var _player = $('div[class*="id-player-"]:not(.is-tic-tac-toe-m)');
    // player is active ? activate game : deactivate game.
    player.active && !isWaiting ? this.activate() : this.deActivate();
    // player active - add fade-in && remove fade-out class.
    _player.filter(function(_position) {
      return _position === position || _position == 3;
    })
    .toggleClass(fadeIn, true)
    .toggleClass(fadeOut, false)
    .addBack()
    // player inactive - remove fade-in && add fade-out class.
    .filter(function(_position) {
      return _position !== position;
    })
    .toggleClass(fadeIn, false)
    .toggleClass(fadeOut, true);

    return this;
  }
  /**
   * get active player.
   *
   * @return {Object} player
   */
  Game.prototype.getActivePlayer = function() {
    // get players object.
    var players = this.get('players');
    // filter players object && get active player object.
    var player = players.filter(function(player) {
      return player.active;
    })[0];

    return player;
  }
  /**
   * set players score.
   *
   * @return {Object} this
   */
  Game.prototype.setPlayersScore = function() {
    // get players.
    var players = this.get('players');
    // check for players.
    if (players.length > 1) {
      // get badges.
      var badges = $('.players').find('.badge');
      // get first player object.
      var _player = players[0];
      // get second player object.
      var __player = players[1];
      // get first badge.
      var _badge = badges.eq(0);
      // get second badge.
      var __badge = badges.eq(1);
      // case 1 - first player score is more then second.
      if (_player.score > __player.score) {
        // remove badge-loosing class for first player.
        _badge.toggleClass('badge-loosing', false);
        // add badge-loosing class for second player.
        __badge.toggleClass('badge-loosing', true);
      }
      // case 2 - second player score is more then first.
      else if (_player.score < __player.score) {
        // add badge-loosing class for first player.
        _badge.toggleClass('badge-loosing', true);
        // remove badge-loosing class for second player.
        __badge.toggleClass('badge-loosing', false);
      }
      // case 3 - first and second players scores are equal.
      else {
        // remove badge-loosing class for first player.
        _badge.toggleClass('badge-loosing', false);
        // remove badge-loosing class for second player.
        __badge.toggleClass('badge-loosing', false);
      }
    }
    // loop in players, get badge by positon and set score.
    players.forEach(function(player) {
      // get badge by position.
      var badge = $('.id-player-' + player.position).find('.badge');
      // set score.
      badge.text(player.score);
    });

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
  /**
   * activate game.
   *
   * @return {Object} this
   */
  Game.prototype.activate = function() {
    // activate game.
    this.setActiveState(true);

    return this;
  }
  /**
   * deactivate game.
   *
   * @return {Object} this
   */
  Game.prototype.deActivate = function() {
    // deactivate game.
    this.setActiveState();

    return this;
  }
  /**
   * set initial targets.
   *
   * @return {Object} this
   */
  Game.prototype.initTargets = function() {
    // add key and figure value on targets.
    this.__canvas.forEachObject(function(object, key) {
      object.set({
        key: key,
        figure: NaN
      });
    });
    // set count.
    this.set('count', this.getCanvasCountObjects());

    return this;
  }
  /**
   * update target.
   *
   * @return {Object} this
   */
  Game.prototype.updateTarget = function(target, key, figure) {
    // update target key & figure values, prevent this target clickable.
    target.set({
      key: key,
      figure: figure
    }).set('evented', false);

    return this;
  }
  /**
   * play game.
   *
   * @param {Object} target
   * @param {Function} callback
   * @return {Object} this
   */
  Game.prototype.play = function(target, callback) {
    // get game object.
    var game = this.getGame();
    // get count objects.
    var count = this.get('count');
    // get active figure;
    var figure = game.figure;
    // prepare targets array.
    var targets = [];
    // get target key.
    var key = target.get('key');
    // set game object.
    var _game = {
      target: {},
      over: false,
      combination: []
    };
    // append target - (key:figure).
    _game['target'][key] = figure;
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
      // draw figure onto the target.
      .drawFigure(target, figure)
      // update target.
      .updateTarget(target, key, figure);
    // loop while count doesn't equals to -1.
    while (count !== -1) {
      // get figure.
      var _figure = this.__canvas.item(count).get('figure');
      // pushing NaN figure into array.
      if (isNaN(_figure)) {
        targets.push(_figure);
      }
      count--;
    }
    // if theres is no more NaN figures
    // this means that all the squares
    // have already filled game is 
    // over but without winner.
    if (!targets.length) {
      // pushing values in game object.
      _game.over = true;
      _game.wins = '';
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
        // get active player object.
        var player = this.getActivePlayer();
        // pushing values in game object.
        _game.over = true;
        _game.combination = combination;
        _game.wins = player;
      }
    }
    // calling callback function
    // if it is provided.
    if (callback && $.isFunction(callback)) {
      callback.call(this, _game);
    }

    // set autoplay.
    this.set('autoplay', false);

    return this;
  }
  /**
   * play on target click.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype._play = function() {
    var _this = this;
    // get socket object.
    var socket = this.socket;
    this.__canvas.on({
      'mouse:down': function(e) {
        // target is clickable ?
        if ($.type(e.target) !== 'undefined' && $.type(e.target) == 'object') {
          // get target.
          var target = e.target;
          // start playing.
          _this.play(target, function(game) {
            // get game object.
            var _game = _this.getGame();
            // socket emit - game:play - passing object.
            socket.emit('game:play', {
              game: _game,
              target: game.target
            });
            // game isn't over ?
            if (!game.over) {
              // get players object.
              var players = _this.getPlayers();
              // socket emit - players:switch - passing object.
              socket.emit('players:switch', {
                game: _game,
                players: players
              });
            }
            // : restart game.
            else {
              // get room object.
              var room = _this.getRoom();
              // socket emit - game:restart - passing object.
              socket.emit('game:restart', {
                room: room,
                game: _game,
                wins: game.wins,
                combination: game.combination
              });
            }
          });
        }
        // :
        else {
          // debug game.
          console.debug('this target has already have figure or its not your turn!');
        }
      }
    });

    return this;
  }
  /**
   * restart game.
   *
   * @return {Object} this
   */
  Game.prototype.restart = function(data) {
    var _this = this;
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
              .initTargets()
              // set active player.
              .setActivePlayer();
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
   * @return {Number} count
   */
  Game.prototype.getCanvasCountObjects = function() {
    // get count.
    var count = this.__canvas.size() - 1;

    return count;
  }
  /**
   * get avaiable targets, passing each object to the
   * callback function if its provided.
   *
   * @param {Function} callback
   * @return {Array} targets 
   */
  Game.prototype.getAvaiableTargets = function(callback) {
    var targets = [];
    // loop throuch each canvas object.
    this.__canvas.forEachObject(function(object, index) {
      // if object has figure and this object
      // is NaN then push its key into 
      // targets array.
      if ('figure' in object && isNaN(object.figure)) {
        targets.push(object.key);
        // if callback is provided passing
        // object in it.
        if (callback && $.isFunction(callback)) {
          callback(object);
        }
      }
    });

    return targets;
    
  }
  /**
   * draw line.
   *
   * @param {Array} coords
   * @return {Object} line
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
   * draw circle.
   *
   * @param {Number} top
   * @param {Number} left
   * @param {Number} radius
   * @return {Object} circle
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
   * draw group.
   *
   * @param {Array} groups
   * @return {Object} group
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
   * draw game.
   *
   * @return {Object} this
   */
  Game.prototype.drawGame = function() {
    // get x.
    var x = this.__canvas.getWidth() / 3;
    // get y.
    var y = this.__canvas.getHeight() / 3;
    // add new groups onto the canvas combined with two lines:
    // _|_|_
    // _|_|_
    //  | |
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
   * draw figure (X || O).
   *
   * @param {Object} target
   * @param {Number} figure
   * @return {Object} this
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
    // figure is 1 ?
    if (figure) {      
      // prepare cross.
      var cross = this.drawGroup([
        this.drawLine([left + gap, top + gap, left + width - gap, top + height - gap]),
        this.drawLine([left + width - gap, top + gap, left + gap, top + height - gap])
      ]);
      // add cross onto the canvas.
      this.__canvas.add(this.figureFadeIn(cross, 0.5, 1, 200));
    }
    // : figure is 0
    else {
      // prepare circle.
      var circle = this.drawCircle(centerY, centerX, radius);
      // add circle onto the canvas.
      this.__canvas.add(this.figureFadeIn(circle, 0.5, 1, 200));
    }

    return this;
  }
  /**
   * draw game state.
   *
   * @return {Object} this
   */
  Game.prototype.drawGameState = function() {
    var _this = this;
    // get room object.
    var game = this.getGame();
    // loop in figures.
    game.targets.forEach(function(target) {
      // get target key.
      var key = Object.keys(target);
      // get target figure.
      var figure = target[key];
      // get target.
      var _target = _this.__canvas.item(key);
      _this
        // draw figure.
        .drawFigure(_target, figure)
        // update target.
        .updateTarget(_target, key, figure);
    });

    return this;
  }
  /**
   * add fade-in effect.
   *
   * @param {Object} figure
   * @param {Number} from
   * @param {Number} to
   * @param {Number} duration
   * @return {Object} this
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
   * @param {Object} combination
   * @return {Object} this
   */
  Game.prototype.drawCrossOut = function(combination) {
    // check for combination object.
    if (combination.length) {
      // get first key from combination.
      var a = combination[0];
      // get last key from combination. 
      var b = combination[2];
      // diff between first and last index.
      var c = b - a;
      // get first square by key.
      var _a_square = this.__canvas.item(a);
      // get last square by key.
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
   * run game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.run = function() {
    var _this = this;
    // get socket object.
    var socket = this.socket;
    // socket event - connect.
    socket.on('connect', function() {
      // socket event - room:init.
      socket.on('room:init', function(room) {
        _this
          // set room.
          .set('room', room);
      })
      // socket event - game:init.
      .on('game:init', function(game) {
        _this
          // set game.
          .set('game', game)
          // draw game.
          .drawGame()
          // initialize targets.
          .initTargets()
          // draw game state.
          .drawGameState()
          // play game.
          ._play();
      })
      // socket event - players:init.
      .on('players:init', function(players) {
        _this
          // set players.
          .set('players', players)
          // add players.
          .addPlayers()
          // set active player.
          .setActivePlayer()
          // set player scores.
          .setPlayersScore()
      })
      // socket event - player:waiting.
      .on('player:waiting', function(data) {
        if ('players' in data) {
          docCookies.removeItem('position');
          docCookies.setItem('position', 0);
        }
        var waiting = data.waiting;
        _this
          // set waiting.
          .set('waiting', true)
          // wait for player.
          .waitForPlayer(waiting);
      })
      // socket event - game:play.
      .on('game:play', function(target) {
        // get target.
        var _target = _this.__canvas.item(Object.keys(target));
        // play game.
        _this.play(_target);
      })
      // socket event - players:switch.
      .on('players:switch', function(data) {
        _this
          // set game object.
          .set('game', data.game)
          // set players object.
          .set('players', data.players)
          // set active player.
          .setActivePlayer();
      })
      // restart event.
      .on('game:restart', function(data) {
        _this
          // set game object.
          .set('game', data.game)
          // set players object.
          .set('players', data.players)
          // draw cross out.
          .drawCrossOut(data.combination)
          // set players score.
          .setPlayersScore()
          // restart game.
          .restart();
      });
   }).on('disconnect', function() {
      window.location.replace('/');
   });
  
   return this; 
  }

  // make sure page is loaded.
  $(function() {
    var z = 100;

    // k();
    // instantiate game object.
    var game = new Game({
      id: 'tictactoe',
      width: window.innerWidth - (window.innerWidth - window.innerHeight),
      height: window.innerHeight
    }, io());

    game
      // join game.
      .playerJoin()
      // run game.
      .run()
      // leave game.
      .playerLeave();

    $(window).on("navigate", function (event, data) {
        var direction = data.state.direction;
        if ( !! direction) {
            alert(direction);
        }
    });
    // activate tooltips.
    $('[data-toggle="tooltip"]').tooltip();

  });

})(jQuery);