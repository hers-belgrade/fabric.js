(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
			isDefined = fabric.util.isDefined ;

/*
 *
 * Use this component to designate group of elements which contain mouseaware proprties ... Using this component, will allow you to completely remove mouse event handlers from event pipeline once element is hidden ...
 */
	fabric.MouseEventBucket = function (svgelem) {
		if (svgelem.mouse_event_bucket) return svgelem; ///no need to mark them again ...
		svgelem.mouse_event_bucket = true;

		var old_hide = svgelem.hide;
		var old_show = svgelem.show;

		svgelem.show = function () {
			var ret = old_show.apply(this, arguments);
			//console.log(this.id, 'show done');

			this.visible_for_mouse = true;
			if (this.wantsMouse){
				this.invokeOnCanvas('addToMouseListeners',this);
			}

			if (!this.branchConditionalEachObjectRecursive) {
				//console.log(ret.id, 'has no method branchConditionalEachObjectRecursive');
				return ret;
			}

			var self = this;

			this.branchConditionalEachObjectRecursive(function (o) {
				if (!o){
					console.log('no object?!?!?');
				 	return;
				}
				if (o.mouse_event_bucket) {
					///do show() on a bucket since show will reatach mouse event listeners ... 
					//of course if object is visible if not wait for show on that bucket....
					if (o.isVisible()) {
						//console.log('will do show on bucket',o.id);
						o.show();
					}
					return true;
				}

				if (o.wantsMouse) {
					//console.log('should add ', o.id);
					self.invokeOnCanvas('addToMouseListeners',o);
				}
			});

			return ret;
		}

		svgelem.hide = function () {
			//console.log('hide done', this.id);
			var ret = old_hide.apply(this, arguments);

			///if I'm visible for mouse do remove 
			if (this.wantsMouse) {
				//console.log('should remove ', this.id, 'BUCKET');
				this.invokeOnCanvas('removeFromMouseListeners',this);
			}

			if (!this.forEachObjectRecursive) return ret;
			var self = this;
			this.forEachObjectRecursive(function (o) {
				if (!o) return;
				///mark bucket as invisible for mouse and remove all it's children from listeners as well ...
				if (o.mouse_event_bucket) {
					o.visible_for_mouse = false;
				}
				if (o.wantsMouse) {
					//console.log('should remove', o.id);
					self.invokeOnCanvas('removeFromMouseListeners', o);
				}
			});
			return ret;
		}

		//execute this one to add mouse listeners if required ...
		if (svgelem.isVisible()) svgelem.show();
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
