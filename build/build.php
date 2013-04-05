<?php

class SCEditorZip extends ZipArchive {
	public function addDirectory($path, $localpath=null, $exclude_hidden=true)
	{
		if($localpath === null)
			$localpath = $path;

		$localpath = rtrim($localpath, '/\\');
		$path = rtrim($path, '/\\');

		$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path), RecursiveIteratorIterator::SELF_FIRST);

		while($iter->valid())
		{
			if(!$iter->isDot() && !$iter->isDir())
			{
				if(!$exclude_hidden || !$this->is_path_hidden($iter->key()))
					$this->addFile($iter->key(), $localpath . DIRECTORY_SEPARATOR . $iter->getSubPathName());
			}

			$iter->next();
		}
	}

	public function removeDirectory($path)
	{
		for($i=0; $i < $this->numFiles; $i++)
		{
			if(strpos($this->getNameIndex($i), $path) === 0)
				$this->deleteName($this->getNameIndex($i));
		}
	}

	private function is_path_hidden($path)
	{
		if(substr(pathinfo($path, PATHINFO_FILENAME), 0, 1) === '.')
			return true;

		if(strpos($path, DIRECTORY_SEPARATOR . '.') !== false)
			return true;

		return false;
	}
}

class SCEditor
{
	/**
	 * Source directory
	 */
	protected $src;

	/**
	 * Array of editor commands
	 */
	protected $commands;

	/**
	 * Array of BBCodes
	 */
	protected $bbcodes;

	/**
	 * Start of command marker
	 */
	const CMD_START	= '// START_COMMAND: ';

	/**
	 * End of command marker
	 */
	const CMD_END	= '// END_COMMAND';


	public function __construct($src_path='../')
	{
		$this->src = $src_path;
	}

	/**
	 * Gets all the commands from the editor
	 *
	 * @return array
	 */
	public function get_editor_commands()
	{
		if($this->commands !== null)
			return $this->commands;

		$this->commands	= $this->get_commands("{$this->src}jquery.sceditor.js");

		return $this->commands;
	}

	/**
	 * Gets all the commands from a file
	 *
	 * @param string $file File to get the commands from
	 * @return array
	 */
	protected function get_commands($file)
	{
		$ret	= array();
		$lines	= file($file);

		foreach($lines as $line)
			if(($pos = stripos($line, self::CMD_START)) !== false)
				$ret[] = substr($line, $pos + strlen(self::CMD_START));

		return $ret;
	}

	/**
	 * Gets all the BBCOdes from the BBCode plugin
	 *
	 * @return array
	 */
	public function get_bbcodes()
	{
		if($this->bbcodes !== null)
			return $this->bbcodes;

		$this->bbcodes	= $this->get_commands("{$this->src}jquery.sceditor.bbcode.js");

		return $this->bbcodes;
	}

	/**
	 * Gets the contents of the editor with the specified commands
	 *
	 * @param array $commands
	 * @return string
	 */
	public function get_editor_contents($commands)
	{
		return $this->get_file("{$this->src}jquery.sceditor.js", $commands);
	}

	/**
	 * Gets the contents of the bbcode file with the specified bbcodes
	 *
	 * @param array $bbcodes
	 * @return string
	 */
	public function get_bbcode_contents($bbcodes)
	{
		return $this->get_file("{$this->src}jquery.sceditor.bbcode.js", $bbcodes);
	}

	protected function get_file($file, $commands)
	{
		$lines	= file($file);
		$remove	= false;
		$ret	= array();

		foreach($lines as $line)
		{
			// detect start of a command, if the command is not included then set next lines to be removed
			if(($pos = stripos($line, self::CMD_START)) !== false)
				$remove = !in_array(substr($line, $pos + strlen(self::CMD_START)), $commands);
			// detect end of a command
			else if(($pos = stripos($line, self::CMD_END)) !== false)
				$remove = false;
			else if(!$remove)
				$ret[] = $line;
		}

		return implode('', $ret);
	}

	public function create_zip($path, $commands, $include_bbcode, $bbcodes)
	{
		// create the file
		fclose(fopen($path, 'a+'));

		$js = $this->get_editor_contents($commands);
		if($include_bbcode)
			$js .= $this->get_bbcode_contents($bbcodes);

		// create the ZIP file
		$zip = new SCEditorZip();
		$zip->open($path);

		// add all the source
		$zip->addDirectory('../', '/sceditor/');

		// remove build directory as it can nolonger be built
		$zip->removeDirectory('/sceditor/build');
		$zip->removeDirectory('/sceditor/tests');
		$zip->removeDirectory('/sceditor/docs');

		// replace the editor and bbcode sources with the newly built ones
		$zip->addFromString('/sceditor/minified/jquery.sceditor.min.js', $this->compress_js($js));
		$zip->addFromString('/sceditor/jquery.sceditor.js', $this->get_editor_contents($commands));

		if($include_bbcode)
			$zip->addFromString('/sceditor/jquery.sceditor.bbcode.js', $this->get_bbcode_contents($bbcodes));

		$zip->close();

		return true;
	}

	/**
	 * Compresses JS with uglifyjs
	 */
	protected function compress_js($js)
	{
		$descriptors = array(
			0 => array("pipe", "r"),
			1 => array("pipe", "w"),
			2 => array("file", "/tmp/error-output.txt", "a")
		);

		$process = proc_open("uglifyjs -nc",
			$descriptors,
			$pipes);

		if(!is_resource($process))
			return NULL;

		fwrite($pipes[0], $js);
		fclose($pipes[0]);

		$output = stream_get_contents($pipes[1]);
		fclose($pipes[1]);

		proc_close($process);

		return $output;
	}
}

$editor = new SCEditor();

