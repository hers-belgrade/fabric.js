(function(global) {

  "use strict";

  var extend = fabric.util.object.extend;

  if (!global.fabric) {
    global.fabric = { };
  }

  if (global.fabric.Sprite) {
    fabric.warn('fabric.Sprite is already defined.');
    return;
  }

  /**
   * Sprite class
   * @class fabric.Sprite
   * @extends fabric.Image
   */
  fabric.Sprite = fabric.util.createClass(fabric.Image , {
    type : 'Sprite',
    initialize : function(element,options){

      this.x = options.x || 0;
      this.y = options.y || 0;

			options.area = fabric.util.object.extend({x: options.x, y:options.y, width:options.width, height:options.height},options.area);
			options.repeat = fabric.util.object.extend({x:false, y:false}, options.repeat);
      this.callSuper('initialize',element,options);
    },
		setRasterArea: function (area_params, props) {
			props && this.set(props);
			var ts = fabric.util.object.extend(this.area, area_params);
			this.set({area:ts});
			this.invokeOnCanvas('renderAll');
		},
    _render : function(ctx){

			////more work to be done ....
			var bs = fabric.backingScale;
			var ms = fabric.masterScale;

			var elw = this._element.width/bs;
			var elh = this._element.height/bs;

			var area_x = this.area.x;// % elw;
			var area_y = this.area.y;// % elh;

			var should_repeat = {
				x : this.repeat.x && (area_x < 0 || area_x+this.area.width > elw),
				y : this.repeat.y && (area_y < 0 || area_y+this.area.height > elw)
			}


			var self = this;

			function repeat_axis (axis, other_pos, slice_from) {
				var x_axis = (axis === 'x');
				if (slice_from < 0) { 
					slice_from = (x_axis) ? ((slice_from % elw) + elw) : ((slice_from % elh) + elh);

				}
				var control = 0;
				var render_height = self.area.height;
				var render_width = self.area.width;
				var max_dimension = (x_axis) ? self.width : self.height;
				var element_dimension = (x_axis) ? elw : elh;
				var dynamic_dimension = 0;

				while (dynamic_dimension < max_dimension) {
					var render_dimension = element_dimension - slice_from;
					if (render_dimension <= 0) return;
					var should_break = false;

					if (dynamic_dimension +render_dimension > max_dimension) {
						render_dimension = max_dimension - dynamic_dimension;
						should_break = true;
					}


					if (x_axis) {
						if (self.repeat.y) {
							repeat_axis('y', dynamic_dimension, self.area.y);
						}else{
							ctx.drawImage (
									self._element,
									//where I am clipping from
									slice_from*bs, other_pos*bs, 
									render_dimension*bs, render_height*bs,
									//where I am pasting to
									dynamic_dimension, other_pos,
									render_dimension,render_height
							 );
						}
					}else{
						ctx.drawImage (
								self._element,
								//where I am clipping from
								0, slice_from*bs,
								render_width*bs, render_dimension*bs,
								//where I am pasting to
								other_pos, dynamic_dimension,
								render_width,render_dimension 
								);
					}


					dynamic_dimension += render_dimension;
					slice_from = 0;
					control += render_dimension;
					if (should_break) break; /// just in case, if I get any weird float ...

				}
			}
		
			function repeat_x (other_pos, slice_from) {
				return repeat_axis('x', other_pos, slice_from);
			}

			function repeat_y (other_pos, slice_from) {
				return repeat_axis('y', other_pos, slice_from);
			}
			if (should_repeat.x) {
				///this will cover both x and y repeat if needed :D
				return repeat_x (this.y, area_x);
			}

			if (should_repeat.y) {
				return repeat_y(this.x,area_y);
			}

			//anyway, avoid negative values ...
			var x_correction = (area_x < 0) ? -area_x: 0;
			var y_correction = (area_y < 0) ? -area_y: 0;
      if(x_correction){
        console.log('x_correction',x_correction);
      }
      if(y_correction){
        console.log('y_correction',y_correction);
      }

			ctx.drawImage(
				this._element,
				(area_x+x_correction)*ms,(area_y+y_correction)*ms,
				(this.area.width-x_correction)*ms,  (this.area.height-y_correction)*ms,
				(this.x-x_correction),(this.y-y_correction),
				(this.width-x_correction), (this.height - y_correction)
			);
    },
		sanitize: function () {
			var bs = fabric.backingScale;
			this.area.x %= (this._element.width/bs);
			this.area.y %= (this._element.height/bs);
		},
    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        element: this.getElement(),
        x:this.x,
        y:this.y,
        name:this.name
      });
    },
  });

  /**
   * Creates an instance of fabric.Sprite from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.Sprite.fromObject = function(object) {
		return new fabric.Sprite(object.element,object);
  };


  /**
   * StateableSprite class
   * @class fabric.StateableSprite
   * @extends fabric.Sprite
   */
  fabric.StateableSprite = fabric.util.createClass(fabric.Sprite, {
    type : 'StateableSprite',
    initialize : function(options){
      if(!options){
        throw 'StateableSprite needs initializer options';
      }
      var el;
      if(options.stategeometries){
        el = options.element;
        this._stategeometries = options.stategeometries;
        delete options.stategeometries;
      }else{
        if(!options.statemap){
          console.trace();
          console.log(options);
          throw 'StateableSprite needs a statemap in initializer options';
        }
        this._stategeometries = {};
        for(var state in options.statemap){
          var ss = options.statemap[state];
          if(el){
            if(ss._element!==el){
              throw 'Sprites in statemap have to share the same img element';
            }
          }else{
            el = ss._element;
          }
          this._stategeometries[state] = {x:ss.x,y:ss.y,width:ss.width,height:ss.height};
        }
      }
      extend(options,this._stateGeometry(options.spritestate));
      this.callSuper('initialize',el,options);
    },
    _stateGeometry : function(state){
      return this._stategeometries[state] || {x:0,y:0,width:0,height:0};
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     * @return {fabric.Object} thisArg
     */
    _set: function(key, value) {
      if(key==='spritestate'){
        var sg = this._stateGeometry(value);
        this.x = sg.x;
        this.y = sg.y;
        this.width = sg.width;
        this.height = sg.height;
      }
      if(key in {x:1,y:1,width:1,height:1}){
        return;
      }
      return this.callSuper('_set',key,value);
    },

    _render : function(){
      if(!this.spritestate){
        throw 'No spritestate on '+this.name;
      }
      this.callSuper.apply(this,['_render'].concat(Array.prototype.slice.call(arguments)));
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        stategeometries:this._stategeometries,
        spritestate:this.spritestate
      });
    },

  });

  /**
   * Creates an instance of fabric.Image from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.StateableSprite.fromObject = function(object) {
    return new fabric.StateableSprite(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
