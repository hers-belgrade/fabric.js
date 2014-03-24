(function(global){

  "use strict";

  function StaticLayerManager(){
    this.collection = {};
    this.lastSize = {};
  }
  StaticLayerManager.prototype.add = function(url,staticlayer){
    //if(this.collection[url] ?
    this.collection[url] = staticlayer;
    this.canvas && staticlayer.monitor(this.canvas);
  };
  StaticLayerManager.prototype.monitor = function(canvas){
    this.canvas = canvas;
    //console.log('monitoring canvas',canvas.width,'x',canvas.height);
    for(var i in this.collection){
      this.collection[i].monitor(canvas);
    }
  };
  StaticLayerManager.prototype.refresh = function(){
    if(this.lastSize.width===this.canvas.width&&
      this.lastSize.height===this.canvas.width){
      return;
    }
    this.lastSize.width = this.canvas.width;
    this.lastSize.height = this.canvas.height;
    for(var i in this.collection){
      this.collection[i].refresh();
    }
  };

  var fabric = global.fabric || (global.fabric = { });
  fabric.staticLayerManager = new StaticLayerManager();

  if (fabric.StaticLayer) {
    return;
  }

  var monitorCanvasElement = function (canvas){
    this.mastercanvas = canvas;
    this.render();
  };

  var renderStaticSubLayer = function(){
    //console.log('DA LI SE OVO IKAD DOGODILO?');
    if (
        !this.group.group._activated || 
        this.id.substr(this.id.length-4,4) === '_map'
     ) {
      return;
    }

    if (!this._cache_canvas) { 
      console.log('will create _cache_canvas');
      this._cache_canvas = this.group.group.produceCanvas();
    }
    var offel = this._cache_canvas
    offel.width = Math.ceil(this.mastercanvas.width);
    offel.height = Math.ceil(this.mastercanvas.height);

    var ctx = offel.getContext('2d');
    ctx.save();

    ctx.scale(fabric.masterScale,fabric.masterScale);
    ctx._currentTransform = [1,0,0,1,0,0];
    this.show();

    var temp = {};
    for (var i in this.rectMap) {
      if (this[i]._cache.global_content) {
        temp[i] = this[i]._cache.global_content;
      }
      else{
        temp[i] = new fabric.Sprite(offel, this.rectMap[i]);
      }
      this[i].dropCache();
    }
    this.originalrender(ctx);

    for(var i in this.rectMap){
      this[i]._cache.global_content = temp[i];
      delete temp[i];
    }
    temp = undefined;
    ctx.restore();
  };

  fabric.StaticLayer = fabric.util.createClass(fabric.Group, {
    initialize: function(objects,options){
      this.callSuper('initialize',objects,options);
      this.toMonitor = undefined;

      // RAZMISLITI ...
      for(var i in this._objects){
        var o = this._objects[i];
        o.originalrender = this.render;
        o.render = renderStaticSubLayer;
        o.monitor = monitorCanvasElement;
      }
    },

    _onSVG_Activated: function () {
      var self = this;
      self.forEachObject(function (v) {
        if (v.id.substr(v.id.length-4,4) === '_map') return;
        v.monitorCanvasElement = monitorCanvasElement;
      });

      var ls = self._objects.slice();
      console.log('sublayers',ls);
      if(ls.length%2){
        console.log( "Static layer cannot contain an odd number of sub-layers" );
        throw "Static layer cannot contain an odd number of sub-layers";
      }
      var fordeletion = [];
      for(var i = 0; i<ls.length; i++){
        var l = ls[i];
        var lmn = l.id+'_map';
        var lm = self[lmn];
        if(!lm){
          continue;
        }
        l.rectMap = {};
        for(var j in lm._objects){
          var r = lm._objects[j];
          if(r.type !== 'rect'){
            console.log( "Only rects allowed on map sub-layer of the static layer. "+j+" is not a rect on sub-layer "+lmn );
            throw "Only rects allowed on map sub-layer of the static layer. "+j+" is not a rect on sub-layer "+lmn;
          }
          if(!r.id){
            console.log(r,'??');
            throw "no id for map rect";
          }
          if(r.id.indexOf('_area')!==r.id.length-5){
            console.log( r.id+" needs to end with _area" );
            throw r.id+" needs to end with _area";
          }
          l.rectMap[r.id.substr(0,r.id.length-5)] = {x:r.left,y:r.top,width:r.width,height:r.height};
        }
        for(var j in l._objects){
          var id = l._objects[j].id;
          if(!l.rectMap[id]){
            console.log('on',l.id,'static',id,'has no rect');
          }
        }
        fordeletion.push(self[lmn]);
      }
      self._apply_monitor();
    },

    _onSVG_Deactivated: function () {
      return;
      //forEachObject
      for (var i in this._objects) {
        var o = this._objects[i];
        if (o.id.substr(o.id.length-4,4) === '_map') continue;
        delete o.monitorCanvasElement;
        o._onSVG_Deactivated && o._onSVG_Deactivated();
      }
    },
    setURL: function(url){
      fabric.staticLayerManager.add(url,this);
    },
    _apply_monitor : function () {
      for(var i in this._objects){
        this._objects[i] && this._objects[i].monitor && this._objects[i].monitor(this.toMonitor);
      }
    },
    monitor: function(canvas){
      this.toMonitor = canvas;
      this._apply_monitor();
    },
    refresh: function(){
      for(var i in this._objects){
        this._objects[i].render();
      }
    }
  });

})(typeof exports !== 'undefined' ? exports : this);
