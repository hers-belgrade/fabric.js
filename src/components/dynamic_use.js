(function(global) {
  fabric.DynamicUse = function (svgelem) {
    svgelem._prepareUsedObj = function (obj) {
      return obj.clone();
    }
    svgelem.setUsedObj(svgelem.getUsedObj());
    return svgelem;
  }
})(typeof exports !== 'undefined' ? exports : this);
