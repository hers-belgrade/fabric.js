(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
		extend = fabric.util.object.extend;

	fabric.TextWithShadow = function (svgelem) {

		var id = svgelem.id;
		var shadow_id = svgelem.id+'_shadow';
		var g = svgelem.group;

		var shadow = null;
		if (g && shadow_id) shadow = g[shadow_id];

		svgelem.setShadowedText = function (text) {
			svgelem.set('text', text);
			shadow && shadow.set('text', text);
			return svgelem;
		}
		return svgelem;
	}


})(typeof exports !== 'undefined' ? exports : this);
