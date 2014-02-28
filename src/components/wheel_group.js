(function (global) {
  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

	fabric.Wheel = function (w, config) {
		if (w.wheel_created) return w;
		fabric.CanvasUser(w);
		w.wheel_created = true;
		var or = w.getUsedObj();
		var dd = or[config.dims];
		w.setUsedObj(config.wheel);
		var clone = w.getUsedObj();
		clone.dropCache();

		clone.on('raster:created', function (raster) {
			w.fire('wheel:created', raster);
		});
		clone.on('raster:changed', function (raster) {
			w.fire('wheel:changed', raster);
		});
		clone.rasterize({area:{width: dd.width, height:dd.height}, repeat: {y:true}});
		clone.invokeOnCanvas('renderAll');

		w.do_test = function () {
			var y = 0;
			var t = w.getUsedObj();
			ri = t.getRasteredImage();

			if (!ri) return;
			console.log('!!!!', ri._cntr);

			var interval = null;
			//ri.setRasterArea({y:600});
			interval = setInterval (function () {
				ri.setRasterArea({y:y});
				y+=20;
			}, 200);
		}

		w.setWheelValue = function(v, local_config, done_cb) {
			var t = w.getUsedObj();
			local_config = extend(local_config, config);
			var objs = t._objects;
			var ztm = objs[0]._currentLocalTransform;
			var ttm = objs[v]._currentLocalTransform;
			var off = {x : ttm[4] - ztm[4], y : ttm[5] - ztm[5]};
			///MORE WORK TO BE DONE ...
			ri = t.getRasteredImage();
			var m = ri.getRasterModulo();
			var animation_config = {};

			///TODO: make some math instead of while down there ...
			var inc = null,
					target = null,
					rc = local_config.round_count || 3;

			if (local_config.type == 'horizontal') {
				inc = rc*m.width;
				target = off.x + inc;
				ri.area.x+=inc;
				while (ri.area.x - off.x < target) {
					ri.area.x += m.width;
				}
				animation_config = {'area.y': off.y};
			}else{
				inc = rc*m.height;
				target = off.y + inc;
				ri.area.y+=inc;
				while (ri.area.y - off.y < target) {
					ri.area.y += m.height;
				}
				animation_config = {'area.y': off.y};
			}

			(function (_ri) {
				var do_go = function (){
					_ri.animate (
						animation_config,
						{
							easing: fabric.util.ease.easeOutElastic,
							//easing: fabric.util.ease.Linear,
							duration:local_config.duration, 
							onComplete: function () { 
								this.sanitize();
								('function' === typeof(done_cb)) && done_cb();
								w.fire('wheel:done');
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
		};

		return w;
	}

	fabric.WheelGroup = function (svgelem, config) {
		if (!svgelem) throw "No svgelem for component WheelGroup";
		if (svgelem.wheels_created) return;
		svgelem.wheels_created = true;

		config = extend ({
			round_count: 20,
			duration: 2000,
			type: 'vertical',
			max_start_delay : 200
		}, config);


		var prefix = config.prefix || svgelem.id;
		if (prefix.length) prefix+= '_';
		var wheels = [];
		var dimensions = [];

		var matrix_mult = fabric.util.multiplyTransformMatrices;
		var matrix_inv = fabric.util.matrixInverse;

		var wheelsReady = false;

		/// do not allow dynamic wheel groups for now in terms of a wheel count ....
		var ready = [];
		for (var i = 0; true; i++) {
			var w = svgelem[prefix+'wheel_'+i];
			if (!w) break;
			wheels.push (w);
			ready.push (false);
		}

		svgelem.getWheelObjs = function () {return wheels;}
		svgelem.wheelsReady = function () { return wheelsReady; }

		for (var i = 0; i < wheels.length; i++) {
			(function (_i) {
				var w = wheels[_i];

				w.on('wheel:created', function () {
					ready[_i] = true;
					if (ready.filter(function(v) {return !v}).length) return;
					svgelem.wheelValue = [];
					for (var k = 0; k < wheels.length; k++) svgelem.wheelValue.push (0);
					wheelsReady = true;
					setTimeout(function () {
						svgelem.fire('wheels:ready', wheels);
					}, 1);
				});

				w.on('wheel:changed', function () {
				});

				fabric.Wheel(wheels[_i], {
					dims: config.dims,
					wheel: config.wheel
				});
				
			})(i);
		}

		svgelem.wheelCount = function () {return wheels.length;};
		svgelem.wheelAt = function (index) {return (wheels[index]) ? wheels[index].getUsedObj() : undefined;};

		svgelem.do_test = function () {
			wheels[0].do_test();
		}

		svgelem.setWheelsValue = function (val, local_config) {
			///MUST BE AN ARRAY OR A STRING
			if (typeof(val) !== 'object') throw "Invalid value for wheel";
			if ('string' === typeof(val)) val = val.split('');
			if (!(val instanceof Array)) throw "Invalid value for wheel"; 
			///todo: animate set finally ....
			local_config = extend(local_config || {}, config);

			if (!wheelsReady) return;
			val = val.slice();
			if (JSON.stringify(this.wheelValue) === JSON.stringify(val)) return;

			var done = wheels.map(function(){return false;});

			var self = this;
			function check_all_done () {
				if (done.filter (function (v) {return !v}).length == 0) {
				 	self.fire('wheels:done', val);
				}
			}

      console.log('OLD', this.wheelsValue, 'VS NEW', val);
			this.fire('wheels:started');
      if ('undefined' !== typeof(this.wheelsValue) && this.wheelsValue.join('') === val.join('')) {
        this.fire('wheels:done', val);
        return;
      }
			this.wheelsValue = val;

			for (var i = 0; i < wheels.length; i++) {
				(function (w, dims, index) {
					w.setWheelValue(val[index], local_config, function () {
						//console.log('DONEEEE');
						done[index] = true;
						check_all_done();
					});
				})(wheels[i], dimensions[i], i);
			}
		}
	}

})(typeof exports !== 'undefined' ? exports : this);

