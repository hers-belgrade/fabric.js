(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
		Matrix = fabric.util.Matrix,
		matrix_mult = fabric.util.multiplyTransformMatrices,
		isDefined = fabric.util.isDefined,
		isFunction = fabric.util.isFunction;

	function WheelSelector (svgobj, config) {
		///TODO:
		// 1.allow non - centered pointer to a valid value .... 
		// 2.allow drag on this element ...
		// 3.remove need for additional, external transform matrices ....

    if (svgobj._ws_initialized) return svgobj;
    svgobj._ws_initialized = true;

		if (svgobj.type === 'use') {
      fabric.DynamicUse(svgobj);
		}

		var self = (svgobj.type === 'use') ? svgobj.getUsedObj() : svgobj;
		var id = self.id;

		var low = self[id+'_low'];
		var high= self[id+'_high'];
		var value = ('undefined' !== typeof(config.initialVal)) ? config.initialVal : undefined;

		var label = fabric.TextWithDecorations(self[id+'_low'][id+'_low_value']);
		updateValueText();

		var hd = fabric.ResourceButton(high[id+'_done_button'], {
			initialState: 'disabled',
				clickcb: gotoLow,
		});

		var hd_plus = fabric.ResourceButton (high[id+'_plus_button'], {
			initialState: 'disabled',
				clickcb : function () {
					doMove(local_value_set[(local_value_set.indexOf(value) + 1) % local_value_set.length]);
				},
				stoppropagation: true
		});

		var hd_minus = fabric.ResourceButton(high[id+'_minus_button'], {
			initialState: 'disabled',
				clickcb : function () {
					doMove(local_value_set[(local_value_set.indexOf(value) - 1 + local_value_set.length) % local_value_set.length]);
				},
				stoppropagation: true
		});

		var local_value_set = config.value_set || [];
		var ref_zero = undefined;

		var container = high[id+'_high_values'];
		container.transformMatrix = container.transformMatrix || Matrix.UnityMatrix();
    fabric.DynamicUse(container[getMeValIndexId(0)]);

		ref_zero = container[getMeValIndexId(0)].getUsedObj();
		ref_zero.transformMatrix = matrix_mult((ref_zero.transformMatrix || [1,0,0,1,0,0]), (container[getMeValIndexId(0)].transformMatrix || [1,0,0,1,0,0]));

		var container_correction = 0;
		var visible_elements = 0;

		var valid_raster = null;

		(function () {
			while (true) {
				o = container[getMeValIndexId(visible_elements)];
				if (!o) break;
				container.remove(o);
				visible_elements++;
			}
		})();

		var before = Math.floor(visible_elements/2);
		var after = Math.floor(visible_elements/2);
		function getMovementQuant() {
			return ref_zero[id+'_high_value_frame'].height;
		}
		
		function updateValueText (){
			label.setText('undefined' !== typeof(value) ? value : '');
		}

		function doChanged (old_value, silent) {
			updateValueText();
			if(silent) return;
			svgobj.fire('scroller:changed', {
				value:value,
				previous: old_value
			});
		}

		function doMove(nv, force) {
			if (!force && nv === value) return;

			var quants = before+local_value_set.indexOf(nv) - 1;
			var val = quants*getMovementQuant();
			var r = container._raster.content;
			r.setRasterArea({ y: val});

			var old_value = value;
			value = nv;
			updateButtons();
			!force && doChanged(old_value);
		}

		function updateButtons () {
			hd_minus.enable();
			hd_plus.enable();
			return;
			var mi = local_value_set.indexOf(value);

			if (mi === 0) hd_minus.disable();
			if (mi >= local_value_set.length - 1) hd_plus.disable();
		}

		function rasterValid(el) {
      var hts = visible_elements*getMovementQuant();
			el.setRasterArea({y:before*getMovementQuant(), height: hts});
      el.set('height', hts);
			if ('undefined' === typeof(value)) return;
			valid_raster = el;

			var to_delta = null;
			var movement_direction = undefined;

			function animate_to_val (val, done) {
				return animate_to_index(local_value_set.indexOf(val), done);
			}

			function animate_to_index (index, done) {
				var cb = function () {
					return (isFunction(done)) ? done.apply(this, arguments) : undefined;
				}
				if (index < 0) cb ({'err': 'invalid_index'});
        if (!valid_raster) return;
				valid_raster.animate({
					'area.y': (1+index) * getMovementQuant()
				}, {
					duration: 200,
					easing: fabric.util.ease.easeLinear,
					onComplete: cb
				});
			}
      
			fabric.Draggable(container, {
				target: container._raster.content,
				area: container.id+'_area',
				hotspot:container.id+'_area',

				onStarted: function (vals) {
					hd_minus.disable();
					hd_plus.disable();
					to_delta = vals;
				},

				onFinished: function (vals) {
					animate_to_index (Math.floor((vals.y + getMovementQuant()/2)/getMovementQuant()) - 1, updateButtons)
				},

				value_manipulator : function (action, axis, val) {
					if (action === 'set') {

						if (val < 0) return;
						if (val + 3*getMovementQuant() > this.getRasterModulo().height) return;
						if (val === this.area[axis]) return;

						var vs = {};
						vs[axis] = val;
						movement_direction = (this.area[axis] - val > 0) ? -1 : 1;
						var sb = local_value_set[Math.floor((val + getMovementQuant()/2)/getMovementQuant())];
						if (sb != value) {
							var old = value;
							value = sb;
							doChanged(old);
						}
						return this.setRasterArea(vs);
					}
					if (action === 'get') {
						return this.area[axis];
					}
				},
				direction: 'vertical',
				nature:'negative'
			});
      el.notify_on_geometry_ready (function () {
			  doMove(value, true);
      });
		}

		function invalidRaster () {
			hd_minus.disable();
			hd_plus.disable();

			container.transformMatrix = matrix_mult(container.transformMatrix || Matrix.UnityMatrix(), Matrix.TranslationMatrix(0, -container_correction));
			container_correction = 0;
			if (valid_raster) {
				console.log('should detach all possible mouse handlers');
			}
			valid_raster = null;
		}

		container.on('raster:created', rasterValid);
		container.on('raster:changed', rasterValid);

		function getMeValIndexId (index) {
			return id+'_high_values_'+index;
		}

		function createAnItem (index, value) {
			var o = container[getMeValIndexId(index)];
			if (!o) {
				o = ref_zero.clone();
				o.id = getMeValIndexId(index);
				o._scroller_index = index;
				if(index > 0) {
					var prev = container[getMeValIndexId(index-1)];
					///ZBUDZ ... ali neka ga ovako za sad ...
					o.transformMatrix = matrix_mult(prev.transformMatrix,[1,0,0,1,0,prev[id+'_high_value_frame'].height]);
				}
				container.addWithUpdate(o);
			}
      var scroll_item = fabric.TextWithDecorations(o[ref_zero.id+'_text']);
			scroll_item.setText(isDefined(value) ? value : '');
			//o[ref_zero.id+'_text'].set('text', (isDefined(value)) ? value : '');
		}

		function createValueSet (){
			var ref = high[id+'_high_values'][id+'_high_values_0'];

			for (var index = 0; index < local_value_set.length + before + after; index++) {
				createAnItem (index, ( index >= before && index < local_value_set.length + before) ? local_value_set[index - before]: undefined);
			}


			invalidRaster();
			var raster_obj = container.getRasterizationObject();
      var hs = Math.max(local_value_set.length + after + before, visible_elements) * getMovementQuant();
			raster_obj.set('height',hs);
      raster_obj.setRasterArea({height:hs});
			container.rasterize();
		}

		createValueSet();

		function gotoLow() {
			!low.isVisible() && svgobj.fire('scroller:deactivated');
			hd_plus.disable();
			hd_minus.disable();
			hd.disable();
			high.hide();

			low.enable();
			low.show();
		}

		function gotoHigh() {
			if (local_value_set.length <= 1) return;
			svgobj.fire('scroller:activated');

			low.disable();
			low.hide();

			hd.enable();
			high.show();

			if (valid_raster && 'undefined' !== typeof(value)) {
				doMove(value, true);
			}
			updateButtons();
		}

		var low = fabric.ResourceButton(low, {
			initialState:'disabled',
			clickcb: gotoHigh
		});

		gotoLow();

		svgobj.deactivate = function () {
			gotoLow();
		}

		svgobj.enable = function (value_set) {
			gotoLow();
			low.enable();
		}

		svgobj.disable = function () {
			gotoLow();
			low.disable();
		}

		svgobj.setValue = function (val, silent) {
			var old = value;
			if (old === val) return;
			value = val;
			doChanged(old, silent);
			return val;
		}

		svgobj.getValue = function () {
			return value;
		}
    svgobj.dropValueSet = function () {
      local_value_set = [];
    }

		svgobj.setValueSet = function (vs) {
			var temp = (vs) ? vs.slice() : [];
			if (JSON.stringify(local_value_set) === JSON.stringify(temp)) return;
			local_value_set = temp;
			createValueSet();
		}
		return svgobj;
	}

	fabric.WheelSelector = WheelSelector;
})(typeof exports !== 'undefined' ? exports : this);
