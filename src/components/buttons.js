(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.TextButton = function(svgelem,config){
    var rainvoker = config.renderAllInvoker||svgelem;
    var ra = function(){rainvoker.invokeOnCanvas('renderAll');};
    var originalparams={fill:svgelem.fill,stroke:svgelem.stroke};
    var reset = function(){this.set(originalparams);ra()};
    var hoverparams = config.hovered;
    var sethover = function(){
      this.set(hoverparams);
      ra()};
    fabric.Hoverable(svgelem,{overcb:sethover,outcb:reset});
    var pressedparams = config.pressed;
    var setdown = function(){this.set(pressedparams);ra()};
    var clickcb = function(){reset.call(this);config.clickcb.call(this);};
    fabric.Clickable(svgelem,{downcb:setdown,clickcb:clickcb});
    return svgelem;
  };

  fabric.ResourceButtonNormalHovered = function(svgelem,config){
    var hovered = svgelem.getObjectById(svgelem.id+'_hovered');
    var normal = svgelem.getObjectById(svgelem.id+'_normal');
    var clickconfig = {ctx:config.ctx||svgelem,clickcb:config.clickcb};
    fabric.Clickable(fabric.Hoverable(normal,{ctx:svgelem,overcb:function(){hovered.show();normal.hide();this.invokeOnCanvas('renderAll');}}),clickconfig);
    fabric.Clickable(fabric.Hoverable(hovered,{ctx:svgelem,outcb:function(){normal.show();hovered.hide();this.invokeOnCanvas('renderAll');}}),clickconfig);
    return svgelem;
  };

  var resourceButtonStateToOuterEventMapping = {
    pressed:'down'
  };

  fabric.ResourceButton = function(svgelem,config){
    var renderables= {
      enabled : svgelem.getObjectById(svgelem.id+'_enabled'),
      disabled : svgelem.getObjectById(svgelem.id+'_disabled'),
      hovered : svgelem.getObjectById(svgelem.id+'_hovered'),
      pressed : svgelem.getObjectById(svgelem.id+'_pressed')
    };
    function ra(){svgelem.invokeOnCanvas('renderAll');};
    function renderState(state){
      for(var i in renderables){
        if(i===state){
          renderables[i].show();
        }else{
          renderables[i].hide();
        }
      }
      ra();
    };
    function processState(state){
      if(!svgelem.enabled){return;}
      renderState(state);
      var cbname = (resourceButtonStateToOuterEventMapping[state]||state)+'cb';
      var outercb = config[cbname];
      outercb && outercb.apply(config.ctx,Array.prototype.slice.call(arguments,1));
      ra();
    };
    function clicked(state){
      renderState('enabled');
      config.clickcb.call(config.ctx);
    };
    var target = svgelem.getObjectById(svgelem.id+'_hotspot');
    svgelem.enable = function(){this.enabled=true;renderState('enabled');return svgelem;};
    svgelem.disable = function(){this.enabled=false;renderState('disabled');return svgelem;};
    var clickconfig = {ctx:config.ctx||svgelem,clickcb:clicked,downcb:function(e){processState('pressed',e);}};
    fabric.Clickable(fabric.Hoverable(target,{outcb:function(e){processState('enabled',e);},overcb:function(e){processState('hovered',e);}}),clickconfig);
    if(config.initialState==='enabled'){
      svgelem.enable();
    }else{
      svgelem.disable();
    }
    return svgelem;
  };

  fabric.ResourceCheckbox = function(svgelem,config){
    ResourceButton(svgelem,config);
    var checkmark = svgelem.getObjectById(svgelem.id+'_checkmark');
    svgelem.check = function(){
      checkmark.show();
    };
    svgelem.uncheck = function(){
      checkmark.hide();
    };
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);


