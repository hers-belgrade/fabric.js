(function() {

  var _slice = Array.prototype.slice;

  /**
   * Takes id and returns an element with that id (if one exists in a document)
   * @memberOf fabric.util
   * @param {String|HTMLElement} id
   * @return {HTMLElement|null}
   */
  function getById(id) {
    return typeof id === 'string' ? fabric.document.getElementById(id) : id;
  }

  /**
   * Converts an array-like object (e.g. arguments or NodeList) to an array
   * @memberOf fabric.util
   * @param {Object} arrayLike
   * @return {Array}
   */
  var toArray = function(arrayLike) {
    return _slice.call(arrayLike, 0);
  };

  var sliceCanConvertNodelists;
  try {
    sliceCanConvertNodelists = toArray(fabric.document.childNodes) instanceof Array;
  }
  catch(err) { }

  if (!sliceCanConvertNodelists) {
    toArray = function(arrayLike) {
      var arr = new Array(arrayLike.length), i = arrayLike.length;
      while (i--) {
        arr[i] = arrayLike[i];
      }
      return arr;
    };
  }

  /**
   * Creates specified element with specified attributes
   * @memberOf fabric.util
   * @param {String} tagName Type of an element to create
   * @param {Object} [attributes] Attributes to set on an element
   * @return {HTMLElement} Newly created element
   */
  function makeElement(tagName, attributes) {
    var el = fabric.document.createElement(tagName);
    for (var prop in attributes) {
      if (prop === 'class') {
        el.className = attributes[prop];
      }
      else if (prop === 'for') {
        el.htmlFor = attributes[prop];
      }
      else {
        el.setAttribute(prop, attributes[prop]);
      }
    }
    return el;
  }

  /**
   * Adds class to an element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to add class to
   * @param {String} className Class to add to an element
   */
  function addClass(element, className) {
    if ((' ' + element.className + ' ').indexOf(' ' + className + ' ') === -1) {
      element.className += (element.className ? ' ' : '') + className;
    }
  }

  function replaceClass(element, oldClassName, newClassName) {
    if (!element) return;
    if (!element.className) {
      addClass(element, className);
      return;
    }
    if (oldClassName) {
      var r = new RegExp (oldClassName);
      element.className = element.className.replace(r,newClassName);
    }else{
      addClass(element, newClassName);
    }
  }

  function removeClass(element, className) {
    if (!element || !element.className) return;
    replaceClass(element, className, '');
  }

  function createStyleRecord (selector, map) {
    var ret = selector+" {\n";
    for (var i in map) {
      ret+= (i+':'+map[i]+";\n");
    }
    ret+="}\n";
    return ret;
  }

  /**
   * Wraps element with another element
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to wrap
   * @param {HTMLElement|String} wrapper Element to wrap with
   * @param {Object} [attributes] Attributes to set on a wrapper
   * @return {HTMLElement} wrapper
   */
  function wrapElement(element, wrapper, attributes) {
    if (typeof wrapper === 'string') {
      wrapper = makeElement(wrapper, attributes);
    }
    if (element.parentNode) {
      element.parentNode.replaceChild(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  /**
   * Returns offset for a given element
   * @function
   * @memberOf fabric.util
   * @param {HTMLElement} element Element to get offset for
   * @return {Object} Object with "left" and "top" properties
   */
  function getElementOffset(element) {
    var docElem, win,
        box = {left: 0, top: 0},
        doc = element && element.ownerDocument,
        offset = {left: 0, top: 0},
        offsetAttributes = {
           'borderLeftWidth': 'left',
           'borderTopWidth':  'top',
           'paddingLeft':     'left',
           'paddingTop':      'top'
        };

    if (!doc){
      return {left: 0, top: 0};
    }

    for (var attr in offsetAttributes) {
      offset[offsetAttributes[attr]] += parseInt(getElementStyle(element, attr), 10) || 0;
    }

    docElem = doc.documentElement;
    if ( typeof element.getBoundingClientRect !== "undefined" ) {
      box = element.getBoundingClientRect();
    }
    if(doc != null && doc === doc.window){
      win = doc;
    } else {
      win = doc.nodeType === 9 && (doc.defaultView || doc.parentWindow);
    }
    return {
      left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0) + offset.left,
      top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0)  + offset.top
    };
  }

  /**
  * Returns style attribute value of a given element
  * @memberOf fabric.util
  * @param {HTMLElement} element Element to get style attribute for
  * @param {String} attr Style attribute to get for element
  * @return {String} Style attribute value of the given element.
  */
  function getElementStyle(element, attr) {
    if (!element.style) {
      element.style = { };
    }

    if (fabric.document.defaultView && fabric.document.defaultView.getComputedStyle) {
      return fabric.document.defaultView.getComputedStyle(element, null)[attr];
    }
    else {
      var value = element.style[attr];
      if (!value && element.currentStyle) value = element.currentStyle[attr];
      return value;
    }
  }

  (function () {
    var style = fabric.document.documentElement.style;

    var selectProp = 'userSelect' in style
      ? 'userSelect'
      : 'MozUserSelect' in style
        ? 'MozUserSelect'
        : 'WebkitUserSelect' in style
          ? 'WebkitUserSelect'
          : 'KhtmlUserSelect' in style
            ? 'KhtmlUserSelect'
            : '';

    /**
     * Makes element unselectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make unselectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementUnselectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = fabric.util.falseFunction;
      }
      if (selectProp) {
        element.style[selectProp] = 'none';
      }
      else if (typeof element.unselectable === 'string') {
        element.unselectable = 'on';
      }
      return element;
    }

    /**
     * Makes element selectable
     * @memberOf fabric.util
     * @param {HTMLElement} element Element to make selectable
     * @return {HTMLElement} Element that was passed in
     */
    function makeElementSelectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = null;
      }
      if (selectProp) {
        element.style[selectProp] = '';
      }
      else if (typeof element.unselectable === 'string') {
        element.unselectable = '';
      }
      return element;
    }

    fabric.util.makeElementUnselectable = makeElementUnselectable;
    fabric.util.makeElementSelectable = makeElementSelectable;
  })();

  (function() {

    /**
     * Inserts a script element with a given url into a document; invokes callback, when that script is finished loading
     * @memberOf fabric.util
     * @param {String} url URL of a script to load
     * @param {Function} callback Callback to execute when script is finished loading
     */
    function getScript(url, callback) {
      var headEl = fabric.document.getElementsByTagName("head")[0],
          scriptEl = fabric.document.createElement('script'),
          loading = true;

      /** @ignore */
      scriptEl.onload = /** @ignore */ scriptEl.onreadystatechange = function(e) {
        if (loading) {
          if (typeof this.readyState === 'string' &&
              this.readyState !== 'loaded' &&
              this.readyState !== 'complete') return;
          loading = false;
          callback(e || fabric.window.event);
          scriptEl = scriptEl.onload = scriptEl.onreadystatechange = null;
        }
      };
      scriptEl.src = url;
      headEl.appendChild(scriptEl);
      // causes issue in Opera
      // headEl.removeChild(scriptEl);
    }

    fabric.util.getScript = getScript;
  })();

  function prepareFonts (fonts, el) {
    el = el ? el : fabric.document.createElement('canvas');
    el.width = 200;
    el.height= 200;
    var ctx = el.getContext('2d');
    for (var i in fonts) {
      ctx.font = '30px '+fonts[i];
      ctx.fillText('TESTME', 0,0);
    }
  }

  function isRenderableElement (o) {
    return (o instanceof HTMLImageElement || o instanceof HTMLCanvasElement);
  }
  var DUMMY_PATH = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC";

  function resetRenderable (obj) {
    if (!obj) return;
    if (obj instanceof HTMLImageElement) {
      obj.src = DUMMY_PATH;
    }
    if (obj instanceof HTMLCanvasElement) {
      obj.width = obj.width;
    }
    obj.style.webkitTransform = '';
  }

  function enable3DGPU (obj) {
    obj.style.webkitTransform = "translate3D(0,0,0)";
  }

  fabric.util.getById = getById;
  fabric.util.toArray = toArray;
  fabric.util.makeElement = makeElement;
  fabric.util.addClass = addClass;
  fabric.util.removeClass = removeClass;
  fabric.util.replaceClass = replaceClass;
  fabric.util.createStyleRecord = createStyleRecord;

  fabric.util.wrapElement = wrapElement;
  fabric.util.getElementOffset = getElementOffset;
  fabric.util.getElementStyle = getElementStyle;
  fabric.util.prepareFonts = prepareFonts;
  fabric.util.isRenderableElement = isRenderableElement;
  fabric.util.resetRenderable = resetRenderable;
  fabric.util.enable3DGPU = enable3DGPU;
  fabric.util.DUMMY_PATH  = DUMMY_PATH;

})();
