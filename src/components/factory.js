(function(global) {

  var fabric = global.fabric || (global.fabric = { });

  if(fabric.Factory){
    return;
  }

  fabric.Factory = function (svgelem, config){
    var item = config.template;
    var applyComponents;
    if(config.component){
      var comp = config.component;
      applyComponents = function(elem){
        return comp(elem);
      };
    }else if(config.components){
      var comps = config.components.slice();
      applyComponents = function(elem){
        for(var i in comps){
          elem = comps[i](elem);
        }
        return elem;
      };
    }else{
      applyComponents = function(elem){return elem;}
    }

    svgelem.produce = function(config){
      return applyComponents(item.clone());
    };
  };

})(typeof exports !== 'undefined' ? exports : this);


