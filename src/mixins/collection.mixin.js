/**
 * @namespace fabric.Collection
 */
fabric.Collection = {

  /**
   * Adds objects to collection, then renders canvas (if `renderOnAddRemove` is not `false`)
   * Objects should be instances of (or inherit from) fabric.Object
   * @param [...] Zero or more fabric instances
   * @return {Self} thisArg
   */
  add: function () {
		if (arguments.length == 0) return this;
		var valid = Array.prototype.filter.call(arguments, function (v) {
			return v;
		});

    this._objects.push.apply(this._objects, valid);
    for (var i = valid.length; i--; ) {
      this._onObjectAdded(valid[i]);
    }
    this.renderOnAddRemove && this.renderAll();
    return this;
  },

  /**
   * Inserts an object into collection at specified index, then renders canvas (if `renderOnAddRemove` is not `false`)
   * An object should be an instance of (or inherit from) fabric.Object
   * @param {Object} object Object to insert
   * @param {Number} index Index to insert object at
   * @param {Boolean} nonSplicing When `true`, no splicing (shifting) of objects occurs
   * @return {Self} thisArg
   */
  insertAt: function (object, index, nonSplicing) {
    var objects = this.getObjects();
    if (nonSplicing) {
      objects[index] = object;
    }
    else {
      objects.splice(index, 0, object);
    }
    this._onObjectAdded(object);
    this.renderOnAddRemove && this.renderAll();
    return this;
  },

  /**
   * Removes an object from a collection, then renders canvas (if `renderOnAddRemove` is not `false`)
   * @param {Object} object Object to remove
   * @return {Self} thisArg
   */
  remove: function(object) {
    var objects = this.getObjects(),
        index = objects.indexOf(object);

    // only call onObjectRemoved if an object was actually removed
    if (index !== -1) {
      objects.splice(index, 1);
      this._onObjectRemoved(object);
    }

    this.renderOnAddRemove && this.renderAll();
    return object;
  },

  /**
   * Executes given function for each object in this group
   * @param {Function} callback
   *                   Callback invoked with current object as first argument,
   *                   index - as second and an array of all objects - as third.
   *                   Iteration happens in reverse order (for performance reasons).
   *                   Callback is invoked in a context of Global Object (e.g. `window`)
   *                   when no `context` argument is given
   *
   * @param {Object} context Context (aka thisObject)
   * @return {Self} thisArg
   */
  forEachObject: function(callback, context) {
    var objects = this.getObjects(),
        i = objects.length;
    while (i--) {
      callback.call(context, objects[i], i, objects);
    }
    return this;
  },

	forEachObjectRecursive: function(callback, context, patharray) {
		patharray = patharray || [];
    var objects = this.getObjects(),
        i = objects.length;
    while (i--) {
			var obj = objects[i];
			if(obj.forEachObjectRecursive){
				var feoret = obj.forEachObjectRecursive(callback,context,patharray.concat([obj]));
				if(feoret){
					return feoret;
				}
			}
      var cbret = callback.call(context, obj, i, objects, patharray);
			if(cbret){
				return cbret;
			}
    }
    return;
	},

	forEachObjectRecursiveAsync: function(callback, context, patharray) {
		patharray = patharray || [];
    var objects = this.getObjects(),
        i = objects.length;
    while (i--) {
			var obj = objects[i];
			if(obj.forEachObjectRecursive){
				var feoret = obj.forEachObjectRecursive(callback,context,patharray.concat([obj]));
				if(feoret){
					return feoret;
				}
			}
      var cbret = callback.call(context, obj, i, objects, patharray);
			if(cbret){
				return cbret;
			}
    }
    return;
	},

	getObjectById: function(id){
		var getidcb = function(obj, index, objects, patharray){
			if(obj && obj.id === id){
				return obj;
			}
		};
		return this.forEachObjectRecursive(getidcb,this);
	},

  /**
   * Returns object at specified index
   * @param {Number} index
   * @return {Self} thisArg
   */
  item: function (index) {
    return this.getObjects()[index];
  },

  /**
   * Returns true if collection contains no objects
   * @return {Boolean} true if collection is empty
   */
  isEmpty: function () {
    return this.getObjects().length === 0;
  },

  /**
   * Returns a size of a collection (i.e: length of an array containing its objects)
   * @return {Number} Collection size
   */
  size: function() {
    return this.getObjects().length;
  },

  /**
   * Returns true if collection contains an object
   * @param {Object} object Object to check against
   * @return {Boolean} `true` if collection contains an object
   */
  contains: function(object) {
    return this.getObjects().indexOf(object) > -1;
  },

  /**
   * Returns number representation of a collection complexity
   * @return {Number} complexity
   */
  complexity: function () {
    return this.getObjects().reduce(function (memo, current) {
      memo += current.complexity ? current.complexity() : 0;
      return memo;
    }, 0);
  },

  /**
   * Makes all of the collection objects grayscale (i.e. calling `toGrayscale` on them)
   * @return {Self} thisArg
   */
  toGrayscale: function() {
    return this.forEachObject(function(obj) {
      obj.toGrayscale();
    });
  },

	/**
	 * Method that determines what object we are clicking on
	 * @param {Event} e mouse event
	 * @param {Boolean} skipGroup when true, group is skipped and only objects are traversed through
	 */
	distributePositionEvent: function (e,eventname) {
    for (var i = this._objects.length-1; i>=0; i--){
      this._objects[i].processPositionEvent(e,eventname);
    }
	},

};
