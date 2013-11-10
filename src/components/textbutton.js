(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.TextButton = function(svgelem,config){
    var of=svgelem.fill,os=svgelem.stroke;
    var rainvoker = config.renderAllInvoker||svgelem;
    var ra = function(){rainvoker.invokeOnCanvas('renderAll');};
    fabric.Hoverable(svgelem,{
    });
    fabric.Clickable(svgelem,{
    });
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);


