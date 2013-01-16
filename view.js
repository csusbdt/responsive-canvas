// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// view object by David Turner
(function() {

	//////////////////////////////////////////////////////////////////////////////
	//
	//  Backgrounds should be created with dimensions DRAW_AREA_WIDTH by 
	//  DRAW_AREA_HEIGHT.  Drawing that is critical to game play should be
	//  done within a rectangle centered in the draw area that has dimensions
	//  GAME_PLAY_WIDTH by GAME_PLAY_HEIGHT.
	//
	//////////////////////////////////////////////////////////////////////////////

	var canvas = document.getElementById('canvas'),
		context = canvas.getContext('2d'),
		drawableLayers = [ ],
		WEIGHT = 0.03,
		currentTime = new Date().getTime(),
		previousTime = currentTime,
		dt = 16,  // average milliseconds per frame
		scale = 1,
		offsetX = 0,
		offsetY = 0,
		canvasMarginLeft = 0,
		canvasMarginTop = 0;

	view = { 
		DRAW_AREA_WIDTH: 1024,
		DRAW_AREA_HEIGHT: 768,
		GAME_PLAY_WIDTH: 800,
		GAME_PLAY_HEIGHT: 600
	};
	
	view.getX = function(e) {
		return (e.pageX - canvasMarginLeft - offsetX) / scale;
	}
	
	view.getY = function(e) {
		return (e.pageY - canvasMarginTop - offsetY) / scale;
	}

  // layerIndex is optional and degfaults to 0
  // duration is optional and defaults to infinity	
  view.addDrawable = function(drawable, layerIndex, duration) {
		var i;
		if (typeof layerIndex === 'undefined') layerIndex = 0;
		// Fill in any missing layers.
		for (i = drawableLayers.length; i <= layerIndex; ++i) {
			drawableLayers[i] = [ ];
		}
		var layer = drawableLayers[layerIndex];
		layer.push(drawable);
		if (typeof duration !== 'undefined') {
			setTimeout(function() {
				view.removeDrawable(layerIndex, drawable);
			}, duration);
		}
	};

	// The following code removes all occurrences of the given drawable.
	view.removeDrawable = function(drawable) {
		for (var layerIndex = 0; layerIndex < drawableLayers.length; ++layerIndex) {
			var layer = drawableLayers[layerIndex];
			for (var i = layer.length - 1; i > 0; --i) {
				if (layer[i] === drawable) {
					// Overwrite with the last element and then pop.
					layer[i] = layer[layer.length - 1];
					layer.pop();
				}
			}
		}
	};
	
	view.removeAllDrawables = function() {
		drawableLayers.length = 0;
	};

	function adjustCanvas() {
		// Get the window dimensions (viewport area)
		var screenWidth = $(window).innerWidth();
		var screenHeight = $(window).innerHeight();
		
		// Determine the scale needed to render game play area.
		scale = Math.min(1, screenWidth / view.GAME_PLAY_WIDTH, screenHeight / view.GAME_PLAY_HEIGHT);
		
		// Determine canvas size.
		canvas.width = Math.min(screenWidth, view.DRAW_AREA_WIDTH * scale);
		canvas.height = Math.min(screenHeight, view.DRAW_AREA_HEIGHT * scale);

		// Center the drawing area in the canvas.
		offsetX = (canvas.width - view.DRAW_AREA_WIDTH * scale) / 2;
		offsetY = (canvas.height - view.DRAW_AREA_HEIGHT * scale) / 2;
		
		// Center canvas in browser window.
		canvasMarginLeft = (screenWidth - canvas.width) / 2;
		canvasMarginTop = (screenHeight - canvas.height) / 2;
		$('#canvas').css('margin-left', canvasMarginLeft);
		$('#canvas').css('margin-top', canvasMarginTop);
	};

	//////////////////////////////////////////////////////////////////////////////
	//
	// Note: Javascript Date object may not give reliable time values, so we
	//       maintain a moving average of the milliseconds per frame.
	//
	// Note: I'm not sure this precaution is needed -- I have not yet observed
	//       poor resolution in Javascript Date objects.
	//
	//////////////////////////////////////////////////////////////////////////////
	
	function animationLoop() {
		currentTime = new Date().getTime();
		var elapsedTime = currentTime - previousTime;
		previousTime = currentTime;
		dt = dt * (1 - WEIGHT) + elapsedTime * WEIGHT;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
		for (var layerIndex = 0; layerIndex < drawableLayers.length; ++layerIndex) {
			var layer = drawableLayers[layerIndex];
			for (var i = 0; i < layer.length; ++i) {
				layer[i].draw(dt, context);
			}
		}
		context.setTransform(1, 0, 0, 1, 0, 0);
		requestAnimationFrame(animationLoop);
	};

	adjustCanvas();
	$(window).resize(adjustCanvas);
	requestAnimationFrame(animationLoop);

})();
