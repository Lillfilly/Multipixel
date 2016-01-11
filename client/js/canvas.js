window.Canvas = (function(){
	var width, height, ct
	var camera;
	var marker;
	var painting;
	var invalid;
	var movedSinceLastUpdate = true;
	var lastColor = 0;
	var sendUpdateCmd;
	var syncronized;

	function toIndex(x, y){
		return y * width + x;
	}

	function Marker(x, y){
		this.lastMove = 0;
		this.x = x;
		this.y = y;

		this.invalid = true;

		this.move = function(newX, newY, camera, td){
			var minTime = 0;
			if(camera.pixel < 8){
				minTime = 8
			}else{
				minTime = 4;
			}
			if(this.lastMove > minTime){
				this.lastMove = 0;
				this.unDraw();

				var oldX = this.x;
				var oldY = this.y;

				if(camera.pixel < 8){
					var range = Math.floor(camera.width / 50) + 1;
					newY = this.y + range * newY;
					newX = this.x + range * newX;
				}else{
					newX = this.x + newX;
					newY = this.y + newY;
				}


				if(newX < camera.x){
					this.x = camera.x;
				}else if(newX >= camera.x + camera.width){
					this.x = camera.x + camera.width - 2;
				}else{
					this.x = newX;
				}
				if(newY < camera.y){
					this.y = camera.y;
				}else if(newY >= camera.y + camera.height){
					this.y = camera.y + camera.height - 2;
				}else{
					this.y = newY
				}

				if(this.y !== oldY || this.x !== oldX){
					movedSinceLastUpdate = true;
				}

				this.invalid = true;
			}else{
				this.lastMove += td;
			}
		}
		this.render = function(){
			if(this.invalid === true){
				var index = toIndex(this.x, this.y, width);
				if(camera.isVisible(index) === true){
					var pos = camera.indexToCameraXY(index);

					if(camera.pixel > 8){
						ct.lineWidth = 2;
						ct.strokeStyle = '#003300';
						ct.fillStyle = 'green';
						ct.strokeRect(pos.x + 1, pos.y + 1, camera.pixel - 2, camera.pixel - 2); 

						ct.strokeStyle = '#DDDDDD';
						ct.fillStyle = '#222222';

						var half = camera.pixel / 2;
						var quarter = half / 2;
						ct.fillRect(pos.x + quarter, pos.y + quarter, half, half); 
						ct.strokeRect(pos.x + quarter, pos.y + quarter, half, half);
					}else{
						ct.lineWidth = 2;
						ct.strokeStyle = '#000000';
						ct.strokeRect(pos.x - 9, pos.y - 9, 21, 21);

						ct.lineWidth = 2;
						ct.strokeStyle = '#ffffff';
						ct.strokeRect(pos.x - 7, pos.y - 7, 17, 17);
					}
				}
				this.invalid = false;
			}
		}
		this.unDraw = function(){
			if(camera.pixel > 8){
				var index = toIndex(this.x, this.y);
				onChange(index, painting[index]);
			}else{
				for(var y = 0; y < 23; y++){
					for(var x = 0; x < 23; x++){
						var index = toIndex(x + this.x - 10, y + this.y - 10);
						onChange(index, painting[index]);
					}
				}
			}
		}
	}

	var hideCursor = function(){
		marker.unDraw();
	}

	var init = function(cw, ch, context, sendUpdate){
		width = cw;
		height = ch;
		ct = context;
		invalid = true;
		painting = [];
		sendUpdateCmd = sendUpdate;
		syncronized = false;
		for(var i = 0; i < width * height; i++){
			painting.push('#FFFFFF');
		}

		camera = {
			x:	0,
			y:	0,
			pixel:	1,
			width:	width,
			height: height,
			lastMove : 0,

			isVisible: function(index){
				var result = true;

				var maxX = this.x + this.width;
				var maxY = this.y + height / this.pixel;

				var iX = index % width;
				var iY = Math.floor(index / width);

				if(iX < this.x || iX > maxX || iY < this.y || iY > maxY){
					result = false;
				}
				return result;
			},
			visiblePixels: function(){
				var result = [];
				var maxX = this.x + this.width;
				var maxY = this.y + height / this.pixel;
				for(var pY = this.y; pY < maxY; pY++){
					for(var pX = this.x; pX < maxX; pX++){
						result.push(pY * width + pX);
					}
				}
				return result;
			},
			indexToCameraXY: function(index){
				//Row diff between cam and pixpos. Paint at cam + dif*camPixel
				var x = (index % width - camera.x) * camera.pixel;
				var y = (Math.floor(index / width) - camera.y) * camera.pixel;
				return {x:x, y:y};
			},
			setZoom: function(pixel){
				this.pixel = pixel;
				this.width = Math.floor(width / camera.pixel) + 1;
				this.height = Math.floor(height / camera.pixel) + 1;
			},
			move: function(x, y){
				if(x < 0){
					camera.x = 0;
				}else if(x + camera.width > width){
					camera.x = width - camera.width;
				}else{
					camera.x = x;
				}
				if(y < 0){
					camera.y = 0;
				}else if(y + camera.height > height){
					camera.y = height - camera.height;
				}else{
					camera.y = y;
				}
				invalid = true;
				this.lastMove = 0;
			}
		}
		camera.width = Math.floor(width / camera.pixel) + 1;

		marker = new Marker(20,20);

		ct.font = "50px Comic Sans MS";
		ct.fillStyle = "black";
		ct.fillRect(0,0,width,height);
		ct.fillStyle = "white";

		var text = "Waiting for server sync";
		var tw = ct.measureText(text).width;
		ct.fillText("Waiting for server sync", width/2 - tw / 2, height / 2); 
	}

	var onCameraZoom = function(pixel){
		var centerX = marker.x;
		var centerY = marker.y;

		camera.setZoom(pixel);
		if(camera.width % 2 === 1){
			centerX++;
		}
		if(camera.height % 2 === 1){
			centerY++;
		}

		var targetX = Math.floor(centerX - camera.width / 2);
		var targetY = Math.floor(centerY - camera.height / 2);

		onCameraMove(targetX, targetY);
		invalid = true;
	}

	var onCameraMove = function(x, y, playerMove){
		if(playerMove === true && camera.pixel > 1){
			var minTime = 0;
			if(camera.pixel < 8){
				minTime = 6;
			}else{
				minTime = 4;
			}
			if(camera.lastMove > minTime){
				if(camera.pixel <= 8){
					var range = Math.floor(camera.width / 100) + 1;
					range = Math.floor(width / camera.width * 5 * 9 / (camera.pixel * 2)) + 1;
					y = camera.y + range * y;
					x = camera.x + range * x;
				}else{
					x = camera.x + x;
					y = camera.y + y;
				}
				camera.move(x,y);
			}
		}else{
			camera.move(x,y);
		}
	}

	var onChange = function(index, color, sendUpdate){
		painting[index] = color || painting[index];
		if(camera.isVisible(index)){
			var pos = camera.indexToCameraXY(index);

			ct.fillStyle = painting[index];
			ct.fillRect(pos.x, pos.y, camera.pixel, camera.pixel);
		}
		if(sendUpdate === true){
			sendUpdateCmd(index, color);
		}
	}
	var onSync = function(newPaint){
		painting = newPaint;
		syncronized = true;
		invalid = true;
	}
	var onUpdate = function(index, color){
		onChange(index, color, false);
	}

	var renderCamera = function(){
		var list = camera.visiblePixels();
		for(var i = 0; i < list.length; i++){
			var x = i % camera.width * camera.pixel;
			var y = Math.floor(i / camera.width) * camera.pixel;

			ct.fillStyle = painting[list[i]];
			ct.fillRect(x, y, camera.pixel, camera.pixel);
		}
		invalid = false;
	}

	var update = function(td){
		var moveMark = {x:0,y:0}
		var moveCam = {x:0, y:0}
		if(Key.isDown(Key.Q)){
			if(camera.pixel -1 != 0){
				onCameraZoom(camera.pixel - 1);
			}
		}else if(Key.isDown(Key.E)){
			if(camera.pixel + 1 != 80){
				onCameraZoom(camera.pixel + 1);
			}
		}
		if(Key.isDown(Key.W)){
			if(Key.isDown(Key.SHIFT)){
				moveCam.y--;
			}else{
				moveMark.y--;
			}
		}
		if(Key.isDown(Key.S)){
			if(Key.isDown(Key.SHIFT)){
				moveCam.y++;
			}else{
				moveMark.y++;
			}
			
		}
		if(Key.isDown(Key.A)){
			if(Key.isDown(Key.SHIFT)){
				moveCam.x--;
			}else{
				moveMark.x--;
			}
		}
		if(Key.isDown(Key.D)){
			if(Key.isDown(Key.SHIFT)){
				moveCam.x++;
			}else{
				camera.width
				moveMark.x++;
			}
		}
		if(Key.isDown(Key.ENTER)){
			
		}
		if(Key.isDown(Key.SPACE)){
			var color = ColorPicker.getColor();
			if(camera.pixel > 8 && movedSinceLastUpdate === true || color != lastColor){
				lastColor = color;
				onChange(toIndex(marker.x, marker.y), color, true);
				movedSinceLastUpdate = false;
			}
		}
		camera.lastMove += td;
		marker.move(moveMark.x, moveMark.y, camera, td);
		if(moveCam.x != 0 || moveCam.y != 0){
			onCameraMove(moveCam.x, moveCam.y, true);
		}
		if(invalid === true){
			marker.invalid = true;
			renderCamera();
		}
		if(marker.invalid === true){
			marker.render();
		}
	}

	var executeFrame = function(td){
		if(syncronized){
			update(td);
		}
	}

	return {
		init: init,
		executeFrame: executeFrame,
		hideCursor: hideCursor,
		onSync: onSync,
		onUpdate: onUpdate
	}
})();