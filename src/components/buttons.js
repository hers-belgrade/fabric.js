(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.TextButton = function(svgelem,config){
    var rainvoker = config.renderAllInvoker||svgelem;
    var ra = function(){rainvoker.invokeOnCanvas('renderAll');};
    var originalparams={fill:svgelem.fill,stroke:svgelem.stroke};
    var reset = function(){this.set(originalparams);ra()};
    var hoverparams = config.hovered;
    var sethover = function(){this.set(hoverparams);ra()};
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

  fabric.ResourceButton = function(svgelem,config){
    var enabled = svgelem.getObjectById(svgelem.id+'_enabled');
    var enabledtarget = config&&config.targets&&config.targets.enabled ? enabled.getObjectById(config.targets.enabled) : enabled;
    var disabled = svgelem.getObjectById(svgelem.id+'_disabled');
    var disabledtarget = config&&config.targets&&config.targets.disabled ? disabled.getObjectById(config.targets.disabled) : disabled;
    var hovered = svgelem.getObjectById(svgelem.id+'_hovered');
    var hoveredtarget = config&&config.targets&&config.targets.hovered ? hovered.getObjectById(config.targets.hovered) : hovered;
    var pressed = svgelem.getObjectById(svgelem.id+'_pressed');
    var pressedtarget = config&&config.targets&&config.targets.pressed ? pressed.getObjectById(config.targets.pressed) : pressed;
    function ra(){svgelem.invokeOnCanvas('renderAll');};
    svgelem.enable = function(){this.enabled=true;enabled.show();disabled.hide();ra();}
    svgelem.disable = function(){this.enabled=false;disabled.show();enabled.hide();ra();}
    var clickconfig = {ctx:config.ctx||svgelem,clickcb:config.clickcb,downcb:config.downcb};
    fabric.Clickable(fabric.Hoverable(enabledtarget,{overcb:function(){enabled.hide();hovered.show();ra();}}),clickconfig);
    fabric.Clickable(fabric.Hoverable(hoveredtarget,{outcb:function(){hovered.hide();enabled.show();ra();}}),clickconfig);
    hovered.hide();
    pressed.hide();
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);


