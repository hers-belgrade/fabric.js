(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

/*
 *
 * Use this component to designate group of elements which contain mouseaware proprties ... Using this component, will allow you to completely remove mouse event handlers from event pipeline once element is hidden ...
 */
	fabric.MouseEventBucket = function (svgelem) {
		svgelem.mouse_event_bucket = true;
		var old_hide = svgelem.hide;
		var old_show = svgelem.show;

		svgelem.show = function () {
			if (!this.isVisible()) {
				var canvas = this.getCanvas();
				if (canvas) {
					if (this.forEachObjectRecursive) {
						this.forEachObjectRecursive(function (o) {
							//avoid hidden mouse_event_buckets who are chids ...
							if (o.mouse_event_bucket && !o.isVisible()) return;
							(o && o.wantsMouse) && canvas.addToMouseListeners(o);
						});
					}
					this.wantsMouse && canvas.addToMouseListeners(this);
				}
			}
			old_show.apply(this, arguments);
		}

		svgelem.hide = function () {
			if (this.isVisible()){
				var canvas = this.getCanvas();
				if (canvas) {
					if (this.forEachObjectRecursive) {
						this.forEachObjectRecursive(function (o) {
							(o && o.wantsMouse) && canvas.removeFromMouseListeners(o);
						});
					}
					this.wantsMouse && canvas.removeFromMouseListeners(this);
				}
			}
			old_hide.apply(this, arguments);
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
