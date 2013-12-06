(function(){

  var cursorMap = [
      'n-resize',
      'ne-resize',
      'e-resize',
      'se-resize',
      's-resize',
      'sw-resize',
      'w-resize',
      'nw-resize'
  ],
  cursorOffset = {
    'mt': 0, // n
    'tr': 1, // ne
    'mr': 2, // e
    'br': 3, // se
    'mb': 4, // s
    'bl': 5, // sw
    'ml': 6, // w
    'tl': 7 // nw
  },
  addListener = fabric.util.addListener,
  removeListener = fabric.util.removeListener,
  getPointer = fabric.util.getPointer;

  function canvasPositionEventListener(canvas,eventname,eventalias) {
    var cnvas=canvas, 
    cnvasel,
    evntname = eventname, 
    evntalias = eventalias;
    /*
    if(eventalias==='mouse:up'){
      cnvasel = fabric.window.document.getElementsByTagName('body')[0];
    }else{
      */
      cnvasel = cnvas.upperCanvasEl; 
    //}
    var evnthandler = function(e){
      e.preventDefault();
      var p = getPointer(e,cnvasel);
      p.x = p.x - cnvas._offset.left;
      p.y = p.y - cnvas._offset.top;
      if(fabric.masterScale){
        p.x/=fabric.masterScale;
        p.y/=fabric.masterScale;
      }
      if(fabric.backingScale!=1){
        p.x*=fabric.backingScale;
        p.y*=fabric.backingScale;
      }
      console.log(eventalias);
      switch(eventalias){
        case 'mouse:down':
          p.listeners=[];
          break;
        default:
          p.listeners=cnvas.currentListeners||[];
          break;
      }
      setTimeout(function(){
        cnvas.distributePositionEvent(p,evntalias);
        switch(eventalias){
          case 'mouse:up':
            cnvas.currentListeners=[];
            break;
          default:
            cnvas.currentListeners=p.listeners;
            break;
        }
      },1);
    };
    addListener(cnvasel, evntname, evnthandler);
    cnvas._positionEventDisposers[evntname] = function(){
      removeListener(cnvasel,eventname,evnthandler);
      delete cnvas._positionEventDisposers[evntname];
    };
  };

  fabric.util.object.extend(fabric.Canvas.prototype, /** @lends fabric.Canvas.prototype */ {

    /**
     * Adds mouse listeners to canvas
     * @private
     */
    _positionEventDisposers: {},
    _initEvents: function () {
      var _this = this;

      this._onResize = this._onResize.bind(this);

      this._onGesture = function(e, s) {
        _this.__onTransformGesture(e, s);
      };

      addListener(fabric.window, 'resize', this._onResize);

      if (fabric.isTouchSupported) {
        canvasPositionEventListener(this,'touchstart','mouse:down');
        canvasPositionEventListener(this,'touchmove','mouse:move');
        canvasPositionEventListener(this,'touchend','mouse:up');

        if (typeof Event !== 'undefined' && 'add' in Event) {
          Event.add(this.upperCanvasEl, 'gesture', this._onGesture);
        }
      }
      else {
        canvasPositionEventListener(this,'mousedown','mouse:down');
        canvasPositionEventListener(this,'mousemove','mouse:move');
        canvasPositionEventListener(this,'mouseup','mouse:up');
      }
    },

    /**
     * Clears a canvas element and removes all event handlers.
     * @return {fabric.Canvas} thisArg
     * @chainable
     */
    dispose: function () {
      this.clear();

      if (!this.interactive) return this;

      if (fabric.isTouchSupported) {
        this._positionEventDisposers['touchstart']();
        this._positionEventDisposers['touchmove']();
        this._positionEventDisposers['touchend']();
        if (typeof Event !== 'undefined' && 'remove' in Event) {
          Event.remove(this.upperCanvasEl, 'gesture', this._onGesture);
        }
      }
      else {
        this._positionEventDisposers['mousedown']();
        this._positionEventDisposers['mousemove']();
        this._positionEventDisposers['mouseup']();
        removeListener(fabric.window, 'resize', this._onResize);
      }
      return this;
    },

    /**
     * @private
     * @param {Event} e Event object fired on mousedown
     */
    _onMouseDown: function (e) {
      this.__onMouseDown(e);

      !fabric.isTouchSupported && addListener(fabric.document, 'mouseup', this._onMouseUp);
      fabric.isTouchSupported && addListener(fabric.document, 'touchend', this._onMouseUp);

      !fabric.isTouchSupported && addListener(fabric.document, 'mousemove', this._onMouseMove);
      fabric.isTouchSupported && addListener(fabric.document, 'touchmove', this._onMouseMove);

      !fabric.isTouchSupported && removeListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      fabric.isTouchSupported && removeListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
    },

    /**
     * @private
     * @param {Event} e Event object fired on mouseup
     */
    _onMouseUp: function (e) {
      this.__onMouseUp(e);

      !fabric.isTouchSupported && removeListener(fabric.document, 'mouseup', this._onMouseUp);
      fabric.isTouchSupported && removeListener(fabric.document, 'touchend', this._onMouseUp);

      !fabric.isTouchSupported && removeListener(fabric.document, 'mousemove', this._onMouseMove);
      fabric.isTouchSupported && removeListener(fabric.document, 'touchmove', this._onMouseMove);

      !fabric.isTouchSupported && addListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      fabric.isTouchSupported && addListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
    },

    /**
     * @private
     * @param {Event} e Event object fired on mousemove
     */
    _onMouseMove: function (e) {
      !this.allowTouchScrolling && e.preventDefault && e.preventDefault();
      this.__onMouseMove(e);
    },

    /**
     * @private
     */
    _onResize: function () {
      if(this.autoresize){
        this._applyWrapperStyle(this.wrapperEl);
        this._applyCanvasStyle(this.lowerCanvasEl);
        if(this.upperCanvasEl){
          this._applyCanvasStyle(this.upperCanvasEl);
        }
        this._computeMasterScale();
      }
      this.calcOffset();
      fabric.staticLayerManager.refresh();
      this.renderAll();
    },

    /**
     * Sets the cursor depending on where the canvas is being hovered.
     * Note: very buggy in Opera
     * @param {Event} e Event object
     * @param {Object} target Object that the mouse is hovering, if so.
     */
    _setCursorFromEvent: function (e, target) {
      var s = this.upperCanvasEl.style;
      if (!target) {
        s.cursor = this.defaultCursor;
        return false;
      }
      else {
        var activeGroup = this.getActiveGroup();
        // only show proper corner when group selection is not active
        var corner = target._findTargetCorner
                      && (!activeGroup || !activeGroup.contains(target))
                      && target._findTargetCorner(e, this._offset);

        if (!corner) {
          s.cursor = target.hoverCursor || this.hoverCursor;
        }
        else {
          if (corner in cursorOffset) {
            var n = Math.round((target.getAngle() % 360) / 45);
            if (n<0) {
              n += 8; // full circle ahead
            }
            n += cursorOffset[corner];
            // normalize n to be from 0 to 7
            n %= 8;
            s.cursor = cursorMap[n];
          }
          else if (corner === 'mtr' && target.hasRotatingPoint) {
            s.cursor = this.rotationCursor;
          }
          else {
            s.cursor = this.defaultCursor;
            return false;
          }
        }
      }
      return true;
    }
  });

  fabric.backingScale = 1;
  if ('devicePixelRatio' in window) {
    if (window.devicePixelRatio != 1) {
      fabric.backingScale = window.devicePixelRatio;
    }
  }
  console.log(fabric.backingScale);
})();
