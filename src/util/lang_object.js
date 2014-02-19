(function(){

  /**
   * Copies all enumerable properties of one object to another
   * @memberOf fabric.util.object
   * @param {Object} destination Where to copy to
   * @param {Object} source Where to copy from
   * @return {Object}
   */
	function extend(destination) {

		function step(d, s) {
			// JScript DontEnum bug is not taken care of
			d = d || {};
			for (var property in s) {
				d[property] = s[property];
			}
			return d;
		}

		var sources = [];
		try {
		sources = arguments.length > 0 ? Array.prototype.slice.call(arguments, 1) : [];
		}catch (e) {
			console.log('FAIL');
		}
		for (var i in sources) {
			sources[i] && (destination = step(destination, sources[i]));
		}	
		return destination;
	}

  /**
   * Creates an empty object and copies all enumerable properties of another object to it
   * @memberOf fabric.util.object
   * @param {Object} object Object to clone
   * @return {Object}
   */
  function clone(object) {
    return extend({ }, object);
  }

  /** @namespace fabric.util.object */
  fabric.util.object = {
    extend: extend,
    clone: clone
  };

})();
