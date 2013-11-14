(function (global) {
  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      extend = fabric.util.object.extend,
      _toString = Object.prototype.toString,
      drawArc = fabric.util.drawArc,
      degreesToRadians = fabric.util.degreesToRadians,
      Matrix = fabric.util.Matrix,
      matmult = fabric.util.multiplyTransformMatrices;

  if (fabric.Use) {
    fabric.warn('fabric.Use is already defined');
    return;
  }

  function extract (obj) {
    var w = ['top', 'left', 'transformMatrix'];
    var ret = {};
    for (var i in w) ret[w[i]] = obj[w[i]];
    return ret;
  }

  ///TODO: put this one in object class or so ...
  function revert_matrix(obj) {
    var x = obj.left;
    var y = obj.top;

    var t = new Matrix();

    //first apply local transformations in current coordinate system, params specified separate from transform matrix
    //
    //TODO: scale is MISSING !!!

    if (obj.angle) {
      t.mult(Matrix.RotateMatrix_deg(obj.angle));
    }

    if (x || y) {
      t.mult (Matrix.TranslationMatrix(-x, -y));
    }


    /// now apply original transform matrix reverse ....

    var original_matrix = obj.transformMatrix;
    if (!original_matrix) return t.val;

    ///TODO: scale missing
    ///TODO: rotation missing
    t.mult (Matrix.TranslationMatrix(Matrix.ExtractTranslation(original_matrix, -1)));
    return t.val;
  }

  function translate_matrix(x, y) {
    var ret = unitMatrix();
    ret[4] = x;
    ret[5] = y;
    return ret;
  }

  function unitMatrix () {return [1,0,0,1,0,0]}

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
