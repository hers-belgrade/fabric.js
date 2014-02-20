(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
		Matrix = fabric.util.Matrix,
		matrix_mult = fabric.util.multiplyTransformMatrices,
		isDefined = fabric.util.isDefined;

	function WheelSelector (svgobj, config) {
		///TODO:
		// 1.allow non - centered pointer to a valid value .... 
		// 2.allow drag on this element ...
		// 3.remove need for additional, external transform matrices ....
		if (svgobj.type === 'use') {
			svgobj.setUsedObj (svgobj.getUsedObj());
		}

		var self = (svgobj.type === 'use') ? svgobj.getUsedObj() : svgobj;
		var id = self.id;

		var low = self[id+'_low'];
		var high= self[id+'_high'];
		var value = ('undefined' !== typeof(config.initialVal)) ? config.initialVal : undefined;
		var raster_valid = false;

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

		ref_zero = container[getMeValIndexId(0)].getUsedObj();
		ref_zero.transformMatrix = matrix_mult((ref_zero.transformMatrix || [1,0,0,1,0,0]), (container[getMeValIndexId(0)].transformMatrix || [1,0,0,1,0,0]));

		var container_correction = 0;
		var visible_elements = 0;

		///create two dummies to fill up gaps


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
			el.setRasterArea({y:before*getMovementQuant(), height: visible_elements*getMovementQuant()});
			if ('undefined' === typeof(value)) return;
			raster_valid = true;
			doMove(value, true);
		}

		function invalidRaster () {
			raster_valid = false;
			hd_minus.disable();
			hd_plus.disable();

			container.transformMatrix = matrix_mult(container.transformMatrix || Matrix.UnityMatrix(), Matrix.TranslationMatrix(0, -container_correction));
			container_correction = 0;

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
			o[ref_zero.id+'_text'].set('text', (isDefined(value)) ? value : '');
		}

		function createValueSet (){
			var ref = high[id+'_high_values'][id+'_high_values_0'];

			for (var index = 0; index < local_value_set.length + before + after; index++) {
				createAnItem (index, ( index >= before && index < local_value_set.length + before) ? local_value_set[index - before]: undefined);
			}


			invalidRaster();
			var raster_obj = container.getRasterizationObject();
			raster_obj.set('height',Math.max(local_value_set.length + after + before, visible_elements) * getMovementQuant());
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

			if (raster_valid && 'undefined' !== typeof(value)) {
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
