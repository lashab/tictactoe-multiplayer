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
      player = players.length === 1 ? players[0] : players[position];
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
    // join submit event.
    $('.id-join').submit(function(e) {
      // get input.
      var input = $(this).find('input[type=text]');
      // get input value.
      var value = input.val();
      // name length > 0 ?
      if (value.length) {
        // get form group.
        var formGroup = input.parent();
        // name doesn't match regex ?
        if (!/^[A-Za-z]{1,8}$/.test(value)) {
          e.preventDefault();
          // display alert text.
          input.next().fadeIn();
          // add error class to form-group.
          formGroup.addClass('has-error');
          // focus on input.
          input.focus();
        }
        // :
        else {
          // add success class to form-group.
          formGroup.addClass('has-success');
        }
      }
      // :
      else {
        e.preventDefault();
        // focus on input.
        input.focus();
      }
    });
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
    $('.glyphicon-menu-left').click(function(e) {
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
    var players = this.getPlayers();
    // check for players length.
    if (players.length > 1) {
      // set waiting value.
      this.set('waiting', false);
      // remove waiting class.
      $('.players.player-waiting').removeClass('player-waiting');
      // hide modal.
      $('.tic-tac-toe-m').modal('hide');
    }
    // loop in players add image && player name.
    players.forEach(function(player) {
      $('.id-player-' + player.position)
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
  Game.prototype.waitForPlayer = function (data) {
    // get waiting object.
    var waiting = data.waiting;
    // get waiting position.
    var position = waiting.position;
    // get player element.
    var player = $('.id-player-' + position);
    // open modal.
    $('.tic-tac-toe-m').modal();
    // set waiting by position.
    $('.id-player-' + waiting.position).children(':first-child')
      .prop('src', waiting.image)
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
    // player is active && not waiting state ? activate game : deactivate game.
    player.active && !isWaiting ? this.activate() : this.deActivate();
    // player active - add fade-in && remove fade-out class.
    $('div[class*=id-player-' + position + ']')
      .toggleClass(fadeIn, true)
      .toggleClass(fadeOut, false);
    // player inactive - remove fade-in && add fade-out class.
    $('div[class*=id-player-' + ~~!position + ']')
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
    var players = this.getPlayers();
    // get badges.
    var badges = $('.players').find('.badge');
    // check for players.
    if (players.length > 1) {
      // get first player object.
      var _player = players[0];
      // get second player object.
      var __player = players[1];
      // get first badge.
      var _badge = badges.filter(':even');
      // get second badge.
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
    else {
      // remove badge-loosing class.
      badges.toggleClass('badge-loosing', false);
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
          // play audio.
          _this.audioPlay();
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
  Game.prototype.restart = function() {
    var _this = this;
    // execute after 1s.
    setTimeout(function() {
      // get count.
      var count = _this.getCanvasCountObjects();
      // while []
      while (count !== _this.count) {
        // remove all figures.
        _this.__canvas.fxRemove(_this.__canvas.item(count), {
          // onComplete event - reset figures, set active player.
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
      this.__canvas.add(this.drawGroup([this.drawLine([coordinates.x1, coordinates.y1, coordinates.x2, coordinates.y2])]));
    }

    return this;
  }
  /**
   * get audio object.
   *
   * @return {Object} audio
   */
  Game.prototype.getAudioObject = function() {
    // get audio object.
    var audio = $('.id-audio')[0];

    return audio;
  }
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
  }
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

    return this;
  }
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

    return this;
  }
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
        // data has room property && left value => 0 ?
        if (data.hasOwnProperty('room') && data.room.left >= 0) {
          _this
          // set room.
          .set('room', data.room)
          // set game.
          .set('game', data.game)
          // set players.
          .set('players', data.players)
          // set active player.
          .setActivePlayer()
          // set players score.
          .setPlayersScore()
          // restart game.
          .restart();
        }
        _this
          // set waiting.
          .set('waiting', true)
          // wait for player.
          .waitForPlayer({
            waiting: data.waiting
          });
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
          // set game.
          .set('game', data.game)
          // set players.
          .set('players', data.players)
          // set active player.
          .setActivePlayer();
      })
      // restart event.
      .on('game:restart', function(data) {
        _this
          // set game.
          .set('game', data.game)
          // set players.
          .set('players', data.players)
          // draw cross out.
          .drawCrossOut(data.combination)
          // set active player.
          .setActivePlayer()
          // set players score.
          .setPlayersScore()
          // restart game.
          .restart();
      })
      .on('player:leave', function() {
        // back to homepage.
        window.location.replace('/');
      });
   })
  
   return this; 
  }

  // make sure page is loaded.
  $(function() {

    var width = window.innerWidth - (window.innerWidth - window.innerHeight);

    var height = window.innerHeight;

    var _navigator = navigator.userAgent || navigator.vendor || window.opera;
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(_navigator)
        || 
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(_navigator.substr(0, 4))) {
      width = window.innerWidth;
    }

    var game = new Game({
      id: 'tictactoe',
      width: width,
      height: height
    }, io());

    game
      // join game.
      .playerJoin()
      // run game.
      .run()
      // switch audio.
      .audioSwitch()
      // leave game.
      .playerLeave();
    // activate tooltips.
    $('[data-toggle="tooltip"]').tooltip();

  });

})(jQuery);