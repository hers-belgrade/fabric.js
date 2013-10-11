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
			this.randomID = Math.floor(Math.random()*5000000);
      options = options || { };

			this.callSuper('initialize', options);
		},
		getElement: function () {
			return this._element;
		},
		setElement: function (element, callback) {
			this._element = element;
			this._originalElement = element;
		},
		setUsedObj: function(object) {
			//console.log('setting used obj',object.id,'on',this.randomID,'with',this.clonesWaitingForUsedObj ? this.clonesWaitingForUsedObj.length : 'no', 'waiters');
			this.usedObj = object;
			var waiters = this.clonesWaitingForUsedObj;
			if(!waiters){return;}
			delete this.clonesWaitingForUsedObj;
			function resolveWaiter(){
				if(!waiters.length){
					return;
				}
				object.clone(function(cloneinst){
					var wf = waiters.shift();
					wf(cloneinst);
					resolveWaiter();
				});
			};
			resolveWaiter();
		},
		toObject: function (propertiesToInclude) {
      var ret = this.callSuper('toObject', propertiesToInclude);
			if(this.usedObj){
				ret.usedobjObj = this.usedObj.toObject();
				ret.usedobjFromObj = this.usedObj.constructor.fromObject;
				ret.usedobjType = this.usedObj.type;
			}else{
				var hook = function(usedobj){
					if(ret.takeObj){
						ret.takeObj(usedobj);
					}
				};
				ret.usedObjHook = hook;
				this.clonesWaitingForUsedObj = this.clonesWaitingForUsedObj || [];
				this.clonesWaitingForUsedObj.push(hook);
				//console.log(this.randomID,'has no usedobj still, but got a link',this['xlink:href'],this.clonesWaitingForUsedObj.length,'waiters');
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
			}else{
				console.log('used object missing ...', this.id, 'should be '+this['xlink:href'], this.randomID);
			}
		}
	});

	fabric.Use.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height xlink:href'.split(' '))
	fabric.Use.fromElement = function (element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES);
		callback( new fabric.Use(element, extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes)) );
	};
	fabric.Use.fromObject = function (object, callback) {
		var extraoptions = {};
		if(object.usedobjObj && object.usedobjFromObj){
			extraoptions.usedobjObj=object.usedobjObj;
			extraoptions.usedobjFromObj = object.usedobjFromObj;
			extraoptions.usedobjType = object.usedobjType;
			delete object.usedobjObj;
			delete object.usedobjFromObj;
			delete object.usedobjType;
		}else if(object.usedObjHook){
			extraoptions.usedObjHook = object.usedObjHook;
			delete object.usedObjHook;
		}
		var inst = new fabric.Use(null,object);
		if(extraoptions.usedobjObj && extraoptions.usedobjFromObj){
			//console.log(object);
			extraoptions.usedobjFromObj(extraoptions.usedobjObj,function(usedobjinst){
				inst.usedObj = usedobjinst;
				callback(inst);
			});
		}else if(extraoptions.usedObjHook){
			object.takeObj = function(usedobj){
				delete object.takeObj;
				inst.setUsedObj(usedobj);
			};
			callback(inst);
		}
	};
  fabric.Use.async = true;
})(typeof exports !== 'undefined' ? exports : this);
