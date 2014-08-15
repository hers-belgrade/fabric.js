(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Hoverable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var ctx=config.ctx||svgelem;
    function trigerrer(ctx,_cb){
      var cb = _cb;
      return cb ? function(evnt){
        this.isVisible() && this.enabled && cb.apply(ctx,arguments);
      } : function(){};
    }
    svgelem.on('object:over',trigerrer(ctx,config.overcb));
    svgelem.on('object:out',trigerrer(ctx,config.outcb));
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);
