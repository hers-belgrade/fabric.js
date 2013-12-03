(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Clickable = function(svgelem,config){
    fabric.MouseAware(svgelem);
    var downcb=config.downcb,clickcb=config.clickcb,doubleclickcb=config.doubleclickcb,ctx=config.ctx||svgelem;
    var mousePressed;
    var longPressTimeout;
    svgelem.on('mouse:down',function(e){
      if(this.isVisible() && this.enabled){
        if(!mousePressed){
          e.e.listeners.push(svgelem);
          downcb&&downcb.call(ctx,e);
        }
        mousePressed=(new Date()).getTime();
        longPressTimeout = longPressTimeout||setTimeout(function(){
          var now = (new Date()).getTime();
          if(mousePressed&&now-mousePressed>1400){
            mousePressed=null;
            longPressTimeout=null;
            mouseReleased=now;
            doubleclickcb&&doubleclickcb.call(ctx,e);
          }
        },1500);
      }});
    var mouseReleased;
    function clicked(e){
      mousePressed=null;
      if(this.isVisible() && this.enabled){
        var released = (new Date()).getTime();
        if(mouseReleased&&released-mouseReleased<300){
          doubleclickcb&&doubleclickcb.call(ctx,e);
        }else{
          clickcb&&clickcb.call(ctx,e);
        }
        mouseReleased = released;
      }
    }
    svgelem.on('mouse:up',clicked);
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

