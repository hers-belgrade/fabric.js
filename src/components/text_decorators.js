(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
		extend = fabric.util.object.extend;


	////TODO: pokusaj da napravis ovo tako da podrzava i shadow i outline ...
	
	fabric.TextWithDecorations = function (svgelem) {
		var id = svgelem.id;
		var els = {
			shadow:null,
			outline:null
		}
		var g = svgelem.group;
		if (!g) return svgelem;

		for (var i in els) {
			els[i] = g[id+'_'+els]
		}

		svgelem.setText = function (t) {
			for (var i in els) {
				els[i].set('text', t);
			}
			this.set('text', t);
		}
		return svgelem;
	}
})(typeof exports !== 'undefined' ? exports : this);
