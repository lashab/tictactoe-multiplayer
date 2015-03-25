(function($) {
  'use strict';

  var Game = function(socket, canvas) {
    this.__canvas = new fabric.Canvas(canvas);
    this.__canvas.setWidth(window.innerWidth - (window.innerWidth - window.innerHeight));
    this.__canvas.setHeight(window.innerHeight);
    this.socket = socket;
  }

  Game.prototype.init = function() {
    if (window.location.pathname && /^\/room\/\d+$/.test(window.location.pathname)) {
      this.socket.emit('init', {
        room: this.getRoomId(),
        player: this.getPlayerId()
      });
    }
    return this;
  }

  Game.prototype._init = function(socket, that) {
    return function(room) {
      if (!$.isEmptyObject(room)) {
        that
          .setRoom(room.room)
          .drawGame()
          .ready()
          .setActiveFigure(that.getRoom().figure)
          .manipulate();
      }
    }
  }

  Game.prototype._players = function(socket, that) {
    return function(room) {
      if (!$.isEmptyObject(room)) {
        that
          .setPlayers(room.players)
          .addPlayers()
          .setActivePlayer()
      }
    }
  }

  Game.prototype.setRoom = function(room) {
    $('.rooms.fade-effect').addClass('whole-in');
    this.room = room;
    return this;
  }

  Game.prototype.getRoom = function() {
    return this.room;
  }

  Game.prototype.setPlayers = function(players) {
    this.players = players;
    return this;
  }

  Game.prototype.getPlayers = function() {
    return this.players;
  }

  Game.prototype.getActivePlayer = function() {
    var players = this.getPlayers();
    var position = NaN;
    players.map(function(player, index) {
      if (player.active) {
        position = index;
      }
    });
    if (!isNaN(position)) {
      return position;
    }
    return false;
  }

  Game.prototype.setActivePlayer = function() {
    var position = this.getActivePlayer();
    $('.id-player-' + position).addClass('whole-in');
    $('div[class*="id-player-"]').filter(function(index) {
      return index !== position;
    }).removeClass('whole-in');
  }

  Game.prototype.addPlayers = function(room) {
    var players = this.getPlayers();
    if (players.length > 1) $('.players.wait').removeClass('wait');
    players.map(function(player, position) {
      $('.id-player-' + position)
      .children('img')
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

  Game.prototype.setActiveFigure = function(figure) {
    this.figure = figure;
    return this;
  }

  Game.prototype.getActiveFigure = function() {
    return this.figure;
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

  Game.prototype.stateFigures = function(room) {
    var that = this;
    var room = this.getRoom();
    room.figures.map(function(figure) {
      var index = Object.keys(figure)[0];
      var value = figure[index];
      var target = that.__canvas.item(index);
      that.drawFigure(that.getFigureData(target), value)
        .setSquareState(target, index, value);
    });
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

  Game.prototype.play = function(target, evented, callback) {
    var figure = this.getActiveFigure();
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
        square.set('evented', evented);
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
        roomid: this.getRoomId(),
        figure: figure,
        figures: {},
        over: game.over
      }
      data['figures'][index] = figure;
      callback.call(this, data);
    }

    this.setActiveFigure(~~!figure);

    return this;
  }

  Game.prototype.ready = function() {
    var room = this.getRoom();
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

  Game.prototype.activateSquares = function() {
    this.__canvas.forEachObject(function(object, index) {
      object.set('evented', true);
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

  Game.prototype.manipulate = function() {
    var that = this;
    this.__canvas.on({
      'mouse:down': function(e) {
        if ($.type(e.target) !== 'undefined') {
          var target = e.target;
          var data = that.getFigureData(target);
          that
            .drawFigure(data, that.getActiveFigure())
            .play(target, false, function(data) {
              that.socket.emit('play', data);
            });
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

  Game.prototype._waiting = function(socket, that) {
    return function(position) {
      $('.id-player-' + position)
      .children('img')
        .prop('src', '../images/loading.gif')
      .end()
      .addClass('wait')
      .addClass('show')
    }
  }

  Game.prototype._ready = function(socket, that) {
    return function() {
      that.activateSquares();
    }
  }

  Game.prototype._play = function(socket, that) {
    return function(data) {
      var square = that.__canvas.item(Object.keys(data.figures));
      that
        .drawFigure(that.getFigureData(square), that.getActiveFigure())
        .play(square, true);
    } 
  }

  Game.prototype._switch = function(socket, that) {
    return function(players) {
      that.setPlayers(players)
        .setActivePlayer();
    }
  }

  Game.prototype.execute = function(event) {
    var socket = this.socket;
    var map = {
      init: '_init',
      waiting: '_waiting',
      players: '_players',
      activate: '_ready',
      ready: '_ready',
      play: '_play',
      switch: '_switch'
    };
    var callback = map[event] && $.isFunction(this[map[event]]) ? this[map[event]] : (function() {
      throw new Error(event + ' ' + 'function not found')
    })();
    socket.on(event, callback(socket, this));
    return this;
  }

  Game.prototype.getRoomId = function() {
    var path = window.location.pathname;
    if (path) {
      return path.split('/')[2];
    }
  }

  Game.prototype.getPlayerId = function() {
    var data = Cookies.getItem('player');
    if (data) {
      return data.split(':')[1].replace(/['"]+/g, '');
    }
  }

  Game.prototype.run = function() {
    this
      .init()
      .execute('init')
      .execute('waiting')
      .execute('players')
      .execute('ready')
      .execute('play')
      .execute('switch');

    this.__canvas.renderAll();
  }

  $(function() {
    new Game(io(), 'tictactoe').run();
  });

})(jQuery);