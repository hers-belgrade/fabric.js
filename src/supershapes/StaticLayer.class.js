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

  var renderStaticSubLayer = function(ctx){
    if(!ctx){
      var offel = fabric.document.createElement('canvas');
      this.canvas = offel;
      offel.width = this.mastercanvas.width;
      offel.height = this.mastercanvas.height;
      //console.log(this.id,'created a canvas for self',offel.width,offel.height);
      ctx = this.canvas.getContext('2d');
    }
    ctx.save();
    //console.log('statics scaled by',fabric.masterScale);
    ctx.scale(fabric.masterScale,fabric.masterScale);
    ctx._currentTransform = [1,0,0,1,0,0];
    for(var i in this.rectMap){
      delete this[i]._cache.content;
    }
    this.originalrender(ctx);
    for(var i in this.rectMap){
      //console.log('rect',i,this.rectMap[i]);
      if(this[i]._cache.content){
        //console.log('old sprite',this[i]._cache.content);
      }
      this[i]._cache.content = new fabric.Sprite(this.canvas,this.rectMap[i]);
      //console.log('new sprite',this[i]._cache.content);
    }
    ctx.restore();
  };

  fabric.StaticLayer = fabric.util.createClass(fabric.Group, {
    initialize: function(objects,options){
      this.callSuper('initialize',objects,options);
      var ls = this._objects.slice();
      if(ls.length%2){
        throw "Static layer cannot contain an odd number of sub-layers";
      }
      var fordeletion = [];
      for(var i = 0; i<ls.length; i++){
        var l = ls[i];
        var lmn = l.id+'_map';
        var lm = this[lmn];
        if(!lm){
          continue;
        }
        l.rectMap = {};
        for(var j in lm._objects){
          var r = lm._objects[j];
          if(r.type !== 'rect'){
            throw "Only rects allowed on map sub-layer of the static layer. "+j+" is not a rect on sub-layer "+lmn;
          }
          l.rectMap[r.id.substr(0,r.id.length-5)] = {x:r.left,y:r.top,width:r.width,height:r.height};
        }
        fordeletion.push(this[lmn]);
      }
      for(var i in fordeletion){
        this.remove(fordeletion[i]);
      }
      for(var i in this._objects){
        var o = this._objects[i];
        o.originalrender = this.render;
        o.render = renderStaticSubLayer;
        o.monitor = monitorCanvasElement;
      }
    },
    setURL: function(url){
      fabric.staticLayerManager.add(url,this);
    },
    monitor: function(canvas){
      for(var i in this._objects){
        this._objects[i].monitor(canvas);
      }
    },
    refresh: function(){
      for(var i in this._objects){
        this._objects[i].render();
      }
    }
  });

})(typeof exports !== 'undefined' ? exports : this);
