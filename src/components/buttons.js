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
    var clickcb = function(){
      reset.call(this);
      config.clickcb.call(this);};
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
          renderables[i] && renderables[i].show();
        }else{
          renderables[i] && renderables[i].hide();
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
    function clicked(e){
      if(!svgelem.enabled){return;}
      renderState('enabled');
      config.clickcb.call(config.ctx, e);
			if (config.stopPropagation) e.e.propagationStopped = true;
    };

		var old_hide = svgelem.hide;
		svgelem.hide = function () {
			this.disable();
			return old_hide.apply(this, arguments);
		}

    var target = svgelem.getObjectById(svgelem.id+'_hotspot');

		/// one should disable/enable target as well once button is disabled/enabled
    svgelem.enable = function(){
			this.enabled=true;
			target.enabled = true;
			renderState('enabled');
			return this;
		};
    svgelem.disable = function(){
			this.enabled=false;
			target.enabled = false;
			renderState('disabled');
			return this;
		};
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
    var checkmark = svgelem.getObjectById(svgelem.id+'_checkmark');
    svgelem.checked = config.checked||false;
    svgelem.check = function(){
      svgelem.checked=true;
      checkmark.show();
    };
    svgelem.uncheck = function(){
      svgelem.checked=false;
      checkmark.hide();
    };
    function cbclickcb(){
      svgelem.checked ? svgelem.uncheck() : svgelem.check();
      clickcb && clickcb.call(svgelem);
    };
    var clickcb = config.clickcb;
    config.clickcb=cbclickcb;
    fabric.ResourceButton(svgelem,config);
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);


