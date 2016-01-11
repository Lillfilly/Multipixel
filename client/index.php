<?php
	$title = 'Multipixel - The online pixel art collaboration tool';
	include(__DIR__ . '/incl/header.php');
	
	$extraJS = [
		'jscolor.min.js',
		'keys.js',
		'color.js',
		'canvas.js',
		'network.js'
	];
?>

<div id='flash'>
	<canvas id='mainCanvas' width='900' height='600'>Canvas not supported</canvas>
	<div id='color'>
		<canvas id='colorCanvas' width='750' height='120'>Canvas not supported</canvas>
		<button id='screenBtn'>Screenshot</button>
		<button id='colorBtn' class="jscolor {position:'top', onFineChange:'ColorPicker.onValueChanged(this.toHEXString())'}"></button>
	</div>
	<div id='chat'>
		<div id='log'></div>
		<div id='chatBox'>
			<label>Message: </label><br/>
			<input type='text' id='msgTxt'/>
			<button id='sendBtn' disabled="true">Send</button>
		</div>
	</div>
</div>

<?php $path=__DIR__; include(__DIR__ . '/incl/footer.php'); ?>