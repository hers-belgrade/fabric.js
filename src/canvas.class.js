(function() {

  var getPointer = fabric.util.getPointer,
      degreesToRadians = fabric.util.degreesToRadians,
      radiansToDegrees = fabric.util.radiansToDegrees,
      atan2 = Math.atan2,
      abs = Math.abs,
      min = Math.min,
      max = Math.max,

			isDefined = fabric.util.isDefined,
      STROKE_OFFSET = 0.5;

  /**
   * Canvas class
   * @class fabric.Canvas
   * @extends fabric.StaticCanvas
   */
  fabric.Canvas = fabric.util.createClass(fabric.StaticCanvas, /** @lends fabric.Canvas.prototype */ {

    /**
     * Constructor
     * @param {HTMLElement | String} el &lt;canvas> element to initialize instance on
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(el, options) {
      options || (options = { });
      for(var i in options){
        this[i] = options[i];
      }
      this.id = ('string' === typeof(el)) ? el : fabric.document.getElementById(el).getAttribute('id');

      this._initStatic(el, options);
      this._initInteractive();

      fabric.Canvas.activeInstance = this;
      fabric.activeCanvasInstance = this;
      this.goRender();
    },

    /**
     * When true, objects can be transformed by one side (unproportionally)
     * @type Boolean
     * @default
     */
    uniScaleTransform:      false,

    /**
     * When true, objects use center point as the origin of transformation
     * @type Boolean
     * @default
     */
    centerTransform:        false,

    /**
     * Indicates that canvas is interactive. This property should not be changed.
     * @type Boolean
     * @default
     */
    interactive:            true,

    /**
     * Indicates whether group selection should be enabled
     * @type Boolean
     * @default
     */
    selection:              true,

    /**
     * Color of selection
     * @type String
     * @default
     */
    selectionColor:         'rgba(100, 100, 255, 0.3)', // blue

    /**
     * Default dash array pattern
     * If not empty the selection border is dashed
     * @type Array
     */
    selectionDashArray:      [ ],

    /**
     * Color of the border of selection (usually slightly darker than color of selection itself)
     * @type String
     * @default
     */
    selectionBorderColor:   'rgba(255, 255, 255, 0.3)',

    /**
     * Width of a line used in object/group selection
     * @type Number
     * @default
     */
    selectionLineWidth:     1,

    /**
     * Default cursor value used when moving an object on canvas
     * @type String
     * @default
     */
    moveCursor:             'move',

    /**
     * Default cursor value used for the entire canvas
     * @type String
     * @default
     */
    defaultCursor:          'default',

    /**
     * Cursor value used for rotation point
     * @type String
     * @default
     */
    rotationCursor:         'crosshair',

    /**
     * Default element class that's given to wrapper (div) element of canvas
     * @type String
     * @default
     */
    containerClass:        'canvas-container',

    /**
     * When true, object detection happens on per-pixel basis rather than on per-bounding-box
     * @type Boolean
     * @default
     */
    perPixelTargetFind:     false,

    /**
     * Number of pixels around target pixel to tolerate (consider active) during object detection
     * @type Number
     * @default
     */
    targetFindTolerance:    0,

    /**
     * When true, target detection is skipped when hovering over canvas. This can be used to improve performance.
     * @type Boolean
     * @default
     */
    skipTargetFind: false,

    /**
     * @private
     */
    _initInteractive: function() {
      this._currentTransform = null;
      this._initWrapperElement();
      this._createUpperCanvas();
      this._createDOMBackgroundSupport();
      this._initEvents();
    },

    /**
     * Resets the current transform to its original values and chooses the type of resizing based on the event
     * @private
     * @param {Event} e Event object fired on mousemove
     */
    _resetCurrentTransform: function(e) {
      var t = this._currentTransform;

      t.target.set('scaleX', t.original.scaleX);
      t.target.set('scaleY', t.original.scaleY);
      t.target.set('left', t.original.left);
      t.target.set('top', t.original.top);

      if (e.altKey || this.centerTransform || t.target.centerTransform) {
        if (t.originX !== 'center') {
          if (t.originX === 'right') {
            t.mouseXSign = -1;
          }
          else {
            t.mouseXSign = 1;
          }
        }
        if (t.originY !== 'center') {
          if (t.originY === 'bottom') {
            t.mouseYSign = -1;
          }
          else {
            t.mouseYSign = 1;
          }
        }

        t.originX = 'center';
        t.originY = 'center';
      }
      else {
        t.originX = t.original.originX;
        t.originY = t.original.originY;
      }
    },

    /**
     * Returns pointer coordinates relative to canvas.
     * @param {Event} e
     * @return {Object} object with "x" and "y" number values
     */
    getPointer: function (e) {
      var pointer = getPointer(e, this.upperCanvasEl);
      return {
        x: pointer.x - this._offset.left,
        y: pointer.y - this._offset.top
      };
    },
    reportBackgroundImages : function (map, resource_name) {
      if (!this._backgrounds) this._backgrounds = {};
      for (var name in map) {
        var selector = "fabric_"+this.id+"_"+resource_name+"_"+name;
        var img = new fabric.StandardImage(null, (new Image()));
        img.setSrc(map[name]);
        this._backgrounds[selector] = new fabric.Image(img);
      }
      return;


      if (!this._dom_background_style) return;
      for (var name in map) {
        var selector = "fabric_"+this.id+"_"+resource_name+"_"+name;
        var s = fabric.document.getElementById('fabric_style_el_'+selector);
        if (!s) {
          s = fabric.document.createElement('style');
          s.setAttribute('id', selector);
          this._dom_background_style.appendChild(s);
        }

        s.sheet.insertRule("."+selector+" { background-image: url("+map[name]+"); }",0);
      }
    },

    setBackground : function (resource_name, name) {
      if (!this._backgrounds) return;
      this._active_background = this._backgrounds['fabric_'+this.id+'_'+resource_name+'_'+name];
      return;
      var class_name = 'fabric_'+this.id+'_'+resource_name+'_'+name;
      fabric.util.replaceClass(this.lowerCanvasEl, this._dom_background_lower_current_class, class_name);
      this._dom_background_lower_current_class = class_name;
    },

    removeBackground : function () {
      delete this._active_background;
      return;
      fabric.util.removeClass(this.lowerCanvasEl, this._dom_background_lower_current_class);
      delete this._dom_background_lower_current_class;
    },

    _createDOMBackgroundSupport : function () {
      return;
      var style_id = this.id+'_dom_background_style';
      var style = fabric.document.getElementById(style_id);
      if (!style) {
        style = fabric.document.createElement('div');
        style.setAttribute('id', style_id);
        fabric.document.getElementsByTagName('body')[0].appendChild(style);

        var nm = fabric.document.createElement('style');
        nm.innerHTML = ".fabric_no_image {background-image: none;}\n";
        style.appendChild(nm);
      }

      fabric.util.setStyle(this.lowerCanvasEl, {
        'background-size': '100% 100%',
        'background-repeat':'none'
      });
      this._dom_background_style = style;
    },

    /**
     * @private
     * @param {HTMLElement|String} canvasEl Canvas element
     * @throws {CANVAS_INIT_ERROR} If canvas can not be initialized
     */
    _createUpperCanvas: function () {
      var lowerCanvasClass = this.lowerCanvasEl.className.replace(/\s*lower-canvas\s*/, '');

      this.upperCanvasEl = this._createCanvasElement();
      fabric.util.addClass(this.upperCanvasEl, 'upper-canvas ' + lowerCanvasClass);

      this.wrapperEl.appendChild(this.upperCanvasEl);

      this._copyCanvasStyle(this.lowerCanvasEl, this.upperCanvasEl);
      this._applyCanvasStyle(this.upperCanvasEl);
      this.contextTop = this.upperCanvasEl.getContext('2d');
    },

    /**
     * @private
     * @param {Number} width
     * @param {Number} height
     */
    _initWrapperElement: function () {
      this.wrapperEl = fabric.util.wrapElement(this.lowerCanvasEl, 'div', {
        'class': this.containerClass
      });
      this._applyWrapperStyle(this.wrapperEl);
    },

    _applyWrapperStyle: function(element){
      if(this.autoresize){
        //console.log('aws autoresize',this.getWidth(),this.getHeight());
        fabric.util.setStyle(element, {
          width: this.getWidth()+'px',//'100%',
          height: this.getHeight()+'px',//'100%',
          left:'0px',
          top:'0px',
          position: 'absolute'
        });
      }else{
        //console.log('aws',this.width,this.height);
        fabric.util.setStyle(element, {
          width: (this.width/fabric.backingScale) + 'px',
          height: (this.height/fabric.backingScale) + 'px',
          position: 'relative'
        });
      }
      fabric.util.makeElementUnselectable(element);
    },

    /**
     * @private
     * @param {Element} element
     */
    _applyCanvasStyle: function (element) {
			var ms = fabric.masterScale;
			var msz = fabric.masterSize;

			var width = 0;
			var height = 0;

			if (this.autoresize) {
				if (isDefined(msz) && isDefined(ms)) {
					width = msz.width*ms/fabric.backingScale;
					height = msz.height*ms/fabric.backingScale;
				}else{
          var pd = this._getParentDims();

					width = pd.width
					height =pd.height;
				}
			}else{
				width = this.getWidth()/fabric.backingScale || element.width;
				height= this.getHeight()/fabric.backingScale|| element.height;
			}
      var ss = {
        position: 'absolute',
        width: width + 'px',
        height: height + 'px',
        left: 0,
        top: 0
      };
      fabric.util.setStyle(element, ss);

      this.width = element.width = width*fabric.backingScale;
      this.height = element.height = height*fabric.backingScale;
      fabric.util.makeElementUnselectable(element);
      //console.log('now it is',element.width,element.height,element.style.width,element.style.height);
    },

    /**
     * Copys the the entire inline style from one element (fromEl) to another (toEl)
     * @private
     * @param {Element} fromEl Element style is copied from
     * @param {Element} toEl Element copied style is applied to
     */
    _copyCanvasStyle: function (fromEl, toEl) {
      toEl.style.cssText = fromEl.style.cssText;
    },

    /**
     * Returns context of canvas where object selection is drawn
     * @return {CanvasRenderingContext2D}
     */
    getSelectionContext: function() {
      return this.contextTop;
    },

    /**
     * Returns &lt;canvas> element on which object selection is drawn
     * @return {HTMLCanvasElement}
     */
    getSelectionElement: function () {
      return this.upperCanvasEl;
    }

  });

  // copying static properties manually to work around Opera's bug,
  // where "prototype" property is enumerable and overrides existing prototype
  for (var prop in fabric.StaticCanvas) {
    if (prop !== 'prototype') {
      fabric.Canvas[prop] = fabric.StaticCanvas[prop];
    }
  }

  /**
   * @class fabric.Element
   * @alias fabric.Canvas
   * @deprecated Use {@link fabric.Canvas} instead.
   * @constructor
   */
  fabric.Element = fabric.Canvas;
})();
