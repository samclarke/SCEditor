(function () {
	'use strict';

	var _formatObject = function (obj) {
		if (!obj) {
			return obj;
		}

		if (obj instanceof Error) {
			var errorMsg = 'Error: ' + (obj.message || obj.description);

			if (obj.stack) {
				errorMsg += '\n' + obj.stack;
			}

			return errorMsg;
		}

		return String(obj);
	};

	var _patchConsoleMethod = function (output, method) {
		var originalMethod = console[method];

		return function (msg) {
			var div = document.createElement('div');
			div.className = method;
			div.textContent = _formatObject(msg);

			output.appendChild(div);
			output.scrollTop = output.scrollHeight;

			if (!originalMethod) {
				return;
			}

			if (originalMethod.apply) {
				originalMethod.apply(this, arguments);
			} else {
				originalMethod(msg);
			}
		};
	};

	var _patchAssertMethod = function (output) {
		var originalMethod = console.assert;

		return function (assertion, msg) {
			var assertion = document.createElement('span');
			assertion.textContent = assertion ? 'Assertion passed: ' :
				'Assertion failed: ';

			var div = document.createElement('div');
			div.className = 'assert';
			div.className += assertion ? ' assert-passed' : ' assert-failed';

			div.appendChild(assertion);
			div.appendChild(document.createTextNode(msg));

			output.appendChild(div);
			output.scrollTop = output.scrollHeight;

			if (!originalMethod) {
				return;
			}

			if (originalMethod.apply) {
				originalMethod.apply(this, arguments);
			} else {
				originalMethod(msg);
			}
		};
	};

	var _patchClearMethod = function (output) {
		var originalMethod = console.clear;

		return function () {
			output.innerHTML = '';

			if (!originalMethod) {
				return;
			}

			if (originalMethod.apply) {
				originalMethod.apply(this, arguments);
			} else {
				originalMethod();
			}
		};
	};

	window.patchConsole = function (outputDiv) {
		var output = outputDiv || document.getElementById('console-output');

		console.info   = _patchConsoleMethod(output, 'info');
		console.warn   = _patchConsoleMethod(output, 'warn');
		console.error  = _patchConsoleMethod(output, 'error');
		console.debug  = _patchConsoleMethod(output, 'debug');
		console.log    = _patchConsoleMethod(output, 'log');
		console.assert = _patchAssertMethod(output);
		console.clear  = _patchClearMethod(output);

		window.onerror = function (msg, url, line) {
			console.error('Caught global error: ' + msg +
				' on line ' + line + ' of ' + url);
		};
	};
}());
