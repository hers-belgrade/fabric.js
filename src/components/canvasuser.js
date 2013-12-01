(function(global) {

  var fabric = global.fabric || (global.fabric = { });

  if(fabric.CanvasUser){return;}

  fabric.CanvasUser = function(svgelem,config){
    svgelem.canvasQueue = [];
    svgelem.invokeOnCanvasOrig = svgelem.invokeOnCanvas;
    svgelem.invokeOnCanvas = function(){
      var c = this.getCanvas();
      if(!c){
        this.canvasQueue.push(arguments);
      }else{
        this.invokeOnCanvasOrig.apply(this,arguments);
        return true;
      }
    };
    svgelem.join = function(canvas){
      var canvaschanged = this.canvas !== canvas;
      this.canvas = canvas;
      if(canvas){
        var cq = this.canvasQueue;
        this.canvasQueue = [];
        for(var i in cq){
          this.invokeOnCanvasOrig.apply(this,cq[i]);
        }
      }
      config && canvaschanged && config.onJoined && config.onJoined.call(this);
    };
    svgelem.leave = function(canvas){
      var canvaschanged = typeof this.canvas !== 'undefined';
      config && canvaschanged && config.onLeaving && config.onLeaving.call(this);
      delete this.canvas;
    };
    return svgelem;
  };

  fabric.CanvasElement = function(svgelem,config){
    function onJoined(){
      this.canvas.add(this);
      config && config.onJoined && config.onJoined.call(this);
    };
    function onLeaving(){
      this.canvas.remove(this);
      config && config.onLeaving && config.onLeaving.call(this);
    };
    fabric.CanvasUser(svgelem,{onJoined:onJoined,onLeaving:onLeaving});
  };


})(typeof exports !== 'undefined' ? exports : this);

