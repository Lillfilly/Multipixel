<script src="http://dbwebb.se/js/jquery.js"></script>
<?php
if(isset($extraJS)){
	foreach($extraJS as $js){
		echo "<script src='js/$js'></script>";
	}
}
?>
<script src="main.js"></script>

</body>
</html>