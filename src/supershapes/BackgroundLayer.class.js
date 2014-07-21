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
        //console.log('images loading done');
        var started = (new Date()).getTime();
        var offel = fabric.util.createCanvasElement();

        offel.width = self.getSvgEl().get('width');
        offel.height = self.getSvgEl().get('height');
        //console.log('offel created in', (new Date()).getTime() - started);

        self.show();
        var context = offel.getContext('2d');
        context._currentTransform = [];
        var unit = [1,0,0,1,0,0];
        var svg = self.getSvgEl();
        //console.log('render started in', (new Date()).getTime() - started);

        var to_report = {};

        for (var i in self._objects) {
          fabric.util.copyTransformMatrix(unit, context._currentTransform);
          var o = self._objects[i];
          o.show();
          o.render(context);
          //console.log('render',o.id,' done in', (new Date()).getTime() - started, 'resource name is',resourcename.length, resourcename);
          to_report[o.id] = offel.toDataURL();
          //canvas.reportBackgroundImage(o.id, offel.toDataURL(), resourcename);
          //console.log('report',o.id,' done in', (new Date()).getTime() - started);
          offel.width = offel.width;
        }
        canvas.reportBackgroundImages(to_report, resourcename);

        fabric.util.isFunction(done) && done();
      });
    }
  });
})(typeof exports !== 'undefined' ? exports : this);
