(function () {
	function setTextFillAndStroke (ctx, settings) {
		if (settings.fill) {
			ctx.fillStyle = settings.fill.toLive ? settings.fill.toLive(ctx) : settings.fill;
		}
		if (settings.stroke) {
			ctx.lineWidth = settings.strokeWidth;
			ctx.lineCap = settings.strokeLineCap;
			ctx.lineJoin = settings.strokeLineJoin;
			ctx.miterLimit = settings.strokeMiterLimit;
			ctx.strokeStyle = settings.stroke.toLive ? settings.stroke.toLive(ctx) : settings.stroke;
		}
	}

	function setFontDeclaration (ctx, settings) {
		var el = document.createElement('div');
		el.style.font = ctx.font;
		var fields = ['fontFamily', 'fontStyle', 'fontVariant', 'fontWeight', 'fontSize'];
		var res = {};
		for (var i in fields) {
			var v = fields[i];
			res[v] = settings[v] || el.style[v];
		}

		if (res.fontSize && 'string' === typeof(res.fontSize)) {
			res.fontSize = parseInt(res.fontSize.replace('px', ''));
		}
		ctx.font = [ res.fontWeight, res.fontStyle, res.fontSize + 'px', '"' + res.fontFamily + '"' ].join(' ');
		return res;
	}

	fabric.util.setTextFillAndStroke = setTextFillAndStroke;
	fabric.util.setFontDeclaration = setFontDeclaration;

})();
