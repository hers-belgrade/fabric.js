(function(global) {

  var fabric = global.fabric || (global.fabric = { });

  function setDataAwareListener(listeneralias,listener){
    if(this.dataListeners[listeneralias]){
      this.dataListeners[listeneralias].destroy();
    }
    this.dataListeners[listeneralias] = listener;
  };

  fabric.DataAware = function(svgelem,config){
    svgelem.dataListeners = {};
    svgelem.follow = function(follower){
      this.unfollow();
      this.follower = follower;
      config && config.onFollowing && config.onFollowing.call(svgelem);
    };
    svgelem.do_command = function(command,paramobj,cb){
      if(!this.follower){
        return;
      }
      this.follower.do_command(command,paramobj,cb,cb?this:undefined);
    };
    svgelem.listenToScalar = function(scalarname,listenerpack){
      if(!this.follower){
        return;
      }
      setDataAwareListener.call(this,'scalar_'+scalarname,this.follower.listenToScalar(this,scalarname,listenerpack));
    };
		svgelem.listenToJSONScalar = function(scalarname,listenerpack){
      if(!this.follower){
        return;
      }
      setDataAwareListener.call(this,'jsonscalar_'+scalarname,this.follower.listenToJSONScalar(this,scalarname,listenerpack));
    };

    svgelem.listenToMultiScalars = function(scalarnames,listenerpack){
      if(!this.follower){
        return;
      }
      setDataAwareListener.call(this,'multiscalars_'+scalarnames.join('_'),this.follower.listenToMultiScalars(this,scalarnames,listenerpack));
    };
    svgelem.listenToScalars = function(listenerpack){
      if(!this.follower){
        return;
      }
      setDataAwareListener.call(this,'scalars',this.follower.listenToScalars(this,listenerpack));
    };
    svgelem.listenToCollections = function(listenerpack){
      if(!this.follower){
        return;
      }
      setDataAwareListener.call(this,'collections',this.follower.listenToCollections(this,listenerpack));
    };
    svgelem.unfollow = function(){
      for(var i in this.dataListeners){
        this.dataListeners[i].destroy();
      }
      this.dataListeners={};
      config && config.onUnfollowed && config.onUnfollowed.call(svgelem);
      delete this.follower;
    };
    return svgelem;
  };
})(typeof exports !== 'undefined' ? exports : this);
