(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

	fabric.WheelGroup = function (svgelem, config) {
		if (!svgelem) throw "No svgelem for component WheelGroup";

		config = extend ({
			round_count: 20,
			duration: 2000,
			type: 'vertical',
			max_start_delay : 200
		}, config);


		var prefix = config.prefix || svgelem.id;
		if (prefix.length) prefix+= '_';
		var vs = ('function' === typeof(config.valueSetter)) ? config.valueSetter : function () {};
		var wheels = [];
		var dimensions = [];

		var matrix_mult = fabric.util.multiplyTransformMatrices;
		var matrix_inv = fabric.util.matrixInverse;

		var wheelReady = false;

		/// do not allow dynamic wheel groups for now in terms of a wheel count ....
		var ready = [];
		for (var i = 0; true; i++) {
			var w = svgelem[prefix+'wheel_'+i];
			if (!w) break;
			wheels.push (w);
			ready.push (false);
		}

		svgelem.getWheelObjs = function () {return wheels;}
		svgelem.wheelsReady = function () { return wheelReady; }

		for (var i = 0; i < wheels.length; i++) {
			(function (_i) {
				var w = wheels[_i];
				var or = w.getUsedObj();
				var dd = or[config.dims];
				dimensions.push (dd);
				w.setUsedObj(config.wheel);
				var clone = w.getUsedObj();
				clone.dropCache();
				clone.on('raster:created', function (raster) {
					ready[_i] = true;
					if (ready.filter(function(v) {return !v}).length) return;
					svgelem.wheelValue = [];
					for (var k = 0; k < wheels.length; k++) svgelem.wheelValue.push (0);
					wheelReady = true;
					setTimeout(function () {
						svgelem.fire('wheels:ready', wheels);
						console.log(' I am ready ...', wheels.map(function (v) {return v._cntr;}));
					}, 1);
				});
				clone.on('raster:changed', function (raster) {
				});
				console.log('OVO SE DESI SAMO JEDNOM?');
				clone.rasterize({area:{width: dd.width, height:dd.height}, repeat: {y:true}});
				clone.invokeOnCanvas('renderAll');
			})(i);
		}

		svgelem.wheelCount = function () {return wheels.length;};
		svgelem.wheelAt = function (index) {return (wheels[index]) ? wheels[index].getUsedObj() : undefined;};

		var debug = false;
		svgelem.doDebug = function (bool) {
			debug = bool;
		}

		svgelem.setWheelValue = function (val, local_config) {
			///MUST BE AN ARRAY OR A STRING
			if (typeof(val) !== 'object') throw "Invalid value for wheel";
			if ('string' === typeof(val)) val = val.split('');
			if (!(val instanceof Array)) throw "Invalid value for wheel"; 
			///todo: animate set finally ....
			local_config = extend(local_config, config);

			if (!wheelReady) return;
			val = val.slice();
			this.wheelValue = val;

			var done = wheels.map(function(){return false;});

			var self = this;
			function check_all_done () {
				if (done.filter (function (v) {return !v}).length == 0) {
				 	self.fire('wheels:done', val);
				}
			}

			this.fire('wheels:started');
			for (var i = 0; i < wheels.length; i++) {
				(function (w, dims, index) {
					var objs = w._objects;
					var ztm = objs[0]._currentLocalTransform;
					var ttm = objs[val[index]]._currentLocalTransform;
					var off = {x : ttm[4] - ztm[4], y : ttm[5] - ztm[5]};
					///MORE WORK TO BE DONE ...
					ri = w.getRasteredImage();
					var m = ri.getRasterModulo();
					var animation_config = {};

					if (local_config.type == 'horizontal') {
						ri.area.x += (local_config.round_count || 3)*m.width;
						animation_config = {'area.x': off.x};
					}else{
						ri.area.y += (local_config.round_count || 3)*m.height;
						animation_config = {'area.y': off.y};
					}

					(function (_ri) {
						var do_go = function (){
							if (debug) {
							ri.area.y += (local_config.round_count || 3)*m.height;
							var y = _ri.area.y;
							setInterval(function () {
								_ri.area.y = y;
								_ri.invokeOnCanvas('renderAll');
								y-= 10;
							}, 200);
							return;
							}

							_ri.animate (
								animation_config,
								{
									easing: fabric.util.ease.easeOutElastic,
									duration:local_config.duration, 
									onComplete: function () { 
										this.sanitize();
										done[index] = true;
										check_all_done();
									}
								}
							);
						}

						if (!local_config.max_start_delay || fabric.util.fxOff())  {
							do_go();
						}else{
							var d = Math.floor(local_config.max_start_delay * Math.random());
							setTimeout(do_go,d);
						}
					})(ri);
				})(wheels[i].getUsedObj(), dimensions[i], i);
			}

							//debug = true;
		}
	}

})(typeof exports !== 'undefined' ? exports : this);

