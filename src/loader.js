(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
			isFunction = fabric.util.isFunction,
      extend = fabric.util.object.extend;

  /**
   * @private
   */
  function _loadSprites(spritename,cb){
    var ih = (function(_cb){
      var cb = _cb;
      return function(spriteobj){
        var so = spriteobj;
        return function(img){
          var sprites = {};
          for(var i in so){
            if(i==='image'){continue;}
            var sg = so[i];
            sprites[i]=new fabric.Sprite(img.getElement(),{x:sg[0],y:sg[1],width:sg[2],height:sg[3],name:i});
          }
          cb(sprites);
        };
      };
    })(cb);
    var och = (function(_ih){
      var ih=_ih;
      return function(xhr){
        var so = {};
        try{
          so = JSON.parse(xhr.responseText);
        }catch(e){
          cb();
          return;
        } 
        fabric.Image.fromURL(fabric.workingDirectory+'/'+so.image,ih(so));
      };
    })(ih);
    fabric.util.request(fabric.workingDirectory+'/'+spritename+'.sprites',{onComplete:och});
  };

  function _loadSVG(resourcename,loaded){
    return fabric.loadSVGHierarchicalFromURL(resourcename, function(svg){
      if(!fabric.masterSize){
        fabric.masterSize = {width:svg.width,height:svg.height};
        if(fabric.activeCanvasInstance){
          fabric.activeCanvasInstance._computeMasterScale();
        }
      }
      if(svg.static){
        svg.static.setURL(resourcename);
      }

      var df_rn = resourcename.replace(/\//g,'_').replace('\.svg','');
      svg.setResourceName (df_rn);
      var btmr = new Date();
      console.log('preparing background layer');
      if (svg.background_layer) {
        svg.background_layer.dispose(fabric.activeCanvasInstance, df_rn, function () {
          console.log('background layer ready. Processing backgrounds took', (new Date()).getTime() - btmr.getTime(),'ms');
          delete svg.background_layer;
          loaded(svg);
        });
      }else{
        loaded(svg);
      }
    });
  };

  /**
   * @private
   */
  function _loadArray(type,picnamearray,cb,ctx){
    function isArray(value) { return  Object.prototype.toString.call(value) === '[object Array]' };
    if(!isArray(picnamearray)){
      return cb.call(ctx,{});
    }
    
    var picnamearraylen = picnamearray.length;
    var loaded = {};

    var _lf = (function(_loaded,_type){
      var loaded = _loaded;
      var type = _type;
      return function(index){
        if(index>=picnamearraylen){
          //console.log('all intermediate loaded',loaded,'calling cb now');
          cb.call(ctx,loaded);
          return;
        }
        var picname = picnamearray[index].name;
        var root = picnamearray[index].root;
        if(isArray(picname)){
          return _loadArray(type,picname,function(_loaded){for(var i in _loaded){this[i]=_loaded[i];}_lf(index+1)},loaded);
        }
        function resourceloaded(resource){
          //console.log(picname,'loaded',loaded);
          loaded[picname] = resource;
          //console.log('finally',loaded);
          _lf(index+1);
        };
        var rn = root+'/'+picname+'.'+type;
        console.log('loading',fabric.workingDirectory,picname,type,rn);
        switch(type){
          case 'png':
            return fabric.Image.fromURL(rn,resourceloaded);
          case 'sprites':
            return _loadSprites(picname,resourceloaded);
          case 'svg':
            return _loadSVG(rn,resourceloaded);
          default:
            return _lf(index+1);
        }
      };
    })(loaded,type);

    _lf(0);
  };


  /**
   * Batch resource loading
   * @static
   * @function
   * @memberOf fabric
   * @param {Object} hash with keys: root, sprites, svg, png. 
   * root is the path to the root directory.
   * svg, sprites, png map to arrays of appropriate resource names in the root Directory
   */
  function loadResources(resobj,cb,ctx){
    //preprocess paths so you can be able to change setWorkingDirectory at any moment
    //
    //
    function prepare_map (obj) {
      for (var i in obj) {
        if (!obj[i].name && !obj[i].root) obj[i] = {name: obj[i], root:resobj.root||''};
      }
    }
    prepare_map(resobj.svg);
    prepare_map(resobj.sprites);

    _loadArray('svg',resobj.svg,function(loaded){
      _loadArray('sprites',resobj.sprites,function(_loaded){
        for(var i in _loaded){
          loaded[i] = _loaded[i];
        }
        cb.call(ctx,loaded);
      });
    });
  };

	function loadInParallel (resobj, cb, ctx) {
		var root = resobj.root;

		var pending = {};

		function check_pending () {
			for (var c in pending) {
				if (Object.keys(pending[c]).length) return;
			}
			pending = undefined;
			isFunction(cb) && cb.call(ctx);
		}

    pending.svg = {};
		for (var _i in resobj.svg) {
			(function (o, i) {
        setTimeout(function(){
          pending.svg[o.name] = true;
          _loadSVG(root+'/'+o.name+'.svg', function (el) {
            delete pending.svg[o.name];
            (isFunction(o.cb)) && o.cb.call(this, el, o.name);
            check_pending();
          });
        }, 0);
			})(resobj.svg[_i],_i);
		}
	}

  extend(fabric, {
    loadResources : loadResources,
		loadInParallel: loadInParallel
  });
})(typeof exports !== 'undefined' ? exports : this);
