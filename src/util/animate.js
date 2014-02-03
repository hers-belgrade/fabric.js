(function() {

   /**
    * Changes value from one to another within certain period of time, invoking callbacks as value is being changed.
    * @memberOf fabric.util
    * @param {Object} [options] Animation options
    * @param {Function} [options.onChange] Callback; invoked on every value change
    * @param {Function} [options.onComplete] Callback; invoked when value change is completed
    * @param {Number} [options.startValue=0] Starting value
    * @param {Number} [options.endValue=100] Ending value
    * @param {Number} [options.byValue=100] Value to modify the property by
    * @param {Function} [options.easing] Easing function
    * @param {Number} [options.duration=500] Duration of change
    */
  function animate(options) {
    options || (options = { });

    var start = +new Date(),
      duration = options.duration || 500,
      finish = start + duration, time,
      onChange = options.onChange || function() { },
      abort = options.abort || function() { return false; },
      easing = options.easing || function(t, b, c, d) {return -c * Math.cos(t/d * (Math.PI/2)) + c + b;},
      startValue = parseFloat('startValue' in options ? options.startValue : 0),
      endValue = parseFloat('endValue' in options ? options.endValue : 100),
      byValue = options.byValue || endValue - startValue;

    options.onStart && options.onStart();

    return (fxoff) ? undefined : function tick() {
			if (fxoff) {
				onChange(endValue);
				options.onComplete && options.onComplete();
				return;
			}
      time = +new Date();
      var currentTime = time > finish ? duration : (time - start);
      if (abort()) {
        return true;
      }
      onChange(easing(currentTime, startValue, byValue, duration));
      if (time > finish) {
        options.onComplete && options.onComplete();
        return true;
      }
    };
  }

  var _requestAnimFrame = fabric.window.requestAnimationFrame       ||
                          fabric.window.webkitRequestAnimationFrame ||
                          fabric.window.mozRequestAnimationFrame    ||
                          fabric.window.oRequestAnimationFrame      ||
                          fabric.window.msRequestAnimationFrame     ||
                          function(callback) {
                            fabric.window.setTimeout(callback, 1000 / 60);
                          };
  /**
    * requestAnimationFrame polyfill based on http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    * @memberOf fabric.util
    * @param {Function} callback Callback to invoke
    * @param {DOMElement} element optional Element to associate with animation
    */
  var requestAnimFrame = function() {
    return _requestAnimFrame.apply(fabric.window, arguments);
  };

	var fxoff = false;
	var fxOff = function (val) {
		if (arguments.length) {
			fxoff = val && true;
		}
		return fxoff;
	}

  fabric.util.animate = animate;
  fabric.util.requestAnimFrame = requestAnimFrame;
	fabric.util.fxOff = fxOff;

})();
