(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.MouseAware = function(svgelem,overcb,outcb){
    if(!svgelem.wantsMouse){
      svgelem.wantsMouse=true;
      svgelem.invokeOnCanvas('addToMouseListeners',svgelem);
    }
    svgelem.enable = function(){
      this.enabled=true;
    };
    svgelem.disable = function(){
      this.enabled=false;
    }
    svgelem.enable();
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

