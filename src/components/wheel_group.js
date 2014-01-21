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
					wheelReady = true;
					svgelem.fire('wheels:ready', wheels);
					if (svgelem.wheelValue) {
						svgelem.setWheelValue(svgelem.wheelValue);
					}else{
						svgelem.wheelValue = config.initValue;
					}
				});
				clone.on('raster:changed', function (raster) {
				});
				clone.rasterize({area:{width: dd.width, height:dd.height}, repeat: {y:true}});
				clone.invokeOnCanvas('renderAll');
			})(i);
		}
		svgelem.wheelCount = function () {return wheels.length;};
		svgelem.wheelAt = function (index) {return (wheels[index]) ? wheels[index].getUsedObj() : undefined;};

		svgelem.setWheelValue = function (val, local_config) {
			///todo: animate set finally ....
			local_config = extend(local_config, config);
			var v = val+'';
			var sp = v.split('');
			this.wheelValue = val;
			if (!wheelReady) return;

			var done =wheels.map(function(){return false;});

			var self = this;
			function check_all_done () {
				(done.filter (function (v) {return !v}).length == 0) && (self.fire('wheels:done', val));
			}

			this.fire('wheels:started');
			for (var i = 0; i < wheels.length; i++) {
				(function (w, dims, index) {
					var objs = w._objects;
					var ztm = objs[0]._localTransformationMatrix;
					var ttm = objs[sp[index]]._localTransformationMatrix;
					var off = {x : ttm[4] - ztm[4], y : ttm[5] - ztm[5]};
					///MORE WORK TO BE DONE ...
					ri = w.getRasteredImage();
					var m = ri.getRasterModulo();
					var animation_config = {};
					if (local_config.type == 'horizontal') {
						animation_config = {'area.x': (local_config.round_count || 5)*m.width+off.x};
					}else{
						animation_config = {'area.y': (local_config.round_count || 5)*m.height+off.y};
					}

					(function (_ri) {
						var do_go = function (){
							_ri.animate (
								animation_config,
								{
									easing: fabric.util.ease.easeAstableFast,
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
		}
	}

})(typeof exports !== 'undefined' ? exports : this);
