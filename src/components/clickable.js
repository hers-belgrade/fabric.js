(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Clickable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var downcb=config.downcb,clickcb=config.clickcb,ctx=config.ctx||svgelem;
    svgelem.on('mouse:down',function(e){
      if(this.enabled){
        e.e.listeners.push(svgelem);
        downcb&&downcb.call(ctx,e);
      }});
    svgelem.on('mouse:up',function(e){this.enabled&&clickcb&&clickcb.call(ctx,e);});
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