if(isset($_GET['build']))
{
	$editor_cmds     = isset($_GET['ec']) ? array_flip($_GET['ec']) : array();
	$editor_bbcodess = isset($_GET['eb']) ? array_flip($_GET['eb']) : array();
	$_GET['editor-bbcode'] = (isset($_GET['editor-bbcode']) && $_GET['editor-bbcode']) ? true : false;

	$removed     = array_diff_key($editor->get_editor_commands(), $editor_cmds);
	$editor_cmds = $editor->get_editor_commands();
	foreach($removed as $index => $ignore)
		unset($editor_cmds[$index]);

	$removed         = array_diff_key($editor->get_bbcodes(), $editor_bbcodess);
	$editor_bbcodess = $editor->get_bbcodes();
	foreach($removed as $index => $ignore)
		unset($editor_bbcodess[$index]);

	// create the SHA based on the commands and bbcodes
	$sha = sha1(implode(',', $editor_cmds));
	$sha = sha1(implode(',', $editor_bbcodess) . $sha);

	// Create the ZIP files name based on the sha
	$zip_file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "sceditor.{$sha}.zip";

	// create the ZIP file if it doesn't exist. It should exist
	// if the same commands have been built before, and the server
	// has not cleared the tmp files (Should help reduce server load).
	if(!file_exists($zip_file))
		$editor->create_zip($zip_file, $editor_cmds, $_GET['editor-bbcode'], $editor_bbcodess);

	$zip_file = realpath($zip_file);

	header("Content-type: application/zip");
	header('Content-Disposition: attachment; filename="' . pathinfo($zip_file, PATHINFO_BASENAME) . '"');
	header('Content-Length:' . filesize($zip_file));

	readfile($zip_file);
	exit;
}
?>
<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />

		<title>SCEditor Build</title>

		<script src="../example/jquery-1.8.2.min.js"></script>
		<script>
		$(function() {
			var updateBookmark = function() {
				$("#bookmark").val(
					window.location.href.split('?')[0] +
					"?build=1&" + $('form').serialize()
						.replace(/%5B/g, '[')
						.replace(/%5D/g, ']')
				);
			};
			updateBookmark();

			$("#bookmark").click(function() {
				$(this).select();
			});

			$('input[name=editor-bbcode]').click(function() {
				if($(this).is(':checked'))
					$(this).parent().next('fieldset').removeAttr('disabled');
				else
					$(this).parent().next('fieldset').attr('disabled', 'disabled');

				updateBookmark();
			});

			$('.toggle').click(function(e) {
				$(this).parent().parent().find(':checkbox').each(function() {
					if($(this).attr('checked'))
						$(this).removeAttr('checked');
					else
						$(this).attr('checked', 'checked');
				});

				e.preventDefault();
				updateBookmark();
			});

			$('.select-all').click(function(e) {
				$(this).parent().parent().find(':checkbox').attr('checked', 'checked');

				e.preventDefault();
				updateBookmark();
			});

			$('.select-none').click(function(e) {
				$(this).parent().parent().find(':checkbox').removeAttr('checked');

				e.preventDefault();
				updateBookmark();
			});

			$('input[type=checkbox]').click(function(e) {
				updateBookmark();
			});
		});
		</script>
		<style>
			/* This styling won't work in older browsers, it's only for building... */
			html {
				font-family: Arial, Helvetica, sans-serif;
				font-size: 15px;
			}
			body {
				width: 800px;
				margin: 0 auto;
			}
			h1 {
				text-align: center;
			}
			fieldset {
				padding: .5em;
				margin: 1em 0;
				border-radius: .5em;
			}
			legend {
				font-weight: bold;
				font-size: 1.2em;
			}
			fieldset div {
				margin: .5em 0 0;
			}
			.cmd {
				display: inline-block;
				width: 10em;
			}
			a:hover {
				text-decoration: none;
			}
			#bookmark {
				width: 99%;
				font-size: 1.1em;
			}
		</style>
	</head>
	<body>
		<h1>SCEditor Build</h1>

		<p>Select any commands and BBCodes required and then click build.</p>
		<form method="GET">
			<fieldset>
				<legend>Editor Commands</legend>

				<?php
				foreach($editor->get_editor_commands() as $index => $command)
					echo "<label class='cmd'><input type='checkbox' name='ec[]' value='{$index}' checked /> {$command}</label>", PHP_EOL;
				?>

				<div>
					<a href="#" class="toggle">Toggle</a>
					<a href="#" class="select-all">Select All</a>
					<a href="#" class="select-none">Select None</a>
				</div>
			</fieldset>

			<label><input type='checkbox' name='editor-bbcode' value='1' checked />Include BBCode plugin</label>
			<fieldset>
				<legend>Editor BBCodes</legend>

				<?php
				foreach($editor->get_bbcodes() as $index => $bbcode)
					echo "<label class='cmd'><input type='checkbox' name='eb[]' value='{$index}' checked /> {$bbcode}</label>", PHP_EOL;
				?>

				<div>
					<a href="#" class="toggle">Toggle</a>
					<a href="#" class="select-all">Select All</a>
					<a href="#" class="select-none">Select None</a>
				</div>
			</fieldset>

			<div><input type="submit" name="build" value="Build" /></div>
		</form>

		<p>Bookmark:</p>
		<div><input type="text" readonly="readonly" name="bookmark" id="bookmark" /></div>

		<p>SCEditor is dual licensed under the <a href="http://www.opensource.org/licenses/mit-license.php">MIT</a>
		 and <a href="http://www.gnu.org/licenses/gpl.html">GPL</a> licenses. Copyright &copy; 2011 - 2012
		 <a href="http://www.samclarke.com/">Sam Clarke</a>.</p>
	</body>
</html>
