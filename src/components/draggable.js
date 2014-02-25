(function(global) {

  var fabric = global.fabric || (global.fabric = { });
	var isFunction = fabric.util.isFunction;

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


    fabric.Clickable(hotspot,{ctx:svgelem,downcb:function(e){
      this.dragActive=true;
      this.dragPosition=e.e;
			isFunction(config.onStarted) && config.onStarted.call(svgelem, {
				x : vm('get', 'x'),
				y : vm('get', 'y')
			});
    },clickcb:function(){
      delete this.dragActive;
      delete this.dragPosition;
      doConstrain && doConstrain();
			isFunction(config.onFinished) && config.onFinished.call(svgelem, {
				x: vm('get','x'),
				y: vm('get','y')
			});

    }});
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

  fabric.ResourceSlider = function(svgelem,config){
    var changecb = config.changecb;
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    var handleconfig = config.handle;
    var handle = svgelem.getObjectById(handleconfig.id);
    var corr;
    var handlehotspot = handle.getObjectById(handle.id+'_hotspot');
    var setupdone = false,lastvalue,laststepindex=0;
    var handlescale,areascale,minpoint,maxpoint,zerohandlepoint;
    var setPoints = function(){
      minpoint = area.localToGlobal(new fabric.Point(0,0));
      maxpoint = area.localToGlobal(new fabric.Point(area.width,area.height));
    };
    function initScales(){
      if(!handlescale){
        zerohandlepoint=new fabric.Point(handle.left,handle.top);
        handlescale=handle.globalScale();
        areascale=area.globalScale();
        setPoints();
      }
      if(!setupdone){
        var s = svgelem.sliderSetup;
        if(s){
          makeSteps();
        }
        setupdone=true;
      }
    }
    var calccorr = config.vertical ? function(){return {x:0,y:handlehotspot.height/handlescale.y/2};} : function(){return {x:handlehotspot.width/handlescale.x/2,y:0};};
    function downHandler(e){
      var hp = handlehotspot.localToGlobal(new fabric.Point(0,0));
      corr = {x:e.e.x-hp.x,y:e.e.y-hp.y};
    };
    handleconfig.downcb = function(e){
      svgelem.dragActive=true;
      initScales();
      downHandler(e);
    };
    handleconfig.clickcb = function(e){
      delete svgelem.dragActive;
    };
    delete handleconfig.ctx;
    fabric.ResourceButton(svgelem.getObjectById(handleconfig.id),handleconfig);
    var setHandlePos = config.vertical ? function(val){
      handle.set({left:zerohandlepoint.x,top:val});
    } : function(val){
      handle.set({left:val,top:zerohandlepoint.y});
    };
    var steps = [];
    var makeSteps = config.vertical ? function(){
      steps = [];
      var lasty = minpoint.y+handlehotspot.height/handlescale.y;
      var len = maxpoint.y-lasty;
      //console.log('active length',len);
      var s = svgelem.sliderSetup;
      var ratio = len/(s.max-s.min);
      var step = s.step || 1;
      var stepr = step*ratio;
      var v = s.min;
      var y = maxpoint.y;
      console.log('filling',steps);
      while(v<=s.max){
        steps.push({mark:y,val:v});
        console.log('unshifted',v);
        v+=step;
        y-=stepr;
      }
      if(v-step<s.max){
        console.log('unshifted',s.max);
        steps.push({mark:lasty,val:s.max});
      }
      console.log('steps',steps);
    } : function(){
      steps = [];
      var lastx = maxpoint.x-handlehotspot.width/handlescale.x;
      var len = lastx-minpoint.x;
      //console.log('active length',len,maxpoint.x,minpoint.x,handlehotspot.width,handlescale.x);
      var s = svgelem.sliderSetup;
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
    };
    var pointOfMark = config.vertical ? function(mark){return {x:minpoint.x,y:mark};} : function(mark){return {x:mark,y:maxpoint.y};};
    var markOfPoint = config.vertical ? function(point){return point.y;} : function(point){return point.x;};
    var valueToPos = function(val){
      var s;
      for(var i in steps){
        s = steps[i];
        if(val<=s.val){
          //console.log('valueToPos',val,steps,s.mark);
          return pointOfMark(s.mark);
        }
      }
      return pointOfMark(s.mark);
    };
    var posToValue = config.vertical ? function(point){
      var m = markOfPoint(point);
      var s;
      for(var i = steps.length-1; i>=0; i--){
        s = steps[i];
        if(s.mark>=m){
          //console.log('posToValue',m,steps,s.val);
          laststepindex=i;
          return s.val;
        }
      }
      laststepindex=i;
      return s.val;
    } : function(point){
      var m = markOfPoint(point);
      var s;
      for(var i in steps){
        s = steps[i];
        if(s.mark>=m){
          //console.log('posToValue',m,steps,s.val);
          laststepindex=i;
          return s.val;
        }
      }
      laststepindex=i;
      return s.val;
    };
    var posToHandlePos = function(pos){
      return {left:zerohandlepoint.x+(pos.x-minpoint.x)*handlescale.x,top:zerohandlepoint.y+(pos.y-maxpoint.y)*handlescale.y};
    };
    var placeHandle = function(p){
      //console.log('mouse',p.x,p.y);
      p.x-=corr.x;
      p.y-=corr.y;
      var val = posToValue(p);
      var pos = valueToPos(val);
      var pthp = posToHandlePos(pos);
      //console.log('point',p.x,p.y,'=> value',val,'=> pos',pos.x,pos.y,'=> handle pos',pthp.left,pthp.top);
      handle.set(pthp);
      if(lastvalue!==val){
        lastvalue=val;
        changecb && changecb.call(svgelem,val);
      }
      svgelem.invokeOnCanvas('renderAll');
    };
    area.on('mouse:move',function(e){
      if(svgelem.dragActive){
        placeHandle(e.e);
      }
    });
    fabric.Clickable(area,{clickcb:function(e){
      initScales();
      corr=calccorr();
      placeHandle(e.e);
    }});
    svgelem.setup = function(obj){
      setupdone = false;
      if(typeof obj.min === 'undefined' || typeof obj.max === 'undefined' || typeof obj.step === 'undefined'){
       return;
      } 
      this.sliderSetup = obj;
      if(zerohandlepoint){
        initScales();
        //handle.set({left:zerohandlepoint.x});
        setHandlePos(0);
        svgelem.invokeOnCanvas('renderAll');
      }
    };
    svgelem.stepUp = function(){
      initScales();
      if(laststepindex>=steps.length-1){return;}
      laststepindex++;
      corr={x:0,y:0};
      placeHandle(pointOfMark(steps[laststepindex].mark));
    };
    svgelem.stepDown = function(){
      initScales();
      if(laststepindex<1){return;}
      laststepindex--;
      corr={x:0,y:0};
      placeHandle(pointOfMark(steps[laststepindex].mark));
    };
    svgelem.setMin = function(){
      initScales();
      laststepindex=0;
      corr={x:0,y:0};
      placeHandle(pointOfMark(steps[laststepindex].mark));
    };
    svgelem.setMax = function(){
      initScales();
      laststepindex=steps.length-1;
      corr={x:0,y:0};
      placeHandle(pointOfMark(steps[laststepindex].mark));
    };
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

