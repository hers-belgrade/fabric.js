(function () {

	function setFillToCanvas (ctx, settings) {
		if (settings.overlayFill) {
			ctx.fillStyle = settings.overlayFill;
		}
		else if (settings.fill) {
			ctx.fillStyle = settings.fill.toLive ? settings.fill.toLive(ctx) : settings.fill;
		}
	}

	function setStrokeToCanvas (ctx,settings) {
		ctx.lineWidth = settings.strokeWidth;
		ctx.lineCap = settings.strokeLineCap;
		ctx.lineJoin = settings.strokeLineJoin;
		ctx.miterLimit = settings.strokeMiterLimit;
		if (settings.stroke) {
			ctx.strokeStyle = settings.stroke.toLive ? settings.stroke.toLive(ctx) : settings.stroke;
		}
	}


	//TODO: should be removed ....
	function setTextFillAndStroke (ctx, settings) {
		setFillToCanvas(ctx, settings);
		setStrokeToCanvas(ctx, settings);
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


	function fixStrokeAndFillForLines (obj, ctx) {
		//mislim da ovo nije potpuna istina ... ako mora da se dogodi fix da li teba da rady obj.stroke = obj.fill?
		/*
		ctx.strokeStyle = ctx.fillStyle;
		ctx.fillStyle = 'none';
		obj.stroke = obj.fill;
		obj.fill = 'none';
		obj._renderStroke(ctx);
		obj._renderFill(ctx);
		*/
	}

	fabric.util.setTextFillAndStroke = setTextFillAndStroke;
	fabric.util.setFontDeclaration = setFontDeclaration;

	fabric.util.setFillToCanvas = setFillToCanvas;
	fabric.util.setStrokeToCanvas = setStrokeToCanvas;
	fabric.util.fixStrokeAndFillForLines = fixStrokeAndFillForLines;



})();
