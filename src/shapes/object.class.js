(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      toFixed = fabric.util.toFixed,
      capitalize = fabric.util.string.capitalize,
      matmult = fabric.util.multiplyTransformMatrices,
      degreesToRadians = fabric.util.degreesToRadians,
      Matrix = fabric.util.Matrix,
      supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Object) {
    return;
  }

  /**
   * Root object class from which all 2d shape classes inherit from
   * @class fabric.Object
   */
  fabric.Object = fabric.util.createClass(/** @lends fabric.Object.prototype */ {

    /**
     * Type of an object (rect, circle, path, etc.)
     * @type String
     * @default
     */
    type:                     'object',

    /**
     * Horizontal origin of transformation of an object (one of "left", "right", "center")
     * @type String
     * @default
     */
    originX:                  'left',

    /**
     * Vertical origin of transformation of an object (one of "top", "bottom", "center")
     * @type String
     * @default
     */
    originY:                  'top',

    /**
     * Top position of an object. Note that by default it's relative to object center. You can change this by setting originY={top/center/bottom}
     * @type Number
     * @default
     */
    top:                      0,

    /**
     * Left position of an object. Note that by default it's relative to object center. You can change this by setting originX={left/center/right}
     * @type Number
     * @default
     */
    left:                     0,

    /**
     * Object width
     * @type Number
     * @default
     */
    width:                    0,

    /**
     * Object height
     * @type Number
     * @default
     */
    height:                   0,

    /**
     * Object scale factor (horizontal)
     * @type Number
     * @default
     */
    scaleX:                   1,

    /**
     * Object scale factor (vertical)
     * @type Number
     * @default
     */
    scaleY:                   1,

    /**
     * When true, an object is rendered as flipped horizontally
     * @type Boolean
     * @default
     */
    flipX:                    false,

    /**
     * When true, an object is rendered as flipped vertically
     * @type Boolean
     * @default
     */
    flipY:                    false,

    /**
     * Opacity of an object
     * @type Number
     * @default
     */
    opacity:                  1,

    /**
     * Size of object's controlling corners (in pixels)
     * @type Number
     * @default
     */
    cornerSize:               12,

    /**
     * When true, object's controlling corners are rendered as transparent inside (i.e. stroke instead of fill)
     * @type Boolean
     * @default
     */
    transparentCorners:       true,

    /**
     * Default cursor value used when hovering over this object on canvas
     * @type String
     * @default
     */
    hoverCursor:              null,

    /**
     * Padding between object and its controlling borders (in pixels)
     * @type Number
     * @default
     */
    padding:                  0,

    /**
     * Color of controlling borders of an object (when it's active)
     * @type String
     * @default
     */
    borderColor:              'rgba(102,153,255,0.75)',

    /**
     * Color of controlling corners of an object (when it's active)
     * @type String
     * @default
     */
    cornerColor:              'rgba(102,153,255,0.5)',

    /**
     * When true, this object will use center point as the origin of transformation
     * when being resized via the controls
     * @type Boolean
     */
    centerTransform:          false,

    /**
     * Color of object's fill
     * @type String
     * @default
     */
    //fill:                     'rgb(0,0,0)',

    /**
     * Fill rule used to fill an object
     * @type String
     * @default
     */
    fillRule:                 'source-over',

    /**
     * Overlay fill (takes precedence over fill value)
     * @type String
     * @default
     */
    overlayFill:              null,

    /**
     * When defined, an object is rendered via stroke and this property specifies its color
     * @type String
     * @default
     */
    //stroke:                   'none',

    /**
     * Width of a stroke used to render this object
     * @type Number
     * @default
     */
    strokeWidth:              1,

    /**
     * Array specifying dash pattern of an object's stroke (stroke must be defined)
     * @type Array
     */
    strokeDashArray:          null,

    /**
     * Line endings style of an object's stroke (one of "butt", "round", "square")
     * @type String
     * @default
     */
    strokeLineCap:            'butt',

    /**
     * Corner style of an object's stroke (one of "bevil", "round", "miter")
     * @type String
     * @default
     */
    strokeLineJoin:           'miter',

    /**
     * Maximum miter length (used for strokeLineJoin = "miter") of an object's stroke
     * @type Number
     * @default
     */
    strokeMiterLimit:         10,

    /**
     * Shadow object representing shadow of this shape
     * @type fabric.Shadow
     * @default
     */
    shadow:                   null,

    /**
     * Opacity of object's controlling borders when object is active and moving
     * @type Number
     * @default
     */
    borderOpacityWhenMoving:  0.4,

    /**
     * Scale factor of object's controlling borders
     * @type Number
     * @default
     */
    borderScaleFactor:        1,

    /**
     * Transform matrix (similar to SVG's transform matrix)
     * @type Array
     */
    transformMatrix:          null,

    /**
     * Minimum allowed scale value of an object
     * @type Number
     * @default
     */
    minScaleLimit:            0.01,

    /**
     * When set to `false`, an object can not be selected for modification (using either point-click-based or group-based selection).
     * All events propagate through it.
     * @type Boolean
     * @default
     */
    selectable:               true,

    /**
     * When set to `false`, an object is not rendered on canvas
     * @type Boolean
     * @default
     */
    visible:                  true,

    /**
     * When set to `false`, object's controls are not displayed and can not be used to manipulate object
     * @type Boolean
     * @default
     */
    hasControls:              true,

    /**
     * When set to `false`, object's controlling borders are not rendered
     * @type Boolean
     * @default
     */
    hasBorders:               true,

    /**
     * When set to `false`, object's controlling rotating point will not be visible or selectable
     * @type Boolean
     * @default
     */
    hasRotatingPoint:         true,

    /**
     * Offset for object's controlling rotating point (when enabled via `hasRotatingPoint`)
     * @type Number
     * @default
     */
    rotatingPointOffset:      40,

    /**
     * When set to `true`, objects are "found" on canvas on per-pixel basis rather than according to bounding box
     * @type Boolean
     * @default
     */
    perPixelTargetFind:       false,

    /**
     * When `false`, default object's values are not included in its serialization
     * @type Boolean
     * @default
     */
    includeDefaultValues:     true,

    /**
     * Function that determines clipping of an object (context is passed as a first argument)
     * @type Function
     */
    clipTo:                   null,

    /**
     * When `true`, object horizontal movement is locked
     * @type Boolean
     * @default
     */
    lockMovementX:            false,

    /**
     * When `true`, object vertical movement is locked
     * @type Boolean
     * @default
     */
    lockMovementY:            false,

    /**
     * When `true`, object rotation is locked
     * @type Boolean
     * @default
     */
    lockRotation:             false,

    /**
     * When `true`, object horizontal scaling is locked
     * @type Boolean
     * @default
     */
    lockScalingX:             false,

    /**
     * When `true`, object vertical scaling is locked
     * @type Boolean
     * @default
     */
    lockScalingY:             false,

    /**
     * When `true`, object non-uniform scaling is locked
     * @type Boolean
     * @default
     */
    lockUniScaling:           false,

    borderRectColor:          '#000000',


    /**
     * Constructor
     * @param {Object} [options] Options object
     */
    initialize: function(options) {
      this._cache = {};
      if (options) {
        this.setOptions(options);
      }
    },

    /**
     * @private
     */
    _initGradient: function(options,attributename) {
      var optval = options[attributename];
      if (optval && optval.colorStops && !(optval instanceof fabric.Gradient)) {
        this.set(attributename, new fabric.Gradient(optval));
      }
    },

    /**
     * @private
     */
    _initPattern: function(options) {
      if (options.fill && options.fill.source && !(options.fill instanceof fabric.Pattern)) {
        this.set('fill', new fabric.Pattern(options.fill));
      }
      if (options.stroke && options.stroke.source && !(options.stroke instanceof fabric.Pattern)) {
        this.set('stroke', new fabric.Pattern(options.stroke));
      }
    },

    /**
     * @private
     */
    _initClipping: function(options) {
      if (!options.clipTo || typeof options.clipTo !== 'string') return;

      var functionBody = fabric.util.getFunctionBody(options.clipTo);
      if (typeof functionBody !== 'undefined') {
        this.clipTo = new Function('ctx', functionBody);
      }
    },

    /**
     * @private
     * returns the top svg element - root of the hierarchy
     */
    _svgElement: function() {
      var ret = this;
      while(ret.group){
        ret = ret.group;
      }
      return ret;
    },

    getCanvas: function(){
      var canvas = this.canvas;
      if(!canvas){
        var group = this.group;
        while(group&&!canvas){
          canvas = group.canvas;
          group = group.group;
        }
      }
      return canvas;
    },

    invokeOnCanvas: function(method){
      var canvas = this.getCanvas();
      if(canvas){
        var m = canvas[method];
        if(typeof m === 'function'){
          var args = Array.prototype.slice.call(arguments,1);
          m.apply(canvas,args);
          return true;
        }
      }
    },

    /**
     * Sets object's properties from options
     * @param {Object} [options] Options object
     */
    setOptions: function(options) {
      for (var prop in options) {
        this.set(prop, options[prop]);
      }
      this._initGradient(options,'fill');
      this._initGradient(options,'stroke');
      this._initPattern(options);
      this._initClipping(options);
    },
    clearAllTransformations : function () {
      var fields = {'top':0, 'left':0, 'transformMatrix':undefined, 'scaleX' : 1, 'scaleY': 1, 'angle': 0, 'flipX': false, 'flipY': false};
      for (var i in fields) {
        this[i] = fields[i];
      }
    },

    attachToCurve: function(curve,curvepercentage){
      this.attachedToCurve=curve;
      this.set({curvePercentage:curvepercentage||0});
    },

    /**
     * Transforms context when rendering an object
     * @param {CanvasRenderingContext2D} ctx Context
     * @param {Boolean} fromLeft When true, context is transformed to object's top/left corner. This is used when rendering text on Node
     */
    transform: function(ctx) {


      var m = this.transformMatrix;
      this._currentTransform = ctx._currentTransform;
      if (m) {
        //console.log(this.id, 'matrix', m)
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }else{
        //console.log(this.id, 'no matrix');
        m = [1,0,0,1,0,0];
      }

      if(this.opacity!==1){
        this.savedAlpha = ctx.globalAlpha;
        ctx.globalAlpha = ctx.globalAlpha*this.opacity;
        //ctx.globalAlpha = 1 - ((1-ctx.globalAlpha)+(1-this.opacity));
      }

      var em = this._extraTransformations();
      if(em){
        m = matmult(m,em);
      }

      fabric.util.setStrokeToCanvas(ctx, this);
      fabric.util.setFillToCanvas(ctx, this);
      ctx.save();

      if(!this._localTransformationMatrix){
        this._cacheLocalTransformMatrix();
      }
      ctx.transform.apply(ctx,this._localTransformationMatrix);
      m = matmult(m,this._localTransformationMatrix);
      ctx._currentTransform = matmult(ctx._currentTransform,m);
      var xl = 0, xr = xl+this.width, yt = 0, yb = yt+this.height;
      var tl = fabric.util.pointInSpace(ctx._currentTransform,new fabric.Point(xl,yt));
      var br = fabric.util.pointInSpace(ctx._currentTransform,new fabric.Point(xr,yb));
      if(tl.x>br.x){
        var x = tl.x;
        tl.x = br.x;
        br.x = x;
      }
      if(tl.y>br.y){
        var y = tl.y;
        tl.y = br.y;
        br.y = y;
      }
      var mx = (tl.x+br.x)/2, my = (tl.y+br.y)/2;
      this.oCoords = {
        tl:{x:tl.x,y:tl.y},tr:{x:br.x,y:tl.y},br:{x:br.x,y:br.y},bl:{x:tl.x,y:br.y},
        ml:{x:tl.x,y:my},mt:{x:mx,y:tl.y},mr:{x:br.x,y:my},mb:{x:mx,y:br.y}
      };
      this._currentGlobalTransform = ctx._currentTransform;
      this._currentLocalTransform = m;
      this.localRotate(ctx);



			/*
			if(this.shouldRasterize){
				delete this.shouldRasterize;
				var obj = this.getRasterizationObject();
				var w = obj.get('width');
				var h = obj.get('height');

				var offel = fabric.document.createElement('canvas');
				offel.width = w*fabric.backingScale;
				offel.height = h*fabric.backingScale;
				var lctx = offel.getContext('2d');

				var lm = [1,0,0,1,0,0];
				lm = fabric.util.multiplyTransformMatrices(lm, fabric.util.matrixInverse([1,0,0,1,obj.left,obj.top]));
				lm = fabric.util.multiplyTransformMatrices(lm, fabric.util.matrixInverse(this._localTransformationMatrix));
				lm = fabric.util.multiplyTransformMatrices(lm, fabric.util.matrixInverse(this._currentGlobalTransform));

				//console.log(obj, this);
				lctx.transform.apply(lctx,lm);
				lctx._currentTransform = [1,0,0,1,0,0];
				this.render(lctx);

				this._cache.local_content = new fabric.Sprite(offel,{x:0, y:0, width:w, height:h});
			}
				*/
    },

    _extraTransformations : function(ctx){
    },

    localRotate: function(ctx){
    },

    untransform: function(ctx,topctx){
      ctx._currentTransform = this._currentTransform;
      if(typeof this.savedAlpha !== 'undefined'){
        ctx.globalAlpha = this.savedAlpha;
      }
      delete this.savedAlpha;
      ctx.restore();
    },

    /**
     * Returns an object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {

      var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

      var object = {
        id:                 this.id,
        type:               this.type,
        originX:            this.originX,
        originY:            this.originY,
        left:               toFixed(this.left, NUM_FRACTION_DIGITS),
        top:                toFixed(this.top, NUM_FRACTION_DIGITS),
        width:              toFixed(this.width, NUM_FRACTION_DIGITS),
        height:             toFixed(this.height, NUM_FRACTION_DIGITS),
        fill:               this.fill,//(this.fill && this.fill.toObject) ? this.fill.toObject() : this.fill,
        overlayFill:        this.overlayFill,
        stroke:             this.stroke,//(this.stroke && this.stroke.toObject) ? this.stroke.toObject() : this.stroke,
        strokeWidth:        toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
        strokeDashArray:    this.strokeDashArray,
        strokeLineCap:      this.strokeLineCap,
        strokeLineJoin:     this.strokeLineJoin,
        strokeMiterLimit:   toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
        scaleX:             toFixed(this.scaleX, NUM_FRACTION_DIGITS),
        scaleY:             toFixed(this.scaleY, NUM_FRACTION_DIGITS),
        flipX:              this.flipX,
        flipY:              this.flipY,
        opacity:            toFixed(this.opacity, NUM_FRACTION_DIGITS),
        shadow:             (this.shadow && this.shadow.toObject) ? this.shadow.toObject() : this.shadow,
        visible:            this.visible,
        display:            this.display,
        clipTo:             this.clipTo && String(this.clipTo),
        transformMatrix:    this.transformMatrix,
        nonIteratable:      this.nonIteratable,
        _cache:             this._cache
      };

      if (!this.includeDefaultValues) {
        object = this._removeDefaultValues(object);
      }

      fabric.util.populateWithProperties(this, object, propertiesToInclude);

      return object;
    },

    /**
     * Returns (dataless) object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toDatalessObject: function(propertiesToInclude) {
      // will be overwritten by subclasses
      return this.toObject(propertiesToInclude);
    },

    /* _TO_SVG_START_ */
    /**
     * Returns styles-string for svg-export
     * @return {String}
     */
    getSvgStyles: function() {

      var fill = this.fill
        ? (this.fill.toLive ? 'url(#SVGID_' + this.fill.id + ')' : this.fill)
        : 'none';

      var stroke = this.stroke
        ? (this.stroke.toLive ? 'url(#SVGID_' + this.stroke.id + ')' : this.stroke)
        : 'none';

      var strokeWidth = this.strokeWidth ? this.strokeWidth : '0';
      var strokeDashArray = this.strokeDashArray ? this.strokeDashArray.join(' ') : '';
      var strokeLineCap = this.strokeLineCap ? this.strokeLineCap : 'butt';
      var strokeLineJoin = this.strokeLineJoin ? this.strokeLineJoin : 'miter';
      var strokeMiterLimit = this.strokeMiterLimit ? this.strokeMiterLimit : '4';
      var opacity = typeof this.opacity !== 'undefined' ? this.opacity : '1';

      var visibility = this.visible ? '' : " visibility: hidden;";
      var filter = this.shadow && this.type !== 'text' ? 'filter: url(#SVGID_' + this.shadow.id + ');' : '';

      return [
        "stroke: ", stroke, "; ",
        "stroke-width: ", strokeWidth, "; ",
        "stroke-dasharray: ", strokeDashArray, "; ",
        "stroke-linecap: ", strokeLineCap, "; ",
        "stroke-linejoin: ", strokeLineJoin, "; ",
        "stroke-miterlimit: ", strokeMiterLimit, "; ",
        "fill: ", fill, "; ",
        "opacity: ", opacity, ";",
        filter,
        visibility
      ].join('');
    },

    /**
     * Returns transform-string for svg-export
     * @return {String}
     */
    getSvgTransform: function() {
      var angle = this.getAngle();
      var center = this.getCenterPoint();

      var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;

      var translatePart = "translate(" +
                            toFixed(center.x, NUM_FRACTION_DIGITS) +
                            " " +
                            toFixed(center.y, NUM_FRACTION_DIGITS) +
                          ")";

      var anglePart = angle !== 0
        ? (" rotate(" + toFixed(angle, NUM_FRACTION_DIGITS) + ")")
        : '';

      var scalePart = (this.scaleX === 1 && this.scaleY === 1)
        ? '' :
        (" scale(" +
          toFixed(this.scaleX, NUM_FRACTION_DIGITS) +
          " " +
          toFixed(this.scaleY, NUM_FRACTION_DIGITS) +
        ")");

      var flipXPart = this.flipX ? "matrix(-1 0 0 1 0 0) " : "";
      var flipYPart = this.flipY ? "matrix(1 0 0 -1 0 0)" : "";

      return [ translatePart, anglePart, scalePart, flipXPart, flipYPart ].join('');
    },

    _createBaseSVGMarkup: function() {
      var markup = [ ];

      if (this.fill && this.fill.toLive) {
        markup.push(this.fill.toSVG(this, false));
      }
      if (this.stroke && this.stroke.toLive) {
        markup.push(this.stroke.toSVG(this, false));
      }
      if (this.shadow) {
        markup.push(this.shadow.toSVG(this));
      }
      return markup;
    },
    /* _TO_SVG_END_ */

    /**
     * @private
     * @param {Object} object
     */
    _removeDefaultValues: function(object) {
      fabric.Object.stateProperties.forEach(function(prop) {
        if (object[prop] === this.constructor.prototype[prop]) {
          delete object[prop];
        }
      }, this);
      return object;
    },

    /**
     * Returns a string representation of an instance
     * @return {String}
     */
    toString: function() {
      return "#<fabric." + capitalize(this.type) + ">";
    },

    /**
     * Basic getter
     * @param {String} property
     * @return {Any} value of a property
     */
    get: function(property) {
      return this[property];
    },

    /**
     * Sets property to a given value. When changing position/dimension -related properties (left, top, scale, angle, etc.) `set` does not update position of object's borders/controls. If you need to update those, call `setCoords()`.
     * @param {String|Object} key (if object, iterate over the object properties)
     * @param {Object|Function} value (if function, the value is passed into it and its return value is used as a new one)
     * @return {fabric.Object} thisArg
     * @chainable
     */
    set: function(key, value) {
      if (typeof key === 'object') {
        for (var prop in key) {
          this._set(prop, key[prop]);
        }
      }
      else {
        if (typeof value === 'function' && key !== 'clipTo') {
          this._set(key, value(this.get(key)));
        }else{
          this._set(key, value);
        }
      }
      return this;
    },

    getObjectsByPath: function(path){
      var temp = this;
      var ret=[];
      for(var i=0; i<path.length&&temp; i++){
        temp = temp[path[i]];
        ret.push(temp);
      }
      return ret;
    },

    getObjectByPath: function(path){
      var ret=this;
      for(var i=0; i<path.length&&ret; i++){
        ret = ret[path[i]];
      }
      return ret;
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     * @return {fabric.Object} thisArg
     */
    _set: function(key, value) {
      var shouldConstrainValue = (key === 'scaleX' || key === 'scaleY');

      if (shouldConstrainValue) {
        value = this._constrainScale(value);
      }
      if (key === 'scaleX' && value < 0) {
        this.flipX = !this.flipX;
        value *= -1;
      }
      else if (key === 'scaleY' && value < 0) {
        this.flipY = !this.flipY;
        value *= -1;
      }
      else if (key === 'width' || key === 'height') {
        this.minScaleLimit = toFixed(Math.min(0.1, 1/Math.max(this.width, this.height)), 2);
      }
      else if(key==='curvePercentage'){
        this.attachedToCurve.setObjectToPointAtRelativeLength(this,value);
      }
      else if (key === 'shadow' && value && !(value instanceof fabric.Shadow)) {
        value = new fabric.Shadow(value);
      }

      if(this[key]!==value){
        this[key] = value;
        if(key in {top:1,left:1,scaleX:1,scaleY:1}){
          this._cacheLocalTransformMatrix();
        }
        if(key in {angle:1,rotationX:1,rotationY:1}){
          this.rotate(this.angle||0,this.rotationX||0,this.rotationY||0);
        }
      }


      return this;
    },

    _cacheLocalTransformMatrix : function(){
      var m = [1,0,0,1,0,0];
      if(this.left || this.top){
        m = matmult(m,[1,0,0,1,this.left,this.top]);
      }
      var sx = this.scaleX * (this.flipX ? -1 : 1), sy = this.scaleY * (this.flipY ? -1 : 1);
      if((sx!==1)||(sy!==1)){
        m = matmult(m,[sx,0,0,sy,0,0]);
      }
      var rp = this.rotationParams;
      if(rp){
        m = matmult(m,[rp.cos,rp.sin,-rp.sin,rp.cos,rp.x,-rp.y]);
        m = matmult(m,[1,0,0,1,-rp.x,rp.y]);
      }
      this._localTransformationMatrix = m;
    },

    /**
     * Toggles specified property from `true` to `false` or from `false` to `true`
     * @param {String} property property to toggle
     * @return {fabric.Object} thisArg
     * @chainable
     */
    toggle: function(property) {
      var value = this.get(property);
      if (typeof value === 'boolean') {
        this.set(property, !value);
      }
      return this;
    },

    /**
     * Sets sourcePath of an object
     * @param {String} value Value to set sourcePath to
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setSourcePath: function(value) {
      this.sourcePath = value;
      return this;
    },

    drawBorderRect : function(ctx){
      if(!this.oCoords){return;}
      if( (this.oCoords.br.x-this.oCoords.tl.x) >= 0 &&
          (this.oCoords.br.y-this.oCoords.tl.y) >= 0){
        ctx.strokeStyle = this.borderRectColor;
        ctx.strokeRect(
          this.oCoords.tl.x,
          this.oCoords.tl.y,
          this.oCoords.br.x-this.oCoords.tl.x,
          this.oCoords.br.y-this.oCoords.tl.y
        );
      }else{
        console.log('invalid border rect',this.oCoords.tl,this.oCoords.br);
      }
    },

    /**
     * Renders an object on a specified context
     * @param {CanvasRenderingContext2D} ctx context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, topctx) {
      // do not render if width/height are zeros or object is not visible
      //if (this.width === 0 || this.height === 0 || !this.visible) return;
      if (!this.visible) return;
      if (this.opacity===0) return;
      if (this.display==='none') return;
      if(this._cache.global_content){
        this._cache.global_content.render(ctx);
        return;
      }
      //var _render_start = (new Date()).getTime();
      //console.log(this.type,this.id,'starts render');

      ctx.save();

      this.transform(ctx); //there is a special ctx.save in this call


      if(topctx){
        this.drawBorderRect(topctx);
      }

      //this._setShadow(ctx);
      //this.clipTo && fabric.util.clipContext(this, ctx);

      if(this._cache.local_content){
				ctx.transform.apply(ctx,this._cache.local_content_transformation);
        this._cache.local_content.render(ctx);
				ctx.restore();
			}else{
				this._render(ctx, topctx);
				//this.clipTo && ctx.restore();
				ctx.restore();
				if(!ctx.suppressPaint){
					this._paint(ctx);
				}
				this._removeShadow(ctx);
			}

      //var utstart = (new Date()).getTime();
      this.untransform(ctx,topctx);
      //console.log('\t\t','untransform done in',(((new Date()).getTime()) - utstart));
      //console.log('\t',this.type,this.id,'rendered in', (((new Date()).getTime()) - _render_start));
      this.finalizeRender(ctx);

			if (this.shouldRasterize) {
				delete this.shouldRasterize;
				var obj = this.getRasterizationObject();
				var lm = obj._localTransformationMatrix;
				var w = obj.get('width');
				var h = obj.get('height');
				console.log('will rasterize, height ',h,'width', w, obj.id);

				var offel = fabric.document.createElement('canvas');
				offel.width = Math.ceil(w*fabric.backingScale);
				offel.height = Math.ceil(h*fabric.backingScale);

				var lctx = offel.getContext('2d');
				lctx._currentTransform = [1,0,0,1,0,0];

				/// small but very obvious correction .... Why? It appears that canvas will floor down width/height numbers creating a pure integer sized canvas, and this 'move bit up and right' correction affects sprite to be positioned correct enough .... but that is just an assumption ...
				var off_matrix = [1,0,0,1,(Math.ceil(w)-w)/2,-(Math.ceil(h)-h)/2]; 
				off_matrix = fabric.util.multiplyTransformMatrices(off_matrix,fabric.util.matrixInverse(obj._currentGlobalTransform));
				off_matrix = fabric.util.multiplyTransformMatrices(off_matrix, this._currentGlobalTransform);
				lctx.transform.apply(lctx,off_matrix);
				this.render(lctx);

				var rc = !this._cache.local_content;
				this._cache.local_content = new fabric.Sprite(offel,{x:0, y:0, width:w, height:h});

				this._cache.local_content_transformation = lm;
				rc ? this.fire ('raster:created', this._cache.local_content) : this.fire ('raster:changed', this._cache.local_content);
			}
    },

    accountForGradientTransform: function(p1,p2){},

    _paint : function(ctx){
    },

    finalizeRender: function(ctx){
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _setShadow: function(ctx) {
      if (!this.shadow) return;

      ctx.shadowColor = this.shadow.color;
      ctx.shadowBlur = this.shadow.blur;
      ctx.shadowOffsetX = this.shadow.offsetX;
      ctx.shadowOffsetY = this.shadow.offsetY;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _removeShadow: function(ctx) {
      ctx.shadowColor = '';
      ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderFill: function(ctx) {
      if(this.fill==='none'){return;}
      if (!this.fill || '' === this.fill) ctx.fillStyle = this.fill;
      ctx.fill();
      if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderStroke: function(ctx) {

      if (this.strokeDashArray && this.strokeDashArray!=='none') {
        // Spec requires the concatenation of two copies the dash list when the number of elements is odd
        if (1 & this.strokeDashArray.length) {
          this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
        }

        if (supportsLineDash) {
          ctx.setLineDash(this.strokeDashArray);
          this._stroke && this._stroke(ctx);
        }
        else {
          this._renderDashedStroke && this._renderDashedStroke(ctx);
        }
        ctx.stroke();
      }
      else {
        if(this._stroke){
          this._stroke(ctx);
        }else{
          if(this.stroke){
            ctx.stroke();
          }
        }
      }
      this._removeShadow(ctx);
    },

    /**
     * Clones an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the outpu
     * @return {fabric.Object} clone of an instance
     */
    clone: function(propertiesToInclude) {
      if (this.constructor.fromObject) {
        return this.constructor.fromObject(this.toObject(propertiesToInclude));
      }else{
        new fabric.Object(this.toObject(propertiesToInclude));
      }
    },

    /**
     * Creates an instance of fabric.Image out of an object
     * @param callback {Function} callback, invoked with an instance as a first argument
     * @return {fabric.Object} thisArg
     */
    cloneAsImage: function(callback) {
      var dataUrl = this.toDataURL();
      fabric.util.loadImage(dataUrl, function(img) {
        if (callback) {
          callback(new fabric.Image(img));
        }
      });
      return this;
    },

    /**
     * Converts an object into a data-url-like string
     * @param {Object} options Options object
     *
     *  `format` the format of the output image. Either "jpeg" or "png".
     *  `quality` quality level (0..1)
     *  `multiplier` multiplier to scale by {Number}
     *
     * @return {String} data url representing an image of this object
     */
    toDataURL: function(options) {
      options || (options = { });

      var el = fabric.util.createCanvasElement();
      el.width = this.getBoundingRectWidth();
      el.height = this.getBoundingRectHeight();

      fabric.util.wrapElement(el, 'div');

      var canvas = new fabric.Canvas(el);
      if (options.format === 'jpeg') {
        canvas.backgroundColor = '#fff';
      }

      var origParams = {
        active: this.get('active'),
        left: this.getLeft(),
        top: this.getTop()
      };

      this.set({
        'active': false,
        left: el.width / 2,
        top: el.height / 2
      });

      canvas.add(this);
      var data = canvas.toDataURL(options);

      this.set(origParams).setCoords();

      canvas.dispose();
      canvas = null;

      return data;
    },

    /**
     * Returns true if specified type is identical to the type of an instance
     * @param type {String} type to check against
     * @return {Boolean}
     */
    isType: function(type) {
      return this.type === type;
    },

    /**
     * Makes object's color grayscale
     * @return {fabric.Object} thisArg
     */
    toGrayscale: function() {
      var fillValue = this.get('fill');
      if (fillValue) {
        this.set('overlayFill', new fabric.Color(fillValue).toGrayscale().toRgb());
      }
      return this;
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 0;
    },

    /**
     * Returns a JSON representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} JSON
     */
    toJSON: function(propertiesToInclude) {
      // delegate, not alias
      return this.toObject(propertiesToInclude);
    },

    /**
     * Sets gradient (fill or stroke) of an object
     * <b>Backwards incompatibility note:</b> This method was named "setGradientFill" until v1.1.0
     * @param {String} property Property name 'stroke' or 'fill'
     * @param {Object} [options] Options object
     */
    setGradient: function(property, options) {
      options || (options = { });

      var gradient = {colorStops: []};

      gradient.type = options.type || (options.r1 || options.r2 ? 'radial' : 'linear');
      gradient.coords = {
        x1: options.x1,
        y1: options.y1,
        x2: options.x2,
        y2: options.y2
      };

      if (options.r1 || options.r2) {
        gradient.coords.r1 = options.r1;
        gradient.coords.r2 = options.r2;
      }

      for (var position in options.colorStops) {
        var color = new fabric.Color(options.colorStops[position]);
        gradient.colorStops.push({offset: position, color: color.toRgb(), opacity: color.getAlpha()});
      }

      this.set(property, fabric.Gradient.forObject(this, gradient));
    },

    /**
     * Sets pattern fill of an object
     * @param {Object} [options] Options object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setPatternFill: function(options) {
      return this.set('fill', new fabric.Pattern(options));
    },

    /**
     * Sets shadow of an object
     * @param {Object|String} [options] Options object or string (e.g. "2px 2px 10px rgba(0,0,0,0.2)")
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setShadow: function(options) {
      return this.set('shadow', new fabric.Shadow(options));
    },

    /**
     * Centers object horizontally on canvas to which it was added last.
     * You might need to call `setCoords` on an object after centering, to update controls area.
     * @return {fabric.Object} thisArg
     */
    centerH: function () {
      this.canvas.centerObjectH(this);
      return this;
    },

    /**
     * Centers object vertically on canvas to which it was added last.
     * You might need to call `setCoords` on an object after centering, to update controls area.
     * @return {fabric.Object} thisArg
     * @chainable
     */
    centerV: function () {
      this.canvas.centerObjectV(this);
      return this;
    },

    /**
     * Centers object vertically and horizontally on canvas to which is was added last
     * You might need to call `setCoords` on an object after centering, to update controls area.
     * @return {fabric.Object} thisArg
     * @chainable
     */
    center: function () {
      return this.centerH().centerV();
    },

    /**
     * Removes object from canvas to which it was added last
     * @return {fabric.Object} thisArg
     * @chainable
     */
    remove: function() {
      return this.canvas.remove(this);
    },

    /**
     * Moves an object to the bottom of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendToBack: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendToBack.call(this.group, this);
      }
      else {
        this.canvas.sendToBack(this);
      }
      return this;
    },

    /**
     * Moves an object to the top of the stack of drawn objects
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringToFront: function() {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringToFront.call(this.group, this);
      }
      else {
        this.canvas.bringToFront(this);
      }
      return this;
    },

    /**
     * Moves an object down in stack of drawn objects
     * @param intersecting {Boolean} If `true`, send object behind next lower intersecting object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    sendBackwards: function(intersecting) {
      if (this.group) {
        fabric.StaticCanvas.prototype.sendBackwards.call(this.group, this, intersecting);
      }
      else {
        this.canvas.sendBackwards(this, intersecting);
      }
      return this;
    },

    /**
     * Moves an object up in stack of drawn objects
     * @param intersecting {Boolean} If `true`, send object in front of next upper intersecting object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    bringForward: function(intersecting) {
      if (this.group) {
        fabric.StaticCanvas.prototype.bringForward.call(this.group, this, intersecting);
      }
      else {
        this.canvas.bringForward(this, intersecting);
      }
      return this;
    },

    /**
     * Moves an object to specified level in stack of drawn objects
     * @param {Number} index New position of object
     * @return {fabric.Object} thisArg
     * @chainable
     */
    moveTo: function(index) {
      if (this.group) {
        fabric.StaticCanvas.prototype.moveTo.call(this.group, this, index);
      }
      else {
        this.canvas.moveTo(this, index);
      }
      return this;
    },
    isVisible: function(){
      return this.opacity>0 && this.display!=='none' && this.visible;
    },
    /**
     * Shows an object and fires shown event
     * @return {fabric.Object} thisArg
     * @chainable
     */
    show: function (options) {
      if(typeof options !== 'object'){
        this.set({'opacity':1, 'display':'inline', 'visible': true});
        this.fire ('object:shown');
        return this;
      }
      this.set({opacity:0, display:'inline', visible:true});
      var oc = options.onComplete;
      this.animate({opacity:1},{onComplete:function(){
        oc&&oc.call(this);
      }});
      return this;
    },
    /**
     * Hides an object and fires hidden event
     * @return {fabric.Object} thisArg
     * @chainable
     */
    hide : function(options) {
      if(typeof options !== 'object'){
        this.set({'opacity':0, 'display':'none', 'visible': false});
        this.fire ('object:hidden');
        return this;
      }
      var oc = options.onComplete;
      this.animate({opacity:0},{onComplete:function(){
        this.hide();
        oc && oc.call(this);
      }});
      return this;
    },

		/** Get object to be rasterized once rasterize method is called 
		 * @return {fabric.Object}
		 * @chainable
		**/
		getRasterizationObject : function () {
			return this;
		},

		rasterize : function () {
			this.shouldRasterize=true;
			this.invokeOnCanvas('renderAll');
		},

		setRasterArea : function (area_params, lc_props) {
			if (!this._cache.local_content) return;
			this._cache.local_content.setRasterArea(area_params, lc_props);
			this.invokeOnCanvas('renderAll');
		}
  });
  /**
   * List of properties to consider when checking if state
   * of an object is changed (fabric.Object#hasStateChanged)
   * as well as for history (undo/redo) purposes
   * @type Array
   */
  fabric.Object.prototype.stateProperties =  (
      'top left width height scaleX scaleY flipX flipY originX originY transformMatrix ' +
      'stroke strokeWidth strokeDashArray strokeLineCap strokeLineJoin strokeMiterLimit ' +
      'angle opacity fill fillRule overlayFill shadow clipTo visible'
    ).split(' ');


  fabric.util.createAccessors(fabric.Object);

  /**
   * Alias for {@link fabric.Object.prototype.setAngle}
   * @alias rotate -> setAngle
   * @memberof fabric.Object
   */
  fabric.Object.prototype.rotate = fabric.Object.prototype.setAngle;

  extend(fabric.Object.prototype, fabric.Observable);

  /**
   * Defines the number of fraction digits when serializing object values. You can use it to increase/decrease precision of such values like left, top, scaleX, scaleY, etc.
   * @static
   * @memberof fabric.Object
   * @constant
   * @type Number
   */
  fabric.Object.NUM_FRACTION_DIGITS = 2;

  /**
   * @static
   * @memberof fabric.Object
   * @type Number
   */
  fabric.Object.__uid = 0;

})(typeof exports !== 'undefined' ? exports : this);
