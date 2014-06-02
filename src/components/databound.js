(function(global) {
  var globl_cnt = 1;

  var fabric = global.fabric || (global.fabric = { }),
			isFunction = fabric.util.isFunction,
      extend = fabric.util.object.extend;

	/// all conditions has to be met in order to allow setScalar ... 
	function ConditionHandler (svgelem, config) {
		this.el = svgelem;
		this.value;
		this.conditions = config.conditions;
    this._cntr = globl_cnt;
    globl_cnt++;
	}
	ConditionHandler.prototype.setCondition = function (name, value) {
		if (!(name in this.conditions)) return;
    //if (this.el.id === 'balance') console.log('setting condition to balance', name, value, this._cntr);
		this.conditions[name] = value;
		if (!this.isAllowed()) return;
		this.el.fire('conditions:true');
	}

	ConditionHandler.prototype.isAllowed = function () {
		for (var i in this.conditions) {
			if (!this.conditions[i]) {
        //console.log(i, 'is false');
        return false;
      }
		}
		return true;
	}

	ConditionHandler.prototype.reset = function () {
		for (var i in this.conditions) this.conditions[i] = false;
	}


  function setScalar(svgelem,value){
		if (svgelem._conditions && !svgelem._conditions.isAllowed()) {
			//(svgelem.id === 'balance') && console.log('conditions said no', svgelem.id, value, svgelem._conditions.conditions, svgelem._conditions._cntr);
			return;
		}
    //(svgelem.id === 'balance') && console.log('conditions said ok', svgelem.id, value);
		if (svgelem._db && isFunction(svgelem._db.formula)) value = svgelem._db.formula(value);
    if(typeof svgelem.setScalar === 'function'){
      svgelem.setScalar(value);
    }else{
      svgelem.set({text:value});
    }
  };

	function prepareValue (svgelem, config, init_val) {
    config = config || {};

    if (svgelem._ct) {
      svgelem.off('conditions:true', svgelem._ct);
      delete svgelem._ct;
    }
		svgelem._db = { formula : (isFunction(config.calc)) ? config.calc : undefined };
		if (config.conditions) {
      svgelem._ct = function () { setScalar(svgelem, svgelem._readScalar()); };
			svgelem.on ('conditions:true' , svgelem._ct);
			if (!svgelem._conditions) svgelem._conditions = new ConditionHandler(svgelem, config);
		}
		setScalar(svgelem, init_val);
	}

	function prepareOnline (svgelem, config, init_val) {
		fabric.DataAware(svgelem, {
      onFollowing: function () {
        this._startFollowers();
      }
    });

		svgelem._readScalar = function () {
			return config.follower.scalars[config.scalarname];
		}
		prepareValue(svgelem, config, init_val);
		svgelem.follow(config.follower);
	}

  fabric.ScalarBound = function(svgelem,config){
    svgelem._startFollowers = function () {
      svgelem.listenToScalar(config.scalarname,{setter:function(val){
        setScalar(this,val);
      }});
    }
		prepareOnline(svgelem, config);
    return svgelem;
  };

  fabric.CalculatedScalarBound = function(svgelem,config){
    svgelem._startFollowers = function () {
      svgelem.listenToScalar(config.scalarname,{setter:function(val){
        setScalar(this,val);
      }});
    }
		prepareOnline(svgelem, config);
    return svgelem;
  };

  fabric.MultiScalarBound = function(svgelem,config){
  svgelem._startFollowers = function () {
      svgelem.listenToMultiScalars(config.scalarnames,function(map){
        setScalar(this,map);
      });
    }
		prepareOnline(svgelem, config);
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

