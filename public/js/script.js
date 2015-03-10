(function($) {
  'use strict';

  var Game = function(socket, canvas) {
    this.__canvas = new fabric.Canvas(canvas);
    this.__canvas.setWidth(window.innerWidth - (window.innerWidth - window.innerHeight));
    this.__canvas.setHeight(window.innerHeight);
    this.x = this.__canvas.getWidth() / 3;
    this.y = this.__canvas.getHeight() / 3;
    this.socket = socket;
    this.which = true;
  }

  Game.prototype.init = function() {
    if (window.location.pathname && /^\/room\/\d+$/.test(window.location.pathname)) {
      this.socket.emit('init', {
        id: this.getRoomId()
      });
    }
    this
      .drawGame()
      .ready()
      .process();
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
    this.__canvas.add(
      this.drawGroup([
        this.drawLine([this.x, 0, this.x, this.y]),
        this.drawLine([0, this.y, this.x, this.y])
      ]),
      this.drawGroup([
        this.drawLine([this.x * 2, 0, this.x * 2, this.y]),
        this.drawLine([this.x * 2, this.y, this.x, this.y])
      ]),
      this.drawGroup([
        this.drawLine([this.x * 3, 0, this.x * 3, this.y]),
        this.drawLine([this.x * 3, this.y, this.x * 2, this.y])
      ]),
      this.drawGroup([
        this.drawLine([this.x, this.y, this.x, this.y * 2]),
        this.drawLine([0, this.y * 2, this.x, this.y * 2])
      ]),
      this.drawGroup([
        this.drawLine([this.x * 2, this.y, this.x * 2, this.y * 2]),
        this.drawLine([this.x, this.y * 2, this.x * 2, this.y * 2])
      ]),
      this.drawGroup([
        this.drawLine([this.x * 3, this.y, this.x * 3, this.y * 2]),
        this.drawLine([this.x * 3, this.y * 2, this.x * 2, this.y * 2])
      ]),
      this.drawGroup([
        this.drawLine([this.x, this.y * 2, this.x, this.y * 3]),
        this.drawLine([0, this.y * 3, this.x, this.y * 3])
      ]),
      this.drawGroup([
        this.drawLine([this.x * 2, this.y * 2, this.x * 2, this.y * 3]),
        this.drawLine([this.x, this.y * 3, this.x * 2, this.y * 3])
      ]),
      this.drawGroup([this.drawLine([
        this.x * 3, this.y * 2, this.x * 3, this.y * 3]),
        this.drawLine([this.x * 2, this.y * 3, this.x * 3, this.y * 3])
      ])
    );
    return this;
  }

  Game.prototype.drawFigure = function(data) {
    if (this.which) {
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
      this.which = false;
    }
    else {
      var centerX = data.center.x;
      var centerY = data.center.y;
      var radius = data.radius;
      var circle = this.drawCircle(centerY, centerX, radius);
      this.__canvas.add(this.figureFadeIn(circle, 0.5, 1, 200));
      this.which = true;
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

  Game.prototype.over = function(target) {
    var j = this.count;
    var values = [];
    var game = {};
    var index = target.get('square').index;
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
    target.set('square', {
      index: index,
      value: ~~this.which
    });

    while (j !== -1) {
      var square = this.__canvas.item(j);
      var value = square.get('square').value;
      // if (isNaN(value)) {
      //   square.set('evented', true);
      // }
      if (isNaN(value)) {
        values.push(value);
      }
      j--;
    }

    if (!values.length) {
      game.over = true;
      game.isWinner = false;
    }

    for (var i in combinations) {
      var combination = combinations[i];
      var a = this.__canvas.item(combination[0]).get('square').value;
      var b = this.__canvas.item(combination[1]).get('square').value;
      var c = this.__canvas.item(combination[2]).get('square').value;
      if ((!isNaN(a) && !isNaN(b) && !isNaN(c)) && (a === b && b === c)) {
        game = {
          over: true,
          isWinner: true,
          won: combination
        } 
      }
    }

    if (game.over && game.isWinner) {
      alert('someone won the game');
    }
    else if (game.over && !game.isWinner) {
      this.restart();
    }

  }

  Game.prototype.ready = function() {
    this.count = this.countCanvasObjects();
    this.__canvas.forEachObject(function(object, index) {
      if (object.get('type') === 'group') {
        object.set({
          square: {
            index: index,
            value: NaN 
          },
          evented: true,
        });
      }
    });
    return this;
  }

  Game.prototype.play = function(e, options) {
    if ($.type(e.target) !== 'undefined') {
      var target = e.target.toggle('evented');
      var data = this.getObjectsData(target);
      this.drawFigure(data).over(target);
    }
  }

  Game.prototype.restart = function() {
    var count = this.countCanvasObjects();
    var that = this;
    setTimeout(function() {
      while (count !== that.count) {
        that.__canvas.fxRemove(that.__canvas.item(count));
        count--;
      }
      that.ready();
    }, 1000);
  }

  Game.prototype.process = function() {
    var that = this;
    this.__canvas.on({
      'mouse:down': function(e) {
        that.play(e, {
          evented: false
        });
      }
    });
  }

  Game.prototype.getObjectsData = function(object) {
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

  Game.prototype._init = function(socket, that) {
    return function(players) {
      players.map(function(player, position) {
        $('.id-seat-' + position).children('img')
          .prop('src', '../images/default.png')
          .next()
            .children()
            .text(player)
            .end()
          .end()
        .end()
        .fadeIn()
        .show()
      });
    }
  }

  Game.prototype.join = function() {
    var form = $('.id-join').length ? $('.id-join') : null;
    if (form) {
      var that = this;
      form.submit(function(e) {
        e.preventDefault();
        var name = $(this).find('input:text').val().replace(/(<([^>]+)>)/ig, null);
        that.socket.emit('join', {
          name: name
        });
      });
    }
    return this;
  }

  Game.prototype._join = function(socket) {
    return function(room) {
      window.location.replace(room.redirect);
    }
  }

  Game.prototype._waiting = function(socket) {
    return function(player) {
      $('.layer').addClass('fade').addClass('in');
      $('.id-seat-' + player).children('img')
        .prop('src', '../images/loading.gif')
      .end()
      .fadeIn()
      .show();
    }
  }

  Game.prototype.execute = function(event) {
    var socket = this.socket;
    var map = {
      join: '_join',
      init: '_init',
      waiting: '_waiting',
    };
    var callback = map[event] && $.isFunction(this[map[event]]) 
      ? this[map[event]] 
        : (function () { 
          throw new Error(event + ' ' + 'function not found')
        })();
    socket.on(event, callback(socket, this));
    return this;
  }

  Game.prototype.getRoomId = function() {
    var path = window.location.pathname;
    return path.split('/')[2];
  }

  Game.prototype.run = function() {
    this
      .join()
      .init()
      .execute('join')
      .execute('init')
      .execute('waiting');

    this.__canvas.renderAll();
  }

  $(function() {
    new Game(io(), 'tictactoe-test').run();
  });

})(jQuery);
