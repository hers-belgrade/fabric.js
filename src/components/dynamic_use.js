(function(global) {
  fabric.DynamicUse = function (svgelem) {
    svgelem._prepareUsedObj = function (obj) {
      return obj.clone();
    }

    var old = svgelem.getUsedObj();
    svgelem.setUsedObj(svgelem.getUsedObj());
    svgelem.invokeOnCanvas('removeFromMouseListeners', old);

    return svgelem;
  }
})(typeof exports !== 'undefined' ? exports : this);
