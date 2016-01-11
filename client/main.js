/**
 * Shim layer, polyfill, for requestAnimationFrame with setTimeout fallback.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
window.requestAnimFrame = (function(){
	return	window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * Shim layer, polyfill, for cancelAnimationFrame with setTimeout fallback.
 */
window.cancelRequestAnimFrame = (function(){
  return  window.cancelRequestAnimationFrame ||
          window.webkitCancelRequestAnimationFrame ||
          window.mozCancelRequestAnimationFrame    ||
          window.oCancelRequestAnimationFrame      ||
          window.msCancelRequestAnimationFrame     ||
          window.clearTimeout;
})();

$(document).ready(function(){
	'use strict';
	var lastGameTick;
	var canvasContext = document.getElementById('mainCanvas').getContext('2d');
	var colorContext = document.getElementById('colorCanvas').getContext('2d');
	var messageLog = document.getElementById('log');

	//Init game

	var onSyncRcvd = function(painting) {
		window.Canvas.onSync(painting);
	}
	var onUpdateRcvd = function(index, color){
		window.Canvas.onUpdate(index, color);
	}
	var sendUpdate = function(index, color){
		window.Network.sendUpdate(index, color);
	}

	window.Key.init();
	window.Canvas.init(900, 600, canvasContext, sendUpdate);
	window.Network.init('ws://nodejs1.student.bth.se:8159', messageLog, onSyncRcvd, onUpdateRcvd);
	window.ColorPicker.init(750, 120, colorContext, document.getElementById('colorBtn'));

	var sendChatMsg = function(){
		var msgtxt = document.getElementById('msgTxt');
		window.Network.sendChat(msgtxt.value);
		msgtxt.value = '';
	}
	document.getElementById('sendBtn').addEventListener('click', function(){
		sendChatMsg();
	});
	document.getElementById('sendBtn').addEventListener('keydown', function(e){
		if (e.keyCode === Key.ENTER){
			sendChatMsg();
		}
	});
	document.getElementById('screenBtn').addEventListener('click', function(){
		window.Canvas.hideCursor();
		window.open(document.getElementById('mainCanvas').toDataURL(), '_blank');
	});

	var gameLoop = function(){
		var now = Date.now();
		var td = (now - (lastGameTick || now)) / 10; // Timediff since last frame / gametick
		lastGameTick = Date.now();
		requestAnimFrame(gameLoop);

		window.ColorPicker.executeFrame();
		window.Canvas.executeFrame(td);
	}
	gameLoop();
});