(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

	fabric.WheelGroup = function (svgelem, config) {
		if (!svgelem) throw "No svgelem for component WheelGroup";
		////za sad, bledo, samo staticki i adio mare ... za sad ... kasnije se uvodi i dinamika ...
		var prefix = config.prefix || '';
		if (prefix.length) prefix+= '_';
		var vs = ('function' === typeof(config.valueSetter)) ? config.valueSetter : function () {};


		///jako naivna implementacija, treba raditi malo na ovom ...

		svgelem.setWheelValue = function (val) {
			var v = val+'';
			var sp = v.split('');
			this.fire('wheels:started');
			for (var i = 0; i < sp.length; i++) {
				var w = this[prefix+'wheel_'+i];
				vs.call(w, sp[i]);
				w.invokeOnCanvas('renderAll');
			}
			//za sad, bez animacije, samo raspali ...
			this.fire('wheels:done', val);
		}
	}

})(typeof exports !== 'undefined' ? exports : this);
