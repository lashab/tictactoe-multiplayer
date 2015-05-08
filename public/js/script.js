;(function($) {
  'use strict';

  /**
   * constructor.
   *
   * @param {Object} canvas
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

    return !$.isEmptyObject(room) 
        ? room 
          : console.debug('room object could\'t be found.');
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
      position ? position >> 0 : (function() {
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
    // get player position from cookie if position 
    // is not provided.
    var position = position || this.getPlayerPosition();
    // cast position to the number.
    position = position >> 0;
    // check for position.
    if (position !== -1) {
      var player = {};
      // get players.
      var players = this.get('players') || [];
      // check for players.
      if (players.length) {
        // get player by position.
        var player = players[position];
      }
      else {
        // debug.
        console.debug('players could\'t be found.');
      }

      return player;
    }
  }
  /**
   * joins to the game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.playerJoin = function (socket) {
    // get room id.
    var room = this.getRoomIdByPathName();
    // check for room.
    if (room) {
      // emit server to join, passing room id.
      socket.emit('player:join', {
        id: room
      });
    }

    return this;
  }
  /**
   * leaves the game.
   *
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.playerLeave = function(socket) {
    var _this = this;
    // add click event.
    $('.room .glyphicon-log-out').click(function(e) {
      e.preventDefault();
      // get room.
      var room = _this.get('room');
      // get player.
      var player = _this.getPlayerByPosition();
      // emit to leave.
      socket.emit('player:leave', {
        room: room._id,
        player: player._id,
        waiting: _this.get('waiting')
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
      // set waiting property to false.
      this.set('waiting', false);
      // remove waiting class.
      $('.players.waiting').removeClass('waiting');
    }
    // loop through each player add image
    // and player name.
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
   * waits for next player.
   *
   * @param {Object} player
   * @return {Object} this
   */
  Game.prototype.waitForPlayer = function (player) {
    // add loading animation according to the
    // player position.
    this
      .set('waiting', true)
      .set('autoplay', false);

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
      .addClass('waiting')
      .addClass('show');

    return this;
  }
  /**
   * sets active player.
   *
   * @param {Object} players
   * @return {Object} this
   */
  Game.prototype.setActivePlayer = function () {
    // get this player position.
    var _position = this.getPlayerPosition();
    // check for position.
    if (_position !== -1) {
      // get players.
      var players = this.get('players');
      // get player by position.
      var player = players[_position];
      // get player position.
      var position = player.position;
      // get active player position.
      position = player.active ? position : ~~!position;
      // get waiting state.
      var isWaiting = this.get('waiting');
      // prepare fade-in class.
      var fadeIn = 'whole-in';
      // prepare fade-out class.
      var fadeOut = 'half-in';
      // get player element(s).
      var _player = $('div[class*="id-player-"]');
      // get progress element(es).
      var _progress = $('div[class*="id-progress-"]');
      // if player is active activate game
      // otherwise deactivate game.
      player.active && !isWaiting ? this.activate() : this.deActivate();
      // filter player element by positon 
      // add whole-in class and remove
      // half-in class.
      _player.filter(function(_position) {
        return _position === position;
      })
      .toggleClass(fadeIn, true)
      .toggleClass(fadeOut, false)
      .addBack()
      // filter player element by positon 
      // remove whole-in class and add
      // half-in class.
      .filter(function(_position) {
        return _position !== position;
      })
      .toggleClass(fadeIn, false)
      .toggleClass(fadeOut, true);

      if (!isWaiting) {
        // start after 1s.
        setTimeout(function() {
          // filter progress bar element by positon 
          // and add whole-in class.
          _progress.filter(function(_position) {
            return _position === position;
          }).addClass(fadeIn);
        }, 1000);
        // filter progress bar element by positon 
        // and remove whole-in class.
        _progress.filter(function(_position) {
          return _position !== position;
        }).removeClass(fadeIn);
      }
    }

    return this;
  }
  /**
   * gets active player.
   *
   * @return {Object} player
   */
  Game.prototype.getActivePlayer = function() {
    // get players.
    var players = this.get('players');
    // filter players, get active player.
    var player = players.filter(function(player) {
      return player.active;
    })[0];

    return player;
  }
  /**
   * sets player score.
   *
   * @return {Object} this
   */
  Game.prototype.setPlayerScores = function() {
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
    // loop through each players, get badge
    // by positon and set score.
    players.forEach(function(player) {
      // get badge by position.
      var badge = $('.id-player-' + player.position).find('.badge');
      // set score.
      badge.text(player.score);
    });

    return this;
  }
  /**
   * auto play.
   *
   * @return {Object} this
   */
  Game.prototype.autoPlay = function () {
    var _this = this;
    // start after 1s.
    setTimeout(function() {
      // get players object.
      var players = _this.get('players');
      // get waiting value.
      var isWaiting = _this.get('waiting');
      // check for players length if both players
      // are in then start count down.
      if (!isWaiting) {
        // set autoplay value defaults to true.
        _this.set('autoplay', true);
        // get player position.
        var _position = _this.getPlayerPosition();
        // check for position.
        if (_position !== -1) {
          // get player by position.
          var player = players[_position];
          // get player position.
          var position = player.position;
          // get active player postion.
          position = player.active ? position : ~~!position;
          // get progress bar by active player position.
          var progress = $('.id-progress-' + position).children('.progress-bar');
          // get width in percentage.
          var width = (100 * parseFloat(progress.width()) / parseFloat(progress.parent().width()));
          // repeat after 1/10 second.
          var time = setInterval(function() {
            // get available targets.
            var targets = _this.getAvaiableTargets();
            // get autoplay value.
            var autoplay = _this.get('autoplay');

            isWaiting = _this.get('waiting');

            if (!isWaiting) {
            // check for autoplay value if its true
            // substract width 1, get random
            // avaiable target and trigger
            // it to draw figure.
            if (autoplay) {
              // substract 1 and update width for progress bar.
              progress.width(width-- + '%');
              // check whether the width is less then zero
              // or not.
              if (width < 0) {
                // get random index from targets array.
                var random = targets[Math.floor(Math.random() * targets.length)];
                // get random target.
                var target = _this.__canvas.item(random);
                // check whether the target has no figure 
                // and position is active player postion.
                if (isNaN(target.figure) && position === _position) {
                  // trigger to mouse down on specific 
                  // target.
                  _this.__canvas.trigger('mouse:down', {
                    target: target
                  });
                }
              }
            }
            // progress bar success.
            var success = 'progress-bar-success';
            // progress bar warning.
            var warning = 'progress-bar-warning';
            // progress bar danger.
            var danger = 'progress-bar-danger';
            // check for autoplay value and width if autoplay 
            // is false or width is zero this means that the
            // event is fired! set progress bar to init 
            // state and recursively call autoplay.
            if (!autoplay || width < 0) {
              // start after 1s.
              setTimeout(function() {
                // set width to 100%.
                progress.width(100 + '%');
                // check for danger progress bar class.
                if(progress.hasClass(danger) || progress.hasClass(warning)) {
                  progress
                    // remove danger progress bar.
                    .removeClass(danger)
                    // remove warning progress bar.
                    .removeClass(warning)
                    // add success progress bar.
                    .addClass(success)
                }
                // recursively call autoplay method.
                _this.autoPlay();
              }, 1000);
              // check for time interval id.
              if (time) {
                // clear time interval by id.
                clearInterval(time);
              }
            }
            // width case 50%.
            else if (width === 50) {
              // check for success progress bar class.
              if (progress.hasClass(success)) {
                progress
                  // remove success progress bar.
                  .removeClass(success)
                  // add warning progress bar.
                  .addClass(warning);
              }
            }
            // width case 20%.
            else if (width === 20) {
              // check for warning progress bar class.
              if (progress.hasClass(warning)) {
                progress
                  // remove warning progress bar.
                  .removeClass(warning)
                  // add danger progress bar.
                  .addClass(danger);
              }
            }
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
  /**
   * activates game.
   *
   * @return {Object} this
   */
  Game.prototype.activate = function() {
    // activate game.
    this.setActiveState(true);

    return this;
  }
  /**
   * deactivates game.
   *
   * @return {Object} this
   */
  Game.prototype.deActivate = function() {
    // deactivate game.
    this.setActiveState();

    return this;
  }
  /**
   * set initial targets index and figure.
   *
   * @return {Object} this
   */
  Game.prototype.initTargets = function() {
    // loop over each drawn
    // target and set index
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
   * updates target.
   *
   * @return {Object} this
   */
  Game.prototype.updateTarget = function(target, index, figure) {
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
   * plays the game.
   *
   * @param {Object} target
   * @param {Function} callback
   * @return {Object} this
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
      .updateTarget(target, index, figure);
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
      // pushing values in game object.
      game.over = true;
      game.wins = '';
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
        // get active player.
        var player = this.getActivePlayer();
        // pushing values in game object.
        game.over = true;
        game.combination = combination;
        game.wins = player._id;
      }
    }
    // calling callback function
    // if it is provided.
    if (callback && $.isFunction(callback)) {
      callback.call(this, game);
    }

    // set autoplay to false.
    this.set('autoplay', false);

    return this;
  }
  /**
   * starts playing on target
   * click event fire.
   *
   * @param {Object} socket
   * @return {Object} this
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
                // emit server to restart the game passing
                // room id, winner combination and winner
                // player id.
                socket.emit('restart', {
                  room: room,
                  wins: game.wins,
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
   * switches active player.
   *
   * @param {Object} data
   * @return {Object} this
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
      .setActivePlayer();

    return this;
  }
  /**
   * restarts the game.
   *
   * @param {Object} data
   * @return {Object} this
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
      // reset player score.
      .setPlayerScores();
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
   * get avaiable targets, passing each object to 
   * callback function if its provided.
   *
   * @param {Function} callback
   * @return {Array} targets 
   */
  Game.prototype.getAvaiableTargets = function(callback) {
    // define targets defaults to empty array.
    var targets = [];
    // loop throuch each canvas object.
    this.__canvas.forEachObject(function(object, index) {
      // if object has figure and this object
      // is NaN then push its index into 
      // targets array.
      if ('figure' in object && isNaN(object.figure)) {
        targets.push(object.index);
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
   * draws the line.
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
   * draws circle.
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
   * draws group.
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
   * draws game.
   *
   * @return {Object} this
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
   * @return {Object} this
   */
  Game.prototype.drawGameState = function() {
    var _this = this;
    // get room object.
    var room = this.get('room');
    // loop through figures, draw each
    // figure, setting state.
    room.figures.forEach(function(target) {
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
        .updateTarget(_target, index, figure);
    });

    return this;
  }
  /**
   * adds fade-in effects to figures.
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
      // get first index from combination.
      var a = combination[0];
      // get last index from combination. 
      var b = combination[2];
      // diff between first and last index.
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
   * @param {Object} socket
   * @return {Object} this
   */
  Game.prototype.run = function(socket) {
    var _this = this;
    // connect event.
    socket.on('connect', function() {
      _this
        // player join.
        .playerJoin(socket)
        // player leave.
        .playerLeave(socket);
      // init room event.
      socket.on('game:init', function(room) {
        if (!$.isEmptyObject(room)) {
          _this
            // set room object.
            .set('room', room)
            // draw game.
            .drawGame()
            // initialize targets.
            .initTargets()
            // draw game state.
            .drawGameState()
            // play game.
            ._play(socket);
        }
        else {
          // debug.
          console.debug('game:init event - room object couldn\t be found.');
        }
      })
      // join players event.
      .on('join players', function(players) {
        // check for players.
        if (players.length) {
          _this
            // set players
            .set('players', players)
            // add players.
            .addPlayers()
            // set active player.
            .setActivePlayer()
            // set player scores.
            .setPlayerScores()
            // auto play.
            .autoPlay();
        }
        else {
          // debug.
          console.debug('join players event - players couldn\t be found.');
        }
      })
      // waiting for player event.
      .on('waiting', function(player) {
        if (!$.isEmptyObject(player)) {

          // waiting for player.
          _this.waitForPlayer(player);
        }
        else {
          // debug.
          console.debug('waiting for player event - player couldn\t be found.');
        }
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
        // check for data.
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
        if (!$.isEmptyObject(data)) {
        // restart the game.
          _this.restart(data);
        }
        else {
          // debug.
          console.debug('restart event - data couldn\t be found.');
        }
      });
   }).on('disconnect', function() {
      window.location.replace('/');
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
    // activate tooltips.
    $('[data-toggle="tooltip"]').tooltip();

  // perfomance debug.
  function performance_debug() {
    var a = performance.now();
    Game.prototype.getRoom();
    var b = performance.now();
    console.debug('Executed in ' + (b - a) + ' ms.');
  }
  performance_debug();
  });

})(jQuery);