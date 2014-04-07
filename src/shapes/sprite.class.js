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
	var cnt = 0;

  /**
   * Sprite class
   * @class fabric.Sprite
   * @extends fabric.Image
   */
  fabric.Sprite = fabric.util.createClass(fabric.Object, {
    type : 'Sprite',
    initialize : function(element,options){
			this._cnt = cnt;
			cnt++;

      this.x = options.x || 0;
      this.y = options.y || 0;

			options.area = fabric.util.object.extend({x: options.x, y:options.y, width:options.width, height:options.height},options.area);
			options.repeat = fabric.util.object.extend({x:false, y:false}, options.repeat);
      this.callSuper('initialize',options);
      this._element = element;
    },

		getRasterParams : function () {
			return {area: this.area, repeat: this.repeat};
		},

		setRasterArea: function (area_params, props) {
			props && this.set(props);
			var ts = fabric.util.object.extend(this.area, area_params);
			this.set({area:ts});
			this.invokeOnCanvas('renderAll');
		},

    _repeat_axis : function(ctx, axis, other_pos, slice_from) {
        var element = this._element;
				var x_axis = (axis === 'x');
				if (slice_from < 0) { 
					slice_from = (x_axis) ? ((slice_from % element.width()) + element.width()) : ((slice_from % element.height()) + element.height());
				}
				var render_height = this.area.height;
				var render_width = this.area.width;
				var max_dimension = (x_axis) ? this.area.width : this.area.height;
				var element_dimension = (x_axis) ? element.width() : element.height();
				var dynamic_dimension = 0;
        var should_break = false; 

				while (dynamic_dimension < max_dimension && !should_break) {
					var render_dimension = element_dimension - slice_from;
					if (render_dimension <= 0) return;
					should_break = false;

					if (dynamic_dimension + render_dimension > max_dimension) {
						render_dimension = max_dimension - dynamic_dimension;
						should_break = true;
					}

          if (render_dimension) {
            if (x_axis) {
              /*
               * TODO
              if (this.repeat.y) {
                repeat_axis('y', dynamic_dimension, this.area.y);
              }else{
                this._element.render(ctx, slice_from, other_pos, dynamic_dimension, render_height, dynamic_dimension, other_pos, render_dimension, render_height);
              }
              */
            }else{
              element.render(ctx, 0, slice_from, render_width, render_dimension, other_pos, dynamic_dimension, render_width, render_dimension);
            }
          }
					slice_from = 0;
					dynamic_dimension += render_dimension;
				}
			},

    _repeat_x : function(ctx, other_pos, slice_from) {
				return this._repeat_axis(ctx, 'x', other_pos, slice_from);
			},

    _repeat_y : function (ctx, other_pos, slice_from) {
				return this._repeat_axis(ctx, 'y', other_pos, slice_from);
			},

    _render : function(ctx){
      if (this._old_width != this._element.width() || this._old_height != this._element.height()) {
        this._old_width = this._element.width();
        this._old_height = this._element.height();
      }
      var element = this._element;
			var area_x = this.area.x % element.width();
			var area_y = this.area.y % element.height();
			//console.log('====', this._element.height(), area_y);

			var should_repeat = {
				x : this.repeat.x && (area_x < 0 || area_x+this.area.width > this._element.width()),
				y : this.repeat.y && (area_y < 0 || area_y+this.area.height > this._element.height())
			}

			if (should_repeat.x) {
				///this will cover both x and y repeat if needed :D
				return this._repeat_x (ctx, this.y, area_x);
			}

			if (should_repeat.y) {
				return this._repeat_y(ctx, this.x,area_y);
			}
      this._element.render(ctx, area_x, area_y, this.area.width, this.area.height, this.x, this.y, this.width, this.height);
    },
		getRasterModulo : function () {
			var ms = fabric.masterScale;
			return {width: this._element.width(), height: this._element.height()}
		},
		sanitize: function () {
			var m = this.getRasterModulo();
			this.area.x %= m.width;
			this.area.y %= m.height;
			//console.log('WILL SANITIZE ', this.area.x, this.area.y, m.height, this._cntr);
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

