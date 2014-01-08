(function (global) {
  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  if (fabric.Use) {
    fabric.warn('fabric.Use is already defined');
    return;
  }

  fabric.Use = fabric.util.createClass (fabric.Object, {
    type:'use',
    borderRectColor:'#FFFF00',
    initialize: function (options) {
      this.randomID = Math.floor(Math.random()*5000000);
      options = options || { };
      this.callSuper('initialize', options);
      if(this.usedObj){
        this.setUsedObj(this.usedObj.clone());
      }
    },
    getElement: function () {
      return this._element;
    },
    setElement: function (element) {
      this._element = element;
      this._originalElement = element;
    },
    setUsedObj: function(object) {
			var self = this;
			if (this.usedObj) {
				this.usedObj.off('raster:created', this._rasterHandlers.create);
				this.usedObj.off('raster:changed', this._rasterHandlers.changed);
				delete this._rasterHandlers;
			}


			this._rasterHandlers = {
				create: function (sprite) {
					self.fire('raster:created', sprite);
				},
				changed: function (sprite) {
					self.fire('raster:changed', sprite);
				}
			}

      object.group = this;
      this.usedObj = object;
			this.usedObj.on('raster:created', this._rasterHandlers.create);
			this.usedObj.on('raster:changed', this._rasterHandlers.changed);
      delete this['xlink:href'];
    },
    toObject: function (propertiesToInclude) {
      var ret = this.callSuper('toObject', propertiesToInclude);
      ret.masteruse = this;
      return ret;
    },
    toSVG : function () {
      throw "toSVG not implemented";
    },
    toString: function () {
      throw "toString not implemented";
    },
    getUsedObj: function() {
      var uo = this.usedObj;
      if(!uo){
        if(this.masteruse){
          uo = this.masteruse.getUsedObj();
          if(uo){
            this.setUsedObj(uo.clone());
            delete this.masteruse;
          }
        }
      }
      return this.usedObj;
    },
		setRasterArea: function (area_params, lc_props) {
			var uo = this.getUsedObj();
			if (!uo) return;
			return uo.setRasterArea(area_params, lc_props);
		},
		rasterize: function (rasterize_params) {
			var uo = this.getUsedObj();
			if (!uo) return; //for now
			return uo.rasterize(rasterize_params);
		},
    forEachObjectRecursive: function(cb){
      var uo = this.getUsedObj();
      if(uo){
        !uo.nonIteratable && uo.forEachObjectRecursive && uo.forEachObjectRecursive(cb);
        cb(uo);
      }
    },
    localRotate: function(ctx){
      if(!this.localAngle){return;}
      var uoc = this.getUsedObj()._cache.global_content;
      if(!uoc){return;}
      var uocx = uoc.x, uocy = uoc.y, uocw = uoc.width, uoch = uoc.height;
      var gz = this.localToGlobal(new fabric.Point(0,0));
      //var tx = -gz.x+uocx, ty = -gz.y+uocy;
      var tx = -(uocx+uocw/2), ty = -(uocy+uoch/2);
      ctx.translate(-tx,-ty);
      ctx.rotate(this.localAngle*Math.PI/180);
      ctx.translate(tx,ty);
    },

    _render: function (ctx,topctx) {
      var uo = this.getUsedObj();
      if(uo){
        uo.render(ctx,topctx);
      }else{
        console.log(this.id,'has no usedObj',this);
      }
    }
  });

  fabric.Use.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height xlink:href'.split(' '))
  fabric.Use.fromElement = function (element, callback, options) {
    return new fabric.Use(extend((options ? fabric.util.object.clone(options) : { }), fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES)));
  };

  fabric.Use.fromObject = function (object) {
    return new fabric.Use(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
