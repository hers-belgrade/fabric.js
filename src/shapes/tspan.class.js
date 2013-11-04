(function(global) {

  if (fabric.Tspan) {
    fabric.warn('fabric.Text is already defined');
    return;
  }

  fabric.Tspan = fabric.util.createClass(fabric.Text , /** @lends fabric.Text.prototype */ {
		toObject: function (propertiesToInclude) {
			return this.callSuper('toObject', propertiesToInclude);
		}
  });

  fabric.Tspan.fromElement = function(element, options){
    if (!element) {
      return null;
    }

    var parsedAttributes = fabric.parseAttributes(element, fabric.Text.ATTRIBUTE_NAMES);
		//tweak textAlign
		switch(parsedAttributes.textAlign){
			case 'end':
				parsedAttributes.textAlign='right';
				break;
		}
    options = fabric.util.object.extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes);
    return new fabric.Tspan(element.textContent, options);
  };


})(typeof exports !== 'undefined' ? exports : this);

