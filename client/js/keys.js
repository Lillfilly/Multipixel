/**
 * Trace the keys pressed
 */
window.Key = {
	pressed: {},

	ENTER:  13,
	SHIFT:  16,
	LEFT:   37,
	UP:     38,
	RIGHT:  39,
	DOWN:   40,
	SPACE:  32,
	A:      65,
	S:      83,
	D:      68,
	W:      87,
	NUM_1:  49,
	NUM_2:  50,
	NUM_3:  51,
	NUM_4:  52,
	NUM_5:  53,
	NUM_6:  54,
	NUM_7:  55,
	NUM_8:  56,

	Q:      81,
	E:      69,

	isDown: function(keyCode, keyCode1) {
		return this.pressed[keyCode] || this.pressed[keyCode1] || false;
	},

	onKeydown: function(event) {
//		console.log(event.keyCode);
		if(document.getElementById('msgTxt') !== document.activeElement){
			if(event.keyCode === this.UP || event.keyCode === this.DOWN || event.keyCode === this.SPACE){
				event.preventDefault();
			}
			this.pressed[event.keyCode] = true;
		}
	},

	onKeyup: function(event) {
		if(this.pressed[event.keyCode]){
			delete this.pressed[event.keyCode];
		}
	},

	init: function(){
		window.addEventListener('keyup',   function(event){window.Key.onKeyup(event);},   false);
		window.addEventListener('keydown', function(event){window.Key.onKeydown(event);}, false);
	}
};
