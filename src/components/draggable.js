(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.Draggable = function(svgelem,config){
    var hotspot = config&&config.hotspot ? svgelem.getObjectById(config.hotspot) : svgelem;
    var target = config&&config.target ? svgelem.getObjectById(config.target) : svgelem;
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    fabric.Clickable(hotspot,{ctx:svgelem,downcb:function(e){
      this.dragActive=true;
      this.dragPosition=e.e;
    },clickcb:function(){
      delete this.dragActive;
      delete this.dragPosition;
    }});
    fabric.MouseAware(area);
    area.on('mouse:move',function(e){
      if(svgelem.dragActive){
        var p = e.e;
        target.set({left:target.left + (p.x-svgelem.dragPosition.x)});
        svgelem.dragPosition=p;
        svgelem.invokeOnCanvas('renderAll');
      }
    });
    return svgelem;
  };

  fabric.Slider = function(svgelem,config){
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    var handle = fabric.ResourceButton(svgelem.getObjectById(config.handle),{
    });
  };

})(typeof exports !== 'undefined' ? exports : this);

