(function(global) {

  var commandLengths = {
    m: 2,
    l: 2,
    h: 1,
    v: 1,
    c: 6,
    s: 4,
    q: 4,
    t: 2,
    a: 7
  };

  "use strict";

  var fabric = global.fabric || (global.fabric = { }),
      min = fabric.util.array.min,
      max = fabric.util.array.max,
      extend = fabric.util.object.extend,
      _toString = Object.prototype.toString,
      drawArc = fabric.util.drawArc;

  if (fabric.Path) {
    fabric.warn('fabric.Path is already defined');
    return;
  }

  /**
   * @private
   */
  function getX(item) {
    if (item[0] === 'H') {
      return item[1];
    }
    return item[item.length - 2];
  }

  /**
   * @private
   */
  function getY(item) {
    if (item[0] === 'V') {
      return item[1];
    }
    return item[item.length - 1];
  }

  /**
   * Path class
   * @class fabric.Path
   * @extends fabric.Object
   */
  fabric.Path = fabric.util.createClass(fabric.Object, /** @lends fabric.Path.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'path',

    borderRectColor:      '#FFFF00',

    /**
     * Constructor
     * @param {Array|String} path Path data (sequence of coordinates and corresponding "command" tokens)
     * @param {Object} [options] Options object
     * @return {fabric.Path} thisArg
     */
    initialize: function(path, options) {
      this.callSuper('initialize',options);

      if (!path) {
        throw new Error('`path` argument is required');
      }

      var fromArray = _toString.call(path) === '[object Array]';
      var or_path = path;
      this.path = fromArray
        ? path
        // one of commands (m,M,l,L,q,Q,c,C,etc.) followed by non-command characters (i.e. command values)
        : path.match && path.match(/[mzlhvcsqta][^mzlhvcsqta]*/gi);

      if (!this.path) return;

      if (!fromArray) {
        this.path = this._parsePath();
      }
      this._initializePath(options);

      if (options.sourcePath) {
        this.setSourcePath(options.sourcePath);
      }
      return;
    },

    /**
     * @private
     * @param {Object} [options] Options object
     */
    _initializePath: function (options) {
      var isWidthSet = 'width' in options && options.width != null,
          isHeightSet = 'height' in options && options.width != null,
          isLeftSet = 'left' in options,
          isTopSet = 'top' in options,
          origLeft = isLeftSet ? this.left : 0,
          origTop = isTopSet ? this.top : 0;

      if (!isWidthSet || !isHeightSet) {
        extend(this, this._parseDimensions());
        if (isWidthSet) {
          this.width = options.width;
        }
        if (isHeightSet) {
          this.height = options.height;
        }
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx context to render path on
     */
    _render: function(ctx) {
      ctx.beginPath();
      var current, // current instruction
          previous = null,
          x = 0, // current x
          y = 0, // current y
          controlX = 0, // current control point x
          controlY = 0, // current control point y
          tempX,
          tempY,
          tempControlX,
          tempControlY,
          l = 0,
          t = 0;

      var id = this.id;
      function do_command (f,args){
        if (f === 'drawArc') {
          args.unshift(ctx);
          drawArc.apply(null, args);
        }else{
          ctx[f].apply(ctx, args);
        }
      }
      for (var i = 0, len = this.path.length; i < len; ++i) {

        current = this.path[i];

        switch (current[0]) { // first letter

          case 'l': // lineto, relative
            x += current[1];
            y += current[2];
            do_command('lineTo',[x, y]);
            break;

          case 'L': // lineto, absolute
            x = current[1];
            y = current[2];
            do_command('lineTo',[x,y]);
            break;

          case 'h': // horizontal lineto, relative
            x += current[1];
            do_command('lineTo', [x,y]);
            break;

          case 'H': // horizontal lineto, absolute
            x = current[1];
            do_command('lineTo', [x,y]);
            break;

          case 'v': // vertical lineto, relative
            y += current[1];
            do_command('lineTo', [x,y]);
            break;

          case 'V': // verical lineto, absolute
            y = current[1];
            do_command('lineTo', [x,y])
            break;

          case 'm': // moveTo, relative
            x += current[1];
            y += current[2];
            do_command('moveTo', [x, y]);
            break;

          case 'M': // moveTo, absolute
            x = current[1];
            y = current[2];
            do_command('moveTo', [x,y]);
            break;

          case 'c': // bezierCurveTo, relative
            tempX = x + current[5];
            tempY = y + current[6];
            controlX = x + current[3];
            controlY = y + current[4];
            do_command('bezierCurveTo',[
              x + current[1],
              y + current[2],
              controlX,
              controlY,
              tempX,
              tempY
              ]
            );
            
            x = tempX;
            y = tempY;
            break;

          case 'C': // bezierCurveTo, absolute
            x = current[5];
            y = current[6];
            controlX = current[3];
            controlY = current[4];
            do_command('bezierCurveTo', [
              current[1],
              current[2],
              controlX,
              controlY,
              x,
              y
              ]
            );
            break;

          case 's': // shorthand cubic bezierCurveTo, relative

            // transform to absolute x,y
            tempX = x + current[3];
            tempY = y + current[4];

            // calculate reflection of previous control points
            controlX = controlX ? (2 * x - controlX) : x;
            controlY = controlY ? (2 * y - controlY) : y;
            do_command( 'bezierCurveTo',[
              controlX,
              controlY,
              x + current[1],
              y + current[2],
              tempX,
              tempY
              ]
            );
            // set control point to 2nd one of this command
            // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
            controlX = x + current[1];
            controlY = y + current[2];

            x = tempX;
            y = tempY;
            break;

          case 'S': // shorthand cubic bezierCurveTo, absolute
            tempX = current[3];
            tempY = current[4];
            // calculate reflection of previous control points
            controlX = 2*x - controlX;
            controlY = 2*y - controlY;
            do_command('bezierCurveTo',[
              controlX,
              controlY,
              current[1],
              current[2],
              tempX,
              tempY
              ]
            );
            x = tempX;
            y = tempY;

            // set control point to 2nd one of this command
            // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
            controlX = current[1];
            controlY = current[2];

            break;

          case 'q': // quadraticCurveTo, relative
            // transform to absolute x,y
            tempX = x + current[3];
            tempY = y + current[4];

            controlX = x + current[1];
            controlY = y + current[2];
            do_command( 'quadraticCurveTo',[
              controlX,
              controlY,
              tempX,
              tempY]
            );
            x = tempX;
            y = tempY;
            break;

          case 'Q': // quadraticCurveTo, absolute
            tempX = current[3];
            tempY = current[4];

            do_command('quadraticCurveTo',[
              current[1],
              current[2],
              tempX,
              tempY]
            );
            x = tempX;
            y = tempY;
            controlX = current[1];
            controlY = current[2];
            break;

          case 't': // shorthand quadraticCurveTo, relative

            // transform to absolute x,y
            tempX = x + current[1];
            tempY = y + current[2];


            if (previous[0].match(/[QqTt]/) === null) {
              // If there is no previous command or if the previous command was not a Q, q, T or t,
              // assume the control point is coincident with the current point
              controlX = x;
              controlY = y;
            }
            else if (previous[0] === 't') {
              // calculate reflection of previous control points for t
              controlX = 2 * x - tempControlX;
              controlY = 2 * y - tempControlY;
            }
            else if (previous[0] === 'q') {
              // calculate reflection of previous control points for q
              controlX = 2 * x - controlX;
              controlY = 2 * y - controlY;
            }

            tempControlX = controlX;
            tempControlY = controlY;
            do_command('quadraticCurveTo', [
              controlX,
              controlY,
              tempX,
              tempY
              ]
            );

            x = tempX;
            y = tempY;
            controlX = x + current[1];
            controlY = y + current[2];
            break;

          case 'T':
            tempX = current[1];
            tempY = current[2];

            // calculate reflection of previous control points
            controlX = 2 * x - controlX;
            controlY = 2 * y - controlY;
            do_command('quadraticCurveTo',[
              controlX,
              controlY,
              tempX,
              tempY
              ]
            );
            x = tempX;
            y = tempY;
            break;

          case 'a':
            do_command('drawArc', [x, y, [
              current[1],
              current[2],
              current[3],
              current[4],
              current[5],
              current[6] + x,
              current[7] + y
            ]]);
            x += current[6];
            y += current[7];
            break;

          case 'A':
            do_command('drawArc',[x, y, [
              current[1],
              current[2],
              current[3],
              current[4],
              current[5],
              current[6],
              current[7]
            ]]);
            x = current[6];
            y = current[7];
            break;

          case 'z':
          case 'Z':
            do_command('closePath');
            break;
        }
        previous = current;
      }
    },

    _paint: function(ctx){
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },

    /**
     * Returns string representation of an instance
     * @return {String} string representation of an instance
     */
    toString: function() {
      return '#<fabric.Path (' + this.complexity() +
        '): { "top": ' + this.top + ', "left": ' + this.left + ' }>';
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      var o = extend(this.callSuper('toObject', propertiesToInclude), {
        path: this.path
      });
      o._path_element = this._path_element;
      if (this.sourcePath) {
        o.sourcePath = this.sourcePath;
      }
      if (this.transformMatrix) {
        o.transformMatrix = this.transformMatrix;
      }
      return o;
    },

    /**
     * Returns dataless object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toDatalessObject: function(propertiesToInclude) {
      var o = this.toObject(propertiesToInclude);
      if (this.sourcePath) {
        o.path = this.sourcePath;
      }
      delete o.sourcePath;
      return o;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @return {String} svg representation of an instance
     */
    toSVG: function() {
      var chunks = [],
          markup = this._createBaseSVGMarkup();

      for (var i = 0, len = this.path.length; i < len; i++) {
        chunks.push(this.path[i].join(' '));
      }
      var path = chunks.join(' ');

      markup.push(
        '<g transform="', (this.group ? '' : this.getSvgTransform()), '">',
          '<path ',
            'd="', path,
            '" style="', this.getSvgStyles(),
            '" stroke-linecap="round" ',
          '/>',
        '</g>'
      );

      return markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns number representation of an instance complexity
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return this.path.length;
    },

    _improvedParsePath : function (path) {
      var e_re = /(\w)([\s\d\.e\-\,\+]*)/g;
      var match = e_re.exec(path);
      var result = [];

      while (match) {
        path = path.slice(match[0].length);
        result.push ({command:match[1], params:match[2].trim().split(' ').map(function(v){return v.split(',').map(function(v){return parseFloat(v)})})});
        if (path.length === 0) break;
        match = e_re.exec(path);
      }
    },

    /**
     * @private
     */
    _parsePath: function() {
      var result = [ ],
          coords = [ ],
          currentPath,
          parsed,
          re = /(-?\.\d+)|(-?\d+(\.\d+)?(e[\+-]\d+)?)/g,
          match,
          coordsStr;

      for (var i = 0, coordsParsed, len = this.path.length; i < len; i++) {
        currentPath = this.path[i];

        coordsStr = currentPath.slice(1).trim();
        coords.length = 0;

        while ((match = re.exec(coordsStr))) {
          coords.push(match[0]);
        }

        coordsParsed = [ currentPath.charAt(0) ];

        for (var j = 0, jlen = coords.length; j < jlen; j++) {
          parsed = parseFloat(coords[j]);
          if (!isNaN(parsed)) {
            coordsParsed.push(parsed);
          }
        }

        var command = coordsParsed[0].toLowerCase(),
            commandLength = commandLengths[command],
            actualCommand = coordsParsed[0];

        if (coordsParsed.length - 1 > commandLength) {
          for (var k = 1, klen = coordsParsed.length; k < klen; k += commandLength) {
            result.push([ actualCommand ].concat(coordsParsed.slice(k, k + commandLength)));
            // subsequent arguments are treated as relative command 
            //if (actualCommand === 'M') actualCommand = 'm';
            if (actualCommand === 'M') actualCommand = 'L';
            if (actualCommand === 'm') actualCommand = 'l';
          }
        }
        else {
          result.push(coordsParsed);
        }
      }

      return result;
    },

    /**
     * @private
     */
    _parseDimensions: function() {
      var aX = [],
          aY = [],
          previousX,
          previousY,
          isLowerCase = false,
          x,
          y;

      this.path.forEach(function(item, i) {
        if (item[0] !== 'H') {
          previousX = (i === 0) ? getX(item) : getX(this.path[i-1]);
        }
        if (item[0] !== 'V') {
          previousY = (i === 0) ? getY(item) : getY(this.path[i-1]);
        }

        // lowercased letter denotes relative position;
        // transform to absolute
        if (item[0] === item[0].toLowerCase()) {
          isLowerCase = true;
        }

        // last 2 items in an array of coordinates are the actualy x/y (except H/V);
        // collect them

        // TODO (kangax): support relative h/v commands

        x = isLowerCase
          ? previousX + getX(item)
          : item[0] === 'V'
            ? previousX
            : getX(item);

        y = isLowerCase
          ? previousY + getY(item)
          : item[0] === 'H'
            ? previousY
            : getY(item);

        var val = parseInt(x, 10);
        if (!isNaN(val)) aX.push(val);

        val = parseInt(y, 10);
        if (!isNaN(val)) aY.push(val);

      }, this);

      var minX = min(aX),
          minY = min(aY),
          maxX = max(aX),
          maxY = max(aY),
          deltaX = maxX - minX,
          deltaY = maxY - minY;

      var o = {
        left: this.left,
        top: this.top,
        width: deltaX,
        height: deltaY
      };

      return o;
    },
    setObjectToPointAtRelativeLength : function(obj,fraction){
      var _p = this.getPointAtRelativeLength(fraction);
      obj.set('left',_p.x);
      obj.set('top',_p.y);
    },
    getPointAtRelativeLength: function(fraction){
      return this._path_element.getPointAtLength(this._path_element.getTotalLength()*fraction);
    }
  });

  /**
   * Creates an instance of fabric.Path from an object
   * @static
   * @memberOf fabric.Path
   * @param {Object} object
   * @param {Function} callback Callback to invoke when an fabric.Path instance is created
   */
  fabric.Path.fromObject = function(object) {
    if (typeof object.path === 'string') {
      throw "no cloning from un-parsed Paths supported";
      fabric.loadSVGFromURL(object.path, function (elements) {
        var path = elements[0];

        var pathUrl = object.path;
        delete object.path;

        fabric.util.object.extend(path, object);
        path.setSourcePath(pathUrl);

        callback(path);
      });
    }
    else {
      return new fabric.Path(object.path, object);
    }
  };

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.Path.fromElement`)
   * @static
   * @memberOf fabric.Path
   * @see http://www.w3.org/TR/SVG/paths.html#PathElement
   */
  fabric.Path.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat(['d']);

  /**
   * Creates an instance of fabric.Path from an SVG <path> element
   * @static
   * @memberOf fabric.Path
   * @param {SVGElement} element to parse
   * @param {Function} callback Callback to invoke when an fabric.Path instance is created
   * @param {Object} [options] Options object
   */
  fabric.Path.fromElement = function(element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Path.ATTRIBUTE_NAMES);
    return new fabric.Path(parsedAttributes.d, extend(parsedAttributes, options,{_path_element: element}));
  };
  /* _FROM_SVG_END_ */

})(typeof exports !== 'undefined' ? exports : this);
