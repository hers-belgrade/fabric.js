(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.TextButton = function(svgelem,config){
    var rainvoker = config.renderAllInvoker||svgelem;
    var ra = function(){rainvoker.invokeOnCanvas('renderAll');};
    var originalparams={fill:svgelem.fill,stroke:svgelem.stroke};
    var reset = function(){this.set(originalparams);ra()};
    var hoverparams = config.hovered;
    var sethover = function(){this.set(hoverparams);ra()};
    fabric.Hoverable(svgelem,{overcb:sethover,outcb:reset});
    var pressedparams = config.pressed;
    var setdown = function(){this.set(pressedparams);ra()};
    var clickcb = function(){reset.call(this);config.clickcb.call(this);};
    fabric.Clickable(svgelem,{downcb:setdown,clickcb:clickcb});
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);


