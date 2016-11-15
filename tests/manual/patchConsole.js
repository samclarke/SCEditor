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

	var _patchConsoleMethod = function ($output, method) {
		var originalMethod = console[method];

		return function (msg) {
			$output.append(
				$('<div>')
					.addClass(method)
					.text(_formatObject(msg))
			);

			$output[0].scrollTop = $output[0].scrollHeight;

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

	var _patchAssertMethod = function ($output) {
		var originalMethod = console.assert;

		return function (assertion, msg) {
			var $assertPrepend = $('<span>')
				.text(assertion ? 'Assertion passed: ' : 'Assertion failed: ');

			$output.append(
				$('<div>')
					.addClass('assert')
					.addClass(assertion ? 'assert-passed' : 'assert-failed')
					.text(msg)
					.prepend($assertPrepend)
			);

			$output[0].scrollTop = $output[0].scrollHeight;

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

	var _patchClearMethod = function ($output) {
		var originalMethod = console.clear;

		return function () {
			$output.empty();

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
		var $output = $(outputDiv || '#console-output');

		console.info   = _patchConsoleMethod($output, 'info');
		console.warn   = _patchConsoleMethod($output, 'warn');
		console.error  = _patchConsoleMethod($output, 'error');
		console.debug  = _patchConsoleMethod($output, 'debug');
		console.log    = _patchConsoleMethod($output, 'log');
		console.assert = _patchAssertMethod($output);
		console.clear  = _patchClearMethod($output);

		window.onerror = function (msg, url, line) {
			console.error('Caught global error: ' + msg +
				' on line ' + line + ' of ' + url);
		};
	};
}());
