(function(global) {
  "use strict";
  var matmult = fabric.util.multiplyTransformMatrices,
    matmultwassign = fabric.util.multiplyTransformMatricesWAssign,
    copymatrix = fabric.util.copyTransformMatrix,
    inv = fabric.util.matrixInverse,
    extend = fabric.util.object.extend ;

	function reduce_dimension (dh, max) {
		///clip negative coordinates
		var corrections = {
			x : 0,
			y : 0
		}
		if (dh.x < 0) {
			corrections.x = -dh.x;
			dh.width += dh.x; //note, x is negative ...
			dh.x = 0;
		}

		if (dh.y < 0) {
			corrections.y = -dh.y;
			dh.height += dh.y;
			dh.y = 0;
		}

		if (dh.x + dh.width > max.width) {
			dh.width -= (dh.width + dh.x - max.width + 1);
		}
		if (dh.y + dh.height > max.height) {
			dh.height -= (dh.height + dh.y - max.height + 1);
		}
		return corrections;
	}

  function ImageInterface (svg) {
    if (!arguments.length) return;
    this.svg = svg;
  }
  ImageInterface.prototype.render = function (ctx, cx, cy, cwidth, cheight, tx, ty, tw, th) {}
  ImageInterface.prototype.width = function () {}
  ImageInterface.prototype.height = function () {}
  ImageInterface.prototype.addClass = function(){}
  ImageInterface.prototype.setSrc = function () {}
  ImageInterface.prototype.clear = function () {}

  ImageInterface.isImage = function (obj) {
    return obj instanceof ImageInterface;
  }

  function StandardImage (svg,dom_image_instance) {
    if (!arguments.length) return;
    ImageInterface.prototype.constructor.call(this, svg);
    this.image = dom_image_instance;
    var self = this;
    this.image.onload = function () {
      fabric.util.isFunction(self.onload) && self.onload.apply(this, arguments);
      if (self.image.width > 1 && self.image.height > 1) fabric.util.enable3DGPU(self.image);
    }
  }
  StandardImage.prototype = new ImageInterface();
  StandardImage.prototype.constructor = StandardImage;

  StandardImage.prototype.render = function (ctx, cx, cy, cw, ch, tx, ty, tw, th) {

    if (arguments.length < 1) return;
    if (arguments.length < 5) {
      return (this.image && this.image.width && this.image.height) ? ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height) : undefined;
    }
    if (arguments.length === 5) {
      return (this.image && cw && ch) ? ctx.drawImage(this.image, cx, cy, cw, ch) : undefined;
    }
    //this._r_cntr && console.log('====>', this._r_cntr);
    (this.image && cw && ch && tw && th) && ctx.drawImage(this.image, cx, cy, cw, ch, tx, ty, tw, th);
  }

  StandardImage.prototype.width = function () {return this.image ? this.image.width : 0;}
  StandardImage.prototype.height= function () {return this.image ? this.image.height: 0;}
  StandardImage.prototype.addClass = function (c) { fabric.util.addClass(this.image, c); }

  StandardImage.prototype.setSrc = function (src) { 
    this.image.src = src; 
  }
  StandardImage.prototype.clear = function () { 
    this.image.src = fabric.util.DUMMY_PATH; 
    this.image.webkitTransform = '';
  }


  function CanvasImage (svg, canvas) {
    ImageInterface.prototype.constructor.call(this, svg);
    this.image = canvas;
    this._initialized = false;
  }

  CanvasImage.prototype = new StandardImage();
  CanvasImage.prototype.constructor = CanvasImage;

  CanvasImage.prototype.render = function (ctx, cx, cy, cw, ch, tx, ty, tw, th) {
    if (!this._initialized && this.image.width > 1 && this.image.height > 1) {
      this._initialized = true;
      fabric.util.enable3DGPU(this.image);
    }
    StandardImage.prototype.render.apply(this, arguments);
  }

  CanvasImage.prototype.clear = function () {
    this.image.width = this.image.width;
    this._initialized = false;
    this.image.webkitTransform = '';
  }

  CanvasImage.prototype._getCanvas = function () {
    return this.image;
  }
  CanvasImage.prototype.destroy = function () {
    this.svg.destroyCanvas(this.image);
    delete this.svg;
  }

  function MultipartImage(svg, step) {
    ImageInterface.prototype.constructor.call(this, svg);
    this.canvas_arr = [];
    this.step = step;
    this._width = 0;
    this._height= 0;
  }

  MultipartImage.prototype = new ImageInterface();
  MultipartImage.prototype.constructor = MultipartImage;

  MultipartImage.prototype.width = function () {return this.width;}
  MultipartImage.prototype.height= function () {return this.height;}

  MultipartImage.prototype.allocate = function (hq, wq) {
    this._wq = wq;
    this._hq = hq;

    var n = hq * wq;
    if (n > this.canvas_arr.length) {
      while (this.canvas_arr.length < n) {
        this.canvas_arr.push (this.svg.produceCanvas());
      }
    }else{
      while (this.canvas_arr.length > n) {
        var c = this.canvas_arr.shift();
        this.svg.destroyCanvas(c);
      }
    }
  }

  MultipartImage.prototype.width = function () {
    return this._width;
  }
  MultipartImage.prototype.height = function () {
    return this._height;
  }

  MultipartImage.prototype.at = function (hq, wq) {
    return this.canvas_arr[this._wq * hq + wq];
  }

  MultipartImage.prototype.render = function (ctx, cx, cy, cwidth, cheight, tx, ty, tw, th) {
    ctx.save();
    cx = cx || 0;
    cy = cy || 0;

    tx = tx || 0;
    ty = ty || 0;

    cwidth = cwidth || this.width();
    cheight= cheight|| this.height();

    tw = tw || cwidth;
    th = th || cheight;

    var wfactor = (cwidth === tw) ? 1 : tw/cwidth;
    var hfactor = (cheight === th) ? 1 : th/cheight;
    var spent_height = 0, h;

    var clip_y = 0;
    var clipping_stared;

    for (var i = 0; i < this._hq && spent_height < cheight; i++) {
      if (cy > i*this.step && cy < (i+1)*this.step) {
        clip_y = cy - i*this.step;
      }else{
        if (cy >= (i+1)*this.step) continue;
        clip_y = 0;
      }

      var spent_width = 0;
      for (var j = 0; j < this._wq && spent_width < cwidth; j++) {
        var c = this.at(i,j);
        if (j === 0) {
          h = c.height - clip_y;
          if (spent_height + h > cheight) {
            var reduction = spent_height + h - cheight;
            h -= reduction;
          }
        }

        var w = c.width;
        if (spent_width + w > cwidth) {
          var reduction = spent_width + w - cwidth;
          w -= reduction;
        }
        ctx.drawImage(c, 0, clip_y, w, h, (tx+spent_width)*wfactor, (ty+spent_height)*hfactor, w*wfactor, h*hfactor);

        spent_width += w;
        if (j === 0) {
          spent_height+= h;
        }
      }
    }
    ctx.restore();
  }

  function createRasterFromObject(obj) {
    var bs = fabric.backingScale;
    var img = obj.getRaster();

    var svg = obj.getSvgEl();
    var ro = obj.getRasterizationObject();
    var max_dim = Math.min(fabric.window.innerHeight, fabric.window.innerWidth);

    var w = Math.ceil(ro.get('width')); //oboe??
    var h = Math.ceil(ro.get('height'));

    var off_matrix = matmult(inv(ro._currentGlobalTransform),obj._currentTransform);

    var ret_transformation;
    var tt = ro._currentGlobalTransform.slice();
    if (ro.id != obj.id) {
      ret_transformation = ro._localTransformationMatrix.slice();
    }else{
      ret_transformation = [1,0,0,1,0,0];
    }

    if (w <= max_dim && h <= max_dim) {
      //create CanvasImage if required

      if (img && img instanceof MultipartImage) {
        img.destroy();
        img = null;
      }

      var  canvas = img ? img._getCanvas() : svg.produceCanvas();

      canvas.width = w*bs;
      canvas.height= h*bs;
      var lctx = canvas.getContext('2d');
      lctx._currentTransform = obj._currentGlobalTransform.slice();
      lctx.transform.apply(lctx, off_matrix);
      obj.render(lctx);
      if (!img) {
        img = new CanvasImage(svg, canvas);
      }
      ro._currentGlobalTransform = tt;
      return {
        img:img,
        obj: ro,
        width: w,
        height:h,
        content_transformation: ret_transformation
      };
    }
    /// this is for sure MultipartImage ...
    var m = Math.ceil (h/max_dim);
    var n = Math.ceil (w/max_dim);
    var t = n*m;
    if (img){
      if (img instanceof CanvasImage) {
        img.destroy();
        img = null;
      }else{
        img.allocate(m,n);
      }
    }else{
      img = new MultipartImage(svg, max_dim);
      img.allocate(m,n);
      img._width = ro.get('width');
      img._height =ro.get('height');
    }

    console.log('should allocate ', m,'for height and ',n, 'for width and step is ', max_dim, 'and height', h, off_matrix);

    for (var i = m-1; i >= 0; i--){
      for (var j = n-1; j >= 0; j--) {
        //pocni od krajnje tacke, pa vidi sta ces sa tim ...
        var c = img.at(i, j);
        var ctx = c.getContext('2d');
        c.width = ((j === n-1) ? ro.width - max_dim*j : max_dim)*bs;
        c.height = ((i === m-1) ?  ro.height - max_dim*i : max_dim)*bs;
        var target = off_matrix.slice();
        matmultwassign(target, [1,0,0,1,-j*max_dim, -i*max_dim]);
        ctx._currentTransform = target;
        ctx.transform.apply(ctx, target);
        obj.render(ctx);
      }
    }
    ro._currentGlobalTransform = tt;

    return {
      img:img,
      obj: ro,
      width: w,
      height:h,
      content_transformation: ret_transformation
    }
  }

  fabric.ImageInterface = ImageInterface;
  fabric.StandardImage = StandardImage;
  fabric.MultipartImage = MultipartImage;
  fabric.CanvasImage = CanvasImage;
  fabric.createRasterFromObject = createRasterFromObject;
})(typeof exports !== 'undefined' ? exports : this);
/*
 *
 * ovo sve od spolja mora da se pozove ...
var off_matrix = [ms,0,0,ms,(Math.ceil(req_w)-req_w)/2,-(Math.ceil(req_h)-req_h)/2];

if (ro.id != obj.id) {
  matmultwassign(off_matrix, inv(ro._currentGlobalTransform));
  matmultwassign(off_matrix, obj._currentTransform);
  ret_transformation = ro._localTransformationMatrix;
}else{
  matmultwassign(off_matrix, inv(ro._currentGlobalTransform));
  matmultwassign(off_matrix, obj._currentTransform);
  ret_transformation = [1,0,0,1,0,0];
}
lctx.transform.apply(lctx,off_matrix);
*/


