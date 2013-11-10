(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.MouseAware = function(svgelem,overcb,outcb){
    if(!svgelem.wantsMouse){
      svgelem.wantsMouse=true;
      svgelem.invokeOnCanvas('addToMouseListeners',svgelem);
    }
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

