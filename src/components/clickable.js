(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Clickable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var downcb=config.downcb,clickcb=config.clickcb,doubleclickcb=config.doubleclickcb,ctx=config.ctx||svgelem;
    var mouseEvents={};
    var longPressTimeout;

    svgelem.on('mouse:down',function(e){
      //console.log('mouse down', this.id, this.getUsedObj ? this.getUsedObj()._tt : '');
      if(this.addedToCanvasMouseListeners && this.isVisible() && this.enabled){
        if(!mouseEvents.pressed){
          e.e.listeners.push(svgelem);
          downcb&&downcb.call(ctx,e);
					//if (config.stopPropagation) e.e.propagationStopped = true;
        }
        mouseEvents.pressed=(new Date()).getTime();
        var t=this, me = mouseEvents;
        longPressTimeout = longPressTimeout||setTimeout(function(){
          var now = (new Date()).getTime();
          if(t.addedToCanvasMouseListeners && t.isVisible() && t.enabled && (me.pressed&&now-me.pressed>1400)){
            me.pressed=null;
            longPressTimeout=null;
            me.released=now;
            doubleclickcb&&doubleclickcb.call(ctx,e);
          }
        },1500);
      }});
    function clicked(e){
			//if (config.stopPropagation) e.e.propagationStopped = true;
      mouseEvents.pressed=null;
      if(this.addedToCanvasMouseListeners && this.isVisible() && this.enabled){
        var released = (new Date()).getTime();
        if(mouseEvents.released&&released-mouseEvents.released<300){
          doubleclickcb&&doubleclickcb.call(ctx,e);
        }else{
          clickcb&&clickcb.call(ctx,e);
        }
        mouseEvents.released = released;
      }
    }
    svgelem.on('mouse:up',clicked);
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

