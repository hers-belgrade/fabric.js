fabric.util.object.extend(fabric.StaticCanvas.prototype, /** @lends fabric.StaticCanvas.prototype */ {

  /**
   * Exports canvas element to a dataurl image.
   * @param {Object} options
   *
   *  `format` the format of the output image. Either "jpeg" or "png".
   *  `quality` quality level (0..1)
   *  `multiplier` multiplier to scale by {Number}
   *
   * @return {String}
   */
  toDataURL: function (options) {
    options || (options = { });

    var format = options.format || 'png',
        quality = options.quality || 1,
        multiplier = options.multiplier || 1;

    if (multiplier !== 1) {
      return this.__toDataURLWithMultiplier(format, quality, multiplier);
    }
    else {
      return this.__toDataURL(format, quality);
    }
  },

  /**
   * @private
   */
  __toDataURL: function(format, quality) {
    this.renderAll(true);
    var canvasEl = this.upperCanvasEl || this.lowerCanvasEl;
    var data = (fabric.StaticCanvas.supports('toDataURLWithQuality'))
              ? canvasEl.toDataURL('image/' + format, quality)
              : canvasEl.toDataURL('image/' + format);

    this.contextTop && this.clearContext(this.contextTop);
    this.renderAll();
    return data;
  },

  /**
   * @private
   */
  __toDataURLWithMultiplier: function(format, quality, multiplier) {

    var origWidth = this.getWidth(),
        origHeight = this.getHeight(),
        scaledWidth = origWidth * multiplier,
        scaledHeight = origHeight * multiplier,
        ctx = this.contextTop || this.contextContainer;

    this.setWidth(scaledWidth).setHeight(scaledHeight);
    ctx.scale(multiplier, multiplier);

    // restoring width, height for `renderAll` to draw
    // background properly (while context is scaled)
    this.width = origWidth;
    this.height = origHeight;

    this.renderAll(true);

    var data = this.__toDataURL(format, quality);

    ctx.scale(1 / multiplier,  1 / multiplier);
    this.setWidth(origWidth).setHeight(origHeight);

    this.contextTop && this.clearContext(this.contextTop);
    this.renderAll();

    return data;
  },

  /**
   * Exports canvas element to a dataurl image (allowing to change image size via multiplier).
   * @deprecated since 1.0.13
   * @param {String} format (png|jpeg)
   * @param {Number} multiplier
   * @param {Number} quality (0..1)
   * @return {String}
   */
  toDataURLWithMultiplier: function (format, multiplier, quality) {
    return this.toDataURL({
      format: format,
      multiplier: multiplier,
      quality: quality
    });
  }
});
