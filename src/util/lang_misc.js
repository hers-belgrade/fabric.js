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

	fabric.util.isFunction = isFunction;
	fabric.util.isArray = isArray;
	fabric.util.isUndefined = isUndefined;
	fabric.util.isDefined = isDefined;

})(typeof exports !== 'undefined' ? exports : this);
