(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Clickable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var downcb=config.downcb,clickcb=config.clickcb,ctx=config.ctx||svgelem;
    svgelem.on('mouse:down',function(){downcb.call(ctx,svgelem);});
    svgelem.on('mouse:up',function(){clickcb.call(ctx,svgelem);});
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

