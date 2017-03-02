(function () {
	'use strict';

	var evalConsoleInput = function () {
		try {
			var codeInput = document.querySelector('#console-input textarea');
			var code = codeInput.value;

			console.info('> ' + code);

			// eslint-disable-next-line no-eval
			eval.call(window, code);
		} catch (ex) {
			console.error(ex);
		}
	};

	var createEditor = function () {
		var coptionsInput = document.querySelector('#debug-options textarea');
		var optionsStr = coptionsInput.value;

		if (window.instance) {
			window.instance.destroy();
		}

		try {
			// eslint-disable-next-line no-new-func
			var options = (new Function('return ' + optionsStr))();
			var textarea = document.getElementById('testarea');

			sceditor.create(textarea, options);
			window.instance = sceditor.instance(textarea);
		} catch (ex) {
			console.error(ex);
		}
	};

	patchConsole();
	createEditor();

	document.querySelector('#console-input textarea')
		.addEventListener('keypress', function (e) {
			if (e.which === 13) {
				evalConsoleInput();

				return false;
			}
		});

	document.querySelector('#console-input input')
		.addEventListener('click', function () {
			evalConsoleInput();

			return false;
		});

	document.querySelector('#debug-options input')
		.addEventListener('click', function () {
			createEditor();

			return false;
		});
}());
