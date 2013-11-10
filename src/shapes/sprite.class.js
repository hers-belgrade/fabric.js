(function(global) {

  "use strict";

  var extend = fabric.util.object.extend;

  if (!global.fabric) {
    global.fabric = { };
  }

  if (global.fabric.Sprite) {
    fabric.warn('fabric.Sprite is already defined.');
    return;
  }

  /**
   * Sprite class
   * @class fabric.Sprite
   * @extends fabric.Image
   */
  fabric.Sprite = fabric.util.createClass(fabric.Image , {
    type : 'Sprite',
    initialize : function(element,options){
      this.x = options.x || 0;
      this.y = options.y || 0;
      this.callSuper('initialize',element,options);
    },
    _render : function(ctx){
      ctx.drawImage(
        this._element,
        this.x,this.y,
        this.width,
        this.height,
        0,0,this.width,this.height
        );
    },
    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        element: this.getElement(),
        x:this.x,
        y:this.y,
        name:this.name
      });
    },
  });

  /**
   * Creates an instance of fabric.Sprite from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.Sprite.fromObject = function(object) {
		return new fabric.Sprite(object.element,object);
  };


  /**
   * StateableSprite class
   * @class fabric.StateableSprite
   * @extends fabric.Sprite
   */
  fabric.StateableSprite = fabric.util.createClass(fabric.Sprite, {
    type : 'StateableSprite',
    initialize : function(options){
      if(!options){
        throw 'StateableSprite needs initializer options';
      }
      var el;
      if(options.stategeometries){
        el = options.element;
        this._stategeometries = options.stategeometries;
        delete options.stategeometries;
      }else{
        if(!options.statemap){
          console.trace();
          console.log(options);
          throw 'StateableSprite needs a statemap in initializer options';
        }
        this._stategeometries = {};
        for(var state in options.statemap){
          var ss = options.statemap[state];
          if(el){
            if(ss._element!==el){
              throw 'Sprites in statemap have to share the same img element';
            }
          }else{
            el = ss._element;
          }
          this._stategeometries[state] = {x:ss.x,y:ss.y,width:ss.width,height:ss.height};
        }
      }
      extend(options,this._stateGeometry(options.spritestate));
      this.callSuper('initialize',el,options);
    },
    _stateGeometry : function(state){
      return this._stategeometries[state] || {x:0,y:0,width:0,height:0};
    },

    /**
     * @private
     * @param {String} key
     * @param {Any} value
     * @return {fabric.Object} thisArg
     */
    _set: function(key, value) {
      if(key==='spritestate'){
        var sg = this._stateGeometry(value);
        this.x = sg.x;
        this.y = sg.y;
        this.width = sg.width;
        this.height = sg.height;
      }
      if(key in {x:1,y:1,width:1,height:1}){
        return;
      }
      return this.callSuper('_set',key,value);
    },

    _render : function(){
                if(!this.spritestate){
                  throw 'No spritestate on '+this.name;
                }
      this.callSuper.apply(this,['_render'].concat(Array.prototype.slice.call(arguments)));
    },

    /**
     * Returns object representation of an instance
     * @param {Array} propertiesToInclude Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        stategeometries:this._stategeometries,
        spritestate:this.spritestate
      });
    },

  });

  /**
   * Creates an instance of fabric.Image from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.StateableSprite.fromObject = function(object) {
    return new fabric.StateableSprite(object);
  };

})(typeof exports !== 'undefined' ? exports : this);
