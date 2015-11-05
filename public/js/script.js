// ----------------------------------------------
// Project: Tictactoe
// File: script.js
// Author: Lasha Badashvili (lashab@picktek.com)
// URL: http://github.com/lashab
// ----------------------------------------------

;(function($) {
  'use strict';

  /**
   * constructor.
   *
   * @param {Object} canvas
   */
  var Game = function(canvas, socket, debug) {
    // set fabric canvas object.
    this.canvas = new fabric.Canvas(canvas.id);
    // set selection.
    this.canvas.selection = false;
    // set socket object.
    this.socket = socket;
    // set debug function.
    this.debug = debug;
    // debug canvas.
    this.debug('canvas', 'object %o', this.canvas);
    // debug socket.
    this.debug('socket', 'object %o', this.socket);
  };
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
  };
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
  };
  /**
   * set canvas width & height.
   *
   * @return {Object} this
   */
  Game.prototype.setCanvasSize = function() {
    // get window width.
    var width = $(window).width();
    // get window height.
    var height = $(window).height();
    // get window width by orientation.
    width = height < width ? width - (width - height) : width;
    // set canvas width.
    this.canvas.setWidth(width);
    // set canvas height.
    this.canvas.setHeight(height);
    // debug canvas.
    this.debug('canvas', 'width %d', this.canvas.getWidth())
    // debug canvas.
    this.debug('canvas', 'height %d', this.canvas.getHeight());

    return this;
  };
  /**
   * get room object.
   *
   * @return {Object} room
   */
  Game.prototype.getRoom = function() {
    // get room object.
    var room = this.get('room') || {};
    // debug message.
    var message = _.isEmpty(room)
      ? 'object could\'t be found - o%'
        : '%o';
    // debug room.
    this.debug('room', message, room);

    return room;
  };
  /**
   * get game object.
   *
   * @return {Object} game
   */
  Game.prototype.getGame = function() {
    // get game object.
    var game = this.get('game') || {};
    // debug message.
    var message = _.isEmpty(game)
      ? 'object could\'t be found - %o'
        : '%o';
    // debug game.
    this.debug('game', message, game);

    return game;
  };
  /**
   * get players object.
   *
   * @return {Array} players
   */
  Game.prototype.getPlayers = function() {
    // get players object.
    var players = this.get('players') || [];
    // debug message.
    if (!players.length) {
      // debug players.
      this.debug('players', 'object could\'t be found - %o', players);
    }

    return players;
  };
  /**
   * get waiting status.
   *
   * @return {Boolean} true|false
   */
  Game.prototype.isWaiting = function() {
    // get waiting boolean value.
    var isWaiting = this.get('waiting') || false;

    return isWaiting;
  };
  /**
   * get room id by pathname.
   *
   * @return {Number|Boolean} room|false
   */
  Game.prototype.getRoomIdByPathName = function () {
    var pathname = '';
    // regex - e.g. room/1, room/2 etc.
    var regex = /^\/room\/(\d+)$/;
    try {
      if (window.location.pathname) {
        // get pathname.
        pathname = window.location.pathname;
      }
      // :
      else {
        // throw error.
        throw new Error('pathname couldn\'t be found.');
      }
    }
    catch (e) {
      // debug room.
      this.debug('room', e.message);

      return false;
    }
    // get matches.
    var matches = pathname.match(regex);
    if (matches) {
      // get room id & casting id.
      var room = matches[1] >> 0;
      // debug room.
      this.debug('room', 'you\'re joined in room #%d', room);

      return room;
    }
    // :
    else {
      // debug room.
      this.debug('room', 'you\'re not joined yet.');
    }

    return false;
  };
  /**
   * get player position from cookie.
   *
   * @return {Number} position
   */
  Game.prototype.getPlayerPosition = function () {
    // get player position from cookie.
    var position = docCookies.getItem('position');
    try {
      // position ? get position & casting position.
      position = position ? position >> 0 : (function() {
        // throw error.
        throw new Error('cookie position couldn\'t be found.')
      })();
    }
    catch(e) {
      // debug players.
      this.debug('players', e.message);

      return -1;
    }

    return position;
  };
  /**
   * get player object by position.
   *
   * @param {Number|String} position
   * @return {Object} player
   */
  Game.prototype.getPlayerByPosition = function(position) {
    var player = {};
    // get position.
    var position = position || this.getPlayerPosition();
    // casting position.
    position = position >> 0;
    if (position !== -1) {
      // get players.
      var players = this.getPlayers();
      if (players.length) {
        // get player object by position.
        player = players.length === 1 ? players[0] : players[position];
      }
    }

    return player;
  };
  /**
   * join game.
   *
   * @return {Object} this
   */
  Game.prototype.playerJoin = function() {
    var _this = this;
    // join submit event.
    $('.id-join').submit(function(e) {
      // get input.
      var input = $(this).find('input[type=text]');
      // get input value.
      var value = input.val();
      if (value.length) {
        // get form group.
        var formGroup = input.parent();
        // name match regex ?
        if (!/^[A-Za-z]{1,8}$/.test(value)) {
          e.preventDefault();
          // display alert text.
          input.next().fadeIn();
          // add error class to the form-group class.
          formGroup.addClass('has-error');
          // focus on input.
          input.focus();
          // debug players.
          _this.debug('players', '%s isn\'t a valid name.', value);
        }
        // :
        else {
          // add success class to the form-group class.
          formGroup.addClass('has-success');
        }
      }
      // :
      else {
        e.preventDefault();
        // focus on input.
        input.focus();
        // debug players.
        _this.debug('players', 'field is empty.');
      }
    });
    // get room id.
    var id = this.getRoomIdByPathName();
    if (id) {
      // socket emit - player:join - passing object.
      this.socket.emit('player:join', {
        id: id
      });
    }

    return this;
  };
  /**
   * Load players.
   *
   * @return {Object} this
   */
  Game.prototype.playersLoad = function () {
    var _this = this;
    // get players object.
    var players = this.getPlayers();
    if (players.length > 1) {
      // set waiting value.
      this.set('waiting', false);
      // remove waiting class.
      $('.players.player-waiting').removeClass('player-waiting');
      // close modal.
      $('.x-o-m').modal('hide');
    }
    // render players.
    players.forEach(function(player) {
      // get player element by position.
      var _player = $('.id-player-' + player.position);
      // add player image.
      _player.children(':first-child').prop('src', '../images/default.png');
      // add player name.
      _player.find('.id-name').text(player.name);
      // debug players.
      _this.debug('players', 'rendering player - %s - %o', player.name, player);
    });

    return this;
  };
  /**
   * leave game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.playerLeave = function() {
    var _this = this;
    // add click event.
    $('.glyphicon-menu-left').click(function(e) {
      // disconnect socket.
      _this.socket.disconnect();
    });

    return this;
  };
  /**
   * waiting for player.
   *
   * @param {Number} position
   * @return {Object} this
   */
  Game.prototype._waiting = function(position) {
    // get player object.
    var player = this.getPlayerByPosition();
    // get player element.
    var _player = $('.id-player-' + position);
    // open modal.
    $('.x-o-m').modal();
    // add waiting image.
    _player.children(':first-child').prop('src', '../images/loading.gif');
    // remove name.
    _player.find('.id-name').empty();
    // remove badge.
    _player.find('.id-badge').children().empty();
    // add player-waiting.
    _player.addClass('player-waiting');
    if (!_.isEmpty(player)) {
      // debug players.
      this.debug('players', '%s is waiting - %o', player.name, player);
    }

    return this;
  };
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
    // prepare fade-in (opacity - 1) class.
    var fadeIn = 'fade-in-1-1';
    // prepare fade-in (opacity - .5) class.
    var _fadeIn = 'fade-in-5-10';
    // player is active & not waiting state ? activate game : deactivate game.
    player.active && !isWaiting ? this.activate() : this.deActivate();
    // player active - add fade-in & remove fade-out class.
    $('div[class*=id-player-' + position + ']')
      .toggleClass(fadeIn, true)
      .toggleClass(_fadeIn, false);
    // player inactive - remove fade-in & add fade-out class.
    $('div[class*=id-player-' + ~~!position + ']')
      .toggleClass(fadeIn, false)
      .toggleClass(_fadeIn, true);
    if (!isWaiting) {
      // get active player object.
      var _player = this.getActivePlayer();
      // debug players.
      this.debug('players', '%s\'s turn - %o', _player.name, _player);
    }

    return this;
  };
  /**
   * get active player object.
   *
   * @return {Object} player
   */
  Game.prototype.getActivePlayer = function() {
    // get players object.
    var players = this.getPlayers();
    // get active player.
    var player = players.filter(function(player) {
      return player.active;
    })[0];

    return player;
  };
  /**
   * set players score.
   *
   * @return {Object} this
   */
  Game.prototype.setPlayersScore = function() {
    var _this = this;
    // get players object.
    var players = this.getPlayers();
    // get badge elements.
    var badges = $('.players').find('.badge');
    // players length > 1 ?
    if (players.length > 1) {
      // get first player object.
      var _player = players[0];
      // get second player object.
      var __player = players[1];
      // get first badge element.
      var _badge = badges.filter(':even');
      // get second badge element.
      var __badge = badges.filter(':odd');
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
    // :
    else {
      // remove badge-loosing class.
      badges.toggleClass('badge-loosing', false);
    }
    players.forEach(function(player) {
      // get player score.
      var score = player.score;
      // get badge by position.
      var badge = $('.id-player-' + player.position).find('.badge');
      // set score.
      badge.text(score);
      // debug players.
      _this.debug('players', '%s\'s score is %d - %o', player.name, score, player);
    });

    return this;
  };
  /**
   * set game active state.
   *
   * @param {Boolean} evented
   * @return {Object} this
   */
  Game.prototype.setActiveState = function(evented) {
    var evented = evented || false;
    // get target objects.
    this.getAvailableTargets(function(object) {
      // set evented TRUE | FALSE.
      object.set('evented', evented);
    });

    return this;
  };
  /**
   * activate game.
   *
   * @return {Object} this
   */
  Game.prototype.activate = function() {
    // activate game.
    this.setActiveState(true);
    // debug game.
    this.debug('game', 'is active you can play.');

    return this;
  };
  /**
   * deactivate game.
   *
   * @return {Object} this
   */
  Game.prototype.deActivate = function() {
    // deactivate game.
    this.setActiveState();
    // debug game.
    this.debug('game', 'is inactive you can\'t play yet.');

    return this;
  };
  /**
   * initialize targets.
   *
   * @return {Object} this
   */
  Game.prototype.initTargets = function() {
    // initial key & figure values.
    this.canvas.forEachObject(function(object, key) {
      object.set({
        key: key,
        figure: NaN
      });
    });

    return this;
  };
  /**
   * update target.
   *
   * @param {Object} target
   * @param {Number} key
   * @param {Number} figure
   * @return {Object} this
   */
  Game.prototype.updateTarget = function(target, key, figure) {
    // update target.
    target.set({
      key: key,
      figure: figure
    }).set('evented', false);

    return this;
  };
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
    // get size.
    var i = this.get('size');
    // get active figure;
    var figure = game.figure;
    // prepare target objects.
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
      // draw figure.
      .drawFigure(target, figure)
      // update target.
      .updateTarget(target, key, figure);
    while (i !== -1) {
      // get figure.
      var _figure = this.canvas.item(i).get('figure');
      // pushing NaN figure.
      if (isNaN(_figure)) {
        targets.push(_figure);
      }
      i--;
    }
    // game is over, status - draw.
    if (!targets.length) {
      _game.over = true;
      _game.wins = {};
      // debug game.
      this.debug('game', 'game is over status - draw');
    }
    // game is over, status - wins.
    for (var i in combinations) {
      var combination = combinations[i];
      var a = this.canvas.item(combination[0]).get('figure');
      var b = this.canvas.item(combination[1]).get('figure');
      var c = this.canvas.item(combination[2]).get('figure');
      if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c)) {
        // get active player object.
        var player = this.getActivePlayer();
        // pushing values in game object.
        _game.over = true;
        _game.combination = combination;
        _game.wins = player;
        // debug game.
        this.debug('game', 'game is over status - wins - %s - %o', player.name, player);
      }
    }
    if (callback && $.isFunction(callback)) {
      // callback - passing game object.
      callback(_game);
    }

    return this;
  };
  /**
   * play game.
   *
   * @return {Object} this
   */
  Game.prototype._play = function() {
    var _this = this;
    // get socket object.
    var socket = this.socket;
    // canvas event - mouse:down.
    this.canvas.on({
      'mouse:down': function(e) {
        if (!_.isUndefined(e.target)) {
          // get target object.
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
            if (!game.over) {
              // get players object.
              var players = _this.getPlayers();
              // socket emit - players:switch - passing object.
              socket.emit('players:switch', {
                game: _game,
                players: players
              });
            }
            // :
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
          })
          // play audio.
          .audioPlay();
        }
        // :
        else {
          // debug game.
        _this.debug('game', 'you can\'t play yet.');
        }
      }
    });

    return this;
  };
  /**
   * restart game.
   *
   * @return {Object} this
   */
  Game.prototype.removeFigures = function() {
    var _this = this;
    // 1s.
    setTimeout(function() {
      // get size - 1.
      var i = _this.getCanvasObjectSize() - 1;
      while (i !== _this.get('size')) {
        // remove figures.
        _this.canvas.fxRemove(_this.canvas.item(i));
        i--;
      }
      // debug game.
      this.debug('game', 'restarting.');
    }, 1000);

    return this;
  };
  /**
   * get canvas object size.
   *
   * @return {Number} size
   */
  Game.prototype.getCanvasObjectSize = function() {
    // get size.
    var size = this.canvas.size();
    // debug canvas.
    this.debug('canvas', 'objects size = %d', size);

    return size;
  }
  /**
   * get available target objects.
   *
   * @param {Function} callback
   */
  Game.prototype.getAvailableTargets = function(callback) {
    this.canvas.forEachObject(function(object) {
      if ('figure' in object && isNaN(object.figure)) {
        if (callback && _.isFunction(callback)) {
          callback(object);
        }
      }
    });
  };
  /**
   * draw line.
   *
   * @param {Array} coordinates
   * @return {Object} line
   */
  Game.prototype.drawLine = function(coordinates) {
    // set options.
    var options = {
      stroke: 'black',
      strokeWidth: 1,
      selectable: false,
      evented: false
    };
    // create new line.
    var line = new fabric.Line(coordinates, options);

    return line;
  };
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
      originX: 'center',
      originY: 'center',
      strokeWidth: 1,
      selectable: false,
      evented: false
    };
    // create new circle.
    var circle = new fabric.Circle(options);

    return circle;
  };
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
  };
  /**
   * draw canvas game.
   *
   * @return {Object} this
   */
  Game.prototype.drawGame = function() {
    // get x.
    var x = this.canvas.getWidth() / 3;
    // get y.
    var y = this.canvas.getHeight() / 3;
    // add new groups onto the canvas combined with two lines:
    // _|_|_
    // _|_|_
    //  | |
    this.canvas.add(
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
    // debug canvas.
    this.debug('canvas', 'drawing game.');

    return this;
  };
  /**
   * draw figure (X | O).
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
      this.canvas.add(this.figureFadeIn(cross, 0.5, 1, 200));
      // debug canvas.
      this.debug('canvas', 'drawing cross.');
    }
    // :
    else {
      // prepare circle.
      var circle = this.drawCircle(centerY, centerX, radius);
      // add circle onto the canvas.
      this.canvas.add(this.figureFadeIn(circle, 0.5, 1, 200));
      // debug canvas.
      this.debug('canvas', 'drawing circle.');
    }

    return this;
  };
  /**
   * draw game state.
   *
   * @return {Object} this
   */
  Game.prototype.drawGameState = function() {
    var _this = this;
    // get room object.
    var game = this.getGame();
    game.targets.forEach(function(target) {
      // get target key.
      var key = Object.keys(target);
      // get target figure.
      var figure = target[key];
      // get target.
      var _target = _this.canvas.item(key);
      _this
        // draw figure.
        .drawFigure(_target, figure)
        // update target.
        .updateTarget(_target, key, figure);
    });
    // debug canvas.
    this.debug('canvas', 'drawing game figures (state) - %o', game);

    return this;
  };
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
    // opacity from.
    figure.set('opacity', from);
    // opacity animation.
    figure.animate('opacity', to, {
      duration: duration,
      onChange: this.canvas.renderAll.bind(this.canvas)
    });

    return figure;
  };
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
      var _a_square = this.canvas.item(a);
      // get last square by key.
      var _c_square = this.canvas.item(b);
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
      // c = 2 ?
      if (c === 2) {
        // set coordinates.
        coordinates = {
          x1: _a_groupOriginCenter.x - _a_squareWidth,
          y1: _a_groupOriginCenter.y,
          x2: _c_groupOriginCenter.x + _c_squareWidth,
          y2: _c_groupOriginCenter.y
        };
      }
      // c = 4 ?
      else if (c === 4) {
        // set coordinates.
        coordinates = {
          x1: _a_groupOriginCenter.x + _a_squareWidth,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x - _c_squareWidth,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // c = 6 ?
      else if (c === 6) {
        // set coordinates.
        coordinates = {
          x1: _a_groupOriginCenter.x,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // c = 8 ?
      else if (c === 8) {
        // set coordinates.
        coordinates = {
          x1: _a_groupOriginCenter.x - _a_squareWidth,
          y1: _a_groupOriginCenter.y - _a_squareHeight,
          x2: _c_groupOriginCenter.x + _c_squareWidth,
          y2: _c_groupOriginCenter.y + _c_squareHeight
        };
      }
      // add cross out onto the canvas.
      this.canvas.add(this.drawGroup([this.drawLine([coordinates.x1, coordinates.y1, coordinates.x2, coordinates.y2])]));
      // debug canvas.
      this.debug('canvas', 'drawing cross-out - %o', combination);
    }

    return this;
  };
  /**
   * get audio object.
   *
   * @return {Object} audio
   */
  Game.prototype.getAudioObject = function() {
    // get audio object.
    var audio = $('.id-audio')[0];

    return audio;
  };
  /**
   * play audio.
   *
   * @return {Object} this
   */
  Game.prototype.audioPlay = function() {
    // get audio object.
    var audio = this.getAudioObject()
    // play audio.
    audio.play();

    return this;
  };
  /**
   * turn on audio.
   *
   * @return {Object} this
   */
  Game.prototype.audioOn = function() {
    // get audio object.
    var audio = this.getAudioObject();
    // unmute audio.
    audio.muted = false;
    // debug audio.
    this.debug('audio', 'is on.');

    return this;
  };
  /**
   * turn off audio.
   *
   * @return {Object} this
   */
  Game.prototype.audioOff = function() {
    // get audio object.
    var audio = this.getAudioObject();
    // unmute audio.
    audio.muted = true;
    // debug audio.
    this.debug('audio', 'is off.');

    return this;
  };
  /**
   * audio switch.
   *
   * @return {Object} this
   */
  Game.prototype.audioSwitch = function() {
    var _this = this;
    // get volume icon.
    var volume = $('[class*=glyphicon-volume]');
    // volume click event.
    volume.click(function(e) {
      // volume has glyphicon-volume-up volume-up class ?
      if ($(this).hasClass('glyphicon-volume-up')) {
        // remove glyphicon-volume-up class.
        $(this).toggleClass('glyphicon-volume-up', false);
        // add glyphicon-volume-off class.
        $(this).toggleClass('glyphicon-volume-off', true);
        // turn the audio off.
        _this.audioOff();
      }
      // :
      else {
        // remove glyphicon-volume-off class.
        $(this).toggleClass('glyphicon-volume-off', false);
        // add glyphicon-volume-up class.
        $(this).toggleClass('glyphicon-volume-up', true);
        // turn the audio on.
        _this.audioOn();
      }
    });

    return this;
  };
  /**
   * draw game on resize.
   *
   * @return {Object} this
   */
  Game.prototype.drawOnResize = function() {
    var _this = this;
    $(window).bind('orientationchange resize', function(event) {
      // get room id.
      var id = _this.getRoomIdByPathName();
      if (id) {
        // remove canvas.
        _this.canvas.forEachObject(function(object) {
          _this.canvas.remove(object);
        });

        _this
          // set canvas size.
          .setCanvasSize()
          // draw game.
          .drawGame()
          // init targets.
          .initTargets();
          // draw game state.
          _this.drawGameState();
          // set active player.
          _this.setActivePlayer();
      }
    });

    return this;
  };
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
        if (!_.isEmpty(room)) {
          _this
            // set room.
            .set('room', room);
        }
        // :
        else {
          // debug socket
          _this.debug('socket', 'event room:init - object is empty.');
        }
      })
      // socket event - game:init.
      .on('game:init', function(game) {
        if (!_.isEmpty(game)) {
        _this
          // set game object.
          .set('game', game)
          // set canvas size.
          .setCanvasSize()
          // draw game.
          .drawGame()
          // set canvas object count.
          .set('size', _this.getCanvasObjectSize() - 1)
          // initialize targets.
          .initTargets()
          // draw game state.
          .drawGameState()
          // play game.
          ._play();
        }
        // :
        else {
          // debug socket
          _this.debug('socket', 'event game:init - object is empty.');
        }
      })
      // socket event - players:init.
      .on('players:init', function(players) {
        if (players.length) {
        _this
          // set players.
          .set('players', players)
          // add players.
          .playersLoad()
          // set active player.
          .setActivePlayer()
          // set player scores.
          .setPlayersScore()
        }
        // :
        else {
          // debug socket.
          _this.debug('socket', 'event players:init object is empty.');
        }
      })
      // socket event - player:waiting.
      .on('player:waiting', function(data) {
        if (!_.isEmpty(data)) {
          // data has room property && left value !== -1 ?
          if (_.has(data, 'room') && data.room.left !== -1) {
            _this
            // set room object.
            .set('room', data.room)
            // set game object.
            .set('game', data.game)
            // set players object.
            .set('players', data.players)
            // restart game.
            .removeFigures()
            // set active player.
            .setActivePlayer()
            // set players score.
            .setPlayersScore()
          }
          _this
            // set waiting boolean value.
            .set('waiting', true)
            // waiting for player.
            ._waiting(data.position);
        }
        // :
        else {
          // debug socket.
          _this.debug('socket', 'event player:waiting object is empty.');
        }
      })
      // socket event - game:play.
      .on('game:play', function(target) {
        if (!_.isEmpty(target)) {
          // get target.
          var _target = _this.canvas.item(Object.keys(target));
          // play game.
          _this.play(_target);
        }
        // :
        else {
          // debug socket.
          _this.debug('socket', 'event game:play object is empty.');
        }
      })
      // socket event - players:switch.
      .on('players:switch', function(data) {
        if (!_.isEmpty(data)) {
        _this
          // set game.
          .set('game', data.game)
          // set players.
          .set('players', data.players)
          // set active player.
          .setActivePlayer();
        }
        // :
        else {
          // debug socket.
          _this.debug('socket', 'event players:switch object is empty.');
        }
      })
      // socket event - game:restart.
      .on('game:restart', function(data) {
        if (!_.isEmpty(data)) {
          _this
            // set game.
            .set('game', data.game)
            // set players.
            .set('players', data.players)
            // draw cross out.
            .drawCrossOut(data.combination)
            // set players score.
            .setPlayersScore()
            // remove figures.
            .removeFigures()
            // re-initialize targets.
            .initTargets()
            // set active player.
            .setActivePlayer()
            // debug socket.
            .debug('socket', 'event game:restart - restarting game - %o', data);
        }
        // :
        else {
          // debug socket.
          _this.debug('socket', 'event game:restart - object is empty.');
        }
      })
      // socket event - disconnect.
      .on('disconnect', function() {
          // Move to homepage.
          window.location.replace('/');
      })
   })

   return this;
 };

  $(function() {
    // instantiate game object.
    var game = new Game({
      id: 'tictactoe'
    }, io(), function(string) {
      debug(string).apply(this, _.toArray(arguments).slice(1));
    });

    game
      // join game.
      .playerJoin()
      // run game.
      .run()
      // re-draw on window resize.
      .drawOnResize()
      // switch audio.
      .audioSwitch()
      // leave game.
      .playerLeave();
    // activate tooltips.
    $('[data-toggle="tooltip"]').tooltip();
  });

})(jQuery);
