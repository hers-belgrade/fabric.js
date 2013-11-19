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

  fabric.ResourceSlider = function(svgelem,config){
    var changecb = config.changecb;
    var area = config&&config.area ? svgelem.getObjectById(config.area) : svgelem;
    var handleconfig = config.handle;
    var handle = svgelem.getObjectById(handleconfig.id);
    var corr;
    var hoveredhandleelement = handle.getObjectById(handleconfig.targets.hovered);
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
        maxpoint.x -= (hoveredhandleelement.width/handlescale.x*areascale.x);
        if(svgelem.sliderSetup){
          stepsize=(maxpoint.x-minpoint.x)/(svgelem.sliderSetup.max-svgelem.sliderSetup.min)*svgelem.sliderSetup.step;
        }else{
          stepsize=0;
        }
      }
    }
    var lastvalue;
    var placeHandle = function(point){
      initScales();
      var fx = (point.x-corr.x);
      if(fx<minpoint.x){
        fx=minpoint.x;
      }
      if(fx>maxpoint.x){
        fx=maxpoint.x;
      }
      if(stepsize){
        var currx=minpoint.x,dist=Math.abs(fx-currx),tempdist=dist,currvalue=svgelem.sliderSetup.min;
        while(currx<=maxpoint.x){
          currx+=stepsize;
          tempdist=Math.abs(fx-currx);
          if(tempdist>dist){
            currx-=stepsize;
            break;
          }
          currvalue+=svgelem.sliderSetup.step;
          dist = tempdist;
        }
        fx = currx;
        if(currvalue!==lastvalue){
          lastvalue=currvalue;
          changecb&&changecb(lastvalue);
        }
      }
      fx-=minpoint.x;
      handle.set({left:zerohandlepoint.x+handlescale.x*fx});
    };
    area.on('mouse:move',function(e){
      if(svgelem.dragActive){
        placeHandle(e.e);
        svgelem.invokeOnCanvas('renderAll');
      }
    });
    fabric.Clickable(area,{clickcb:function(e){
      initScales();
      corr={x:hoveredhandleelement.width/handlescale.x*areascale.x/2,y:0};
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
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

