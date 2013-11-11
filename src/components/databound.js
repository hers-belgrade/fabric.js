(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  function setScalar(svgelem,value){
    if(typeof svgelem.setScalar === 'function'){
      svgelem.setScalar(value);
    }else{
      svgelem.set({text:value});
    }
  };

  fabric.ScalarBound = function(svgelem,config){
    setScalar(svgelem);
    svgelem.listener = config.follower.listenToScalar(svgelem,config.scalarname,{setter:function(val){
      setScalar(this,val);
    }});
    return svgelem;
  };

  fabric.CalculatedScalarBound = function(svgelem,config){
    setScalar(svgelem);
    var formula = config.calc;
    if(svgelem.listener){
      svgelem.listener.destroy();
    }
    svgelem.listener = config.follower.listenToScalar(svgelem,config.scalarname,{setter:function(val){
      setScalar(this,formula(val));
    }});
    return svgelem;
  };

  fabric.MultiScalarBound = function(svgelem,config){
    setScalar(svgelem);
    var formula = config.calc;
    svgelem.listener = config.follower.listenToMultiScalars(svgelem,config.scalarnames,function(map){
      setScalar(this,formula(map));
    });
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

