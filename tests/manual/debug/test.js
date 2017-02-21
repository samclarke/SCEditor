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

	$(function () {
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
