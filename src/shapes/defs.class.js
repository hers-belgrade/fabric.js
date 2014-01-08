(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Defs){
    return;
  }

  fabric.Defs = fabric.util.createClass(fabric.Group, {
    initialize: function(objects,options){
      this.callSuper('initialize',objects,options);
    },
    _render: function(ctx,topctx){
    }
  });


})(typeof exports !== 'undefined' ? exports : this);
