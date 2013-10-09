(function (global) {
	"use strict";
  var fabric = global.fabric || (global.fabric = { }),
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      extend = fabric.util.object.extend,
      _toString = Object.prototype.toString,
      drawArc = fabric.util.drawArc;

  if (fabric.Use) {
    fabric.warn('fabric.Use is already defined');
    return;
  }

	fabric.Use = fabric.util.createClass (fabric.Object, {
		type:'use',
    borderRectColor:'#FFFF00',
		initialize: function (element,options) {
      options = options || { };

			var usedobjFromObj = options.usedobjFromObj;
			var usedobjObj= options.usedobjObj;

			delete options.usedobjFromObj;
			delete options.usedobjObj;

			this.callSuper('initialize', options);
			if ('function' === typeof(usedobjFromObj)) {
				var self = this;
				usedobjFromObj(usedobjObj, function (instance) {
					self.usedObj = instance;
				});
			}
		},
		getElement: function () {
			return this._element;
		},
		setElement: function (element, callback) {
			this._element = element;
			this._originalElement = element;
		},
		toObject: function (propertiesToInclude) {
      var ret = extend(this.callSuper('toObject', propertiesToInclude), {
        'xlink:href': this['xlink:href']
      });
			if(this.usedObj){
				ret.usedobjObj = this.usedObj.toObject();
				ret.usedobjFromObj = this.usedObj.constructor.fromObject;
			}
			return ret;
		},
		toSVG : function () {
			throw "toSVG not implemented";
		},
		toString: function () {
			throw "toString not implemented";
		},
		clone: function (callback, propertiesToInclude) {
			throw "clone not implemented";
		},
		_render: function (ctx,topctx) {
			if(this.usedObj){
				this.usedObj.render(ctx,topctx);
				console.log(this.original_options);
			}else{
				console.log('used object missing ...', this.id, 'should be '+this['xlink:href']);
			}
		}
	});

	fabric.Use.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height xlink:href'.split(' '))
	fabric.Use.fromElement = function (element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES);
		callback( new fabric.Use(element, extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes)) );
	};
	fabric.Use.fromObject = function (object, callback) {
		var inst = new fabric.Use(null,object);
		if(inst.usedobjObj && inst.usedobjFromObj){
			inst.usedobjFromObj(inst.usedobjObj,function(usedobjinst){
				delete inst.usedobjObj;
				delete inst.usedobjFromObj;
				inst.usedObj = usedobjinst;
				callback(inst);
			});
		}else{
			callback(inst);
		}
	};
  fabric.Use.async = true;
})(typeof exports !== 'undefined' ? exports : this);
