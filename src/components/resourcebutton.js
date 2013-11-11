(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  fabric.ResourceButtonNormalHovered = function(svgelem,config){
    var hovered = svgelem.getObjectById(svgelem.id+'_hovered');
    var normal = svgelem.getObjectById(svgelem.id+'_normal');
    fabric.Hoverable(normal,{ctx:svgelem,overcb:function(){hovered.show();normal.hide();this.invokeOnCanvas('renderAll');}});
    fabric.Clickable(fabric.Hoverable(hovered,{ctx:svgelem,outcb:function(){normal.show();hovered.hide();this.invokeOnCanvas('renderAll');}}),{ctx:config.ctx||svgelem,clickcb:config.clickcb});
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
    fabric.Hoverable(enabledtarget,{overcb:function(){enabled.hide();hovered.show();ra();}});
    fabric.Clickable(fabric.Hoverable(hoveredtarget,{outcb:function(){hovered.hide();enabled.show();ra();}}),{ctx:config.ctx||svgelem,clickcb:config.clickcb});
    hovered.hide();
    pressed.hide();
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

