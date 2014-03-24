(function(global) {
	"use strict";
	var extend  = fabric.util.object.extend;

	function isFunction (f) {
		return ('function' === typeof(f));
	}

	function isArray (a) {
		return ('object' === typeof(a) && a instanceof Array);
	}

	function isDefined (a) {
		return !isUndefined(a);
	}

	function isUndefined(a) {
		return (typeof(a) === 'undefined');
	}

	function reduce_dimension (dh, max) {
		///clip negative coordinates
		var corrections = {
			x : 0,
			y : 0
		}
		if (dh.x < 0) {
			corrections.x = -dh.x;
			dh.width += dh.x; //note, x is negative ...
			dh.x = 0;
		}

		if (dh.y < 0) {
			corrections.y = -dh.y;
			dh.height += dh.y;
			dh.y = 0;
		}

		if (dh.x + dh.width > max.width) {
			dh.width -= (dh.width + dh.x - max.width + 1);
		}
		if (dh.y + dh.height > max.height) {
			dh.height -= (dh.height + dh.y - max.height + 1);
		}
		return corrections;
	}

	function safeDrawImage (ctx, image, params) {
		if (!ctx) throw "No context";
		if (!image) throw "No image";
		params = params || {};
		var ms = fabric.masterScale;
    if (Math.floor(params.clip.width * ms) > image.width || Math.floor(params.clip.height * ms) > image.height) {
      //console.log('will cancel rendering ... ', params.clip, image.width, image.height);
      return;
    }

		for (var i in params.clip) params.clip[i]*=ms;
		var c = reduce_dimension (params.clip, {width: image.width, height: image.height}); 

		if (c.x) {
			params.target.x -= c.x;
			params.target.width -= c.x;
		}
		if (c.y) {
			params.target.y -= c.y;
			params.target.height -= c.y;
		}
		try {
      return ctx.drawImage (
        image,
        params.clip.x, params.clip.y,
        params.clip.width, params.clip.height,
        params.target.x, params.target.y,
        params.target.width, params.target.height
      );
		}catch (e) {
      console.log('.');
			//console.log('!!!!!!!!!!!!!!!!!', params, image.width, image.height, e);
		}
	}

	fabric.util.isFunction = isFunction;
	fabric.util.isArray = isArray;
	fabric.util.isUndefined = isUndefined;
	fabric.util.isDefined = isDefined;
	fabric.util.safeDrawImage = safeDrawImage;

})(typeof exports !== 'undefined' ? exports : this);
