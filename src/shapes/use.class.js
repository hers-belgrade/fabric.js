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
    setElement: function (element, callback) {
      this._element = element;
      this._originalElement = element;
    },
    setUsedObj: function(object) {
      object.group = this;
      this.usedObj = object;
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
    var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES);
    callback( new fabric.Use(extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes)) );
  };
  fabric.Use.fromObject = function (object) {
    return new fabric.Use(object);
  };
  fabric.Use.async = true;
})(typeof exports !== 'undefined' ? exports : this);
