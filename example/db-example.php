<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />

		<title>SCEditor Demo</title>

		<link rel="stylesheet" href="../minified/jquery.sceditor.min.css" type="text/css" media="all" />

		<script src="jquery-1.6.2.min.js"></script>
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
				// set up editor
				var $message_editor = $("#message").sceditorBBCodePlugin({
					style: "../minified/jquery.sceditor.default.min.css"
				});
console.log($message_editor.commands);
				// set up quote link click handler
				$("#quote-something").click(function() {
					$message_editor.data('sceditor').commands.quote.exec(null, 'Something');
					return;
				});
			});
		</script>
	</head>
	<body>
<?php
if(isset($_POST['message']))
{
	$message = htmlentities($_POST['message'], ENT_QUOTES, 'UTF-8');

	$db_safe_message = mysql_real_escape_string($message);
	// can now save $db_safe_message in the DB
}
else
	$message = '';
?>

		<form action="" method="post">
			<div>
				<textarea name="message" id="message" style="height:200px;width:500px;"><?php
					// echo the message if there is one
					echo $message; ?></textarea>
			</div>

			<a href="#js-disabled-fallback-here" id="quote-something">Quote something</a>

			<div><input type="submit" value="Post" /></div>
		</form>

		<p>SCEditor is dual licensed under the <a href="http://www.opensource.org/licenses/mit-license.php">MIT</a>
		 and <a href="http://www.gnu.org/licenses/gpl.html">GPL</a></p>
	</body>
</html>
