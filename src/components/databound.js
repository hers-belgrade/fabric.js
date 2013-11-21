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
    fabric.DataAware(svgelem);
    setScalar(svgelem);
    svgelem.follow(config.follower);
    svgelem.listenToScalar(config.scalarname,{setter:function(val){
      setScalar(this,val);
    }});
    return svgelem;
  };

  fabric.CalculatedScalarBound = function(svgelem,config){
    setScalar(svgelem);
    var formula = config.calc;
    fabric.DataAware(svgelem);
    svgelem.follow(config.follower);
    svgelem.listenToScalar(config.scalarname,{setter:function(val){
      setScalar(this,formula(val));
    }});
    return svgelem;
  };

  fabric.MultiScalarBound = function(svgelem,config){
    setScalar(svgelem);
    fabric.DataAware(svgelem);
    svgelem.follow(config.follower);
    var formula = config.calc;
    svgelem.listenToMultiScalars(config.scalarnames,function(map){
      setScalar(this,formula(map));
    });
    return svgelem;
  };

})(typeof exports !== 'undefined' ? exports : this);

