(function($) {
  'use strict';

  var Canvas = function(socket, canvas) {
    this.__canvas = new fabric.Canvas(canvas);
    this.__canvas.setWidth(window.innerWidth - (window.innerWidth - window.innerHeight));
    this.__canvas.setHeight(window.innerHeight);
    this.x = this.__canvas.getWidth() / 3;
    this.y = this.__canvas.getHeight() / 3;
    this.socket = socket;
  }

  Canvas.prototype.initialize = function() {
    this.__canvas.forEachObject(function(object, index) {
      if (object.get('type') === 'group') {
        object.set({
          cube: {
            key: index,
            value: NaN 
          },
          evented: true,
        });
      }
    });
    return this;
  }

  Canvas.prototype.drawLine = function(coords) {
    return new fabric.Line(coords, {
      stroke: 'black',
      strokeWidth: 1,
      selectable: false,
      evented: false
    });
  }

  Canvas.prototype.drawCircle = function(top, left, radius) {
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

  Canvas.prototype.drawGroup = function(groups) {
    return new fabric.Group(groups, {
      hasBorders: false,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
      evented: false
    });
  }

  Canvas.prototype.drawGame = function() {
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

  Canvas.prototype.getData = function(object) {
    return {
      top: object.getTop(),
      left: object.getLeft(),
      width: object.getWidth(),
      height: object.getHeight()
    }
  }

  Canvas.prototype.drawFigure = function(which) {

  }

  Canvas.prototype.play = function(e, options) {
    if ($.type(e.target) !== 'undefined') {
      var target = e.target.toggle('evented');
      console.log(this.getData(that_cube));
      // console.log(that_cube.getBoundingRect())
    }
  }

  Canvas.prototype.process = function() {
    var that = this;
    this.__canvas.on({
      'mouse:down': function(e) {
        that.play(e, {
          evented: false
        });
      }
    });
  }

  var Game = function(socket, canvas) {
    Canvas.call(this, socket, canvas);
  };

  Game.prototype = Object.create(Canvas.prototype);

  Game.prototype.init = function() {
    if (/^\/room\/\d+$/.test(window.location.pathname)) {
      this.socket.emit('init', {
        id: this.getRoomId()
      });
    }
    this
      .drawGame()
      .initialize()
      .process();
    return this;
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
