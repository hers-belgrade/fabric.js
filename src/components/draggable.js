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
        target.set({left:target.left + (p.x-svgelem.dragPosition.x),top:target.top + (p.y-svgelem.dragPosition.y)});
        svgelem.dragPosition=p;
        svgelem.invokeOnCanvas('renderAll');
      }
    });
    return svgelem;
  };

  fabric.ResourceSlider = function(svgelem,config){
    var poscriterion = config.vertical ? function(obj){return obj.y} : function(obj){return obj.x};
    var sizecriterion = config.vertical ? function(obj){return obj.height} : function(obj){return obj.width};
    var changecriterion = config.vertical ? function(obj,val){obj.y+=val;} : function(obj,val){obj.x+=val;};
    var changecb = config.changecb;
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    var handleconfig = config.handle;
    var handle = svgelem.getObjectById(handleconfig.id);
    var corr;
    var hoveredhandleelement = handle.getObjectById(handle.id+'_hotspot');
    var calccorr = config.vertical ? function(){return {x:0,y:hoveredhandleelement.height/handlescale.y*areascale.y/2};} : function(){return {x:hoveredhandleelement.width/handlescale.x*areascale.x/2,y:0};};
    function downHandler(e){
      var hp = hoveredhandleelement.localToGlobal(new fabric.Point(0,0));
      corr = {x:e.e.x-hp.x,y:e.e.y-hp.y};
    };
    handleconfig.downcb = function(e){
      svgelem.dragActive=true;
      downHandler(e);
    };
    handleconfig.clickcb = function(e){
      delete svgelem.dragActive;
    };
    delete handleconfig.ctx;
    fabric.ResourceButton(svgelem.getObjectById(handleconfig.id),handleconfig);
    var handlescale,areascale,minpoint,maxpoint,zerohandlepoint,stepsize;
    function initScales(){
      if(!handlescale){
        zerohandlepoint=new fabric.Point(handle.left,handle.top);
        handlescale=handle.globalScale();
        areascale=area.globalScale();
        minpoint = area.localToGlobal(new fabric.Point(0,0));
        maxpoint = area.localToGlobal(new fabric.Point(area.width,area.height));
        changecriterion(maxpoint, -(sizecriterion(hoveredhandleelement)/poscriterion(handlescale)*poscriterion(areascale)));
        if(svgelem.sliderSetup){
          stepsize=(poscriterion(maxpoint)-poscriterion(minpoint))/(svgelem.sliderSetup.max-svgelem.sliderSetup.min)*svgelem.sliderSetup.step;
        }else{
          stepsize=0;
        }
      }
    }
    var setHandlePos = config.vertical ? function(val){
      handle.set({top:val});
    } : function(val){
      handle.set({left:val});
    };
    var lastvalue;
    var placeHandle = function(point){
      initScales();
      var f = (poscriterion(point)-poscriterion(corr)),minf = poscriterion(minpoint),maxf = poscriterion(maxpoint);
      if(f<minf){
        f=minf;
      }
      if(f>maxf){
        f=maxf;
      }
      if(stepsize){
        var curr=minf,dist=Math.abs(f-curr),tempdist=dist,currvalue=svgelem.sliderSetup.min;
        while(curr<=maxf){
          curr+=stepsize;
          tempdist=Math.abs(f-curr);
          if(tempdist>=dist){
            curr-=stepsize;
            break;
          }
          currvalue+=svgelem.sliderSetup.step;
          dist = tempdist;
        }
        f = curr;
        if(currvalue!==lastvalue){
          lastvalue=currvalue;
          changecb&&changecb(lastvalue);
        }
      }
      f-=minf;
      setHandlePos(poscriterion(zerohandlepoint)+poscriterion(handlescale)*f);
      //console.log(point.x,zerohandlepoint.x,handlescale.x,zerohandlepoint.x+handlescale.x*fx);
    };
    var placeHandleAtStep = config.vertical ? function (sc){
      placeHandle(new fabric.Point(minpoint.x,minpoint.y+sc*stepsize));
    } : function (sc){
      placeHandle(new fabric.Point(minpoint.x+sc*stepsize,minpoint.y));
    };
    area.on('mouse:move',function(e){
      if(svgelem.dragActive){
        placeHandle(e.e);
        svgelem.invokeOnCanvas('renderAll');
      }
    });
    fabric.Clickable(area,{clickcb:function(e){
      initScales();
      corr=calccorr();
      placeHandle(e.e);
      svgelem.invokeOnCanvas('renderAll');
    }});
    svgelem.setup = function(obj){
      if(typeof obj.min === 'undefined' || typeof obj.max === 'undefined' || typeof obj.step === 'undefined'){
       return;
      } 
      if(zerohandlepoint){
        handle.set({left:zerohandlepoint.x});
        svgelem.invokeOnCanvas('renderAll');
      }
      this.sliderSetup = obj;
    };
    svgelem.placeHandleFromValue = function(val){
      if(!this.sliderSetup){return;}
      initScales();
      corr={x:0,y:0};
      var sc = ~~((val-this.sliderSetup.min)/this.sliderSetup.step);
      placeHandleAtStep(sc);
    };
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

