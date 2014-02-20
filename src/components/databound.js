(function(global) {

  var fabric = global.fabric || (global.fabric = { }),
			isFunction = fabric.util.isFunction,
      extend = fabric.util.object.extend;

	/// all conditions has to be met in order to allow setScalar ... 
	function ConditionHandler (svgelem, config) {
		this.el = svgelem;
		this.value;
		this.conditions = config.conditions;
	}

	ConditionHandler.prototype.setCondition = function (name, value) {
		if (!(name in this.conditions)) return;
		this.conditions[name] = value;
		if (!this.isAllowed()) return;
		//console.log('all conditions met ',this.conditions);
		this.el.fire('conditions:true');
	}

	ConditionHandler.prototype.isAllowed = function () {
		for (var i in this.conditions) {
			if (!this.conditions[i]) return false;
		}
		return true;
	}

	ConditionHandler.prototype.reset = function () {
		for (var i in this.conditions) this.conditions[i] = false;
	}


  function setScalar(svgelem,value){

		if (svgelem._conditions && !svgelem._conditions.isAllowed()) {
			//console.log('conditions said no', svgelem.id, value, svgelem._conditions.conditions);
			return;
		}
		if (isFunction(svgelem._db.formula)) value = svgelem._db.formula(value);
    if(typeof svgelem.setScalar === 'function'){
      svgelem.setScalar(value);
    }else{
      svgelem.set({text:value});
    }
  };

	function prepareValue (svgelem, config, init_val) {
		svgelem._db = { formula : (isFunction(config.calc)) ? config.calc : undefined };
		setScalar(svgelem, init_val);
		if (config.conditions) {
			svgelem.on ('conditions:true' , function () { setScalar(svgelem, svgelem._readScalar()); });
			svgelem._conditions = new ConditionHandler(svgelem, config);
		}
	}

	function prepareOnline (svgelem, config, init_val) {
		fabric.DataAware(svgelem);
		svgelem.follow(config.follower);
		svgelem._readScalar = function () {
			return config.follower.scalars[config.scalarname];
		}
		prepareValue(svgelem, config, init_val);
	}

  fabric.ScalarBound = function(svgelem,config){
		prepareOnline(svgelem, config);
    svgelem.listenToScalar(config.scalarname,{setter:function(val){
      setScalar(this,val);
    }});
    return svgelem;
  };

  fabric.CalculatedScalarBound = function(svgelem,config){
		prepareOnline(svgelem, config);
    svgelem.listenToScalar(config.scalarname,{setter:function(val){
      setScalar(this,val);
    }});
    return svgelem;
  };

  fabric.MultiScalarBound = function(svgelem,config){
		prepareOnline(svgelem, config);
    svgelem.listenToMultiScalars(config.scalarnames,function(map){
      setScalar(this,map);
    });
    return svgelem;
  };

	fabric.OfflineBound = function (svgelem, config) {
		svgelem._readScalar = function () {
			return svgelem._scalar_val;
		}
		svgelem.doSetValue = function (v) { 
			svgelem._scalar_val = v;
			setScalar(svgelem, v); 
		}
		prepareValue(svgelem, config);
	}

})(typeof exports !== 'undefined' ? exports : this);

