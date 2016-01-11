window.ColorPicker = (function(){
	var width, height;
	var sw, sh, cols;
	var ct, btn;

	var colors; 
	var selected;
	var moving;

	var valid;

	var init = function(w, h, context, button){
		width = w;
		height = h;
		ct = context;
		btn = button;
		colors = [
			'#001f3f',
			'#0074D9',
			'#7FDBFF',
			'#39CCCC',
			'#3D9970',
			'#2ECC40',
			'#01FF70',
			'#FFDC00',
			'#FF851B',
			'#FF4136',
			'#85144b',
			'#F012BE',
			'#B10DC9',
			'#111111',
			'#DDDDDD',
			'#FFFFFF'
		];
		cols = 8;
		sh = h / 2;
		sw = w / cols;

		selected = 15;

		render();
	}

	var getColor = function(){
		return colors[selected];
	}

	var onValueChanged = function(c){
		colors[selected] = c;
		render();
	}

	var update = function(){
		if(moving === true){
			if(!Key.isDown(Key.UP, Key.DOWN) && !Key.isDown(Key.LEFT, Key.RIGHT) && !Key.isDown(Key.ENTER)){
				moving = false;
			}
		}else{
			var changed = true;
			if(Key.isDown(Key.UP)){
				if(selected >= cols){
					selected -= cols;
				}
			}
			else if(Key.isDown(Key.LEFT)){
				if(selected % cols !== 0){
					selected--;
				}
			}
			else if(Key.isDown(Key.DOWN)){
				if(selected < colors.length - cols){
					selected += cols;
				}
			}
			else if(Key.isDown(Key.RIGHT)){
				if((selected + 1) % cols !== 0){
					selected++;
				}
			}else{
				changed = false;
			}
			if(changed === true){
				moving = true;
				btn.jscolor.fromString(colors[selected]);
				render();
			}
		}
	}

	var render = function(){
		for(var i = 0; i < colors.length; i++){
			ct.fillStyle= colors[i];
			ct.fillRect((i % cols) * sw, Math.floor(i / cols) * sh, sw, sh);
		}

		ct.lineWidth = 2;
		ct.strokeStyle = '#DDDDDD';
		ct.fillStyle = '#222222';

		var selX = (selected % cols) * sw + sw / 2 - 10;
		var selY = Math.floor(selected / cols) * sh + sh / 2 - 10;
		ct.fillRect(selX,selY , 20, 20); 
		ct.strokeRect(selX, selY, 20, 20);
		valid = true;
	}

	var executeFrame = function(){
		update();
	}
	return {
		getColor: getColor,
		onValueChanged: onValueChanged,
		init: init,
		executeFrame: executeFrame
	}
})();