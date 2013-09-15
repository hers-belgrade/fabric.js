(function(global) {
  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  /**
   * @private
   */
  function _urlOfResource(picname){
    return fabric.workingDirectory+'/'+picname;
  };

  /**
   * @private
   */
  function _resolveResourceName(name){
    var ra = name.split(':');
    if(ra.length!==2){
      return {};
    }
    return {type:ra[0],name:ra[1]};
  };

  /**
   * @private
   */
  function _loadSprites(spritename,cb){
    var rn = _urlOfResource(spritename);
    var path = rn.substr(0,rn.lastIndexOf('/'));
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
    var och = (function(_path,_ih){
      var path = _path,ih=_ih;
      return function(xhr){
        var so = {};
        try{
          so = JSON.parse(xhr.responseText);
        }catch(e){
         return;
        } 
        fabric.Image.fromURL(path+'/'+so.image,ih(so));
      };
    })(path,ih);
    fabric.util.request(rn,{onComplete:och});
  };

  /**
   * @private
   */
  function _load(picname,cb){
    var resource = _resolveResourceName(picname);
    var rn = _urlOfResource(resource.name);
    switch(resource.type){
      case 'pic':
        fabric.Image.fromURL(rn,(function(_t){var t = _t; return function(img){cb.call(t,img);}})(this));
        return;
      case 'sprite':
        _loadSprites(rn,(function(_t){var t = _t; return function(sprites){cb.call(t,sprites);}})(this));
        return;
      case 'svg':
        var objhash = {};
        fabric.loadSVGFromURL(
            rn,
            (function(_t){var t = _t; return function(svggroup,options){ cb.apply(t,arguments); };})(this)
        );
        return;
      default:
        return;
    }
  };
  function setWorkingDirectory(path){
    fabric.workingDirectory = path;
  };

  function loadResources(resobj){
  };

  extend(fabric, {
    setWorkingDirectory : setWorkingDirectory
  });

})(typeof exports !== 'undefined' ? exports : this);
