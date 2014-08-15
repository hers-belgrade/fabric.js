(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
		extend = fabric.util.object.extend;


	////TODO: pokusaj da napravis ovo tako da podrzava i shadow i outline ...
	
	fabric.TextWithDecorations = function (svgelem) {
		if (svgelem._text_with_decorations) return svgelem;
		svgelem._text_with_decorations = true;

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
    var or_set = svgelem.set;

    svgelem.set = function () {
      var args = arguments;
      traverse(function (el) {
        el.set.apply(el, args);
      });
      or_set.apply(svgelem, arguments);
    }

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
      t = t+'';
			for (var i in els) {
				els[i] && els[i].set('text', t);
			}
			this.set('text', t);
		}
		return svgelem;
	}
})(typeof exports !== 'undefined' ? exports : this);
