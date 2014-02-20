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
			els[i] = g[id+'_'+i];
		}

		function traverse (cb) {
			for (var i in els) {
				('function' === typeof(cb)) && els[i]  && cb(els[i]);
			}
		}


		var or_show = svgelem.show;
		var or_hide = svgelem.hide;

		svgelem.hide = function () {
			var args = arguments;
			traverse(function (el) {
				el.hide.apply(el, args);
			});
			return or_hide.apply(svgelem, args);
		}

		svgelem.show = function () {
			var args = arguments;
			traverse(function (el) {
				el.show.apply(el, args);
			});
			return or_show.apply(svgelem, args);
		}


		svgelem.setText = function (t) {
			for (var i in els) {
				els[i] && els[i].set('text', t);
			}
			this.set('text', t);
		}
		return svgelem;
	}
})(typeof exports !== 'undefined' ? exports : this);
