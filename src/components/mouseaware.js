(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

/*
 *
 * Use this component to designate group of elements which contain mouseaware proprties ... Using this component, will allow you to completely remove mouse event handlers from event pipeline once element is hidden ...
 */
	fabric.MouseEventBucket = function (svgelem) {
		svgelem.mouse_event_bucket = true;
		svgelem.visible_for_mouse = svgelem.isVisible();

		var old_hide = svgelem.hide;
		var old_show = svgelem.show;

		svgelem.show = function () {
			var was_hidden = !this.isVisible();
			var ret = old_show.apply(this, arguments);
			var canvas = this.getCanvas();
			if (!canvas) return ret;
			if (this.visible_for_mouse) return ret;

			if (!this.visible_for_mouse) {
				// ! visible for mouse events ? make it visible ....
				this.visible_for_mouse = true;
				this.wantsMouse && canvas.addToMouseListeners(this);
			}

			if (!this.forEachObjectRecursive) return ret;

			this.forEachObjectRecursive(function (o) {
				if (!o) return;
				if (o.mouse_event_bucket) {
					///make child available for mouse clicks ...
					if (o.isVisible()) o.show();
					return;
				}

				o.wantsMouse && canvas.addToMouseListeners(o);
			});

			return ret;
		}

		svgelem.hide = function () {
			var was_visible = this.isVisible();
			var canvas = this.getCanvas();
			var ret = old_hide.apply(this, arguments);
			if (!canvas) return ret;
			if (this.visible_for_mouse) {
				this.visible_for_mouse = false;
				this.wantsMouse && canvas.removeFromMouseListeners(this);
			}
			if (!was_visible || !this.forEachObjectRecursive) return ret;
			this.forEachObjectRecursive(function (o) {
				if (!o) return;
				if (o.mouse_event_bucket && o.visible_for_mouse) o.visible_for_mouse = false;
				if (o.wantsMouse) canvas.removeFromMouseListeners(o);
			});
			return ret;
		}
		return svgelem;
	}

  fabric.MouseAware = function(svgelem,overcb,outcb){
    if(!svgelem.wantsMouse){
      svgelem.wantsMouse=true;
      svgelem.invokeOnCanvas('addToMouseListeners',svgelem);
    }
    svgelem.enable = function(){
      this.enabled=true;
      return this;
    };
    svgelem.disable = function(){
      this.enabled=false;
      return this;
    }
    svgelem.enable();
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);
