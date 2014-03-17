(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Svg) {
    return;
  }

  ///TODO: activate/deactivate should prepare StaticLayer and 

  fabric.Svg = fabric.util.createClass(fabric.Group,{
    type: 'svg',
    initialize: function(objects, options){
      options = options || {};
      options._svg_el = this;
      this.callSuper('initialize',objects,options);
      this._image_cache = {};
      this._static_layer = options.static_layer;
    },
    loadImage: function () {
    },
    dropImageCache: function () {
    },
    activate: function(){
      console.log('will activate svg', this.id);
      this._static_layer && this._static_layer.activate();
    },
    deactivate: function(){
      console.log('will deactivate svg', this.id);
      this._static_layer && this._static_layer.deactivate();
    },
  });

  fabric.Svg.fromObject = function(object){
    return new fabric.Svg(fabric.util.enlivenObjects(object.objects),object);
  };

})(typeof exports !== 'undefined' ? exports : this);

