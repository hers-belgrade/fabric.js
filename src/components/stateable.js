(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
			isFunction = fabric.util.isFunction, 
      extend = fabric.util.object.extend;

	function _execute (item, action, old) {
		item.cb.call(item.ctx, action, this.state, old);
	}

	function _register_to_list (state_list, cb, ctx) {
		if (!isFunction(cb) || !state_list.length) return undefined;
		var ret = {};
		for (var i in state_list) {
			var s = state_list[i];
			if (!this.registrants[s]) continue;
			ret[s] = this.registrants[s].push ({cb:cb, ctx: ctx});
			if (s === this.state) cb ('in', s);
		}
		return ret;
	}


	function StateManager (svgelem, states) {
		if (!arguments.length) return;
		this.registrants = {};
		for (var i in states) {
			/// very inefficient approach if there are lot of removals ... should consider better one ...
			this.registrants[states[i]] = [];
		}
		this.state = undefined;
		this.svgelem = svgelem;
	}

	StateManager.prototype.list = function () {
		return Object.keys (this.registrants);
	}

	///TODO: introduce hints into state list for in and out actions, to reduce function callings...
	StateManager.prototype.register = function (state, cb, ctx) {
		if ('string' !== typeof(state)) return undefined;

		if (state === '*') { return _register_to_list.call(this, this.list(), cb, ctx); }
		var list;
		if (state.charAt(0) === '!') {
			var black_list = state.substring(1).split(',');
			var all = this.list;
			list = [];
			for (var i in all) {
				if (black_list.indexOf(all[i]) < 0) list.push (all[i]);
			}
		}else{
			list = state.split(',');
		}
		return _register_to_list.call(this, list, cb, ctx);
	}

	StateManager.prototype.unregister = function (id_map) {
		for (var i in id_map) {
			this.registrants[i][id_map[i]] = undefined;
		}
	}
  StateManager.prototype.dropState = function () {
    delete this.state;
  }

	StateManager.prototype.setState = function (s) {
		if (this.state === s) return undefined;

		var old = this.state;
		this.state = s;

		for (var i in this.registrants[old]) {
			_execute.call(this, this.registrants[old][i], 'out', old);
		}
		for (var i in this.registrants[s]) {
			_execute.call(this, this.registrants[s][i], 'in', s);
		}

		this.svgelem.fire('state:changed', s, old);
	}


	fabric.Stateable = function (svgelem, config) {
    if (svgelem._stateable) {
      svgelem._stateable.dropState();
    }else{
		  svgelem._stateable = new StateManager(svgelem, config.states);
    }
		return svgelem;
	}
})(typeof exports !== 'undefined' ? exports : this);
