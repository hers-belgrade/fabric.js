(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Svg) {
    return;
  }

  fabric.Svg = fabric.util.createClass(fabric.Group,{
    
    type: 'svg',

    initialize: function(objects, options){
      this.callSuper('initialize',objects,options);
    },

    activate: function(){
    },

    deactivate: function(){
    }
  });

  fabric.Svg.fromObject = function(object){
    return new fabric.Svg(fabric.util.enlivenObjects(object.objects),object);
  };

})(typeof exports !== 'undefined' ? exports : this);

