(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend,
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      invoke = fabric.util.array.invoke;

  if (fabric.Group) {
    return;
  }

  // lock-related properties, for use in fabric.Group#get
  // to enable locking behavior on group
  // when one of its objects has lock-related properties set
  var _lockProperties = {
    lockMovementX:  true,
    lockMovementY:  true,
    lockRotation:   true,
    lockScalingX:   true,
    lockScalingY:   true,
    lockUniScaling: true
  };

  /**
   * Group class
   * @class fabric.Group
   * @extends fabric.Object
   * @mixes fabric.Collection
   */
  fabric.Group = fabric.util.createClass(fabric.Object, fabric.Collection, /** @lends fabric.Group.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'group',

    borderRectColor:          '#00FF00',

    /**
     * Constructor
     * @param {Object} objects Group objects
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(objects, options) {
      options = options || { };

      this._objects = objects || [];
      for (var i = this._objects.length; i--; ) {
        var o = this._objects[i];
        this._checkObjectAdded(o);
        if(o.id){
          this[o.id] = o;
        }
        o.group = this;
      }

      this.originalState = { };
      this.callSuper('initialize');

      this._calcBounds();

      if (options) {
        extend(this, options);
      }

      this.setCoords(true);
      this.saveCoords();
    },

    /**
     * Returns string represenation of a group
     * @return {String}
     */
    toString: function() {
      return '#<fabric.Group: (' + this.complexity() + ')>';
    },

    /**
     * Returns an array of all objects in this group
     * @return {Array} group objects
     */
    getObjects: function() {
      return this._objects;
    },

    /**
     * Adds an object to a group; Then recalculates group's dimension, position.
     * @param {Object} object
     * @return {fabric.Group} thisArg
     * @chainable
     */
    addWithUpdate: function(object) {
      this._objects.push(object);
      object.group = this;
      // since _restoreObjectsState set objects inactive
      //this.forEachObject(function(o){ o.set('active', true); o.group = this; }, this);

      this.setCoords(true);
      this.saveCoords();
      return this;
    },

    /**
     * Removes an object from a group; Then recalculates group's dimension, position.
     * @param {Object} object
     * @return {fabric.Group} thisArg
     * @chainable
     */
    removeWithUpdate: function(object) {
      this._restoreObjectsState();
      // since _restoreObjectsState set objects inactive
      this.forEachObject(function(o){ o.set('active', true); o.group = this; }, this);

      this.remove(object);
      return this;
    },

    /**
     * @private
     */
    _onObjectAdded: function(object) {
      this._checkObjectAdded(object);
      object.group = this;
      if(object.id){
        this[object.id] = object;
      }
      this._calcBounds();
    },

    /**
     * @private
     */
    _onObjectRemoved: function(object) {
      delete object.group;
      object.set('active', false);
      this._calcBounds();
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      var objprops = propertiesToInclude ? propertiesToInclude.concat(['performCache']) : ['performCache'];
      var ret = extend(this.callSuper('toObject', ['anchorX','anchorY'].concat(propertiesToInclude)), {
        objects: invoke(this._objects, 'toObject', objprops)
      });
			return ret;
    },

    /**
     * Renders instance on a given context
     * @param {CanvasRenderingContext2D} ctx context to render instance on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render1: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      this.transform(ctx);

      var groupScaleFactor = Math.max(this.scaleX, this.scaleY);

      this.clipTo && fabric.util.clipContext(this, ctx);

      //The array is now sorted in order of highest first, so start from end.
      for (var i = 0, len = this._objects.length; i < len; i++) {

        var object = this._objects[i],
            originalScaleFactor = object.borderScaleFactor,
            originalHasRotatingPoint = object.hasRotatingPoint;

        // do not render if object is not visible
        if (!object.visible) continue;

        object.borderScaleFactor = groupScaleFactor;
        object.hasRotatingPoint = false;

        object.render(ctx);

        object.borderScaleFactor = originalScaleFactor;
        object.hasRotatingPoint = originalHasRotatingPoint;
      }
      this.clipTo && ctx.restore();

      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
      this.setCoords();
    },

    processPositionEvent : function(e,eventname){
      if(-1===this.callSuper('processPositionEvent',e,eventname)){
        return;
      }
      this.distributePositionEvent(e,eventname);
    },

    _extraTransformations: function(){
      if(this.anchorX || this.anchorY){
        return [1,0,0,1,-this.anchorX,-this.anchorY];
      }
    },

    _checkObjectAdded: function(obj){
      if(obj.performCache==='true'){
        this._clipper = obj;
      }
    },

    _renderContent: function(ctx,topctx){
      fabric.util.setTextFillAndStroke(ctx, this);
      fabric.util.setFontDeclaration(ctx, this);
      ctx.translate(-this.anchorX||0,-this.anchorY||0);
      for (var i = 0, len = this._objects.length; i < len; i++) {
        var object = this._objects[i];
        object.render(ctx, topctx);
      }
      this._calcBounds();
    },

    _render: function(ctx, topctx){
      if(this._clipper){
        if(!this._cachedImage){
          var canvas = fabric.util.createCanvasElement();
          var _ctx = canvas.getContext('2d');
          _ctx.width = this._clipper.width;
          _ctx.height = this._clipper.height;
          _ctx._currentTransform = [1,0,0,1,0,0];
          this._renderContent(_ctx);
          this._cachedImage = fabric.util.createImage();
          this._cachedImage.src = canvas.toDataURL();
        }
        ctx.drawImage(this._cachedImage,0,0,this._cachedImage.width,this._cachedImage.height);
      }else{
        this._renderContent(ctx,topctx);
      }
    },

    /**
     * Retores original state of each of group objects (original state is that which was before group was created).
     * @private
     * @return {fabric.Group} thisArg
     * @chainable
     */
    _restoreObjectsState: function() {
      return;
      this._objects.forEach(this._restoreObjectState, this);
      return this;
    },

    /**
     * Restores original state of a specified object in group
     * @private
     * @param {fabric.Object} object
     * @return {fabric.Group} thisArg
     */
    _restoreObjectState: function(object) {
      return;

      var groupLeft = this.get('left'),
          groupTop = this.get('top'),
          groupAngle = this.getAngle() * (Math.PI / 180),
          rotatedTop = Math.cos(groupAngle) * object.get('top') * this.get('scaleY') + Math.sin(groupAngle) * object.get('left') * this.get('scaleX'),
          rotatedLeft = -Math.sin(groupAngle) * object.get('top') * this.get('scaleY') + Math.cos(groupAngle) * object.get('left') * this.get('scaleX');

      object.setAngle(object.getAngle() + this.getAngle());

      object.set('left', groupLeft + rotatedLeft);
      object.set('top', groupTop + rotatedTop);

      object.set('scaleX', object.get('scaleX') * this.get('scaleX'));
      object.set('scaleY', object.get('scaleY') * this.get('scaleY'));

      object.setCoords();
      object.hasControls = object.__origHasControls;
      delete object.__origHasControls;
      object.set('active', false);
      object.setCoords();
      delete object.group;

      return this;
    },

    /**
     * Destroys a group (restoring state of its objects)
     * @return {fabric.Group} thisArg
     * @chainable
     */
    destroy: function() {
      return this._restoreObjectsState();
    },

    /**
     * Saves coordinates of this instance (to be used together with `hasMoved`)
     * @saveCoords
     * @return {fabric.Group} thisArg
     * @chainable
     */
    saveCoords: function() {
      return this;
      this._originalLeft = this.get('left');
      this._originalTop = this.get('top');
      return this;
    },

    /**
     * Checks whether this group was moved (since `saveCoords` was called last)
     * @return {Boolean} true if an object was moved (since fabric.Group#saveCoords was called)
     */
    hasMoved: function() {
      return this._originalLeft !== this.get('left') ||
             this._originalTop !== this.get('top');
    },

    /**
     * Sets coordinates of all group objects
     * @return {fabric.Group} thisArg
     * @chainable
     */
    setObjectsCoords: function() {
      this.forEachObject(function(object) {
        object.setCoords();
      });
      return this;
    },

    /**
     * @private
     */
    _calcBounds: function() {
      return;
      var aX = [],
          aY = [],
          minX, minY, maxX, maxY, o, width, height,
          i = 0,
          len = this._objects.length;

      for (; i < len; ++i) {
        o = this._objects[i];
        for (var prop in o.oCoords) {
          aX.push(o.oCoords[prop].x);
          aY.push(o.oCoords[prop].y);
        }
      }

      minX = min(aX);
      maxX = max(aX);
      minY = min(aY);
      maxY = max(aY);

      width = (maxX - minX) || 0;
      height = (maxY - minY) || 0;

      this.width = this.width || width;
      this.height = this.height || height;
      if(typeof minX==='number' && typeof minY==='number' && typeof maxX==='number' && typeof maxY==='number'){
        this.setCoords(new fabric.Point(minX,minY), new fabric.Point(maxY,maxY));
      }

      //this.left = (minX + width / 2) || 0;
      //this.top = (minY + height / 2) || 0;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var objectsMarkup = [ ];
      for (var i = this._objects.length; i--; ) {
        objectsMarkup.push(this._objects[i].toSVG());
      }

      return (
        '<g transform="' + this.getSvgTransform() + '">' +
          objectsMarkup.join('') +
        '</g>');
    },
    /* _TO_SVG_END_ */

  });

  /**
   * Returns {@link fabric.Group} instance from an object representation
   * @static
   * @memberOf fabric.Group
   * @param {Object} object Object to create a group from
   * @param {Object} [options] Options object
   * @return {fabric.Group} An instance of fabric.Group
   */
  fabric.Group.fromObject = function(object) {
    return new fabric.Group(fabric.util.enlivenObjects(object.objects),object);
  };

  /**
   * Indicates that instances of this type are async
   * @static
   * @memberOf fabric.Group
   * @type Boolean
   * @default
   */
  fabric.Group.async = true;
  fabric.Group.findChildGroups = function (s) {
    if (!s || !s._objects) return[];
    var ret = [];
    for (var i in s._objects) {
      if (s._objects[i].type === 'group') ret.push (s._objects[i]);
    }
    return ret;
  }


  ////TODO: PUT THIS IN SOME MORE GENERAL FORM !!!!
  fabric.Group.find = function (s, id) {
    if (s.id === id) return s;
    if (!s._objects) return undefined;

    for (var i in s._objects) {
      var r = fabric.Group.find(s._objects[i], id);
      if (r) return r;
    }
    return undefined;
  }

})(typeof exports !== 'undefined' ? exports : this);
