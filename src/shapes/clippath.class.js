(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.ClipPath){
    return;
  }

  fabric.ClipPath = fabric.util.createClass(fabric.Group, {
    initialize: function(objects,options){
      this.callSuper('initialize',objects,options);
    },
    transform: function(ctx){
      this.callSuper('transform',ctx);
      ctx.suppressPaint=true;
    },
    untransform: function(ctx){
      this.callSuper('untransform',ctx);
      delete ctx.suppressPaint;
    },
    finalizeRender: function(ctx){
      ctx.clip();
    },
  });


})(typeof exports !== 'undefined' ? exports : this);
