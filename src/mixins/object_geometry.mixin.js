(function() {

  var degreesToRadians = fabric.util.degreesToRadians;

  fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

    /**
     * Object containing coordinates of object's controls
     * @type Object
     * @default
     */
        
    oCoords: {tl:{x:0,y:0},tr:{x:0,y:0},br:{x:0,y:0},bl:{x:0,y:0}},

    /**
     * Checks if object intersects with an area formed by 2 points
     * @param {Object} pointTL top-left point of area
     * @param {Object} pointBR bottom-right point of area
     * @return {Boolean} true if object intersects with an area formed by 2 points
     */
    intersectsWithRect: function(pointTL, pointBR) {
      var oCoords = this.oCoords,
          tl = new fabric.Point(oCoords.tl.x, oCoords.tl.y),
          tr = new fabric.Point(oCoords.tr.x, oCoords.tr.y),
          bl = new fabric.Point(oCoords.bl.x, oCoords.bl.y),
          br = new fabric.Point(oCoords.br.x, oCoords.br.y);

      var intersection = fabric.Intersection.intersectPolygonRectangle(
        [tl, tr, br, bl],
        pointTL,
        pointBR
      );
      return intersection.status === 'Intersection';
    },

    /**
     * Checks if object intersects with another object
     * @param {Object} other Object to test
     * @return {Boolean} true if object intersects with another object
     */
    intersectsWithObject: function(other) {
      // extracts coords
      function getCoords(oCoords) {
        return {
          tl: new fabric.Point(oCoords.tl.x, oCoords.tl.y),
          tr: new fabric.Point(oCoords.tr.x, oCoords.tr.y),
          bl: new fabric.Point(oCoords.bl.x, oCoords.bl.y),
          br: new fabric.Point(oCoords.br.x, oCoords.br.y)
        };
      }
      var thisCoords = getCoords(this.oCoords),
          otherCoords = getCoords(other.oCoords);

      var intersection = fabric.Intersection.intersectPolygonPolygon(
        [thisCoords.tl, thisCoords.tr, thisCoords.br, thisCoords.bl],
        [otherCoords.tl, otherCoords.tr, otherCoords.br, otherCoords.bl]
      );

      return intersection.status === 'Intersection';
    },

    /**
     * Checks if object is fully contained within area of another object
     * @param {Object} other Object to test
     * @return {Boolean} true if object is fully contained within area of another object
     */
    isContainedWithinObject: function(other) {
      var boundingRect = other.getBoundingRect(),
          point1 = new fabric.Point(boundingRect.left, boundingRect.top),
          point2 = new fabric.Point(boundingRect.left + boundingRect.width, boundingRect.top + boundingRect.height);

      return this.isContainedWithinRect(point1, point2);
    },

    /**
     * Checks if object is fully contained within area formed by 2 points
     * @param {Object} pointTL top-left point of area
     * @param {Object} pointBR bottom-right point of area
     * @return {Boolean} true if object is fully contained within area formed by 2 points
     */
    isContainedWithinRect: function(pointTL, pointBR) {
      var boundingRect = this.getBoundingRect();

      return (
        boundingRect.left > pointTL.x &&
        boundingRect.left + boundingRect.width < pointBR.x &&
        boundingRect.top > pointTL.y &&
        boundingRect.top + boundingRect.height < pointBR.y
      );
    },

    /**
     * Checks if point is inside the object
     * @param {Object} point
     * @return {Boolean} true if point is inside the object
     */
    containsPoint: function(point) {
      if(!this.oCoords){return false;}
      var lines = this._getImageLines(this.oCoords),
          xPoints = this._findCrossPoints(point, lines);

      // if xPoints is odd then point is inside the object
      var ret = (xPoints !== 0 && xPoints % 2 === 1);
      if(!fabric.isTouchSupported){
        if(ret){
          if(!this.foundContaining){
            this.foundContaining=true;
            this.fire('object:over',{e:point});
            //console.log(this.oCoords.tl.x,this.oCoords.tl.y,this.oCoords.br.x,this.oCoords.br.y,'contains');
          }
        }else{
          if(this.foundContaining){
            delete this.foundContaining;
            this.fire('object:out',{e:point});
          }
        }
      }
      return ret;
    },

    /**
     * Method that returns an object with the object edges in it, given the coordinates of the corners
     * @private
     * @param {Object} oCoords Coordinates of the object corners
     */
    _getImageLines: function(oCoords) {
      return {
        topline: {
          o: oCoords.tl,
          d: oCoords.tr
        },
        rightline: {
          o: oCoords.tr,
          d: oCoords.br
        },
        bottomline: {
          o: oCoords.br,
          d: oCoords.bl
        },
        leftline: {
          o: oCoords.bl,
          d: oCoords.tl
        }
      };
    },

    /**
     * Helper method to determine how many cross points are between the 4 object edges
     * and the horizontal line determined by a point on canvas
     * @private
     * @param {Object} point
     * @param {Object} oCoords Coordinates of the image being evaluated
     */
    _findCrossPoints: function(point, oCoords) {
      var b1, b2, a1, a2, xi, yi,
          xcount = 0,
          iLine;

      for (var lineKey in oCoords) {
        iLine = oCoords[lineKey];
        // optimisation 1: line below point. no cross
        if ((iLine.o.y < point.y) && (iLine.d.y < point.y)) {
          continue;
        }
        // optimisation 2: line above point. no cross
        if ((iLine.o.y >= point.y) && (iLine.d.y >= point.y)) {
          continue;
        }
        // optimisation 3: vertical line case
        if ((iLine.o.x === iLine.d.x) && (iLine.o.x >= point.x)) {
          xi = iLine.o.x;
          yi = point.y;
        }
        // calculate the intersection point
        else {
          b1 = 0;
          b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
          a1 = point.y- b1 * point.x;
          a2 = iLine.o.y - b2 * iLine.o.x;

          xi = - (a1 - a2) / (b1 - b2);
          yi = a1 + b1 * xi;
        }
        // dont count xi < point.x cases
        if (xi >= point.x) {
          xcount += 1;
        }
        // optimisation 4: specific for square images
        if (xcount === 2) {
          break;
        }
      }
      return xcount;
    },

    /**
     * Returns width of an object's bounding rectangle
     * @deprecated since 1.0.4
     * @return {Number} width value
     */
    getBoundingRectWidth: function() {
      return this.getBoundingRect().width;
    },

    /**
     * Returns height of an object's bounding rectangle
     * @deprecated since 1.0.4
     * @return {Number} height value
     */
    getBoundingRectHeight: function() {
      return this.getBoundingRect().height;
    },

    /**
     * Returns coordinates of object's bounding rectangle (left, top, width, height)
     * @return {Object} Object with left, top, width, height properties
     */
    getBoundingRect: function() {
      this.oCoords || this.setCoords();

      var xCoords = [this.oCoords.tl.x, this.oCoords.tr.x, this.oCoords.br.x, this.oCoords.bl.x];
      var minX = fabric.util.array.min(xCoords);
      var maxX = fabric.util.array.max(xCoords);
      var width = Math.abs(minX - maxX);

      var yCoords = [this.oCoords.tl.y, this.oCoords.tr.y, this.oCoords.br.y, this.oCoords.bl.y];
      var minY = fabric.util.array.min(yCoords);
      var maxY = fabric.util.array.max(yCoords);
      var height = Math.abs(minY - maxY);

      return {
        left: minX,
        top: minY,
        width: width,
        height: height
      };
    },

    /**
     * Returns width of an object
     * @return {Number} width value
     */
    getWidth: function() {
      return this.width * this.scaleX;
    },

    /**
     * Returns height of an object
     * @return {Number} height value
     */
    getHeight: function() {
      return this.height * this.scaleY;
    },

    /**
     * Makes sure the scale is valid and modifies it if necessary
     * @private
     * @param {Number} value
     * @return {Number}
     */
    _constrainScale: function(value) {
      if (Math.abs(value) < this.minScaleLimit) {
        if (value < 0)
          return -this.minScaleLimit;
        else
          return this.minScaleLimit;
      }

      return value;
    },

    /**
     * Rotates an object for a given angle around a given point
     * @param angle {Number} angle in degrees
     * @param x {Number} x
     * @param y {Number} y
     * @return {fabric.Object} thisArg
     * @chainable
     */
    rotate: function(angle,x,y) {
      var rp = this.rotationParams || {angle:0,sin:0,cos:1,x:0,y:0};
      var a = rp.angle+fabric.util.degreesToRadians(angle);
      while(a>2*Math.PI){
        a-=2*Math.PI;
      }
      var sin=Math.sin(a),cos=Math.cos(a);
      this.rotationParams = {angle:a,sin:sin,cos:cos,x:x,y:y};
      this._cacheLocalTransformMatrix();
      return this;
    },

    /**
     * Scales an object to a given width, with respect to bounding box (scaling by x/y equally)
     * @param value {Number} new width value
     * @return {fabric.Object} thisArg
     * @chainable
     */
    scaleToWidth: function(value) {
      // adjust to bounding rect factor so that rotated shapes would fit as well
      var boundingRectFactor = this.getBoundingRectWidth() / this.getWidth();
      return this.scale(value / this.width / boundingRectFactor);
    },

    /**
     * Scales an object to a given height, with respect to bounding box (scaling by x/y equally)
     * @param value {Number} new height value
     * @return {fabric.Object} thisArg
     * @chainable
     */
    scaleToHeight: function(value) {
      // adjust to bounding rect factor so that rotated shapes would fit as well
      var boundingRectFactor = this.getBoundingRectHeight() / this.getHeight();
      return this.scale(value / this.height / boundingRectFactor);
    },

    processPositionEvent : function(e,eventname){
      if((!(this.visible && this.opacity>0))||(this.display==='none')){
        return -1; //void function returning -1 for child classes
      }
      if(this.containsPoint(e)){
        this.fire(eventname,{e:e});
      }
    },

		globalToLocal : function(globalpoint){
			return fabric.util.pointInSpace(fabric.util.matrixInverse(this._currentGlobalTransform),globalpoint);
		},

		localToGlobal : function(localpoint){
			return fabric.util.pointInSpace(this._currentGlobalTransform,localpoint);
		},

    globalScale : function(){
      var zerozero=this.globalToLocal(new fabric.Point(0,0));
      var oneone=this.globalToLocal(new fabric.Point(1,1));
      return {x:oneone.x-zerozero.x,y:oneone.y-zerozero.y};
    },

    containsGlobalPoint : function(globalpoint){
      var lp = globalToLocal(globalToLocal);
      return lp.x>0 && lp.x<this.width && lp.y>0 && lp.y<this.height;
    },

    /**
     * Sets corner position coordinates based on current angle, width and height
     * @return {fabric.Object} thisArg
     * @chainable
     */
    setCoords: function(tl,br) {
      return this;
    }
  });
})();
