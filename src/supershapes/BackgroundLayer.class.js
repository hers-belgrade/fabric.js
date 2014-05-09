(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = { });
  if (fabric.BackgroundLayer) {return;}
  ///TODO: nema potrebe da ovo postane klasa, funkcija je sasvim dovoljna?
  fabric.BackgroundLayer = fabric.util.createClass(fabric.Group, {
    initialize: function (objects, options) {
      this.callSuper('initialize', objects, options);
    },
    dispose: function (canvas, resourcename, done) {
      ///ok, first, you should load requiered images despite SVG is not activated yet ...

      var pl = [];
      this.forEachObjectRecursive (function (o) {
        (o._element) && pl.push (o._element);
      });
      var self = this;
      this.getSvgEl().loadAndForget(pl, function () {
        var offel = fabric.util.createCanvasElement();
        offel.width = fabric.masterSize.width;
        offel.height = fabric.masterSize.height;

        self.show();
        var context = offel.getContext('2d');
        context._currentTransform = [];
        var unit = [1,0,0,1,0,0];
        var svg = self.getSvgEl();

        for (var i in self._objects) {
          fabric.util.copyTransformMatrix(unit, context._currentTransform);
          var o = self._objects[i];
          o.show();
          o.render(context);
          canvas.reportBackgroundImage(o.id, offel.toDataURL(), resourcename);
          offel.width = offel.width;
        }
        fabric.util.isFunction(done) && done();
      });
    }
  });
})(typeof exports !== 'undefined' ? exports : this);
