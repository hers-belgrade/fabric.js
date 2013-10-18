(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
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
        //console.log('loading',fabric.workingDirectory,picname,type,rn);
        switch(type){
          case 'png':
            return fabric.Image.fromURL(rn,resourceloaded);
          case 'sprites':
            return _loadSprites(picname,resourceloaded);
          case 'svg':
            return fabric.loadSVGHierarchicalFromURL(rn, resourceloaded);
          default:
            return _lf(index+1);
        }
      };
    })(loaded,type);
    _lf(0);
  };

  /**
   * Sets the path for further call to loadResources
   * @static
   * @function
   * @memberOf fabric
   * @param {String} path to working directory
   */
  function setWorkingDirectory(path){
    fabric.workingDirectory = path;
  };

  /**
   * Sets the path for further call to loadResources
   * @static
   * @function
   * @memberOf fabric
   * @param {Object} hash with keys: sprites, svg. Values are arrays of appropriate resource names in the Working Directory
   */
  function loadResources(resobj,cb,ctx){
		//preprocess paths so you can be able to change setWorkingDirectory at any moment
		//
		//
		function prepere_map (obj) {
			for (var i in obj) {
				if (!obj[i].name && !obj[i].root) obj[i] = {name: obj[i], root:fabric.workingDirectory};
			}
		}
		prepere_map(resobj.svg);
		prepere_map(resobj.sprites);

    _loadArray('svg',resobj.svg,function(loaded){
      _loadArray('sprites',resobj.sprites,function(_loaded){
        for(var i in _loaded){
          loaded[i] = _loaded[i];
        }
        cb.call(ctx,loaded);
      });
    });
  };

  extend(fabric, {
    setWorkingDirectory : setWorkingDirectory,
    loadResources : loadResources
  });
})(typeof exports !== 'undefined' ? exports : this);
