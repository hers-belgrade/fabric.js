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
			options.area = options.area || {
				x : options.x,
				y : options.y,
				width: options.width,
				height:options.height,
			};
			options.repeat = options.repeat || {
				x : false,
				y : false
			};
      this.callSuper('initialize',element,options);

    },
    _render : function(ctx){

			////more work to be done ....
			var ms = fabric.masterScale;
			this.area.y %= this._element.height;
			this.area.x %= this._element.width;

			var should_repeat = {
				x : this.repeat.x && (this.area.x < 0 || this.area.x+this.area.width > this._element.width),
				y : this.repeat.y && (this.area.y < 0 || this.area.y+this.area.height > this._element.height)
			}
			so_far = {y:this.area.y};
			var self = this;

			function repeat_x (canvas_y, slice_from) {
				var canvas_x = 0; ///where I'm gona render on canvas ...
				if (slice_from < 0) { slice_from = (slice_from % self._element.width) + self._element.width; }
				var control_width = 0;

				while (canvas_x < self.width) {
					var render_width = self._element.width - slice_from;
					if (render_width <= 0) return;
					var should_break = false;


					if (canvas_x+render_width > self.where) {
						render_width = self.width- canvas_x;
						should_break = true;
					}

					if (self.repeat.y) {
						repeat_y(canvas_x, self.area.y);
					}else{
						ctx.drawImage (
								self._element,
								//where I am clipping from
								slice_from, canvas_y, 
								render_width*ms, self.area.height*ms,
								//where I am pasting to
								canvas_x, canvas_y,
								render_width,self.area.height 
								);

					}


					canvas_x += render_width;
					slice_from = 0;
					control_width += render_width;
					if (should_break) break; /// just in case, if I get any weird float ...
				}

			}

			function repeat_y (canvas_x, slice_from) {
				var canvas_y = 0; ///where I'm gona render on canvas ...
				if (slice_from < 0) { slice_from = (slice_from % self._element.height) + self._element.height; }
				var control_height = 0;


				while (canvas_y < self.height) {
					var render_height = self._element.height - slice_from;
					if (render_height <= 0) return;
					var should_break = false;


					if (canvas_y+render_height > self.height) {
						render_height = self.height - canvas_y;
						should_break = true;
					}

					ctx.drawImage (
							self._element,
							//where I am clipping from
							0, slice_from, 
							self.area.width*ms, render_height,
							//where I am pasting to
							canvas_x, canvas_y,
							self.area.width,render_height 
					);


					canvas_y += render_height;
					slice_from = 0;
					control_height += render_height;
					if (should_break) break; /// just in case, if I get any weird float ...
				}
			}
			if (should_repeat.x) {
				return repeat_x (this.y, this.area.x);
			}

			if (should_repeat.y) {
				return repeat_y(this.x,this.area.y);
			}

			ctx.drawImage(
				this._element,
				this.area.x*ms,this.area.y*ms,
				this.area.width*ms,  this.area.height*ms,
				this.x,this.y,
				this.width, this.height
			);
			var so_far = {};
			so_far.y = this._element.height;

			if (should_repeat.x) {

				return;
			}

			if (should_repeat.y) {
				return;




				console.log('ELEMENT IS ', this._element.height, 'high, and area is ', this.area.height);
				/// ovo je zabavan deo: koliko treba puta ovo da ponovim, jednom je malo ....
				var h = this.area.y+this.area.height - this._element.height;
				var so_far = this.y+this.area.height;
				ctx.drawImage(
						this._element,
						this.area.x*ms, 0,
						this.width*ms, h*ms,
						this.x, this.y + this.area.height-h,
						this.width,h
				);
				ctx.drawImage(
						this._element,
						this.area.x*ms, this._element.height,
						this.width*ms, h*ms,
						this.x, this.y + 2*this.area.height-h,
						this.width,h
				);

				return;
			}
			return;
			console.log('WRAPPING?');




			if (!this.area) {
				return;
			}else{
				if (this.area.tile) {
				}else{
					ctx.drawImage(
							this._element,
							this.area.x, this.area.y,
							this.area.width, this.area.height,
							this.x, this.y,
							this.area.width, this.area.height
							);
				}
			}
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
		setArea: function (na) {
			///consider calling render all immidiatelly ...
			var dims =  ['x', 'y', 'width', 'height'];
			for (var i in dims) {
				if ('undefined' != typeof(na[dims[i]])) this.area[dims[i]] = na[dims[i]];
			}

			if (na.repeat) {
				if ('undefined' === typeof(na.repeat.x)) this.repeat.x = na.repeat.x;
				if ('undefined' === typeof(na.repeat.y)) this.repeat.y = na.repeat.y;
			}
		},

		getArea: function () {
			return this.area;
		},

		removeArea : function () {
			delete this.area;
		}
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
