<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />

		<title>SCEditor Demo</title>

		<link rel="stylesheet" href="../minified/themes/default.min.css" type="text/css" media="all" />

		<script src="jquery-1.7.2.min.js"></script>
		<script src="../minified/jquery.sceditor.min.js"></script>

		<style>
			html {
				font-family: Arial, Helvetica, sans-serif;
				font-size: 13px;
			}
			form div {
				padding: .5em;
			}
			code:before {
				position: absolute;
				content: 'Code:';
				top: -1.35em;
				left: 0;
			}
			code {
				margin-top: 1.5em;
				position: relative;
				background: #eee;
				border: 1px solid #aaa;
				white-space: pre;
				padding: .25em;
				min-height: 1.25em;
			}
			code:before, code {
				display: block;
				text-align: left;
			}
		</style>

		<script>
			$(document).ready(function() {
				$("textarea:first").sceditor({
					style: "../minified/jquery.sceditor.default.min.css",
					toolbar: "bold,italic,underline|font,size,color,removeformat|image,link,unlink,emoticon",
					resizeEnabled: false
				});
			});
			$(document).ready(function() {
				$("textarea:last").sceditorBBCodePlugin({
					style: "../minified/jquery.sceditor.default.min.css"
				});
			});
		</script>
	</head>
	<body>
<?php
if(isset($_POST['html_field']))
{
	$html   = htmlentities($_POST['html_field'], ENT_QUOTES, 'UTF-8');
	$bbcode = htmlentities($_POST['bbcode_field'], ENT_QUOTES, 'UTF-8');
	echo "<p>Output of the HTML editor: <code>{$html}</code>
			Output of the BBCode editor: <code>{$bbcode}</code></p>";
}
?>

		<form action="" method="post">
			<div><textarea name="html_field" style="height:150px;width:200px;"></textarea></div>

			<div>
				<textarea name="bbcode_field" style="height:200px;width:500px;">[center][size=3][b]BBCode SCEditor[/b][/size][/center]

Give it a try! :)

[color=#ff00]Red text! [/color][color=#3399ff]Blue?[/color]

[ul][li]A simple list[/li][li]list item 2[/li][/ul]
If you are using IE9+ or any non-IE browser just type [b]:[/b]) and it should be converted into :) as you type.</textarea>

				<p>If you are using IE9+ or any other browser then it should automatically replace
					:) and other emoticon codes with theit emoticon images.</p>
			</div>

			<p><code>$(document).ready(function() {
	$("textarea:first").sceditor({
		style: "../minified/jquery.sceditor.default.min.css",
		toolbar: "bold,italic,underline|font,size,color,removeformat|image,link,unlink,emoticon"
	});
});</code></p>

			<p><code>$(document).ready(function() {
	$("textarea:last").sceditorBBCodePlugin({style: "../minified/jquery.sceditor.default.min.css"});
});</code></p>

			<div><input type="submit" value="Post" /></div>
		</form>

		<p>SCEditor is dual licensed under the <a href="http://www.opensource.org/licenses/mit-license.php">MIT</a>
		 and <a href="http://www.gnu.org/licenses/gpl.html">GPL</a></p>
	</body>
</html>
