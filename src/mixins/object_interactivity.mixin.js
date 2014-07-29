(function(){

  var getPointer = fabric.util.getPointer,
      degreesToRadians = fabric.util.degreesToRadians;

  fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

		block_mouse_propagation : function () {
			this._propagation_stop_handle = function (e) {
				e.e.block_further_processing = true;
			}
			this.on('mouse:down', this._propagation_stop_handle);
			this.on('mouse:up', this._propagation_stop_handle);
			this.on('object:over', this._propagation_stop_handle);
			this.on('object:out', this._propagation_stop_handle);
		},


    /**
     * Determines which one of the four corners has been clicked
     * @private
     * @param {Event} e Event object
     * @param {Object} offset Canvas offset
     * @return {String|Boolean} corner code (tl, tr, bl, br, etc.), or false if nothing is found
     */
    _findTargetCorner: function(e, offset) {
      if (!this.hasControls || !this.active) return false;

      var pointer = getPointer(e, this.canvas.upperCanvasEl),
          ex = pointer.x - offset.left,
          ey = pointer.y - offset.top,
          xPoints,
          lines;

      for (var i in this.oCoords) {

        if (i === 'mtr' && !this.hasRotatingPoint) {
          continue;
        }

        if (this.get('lockUniScaling') && (i === 'mt' || i === 'mr' || i === 'mb' || i === 'ml')) {
          continue;
        }

        lines = this._getImageLines(this.oCoords[i].corner);

        // debugging

        // canvas.contextTop.fillRect(lines.bottomline.d.x, lines.bottomline.d.y, 2, 2);
        // canvas.contextTop.fillRect(lines.bottomline.o.x, lines.bottomline.o.y, 2, 2);

        // canvas.contextTop.fillRect(lines.leftline.d.x, lines.leftline.d.y, 2, 2);
        // canvas.contextTop.fillRect(lines.leftline.o.x, lines.leftline.o.y, 2, 2);

        // canvas.contextTop.fillRect(lines.topline.d.x, lines.topline.d.y, 2, 2);
        // canvas.contextTop.fillRect(lines.topline.o.x, lines.topline.o.y, 2, 2);

        // canvas.contextTop.fillRect(lines.rightline.d.x, lines.rightline.d.y, 2, 2);
        // canvas.contextTop.fillRect(lines.rightline.o.x, lines.rightline.o.y, 2, 2);

        xPoints = this._findCrossPoints({x: ex, y: ey}, lines);
        if (xPoints !== 0 && xPoints % 2 === 1) {
          this.__corner = i;
          return i;
        }
      }
      return false;
    },

  });
})();
