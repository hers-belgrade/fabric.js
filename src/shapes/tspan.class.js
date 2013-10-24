(function(global) {

  if (fabric.Tspan) {
    fabric.warn('fabric.Text is already defined');
    return;
  }

  fabric.Tspan = fabric.util.createClass(fabric.Text , /** @lends fabric.Text.prototype */ {
  });

  fabric.Tspan.fromElement = function(element, options){
    return new fabric.Text.fromElement(element,options);
  };

})(typeof exports !== 'undefined' ? exports : this);

