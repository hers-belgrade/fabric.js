(function(global) {

  var fabric = global.fabric || (global.fabric = { });
	var extend = fabric.util.object.extend, Easings = fabric.util.ease, isFunction = fabric.util.isFunction;

  if(fabric.Draggable){return;}

  fabric.Draggable = function(svgelem,config){
		function get_me_obj (req) {
			return ('string' === typeof(req)) ? svgelem.getObjectById(req) : req;
		}

		var config = config || {};
    var hotspot = config&&config.hotspot ? get_me_obj(config.hotspot) : svgelem;
    var target = config&&config.target ? get_me_obj(config.target) : svgelem;
    var area = config&&config.area ? get_me_obj(config.area) : svgelem;
    var direction = config ? config.direction : '';
    var doConstrain;
    if(config && config.constrainto){
      doConstrain = function(){
        if(area.oCoords && target.oCoords){
          var coc = config.constrainto.oCoords, toc = target.oCoords;
          if(coc.tl.y<toc.tl.y){
            target.animate({top:target.top + (coc.tl.y-toc.tl.y)},100);
            svgelem.invokeOnCanvas('renderAll');
          }else{
            //display as much as possible
            var ch = coc.br.y-coc.tl.y;
            var th = toc.br.y-toc.tl.y;
            if(coc.br.y>toc.br.y && th>ch){
              target.set({top:target.top + (coc.br.y-toc.br.y)});
              svgelem.invokeOnCanvas('renderAll');
            }else{
              if(coc.tl.y>toc.tl.y && th<ch){
                target.set({top:target.top + (coc.tl.y-toc.tl.y)});
                svgelem.invokeOnCanvas('renderAll');
              }
            }
          }
        }
      }
    }


		function add(a, b) {return a+b;}
		function sub(a, b) {return a-b;}

		var update = (config.nature === 'negative') ? sub : add;
		var vm = function () {
			return config.value_manipulator.apply(target, arguments);
		}

		////TODO: we still have bit odd behavior, to restore dragging abilities ...
		function doneWithDragging () {
			//console.log('=================>', this.id, this);
      delete this.dragActive;
      delete this.dragPosition;
      doConstrain && doConstrain();
			isFunction(config.onFinished) && config.onFinished.call(svgelem, {
				x: vm('get','x'),
				y: vm('get','y')
			});
		}

		hotspot.on('mouselisteners:removed', doneWithDragging);
    fabric.Clickable(hotspot,{ctx:svgelem,downcb:function(e){
      this.dragActive=true;
      this.dragPosition=e.e;
			isFunction(config.onStarted) && config.onStarted.call(svgelem, {
				x : vm('get', 'x'),
				y : vm('get', 'y')
			});
    },clickcb:doneWithDragging});
    fabric.MouseAware(area);


		if (!isFunction(config.value_manipulator)) {
			config.value_manipulator = function (action, axis, value) {
				if (action === 'get') {
					return (axis === 'x') ? this.left : this.top;
				}

				if (action === 'set') {
					if (axis === 'x') {
						return this.set('left', value);
					}else{
						return this.set('top', value);
					}
				}
			}
		}
    area.on('mouse:move',function(e){
			//console.log('doing mouse move ...');
      if(svgelem.dragActive){
        var p = e.e;
        switch(direction){
          case 'vertical':
            vm('set','y',update(vm('get', 'y'),(p.y-svgelem.dragPosition.y)));
          break;
          case 'horizontal':
            vm('set','x',update(vm('get', 'x'),(p.x-svgelem.dragPosition.x)));
          break;
          default:
            vm('set','x',update(vm('get', 'x'),(p.x-svgelem.dragPosition.x)));
            vm('set','y',update(vm('get', 'y'),(p.y-svgelem.dragPosition.y)));
          break;
        }
        svgelem.dragPosition=p;
        svgelem.invokeOnCanvas('renderAll');
      }
    });
    return svgelem;
  };


  RSP = function (config) {
    if (!arguments.length) return;
    this._config = config;
  }

  RSP.prototype.setup = function (obj) {
    this._setup = obj;
  }

  RSP.prototype.first_render = function (data) {
    this.minpoint = data.minpoint;
    this.maxpoint = data.maxpoint;
    this.zerohandlepoint = data.zerohandlepoint;
    this.handlescale = data.handlescale;
    this.areascale = data.areascale;
    this.handlehotspot = data.handlehotspot;
    this.area = data.area;
  }

  RSP.prototype.posToValue = function (point) {
    throw "Not implemented";
  }
  RSP.prototype.valueToPos = function (val) {
    throw "Not implemented";
  }

  RSP.prototype.createPoints = function () {
    throw "Not implemented";
  }

  RSP.prototype.upAllowed = function () {
    throw "Not implemented";
  }
  RSP.prototype.downAllowed = function () {
    throw "Not implemented";
  }

  RSP_Discrete = function (config) {
    RSP.prototype.constructor.apply(this, arguments);
  }

  RSP_Discrete.prototype = new RSP();
  RSP_Discrete.prototype.constructor = RSP_Discrete;

  RSP_Discrete.prototype.setup = function (obj) {
    if (!obj || !(obj.steps instanceof Array)) return;
    RSP.prototype.setup.call(this, obj);
    return true;
  }

  RSP_Discrete.prototype.posToValue = function (point) {
    var config = this._config;
    if (config.vertical){
      var m = this._markOfPoint(point);
      var s;
      for(var i = this._steps.length-1; i>=0; i--){
        s = this._steps[i];
        if(s.mark>=m){
          //console.log('posToValue',m,steps,s.val);
          this.laststepindex=i;
          return s.val;
        }
      }
      this.laststepindex=i;
      return s.val
    }else{
      var m = this._markOfPoint(point);
      var s;
      for(var i = 0; i < this._steps.length; i++){
        s = this._steps[i];
        if(s.mark>=m){
          //console.log('posToValue',m,steps,s.val);
          this.laststepindex=i;
          return s.val;
        }
      }
      this.laststepindex=i;
      return s.val;
    };
  }

  RSP_Discrete.prototype.getMarks = function () {
    return this._steps.map(function (v) {return v.mark;});
  }

  RSP_Discrete.prototype._currentPointOfMark = function () {
    return this._pointOfMark(this._steps[this.laststepindex].mark);
  }

  RSP_Discrete.prototype.inc = function () {
    if (!this.upAllowed()) return;
    this.laststepindex++;
    return this._currentPointOfMark();
  }
  RSP_Discrete.prototype.dec = function () {
    if (!this.downAllowed()) return;
    this.laststepindex--;
    return this._currentPointOfMark();
  }
  RSP_Discrete.prototype.min = function () {
    this.laststepindex = 0;
    return this._currentPointOfMark();
  }
  RSP_Discrete.prototype.max = function () {
    this.laststepindex=this._steps.length-1;
    return this._currentPointOfMark();
  }

  RSP_Discrete.prototype.index = function (i) {
    this.laststepindex = i;
    return this._currentPointOfMark();
  }

  RSP_Discrete.prototype.upAllowed = function () {
    return this.laststepindex < this._steps.length;
  }

  RSP_Discrete.prototype.downAllowed= function () {
    return this.laststepindex >= 0;
  }


  RSP_Discrete.prototype._pointOfMark = function (mark) {
    return this._config.vertical ? {x:this.minpoint.x,y:mark}: {x:mark,y:this.maxpoint.y};
  }
  RSP_Discrete.prototype._markOfPoint = function (point) {
    return this._config.vertical ? point.y : point.x;
  }

  RSP_Discrete.prototype.valueToPos = function (val) {
    var s;
    for(var i in this._steps){
      s = this._steps[i];
      if(val<=s.val){
        //console.log('valueToPos',val,steps,s.mark);
        return this._pointOfMark(s.mark);
      }
    }
    return this._pointOfMark(s.mark);
  }

  RSP_Discrete.prototype.updateSetup = function () {
    var config  = this._config;
    this.laststepindex = 0;
    var vals = this._setup.steps;
    var stps = this._setup.steps.slice();
    var m = stps[0];
    
    var max_point = config.vertical ? this.maxpoint.y : this.maxpoint.x;
    var min_point = config.vertical ? this.minpoint.y : this.minpoint.x;

    var delta = (max_point - min_point)/(stps[stps.length-1] - m);

    this._steps = [];
    for (var i = 0 ; i < stps.length ; i++) {
      this._steps.push ({
        mark : min_point+delta * (stps[i] - m),
        val : i
      });
    }
  }
  
  RSP_Step = function (config) {
    RSP_Discrete.prototype.constructor.apply(this, arguments);
  }

  RSP_Step.prototype = new RSP_Discrete();
  RSP_Step.prototype.constructor = RSP_Step;

  RSP_Step.prototype.setup = function (obj) {
    RSP.prototype.setup.call(this, obj);
    if(typeof obj.min === 'undefined' || typeof obj.max === 'undefined' || typeof obj.step === 'undefined'){
      return false;
    } 
    this.laststepindex = 0;
    return true;
  }

  RSP_Step.prototype.updateSetup = function (s) {
    if (!this.setup(s)) return;
    this.laststepindex = 0;

    var config = this._config;
    var handlehotspot = this.handlehotspot,
        minpoint = this.minpoint,
        maxpoint = this.maxpoint,
        handlescale = this.handlescale;

    var s = this._setup;
    var min_point = config.vertical ? this.minpoint.y : this.minpoint.x;

    if (config.vertical) {
      steps = [];
      var lasty = minpoint.y+handlehotspot.height/handlescale.y;
      var len = maxpoint.y-lasty;
      //console.log('active length',len);
      var ratio = len/(s.max-s.min);
      var step = s.step || 1;
      var stepr = step*ratio;
      var v = s.min;
      var y = maxpoint.y;
      while(v<=s.max){
        steps.push({mark:y,val:v});
        v+=step;
        y-=stepr;
      }
      if(v-step<s.max){
        steps.push({mark:lasty,val:s.max});
      }
    }else{
      steps = [];
      var lastx = maxpoint.x-handlehotspot.width/handlescale.x;
      var len = lastx-minpoint.x;
      //console.log('active length',len,maxpoint.x,minpoint.x,handlehotspot.width,handlescale.x);
      var ratio = len/(s.max-s.min);
      var step = s.step || 1;
      var stepr = step*ratio;
      var v = s.min;
      var x = minpoint.x;
      while(v<s.max){
        steps.push({mark:x,val:v});
        v+=step;
        x+=stepr;
      }
      if(v>s.max){
        steps.pop();
      }
      steps.push({mark:lastx,val:s.max});
    }
    this._steps = steps;
  }

  ///KRPEZ AKO MENE PITAS ...
  RSP_Step.prototype.mouseClick_correction = function () {
    return this._config.vertical ?  {x:0,y:this.handlehotspot.height/this.handlescale.y/2} : {x:this.handlehotspot.width/this.handlescale.x/2,y:0};
  }
  RSP_Discrete.prototype.mouseClick_correction = function() {
    return this._config.vertical ? {x:0,y:this.handlehotspot.height/this.handlescale.y/2 + this.area.top} : {x:this.handlehotspot.width/this.handlescale.x/2 + this.area.left,y:0};
  }

  ///TODO
  RSP_Cont = function () {
  }
  RSP_Cont.prototype = new RSP();
  RSP_Cont.prototype.constructor = RSP_Cont;


  function PluginFactory (type, config) {
    switch (type) {
      case 'step' : return new RSP_Step(config);
      case 'discrete': return new RSP_Discrete(config);
    }
    return undefined;
  }

  fabric.ResourceSlider = function(svgelem,config){
    var changecb = config.changecb;
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    var handleconfig = config.handle;
    var handle = svgelem.getObjectById(config.handle.id)

    var handlehotspot = svgelem.getObjectById(handle.id+'_hotspot');
    var setupdone = false,lastvalue;
    var handlescale,areascale,zerohandlepoint;

    var Plugin = PluginFactory(config.type || 'step', config);



    function initScales(){
      if(!handlescale){
        handlescale = handle.globalScale();
        Plugin.first_render({
          minpoint : area.localToGlobal(new fabric.Point(0,0)),
          maxpoint : area.localToGlobal(new fabric.Point(area.width,area.height)),
          zerohandlepoint: new fabric.Point(handle.left,handle.top),
          handlescale:handlescale,
          areascale:area.globalScale(),
          handlehotspot: handlehotspot,
          area: area
        });

      }

      if(!setupdone){
        var s = svgelem.sliderSetup;
        s && Plugin.updateSetup(s);
        setupdone=true;
      }
    }

    function downHandler(e){
      var hp = handlehotspot.localToGlobal(new fabric.Point(0,0));
      corr = {x:e.e.x-hp.x,y:e.e.y-hp.y};
    };
    handleconfig.downcb = function(e){
      svgelem.dragActive=true;
      //initScales();
      downHandler(e);
    };
    handleconfig.clickcb = function(e){
      delete svgelem.dragActive;
    };
    delete handleconfig.ctx;

    fabric.ResourceButton(svgelem.getObjectById(handleconfig.id),handleconfig);

    var setHandlePos = config.vertical ? function(val){
      handle.set({left:Plugin.zerohandlepoint.x,top:val});
    } : function(val){
      handle.set({left:val,top:Plugin.zerohandlepoint.y});
    };
    var posToHandlePos = function(pos){
      return {
        left:Plugin.zerohandlepoint.x+(pos.x-Plugin.minpoint.x)*Plugin.handlescale.x,
        top:Plugin.zerohandlepoint.y+(pos.y-Plugin.maxpoint.y)*Plugin.handlescale.y
      };
    };
    var placeHandle = function(p, animation_params){
      ///TODO: do not place if not changed ...
      //console.log('mouse',p.x,p.y);
      p.x-=corr.x;
      p.y-=corr.y;
      var val = Plugin.posToValue(p);
      var pos = Plugin.valueToPos(val);
      var pthp = posToHandlePos(pos);
      if (animation_params && animation_params.duration) {
        handle.animate (pthp, extend (animation_params, {easing:Easings.easeLinear}));
      }else{
        handle.set(pthp);
      }
      if(lastvalue!==val){
        lastvalue=val;
        changecb && changecb.call(svgelem,val);
      }
      svgelem.invokeOnCanvas('renderAll');
    };
    area.on('mouse:move',function(e){
      if(svgelem.dragActive){
        corr = Plugin.mouseClick_correction();
        placeHandle(e.e);
      }
    });
    fabric.Clickable(area,{clickcb:function(e){
      corr = Plugin.mouseClick_correction();
      placeHandle(e.e);
    }});

    svgelem.getMarks = function () {
      return Plugin.getMarks();
    }

    svgelem.setup = function(obj, cb){
      if (!Plugin.setup(obj)) return;
      setupdone = false;
      this.sliderSetup = obj;
      handle.notify_on_geometry_ready (function () {
        initScales();
        setHandlePos(0);
        fabric.util.isFunction (cb) && cb();
      });
      return;




      if(Plugin.zerohandlepoint){
        //initScales();
        setHandlePos(0);
        svgelem.invokeOnCanvas('renderAll');
      }
    };

    svgelem.stepUp = function(animation_params){
      //initScales();
      if (!Plugin.upAllowed()) { return; }
      corr={x:0,y:0};
      placeHandle(Plugin.inc(), animation_params);
    };

    svgelem.stepDown = function(animation_params){
      //initScales();
      if (!Plugin.downAllowed) return;
      corr={x:0,y:0};
      placeHandle(Plugin.dec(), animation_params);
    };

    svgelem.setMin = function(animation_params){
      //initScales();
      corr={x:0,y:0};
      placeHandle(Plugin.min(), animation_params);
    };

    svgelem.setMax = function(animation_params){
      //initScales();
      corr={x:0,y:0};
      placeHandle(Plugin.max(), animation_params);
    };


    svgelem.setIndex = function (i, animation_params) {
      //initScales();
      corr={x:0,y:0};
      placeHandle(Plugin.index(i), animation_params);
    }
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

