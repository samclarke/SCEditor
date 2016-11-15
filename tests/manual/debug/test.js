(function () {
	'use strict';

	var evalConsoleInput = function () {
		try {
			var code = $('#console-input textarea').val();

			console.info('> ' + code);

			// eslint-disable-next-line no-eval
			eval.call(window, code);
		} catch (ex) {
			console.error(ex);
		}
	};

	var createEditor = function () {
		var options;
		var optionsStr = $('#debug-options textarea').val();

		if (window.instance) {
			window.instance.destroy();
		}

		try {
			// eslint-disable-next-line no-new-func
			options = (new Function('return ' + optionsStr))();

			$('#testarea').sceditor(options);

			window.instance = $('#testarea').sceditor('instance');
		} catch (ex) {
			console.error(ex);
		}
	};


	define('jquery', [], function () {
		return jQuery;
	});

	require.config({
		baseUrl: '../../../src',
		paths: {
			'domReady': '../tests/libs/domReady-2.0.1'
		},
		shim: {
			'plugins/bbcode': ['jquery.sceditor'],
			'plugins/xhtml': ['jquery.sceditor'],
			'plugins/format': ['jquery.sceditor'],
			'plugins/undo': ['jquery.sceditor']
		}
	});

	require([
		'jquery.sceditor',
		'plugins/bbcode',
		'plugins/xhtml',
		'plugins/format',
		'plugins/undo',
		'domReady!'
	], function () {
		patchConsole();
		createEditor();

		$('#console-input textarea').keypress(function (e) {
			if (e.which === 13) {
				evalConsoleInput();

				return false;
			}
		});

		$('#console-input input').click(function () {
			evalConsoleInput();

			return false;
		});

		$('#debug-options input').click(function () {
			createEditor();

			return false;
		});
	});
}());
