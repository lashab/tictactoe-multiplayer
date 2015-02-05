(function() {
 'use strict'; 
 var canvas = new fabric.Canvas('tictactoe');

 canvas.setWidth(window.innerWidth);
 canvas.setHeight(window.innerHeight);

 var x = canvas.getWidth() / 3;
 var y = canvas.getHeight() / 3;
 x = x - (x - y);

 var makeLine = function(coords) {
  return new fabric.Line(coords, {
    stroke: 'black',
    strokeWidth: 1,
    selectable: false,
    evented: false
  }); 
}

var makeGroup = function(groups) {
  return new fabric.Group(groups, {
    selectable: false,
    hoverCursor: 'pointer',
    hasBorders: false,
    hasControls: false,
    lockMovementX: true,
    lockMovementY: true
  });
}

canvas.add(
  makeGroup([makeLine([x, 0, x, y]), makeLine([0, y, x, y])]),
  makeGroup([makeLine([x * 2, 0, x * 2, y]), makeLine([x * 2, y, x, y])]),
  makeGroup([makeLine([x * 3, 0, x * 3, y]), makeLine([x * 3, y, x * 2, y])]),
  makeGroup([makeLine([x, y, x, y * 2]), makeLine([0, y * 2, x, y * 2])]),
  makeGroup([makeLine([x * 2, y, x * 2, y * 2]), makeLine([x, y * 2, x * 2, y * 2])]),
  makeGroup([makeLine([x * 3, y, x * 3, y * 2]), makeLine([x * 3, y * 2, x * 2, y * 2])]),
  makeGroup([makeLine([x, y * 2, x, y * 3]), makeLine([0, y * 3, x, y * 3])]),
  makeGroup([makeLine([x * 2, y * 2, x * 2, y * 3]), makeLine([x, y * 3, x * 2, y * 3])]),
  makeGroup([makeLine([x * 3, y * 2, x * 3, y * 3]), makeLine([x * 2, y * 3, x * 3, y * 3])])
  );

  // canvas.forEachObject(function(o) {
  //   o.on('mouse:down', function(e) {
  //     alert();
  //   })
  // });

canvas.on({
  'mouse:down': function(e) {
    if (e.target) {
      
      var box = e.target;
      , left = box.getLeft();
      , top = box.getTop();
      , wLeft = box.getLeft() + box.getWidth();
      , hTop = box.getTop() + box.getHeight();

      box.set('evented', false);
      canvas.add(makeLine([left + 50, top + 50, wLeft - 50, hTop - 50]), makeLine([wLeft - 50, top + 50, left + 50, hTop - 50]));
    }
  }
});

canvas.renderAll();
})()