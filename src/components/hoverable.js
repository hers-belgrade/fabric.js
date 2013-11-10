(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Hoverable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var overcb=config.overcb,outcb=config.outcb,ctx=config.ctx||svgelem;
    svgelem.on('object:over',function(){overcb.call(ctx,svgelem);});
    svgelem.on('object:out',function(){outcb.call(ctx,svgelem);});
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);
