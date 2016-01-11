window.Network = (function(){
	var chatSocket;
	var drawSocket;
	var logWindow;

	var onSyncRcvd;
	var onUpdateRcvd;

	var logLength = 0;

	function log(message){
		var element = document.getElementById('log');
		element.innerHTML += '<div class="chatMsg">' + message + '</div>';

		logLength++;
		if(logLength === 50){
			element.removeChild(element.children[0]);
			logLength--;
		}

		element.scrollTop = element.scrollHeight;
	}

	function htmlEntities(str) {
		return String(str).replace('/&/g', '&amp;').replace('/</g', '&lt;').replace('/>/g', '&gt;').replace('/"/g', '&quot;');
	}

	function openConnection(address){
		chatSocket = new WebSocket(address, 'color-chat-protocol');
		chatSocket.onopen = function(){
			document.getElementById('sendBtn').removeAttribute('disabled');
//			log('Connected to chat');
		}
		chatSocket.onclose = function(){
			document.getElementById('sendBtn').setAttribute('disabled', true);
			log('Disconnected from chat');
		}
		chatSocket.onmessage = function(event){
			log(htmlEntities(event.data));
		}

		drawSocket = new WebSocket(address, 'color-draw-protocol');
		drawSocket.onopen = function(){
//			log('Connected to draw');
		}
		drawSocket.onclose = function(){
			log('Disconnected from draw');
		}
		drawSocket.onmessage = function(event){
			var command = event.data.substring(0,6);
			if(command === '@SYNC@'){
				var painting = [];
				for(var i = 6; i < event.data.length; i+= 7){
					painting.push(event.data.substring(i, i+7));
				}
				onSyncRcvd(painting);
//				log('Syncronized with server');
			}else if(command === '@DRAW@'){
				var n = event.data.indexOf(';');
				if(n !== -1){
					var index = event.data.substring(6, n);
					if(!isNaN(parseFloat(index)) && isFinite(index)){
						var color = event.data.substring(n+1);
						var reg = new RegExp('[#][0-9A-Fa-f]{6}');
						if(reg.test(color) === true){
							onUpdateRcvd(index, color);
						}
					}
				}
			}
		}
	}

	var sendChat = function(msg){
		chatSocket.send(htmlEntities(msg));
	}
	var sendUpdate = function(index, color){
		var msg = '@DRAW@' + index + ';' + color;
		drawSocket.send(msg);
	}

	var init = function(address, log, syncRcvd, updateRcvd){
		onSyncRcvd = syncRcvd;
		onUpdateRcvd = updateRcvd;
		logWindow = log;
		openConnection(address);
	}

	return{
		sendChat: sendChat,
		sendUpdate: sendUpdate,
		init:init
	}
})();