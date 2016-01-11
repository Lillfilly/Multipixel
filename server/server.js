var WebSocketServer = require('/home/saxon/teachers/com/mosstud/www/node/node_modules/websocket').server;
var port = 8159;

// Require the modules we need
var http = require('http');

var chatPeers = [];
var drawPeers = [];
var painting = [];


for(var i = 0; i < 900*600; i++){
	painting.push('#FFFFFF');
}

// Create a http server with a callback handling all requests
var httpServer = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(403, {'Content-type': 'text/plain'});
	response.end('Forbidden\n');
});

// Setup the http-server to listen to a port
httpServer.listen(port, function() {
	console.log((new Date()) + ' HTTP server is listening on port ' + port);
});

// Create an object for the websocket
// https://github.com/Worlize/WebSocket-Node/wiki/Documentation
wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false
});

// Create a callback to handle each connection request
wsServer.on('request', function(request) {
	if(!originIsAllowed(request.origin)){
		console.log('Connection rejected from ' + request.origin);
		request.reject();
		return;
	}
	// Loop through protocols. Accept by highest order first.
	var validProtocol = false;
	for (var i=0; i < request.requestedProtocols.length && validProtocol === false; i++){
		if(request.requestedProtocols[i] === 'color-chat-protocol'){
			validProtocol = true;
			acceptAsChat(request);
		}else if(request.requestedProtocols[i] === 'color-draw-protocol'){
			validProtocol = true;
			acceptAsDraw(request);
		}
	}
	if(validProtocol === false){
		request.reject(403, 'Unsupported protocol');
		console.log('Request from \'' + request.origin + '\' rejected, unsupported protocol');
	}
});

function originIsAllowed(origin){
	var result = false
	if(origin === 'http://www.student.bth.se'){
		result = true;
	}
	return result;
}

function htmlEntities(str) {
	return String(str).replace('/&/g', '&amp;').replace('/</g', '&lt;').replace('/>/g', '&gt;').replace('/"/g', '&quot;');
}


function sync(peer){
	var msg = '@SYNC@';
	for(var i = 0; i<painting.length; i++){
		msg += painting[i];
	}
	peer.connection.sendUTF(msg);
}
function update(index, color){
	
}
function broadcast(msg, peers, senderPeer){
	for(i = 0; i < peers.length; i++){
		if(senderPeer){
			if(peers[i].index !== senderPeer.index){
				peers[i].connection.sendUTF(msg);
			}
		}else{
			peers[i].connection.sendUTF(msg);
		}
	}
}
function acceptAsDraw(request){
	var peer = {
		connection: request.accept('color-draw-protocol', request.origin),
		index: drawPeers.length
	}
	console.log((new Date()) + ' Draw connection accepted from ' + request.origin);
	
	sync(peer);
	drawPeers.push(peer);

	peer.connection.on('message', function(msg){
		msg = msg.utf8Data;
		if(msg.substring(0, 6) === '@DRAW@'){
			var n = msg.indexOf(';');
			if(n !== -1){
				var index = msg.substring(6, n);
				if(!isNaN(parseFloat(index)) && isFinite(index)){
					var color = msg.substring(n+1);
					var reg = new RegExp('[#][0-9A-Fa-f]{6}');
					if(reg.test(color) === true){
						painting[index] = color;
						broadcast('@DRAW@'+index+';'+color, drawPeers, peer);
					}
				}
			}
		}
		
	});
	peer.connection.on('close', function(msg){
		console.log((new Date()) + ' Draw peer ' + peer.connection.remoteAddress + ' disconnected.');
		drawPeers.splice(peer.index, 1);
		for(var i = 0; i < drawPeers.length; i++){
			drawPeers[i].index = i;
		}
	});
}

function acceptAsChat(request){
	var peer = {
		connection : request.accept('color-chat-protocol', request.origin),
		name : null,
		index : chatPeers.length
	}
	chatPeers.push(peer);

	console.log((new Date()) + ' Chat connection accepted from ' + request.origin);

	peer.connection.sendUTF('Welcome user!\nPick a username by sending it to the server.\nThe username should be max 15 chars and min 3 chars');
	peer.connection.on('message', function(msg){
		msg = htmlEntities(msg.utf8Data);
		if(msg.length === 0){
			peer.connection.sendUTF('Ignored empty message');
		}
		if(!peer.name){
			if(msg.length < 3){
				peer.connection.sendUTF('Username was too short, please try again!');
			}else if(msg.length > 15){
				peer.connection.sendUTF('Username was too long, please try again!');
			}else{
				peer.name = msg;
				peer.connection.sendUTF('Nice to see you ' + peer.name + '!\nType /help to see a list of possible commands.');
				broadcast(peer.name + ' connected', chatPeers, peer);
			}
		}else{
			if(msg.substring(0,1) === '/'){
				if(msg.indexOf('/who') === 0){
					peer.connection.sendUTF(who());
				}else if(msg.indexOf('/me') === 0){
					if(msg.length < 5){
						peer.connection.sendUTF('The /me command needs a non empty argument.\nExample: "/me grabs a coffee."');
					}else{
						broadcast(peer.name + ' ' + msg.substring(4), chatPeers);
					}
				}else if(msg.indexOf('/help') === 0){
					peer.connection.sendUTF('/who - Shows who is online\n/me - Pretty much the same as in irc.\n/help - Shows this help');
				}
			}
			else{
				broadcast(peer.name + ' says: "' + msg + '"', chatPeers);
			}
		}
	});
	peer.connection.on('close', function(msg){
		if(peer.name){
			broadcast(peer.name + ' disconnected', chatPeers, peer);
		}
		console.log((new Date()) + ' Chat peer ' + peer.connection.remoteAddress + ' disconnected.');
		chatPeers.splice(peer.index, 1);
		for(var i = 0; i < chatPeers.length; i++){
			chatPeers[i].index = i;
		}
	});
	
	
	function who(){
		var result = 'Currently active users are:';
		for(i = 0; i < chatPeers.length; i++){
			if(chatPeers[i] && chatPeers[i].name){
				result += '\n  ' + chatPeers[i].name
			}
		}
		return result;
	}
}