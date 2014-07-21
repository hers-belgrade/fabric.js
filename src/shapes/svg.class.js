(function(global){

  "use strict";

  var fabric = global.fabric || (global.fabric = { });

  if (fabric.Svg) {
    return;
  }

  ///TODO: activate/deactivate should prepare StaticLayer and 
  
  function do_propagate_activate () {
    if (this.static) {
      this.static._onSVG_Activated();
    }
    if (this.references) {
      this.references._onSVG_Activated();
    }

    this.forEachObject(function(o) {
      if (o.id === 'static' || o.id === 'references') return;
      o._onSVG_Activated && o._onSVG_Activated();
    });
  }


  function isCachedone(done) {
    for (var i in this._path_cache) {
      if (!this._path_cache[i]) return;
    }
    do_propagate_activate.call(this);
    done && done();
  }

  function load_cache (done) {
    var self = this;
    if (!Object.keys(this._path_cache).length) {
      isCachedone.call(self, done);
      return;
    }

    for (var _i in this._path_cache) {
      (function (key) {
        var img = self._image_cache[key];
        img.onload = function () {
          self._path_cache[key] = true;
          isCachedone.call(self, done);
        }
        img.setSrc(key);
      })(_i);
    }
  }

  fabric.Svg = fabric.util.createClass(fabric.Group,{
    type: 'svg',
    initialize: function(objects, options){
      options = options || {};
      options._svg_el = this;
      this.callSuper('initialize',objects,options);
      this._path_cache = {};
      this._image_cache = {};
      this._canvases = [];
      this._activated = false;
    },

    getImage: function (p) {
      if (this._image_cache[p]) return this._image_cache[p];
      this._path_cache[p] = false;
      var img = new fabric.StandardImage(this, fabric.util.createImage());
      var self = this;

      if (this._activated) {
        img.onload = function () {
          self._path_cache[p] = true;
        }
        img.setSrc(p);
      }
      else{
        img.clear();
      }
      this._image_cache[p] = img;
      return  img;
    },

    loadAndForget: function (img_list, done) {
      var map = {};
      if (img_list.length === 0) return done();

      var path_list = [];
      for (var i in img_list) {
        for (var j in this._image_cache) {
          if (this._image_cache[j] === img_list[i]) path_list.push (j);
        }
      }
      var self = this;

      var started = (new Date()).getTime();
      //console.log('loadAndForget issued', this.id);


      var isItDone = function (p) {
        delete map[p];
        delete self._image_cache[p];
        delete self._path_cache[p];
        if (Object.keys(map).length > 0) return;
        //console.log('loading images completely done in', (new Date()).getTime() - started);
        done();
      }


      for (var _i in path_list) {
        (function (i) {
          var p = path_list[i];
          map[p] = true;
          var img = self._image_cache[p];
          img.onload = function () {
            //console.log('image done within', (new Date()).getTime() - started);
            isItDone(p);
            delete img.onload;
          }
          img.setSrc(p);
        })(_i);
      }
    },

    createCanvasRaw: function(){
      var ret = fabric.document.createElement('canvas');
      fabric.util.enable3DGPU(ret);
      return ret;
    },
    produceCanvas: function(){
      var ret = this.createCanvasRaw();
      this._canvases.push(ret);
      return ret;
    },
    destroyCanvas: function (c) {
      var index = this._canvases.indexOf(c);
      if (index < 0) return;
      this._canvases.splice(index,1);
    },

    activate: function(done){
      var self = this;
      if (this._activated) return;
      this._activated = true;

      fabric.masterSize = {
        width: this.get('width')
        ,height: this.get('height')
      }

      if(fabric.activeCanvasInstance){
        fabric.activeCanvasInstance._computeMasterScale();
        fabric.activeCanvasInstance.renderAll();
      }


      var started = (new Date()).getTime();
      for (var i in this._path_cache) this._path_cache[i] = false;
      load_cache.call(this, function () {
        fabric.util.isFunction(done) && done.apply(this, arguments);
        self.fire('svg:activated_and_loaded');
      });
      this.fire('svg:activated');
    },
    deactivate: function(){
      if (!this._activated) return;
      this._activated = false;
      //drop image cache as well ...
      for (var i in this._path_cache) { 
        this._path_cache[i] = false;
        var o = this._image_cache[i];
        o.onload = function () {};
        o.clear();
      }
      for(var i in this._canvases){
        var _c = this._canvases[i];
        _c.width = 1;
        _c.height = 1;
      }
      this.fire('svg:deactivated');
    },
    setBackground: function (name, canvas) {
      if (!canvas) return;
      canvas.setBackground(this.resource_name, name);
    },
    setResourceName : function (rn) {
      this.resource_name = rn;
    }
  });

  fabric.Svg.fromObject = function(object){
    return new fabric.Svg(fabric.util.enlivenObjects(object.objects),object);
  };

})(typeof exports !== 'undefined' ? exports : this);

