(function () {
	'use strict';

	var _assert = {
		ok: function (actual, description, info) {
			console.assert(actual, description);

			if (!actual && info) {
				console.info(info);
			}
		},
		equal: function (actual, expected, description) {
			_assert.ok(
				// eslint-disable-next-line eqeqeq
				actual == expected,
				description,
				'Expected "' + actual + '" == "' + expected + '"'
			);
		},
		strictEqual: function (actual, expected, description) {
			_assert.ok(
				actual === expected,
				description,
				'Expected "' + actual + '" === "' + expected + '"'
			);
		},
		notEqual: function (actual, expected, description) {
			_assert.ok(
				// eslint-disable-next-line eqeqeq
				actual != expected,
				description,
				'Expected "' + actual + '" != "' + expected + '"'
			);
		},
		notStrictEqual: function (actual, expected, description) {
			_assert.ok(
				actual !== expected,
				description,
				'Expected "' + actual + '" !== "' + expected + '"'
			);
		},
		throws: function (method, expected, description) {
			var undef;
			var exception = false;

			if (description === undef) {
				description = expected;
				expected    = undef;
			}

			try {
				method.call(null);
			} catch (ex) {
				exception = ex;
			}

			if (expected === undef) {
				_assert.ok(
					exception,
					description,
					'No exception was thrown.'
				);
			} else {
				_assert.ok(
					// eslint-disable-next-line eqeqeq
					exception == expected,
					description,
					'Expected exception and actual exception did not match.'
				);
			}
		}
	};

	var _bind = function (fn, that) {
		return function () {
			return fn.apply(that, arguments);
		};
	};


	var TestRunner = function () {
		this.assert = _assert;
		this._tests = [];

		this._currentTestIndex = -1;
		this._testObjectThis   = {};
	};

	TestRunner.prototype._currentTest = function () {
		var undef;

		if (this._currentTestIndex < 0) {
			return undef;
		}

		return this._tests[this._currentTestIndex];
	};

	TestRunner.prototype._failedTests = function () {
		var failed = [];

		for (var i = 0; i < this._tests.length; i++) {
			if (this._tests[i].passed === false) {
				failed.push(this._tests[i]);
			}
		}

		return failed;
	};

	TestRunner.prototype._skippedTests = function () {
		var skipped = [];

		for (var i = 0; i < this._tests.length; i++) {
			if (this._tests[i].skipped) {
				skipped.push(this._tests[i]);
			}
		}

		return skipped;
	};

	TestRunner.prototype._incrementTest = function () {
		var title, instructions, totalFailed;
		var $currentTestDisplay = $('.current-test');

		this._currentTestIndex++;
		this._updateProgress();

		if (this._currentTest()) {
			title = this._currentTest().title;
			instructions = this._currentTest().instructions;
		} else {
			totalFailed = this._failedTests().length;

			title = 'Finished!';
			instructions = 'Testing complete. ' + totalFailed + ' of ' +
				this._totalTests() + ' tests failed, ' +
				this._skippedTests().length + ' skipped.';

			$currentTestDisplay.addClass(totalFailed ? 'failed' : 'passed');
		}

		$currentTestDisplay.children('h3').text(title);
		$currentTestDisplay.children('p').text(instructions);
	};

	TestRunner.prototype._updateProgress = function () {
		var currentPercent =
			(this._currentPosition() / this._totalTests()) * 100;

		$('#progress-info').text(
			this._currentPosition() + ' / ' + this._totalTests()
		);

		$('#progress').width(currentPercent + '%');
	};

	TestRunner.prototype._currentPosition = function () {
		return Math.min(
			Math.max(this._currentTestIndex, 0), this._totalTests()
		);
	};

	TestRunner.prototype._totalTests = function () {
		return this._tests.length;
	};

	TestRunner.prototype._setupTests = function () {
		var	$test, test, testIdx,
			that   = this;

		for (testIdx = 0; testIdx < this._tests.length; testIdx++) {
			test = this._tests[testIdx];

			$test = $('<div class="test">')
				.append($('<h3>').text(test.title))
				.append($('<p>').text(test.instructions));

			this._tests[testIdx].display = $test;
			$('#tests').append($test);
		}

		$('.current-test a').click(function () {
			that._skipTest();

			return false;
		});
	};

	TestRunner.prototype._done = function (passed) {
		var currentTest = this._currentTest();

		if (currentTest) {
			currentTest.display.addClass(passed ? 'passed' : 'failed');
			currentTest.passed  = !!passed;
			currentTest.skipped = false;

			if (passed) {
				console.info('Test: "' + currentTest.title + '" passed.');
			} else {
				console.error('Test: "' + currentTest.title + '" failed.');
			}
		}

		this._runNext();
	};

	TestRunner.prototype._skipTest = function () {
		var currentTest = this._currentTest();

		if (!currentTest) {
			return;
		}

		currentTest.passed  = true;
		currentTest.skipped = true;

		console.info('Test: "' + currentTest.title + '" skipped.');

		this._runNext();
	};

	TestRunner.prototype._runNext = function () {
		var currentTest;
		var $testsContainer = $('#tests');

		currentTest = this._currentTest();
		if (currentTest) {
			if (currentTest.teardown) {
				currentTest.teardown.call(this._testObjectThis);
			}
		}

		this._incrementTest();

		currentTest = this._currentTest();
		if (currentTest) {
			$testsContainer.scrollTop(
				$testsContainer.scrollTop() +
				currentTest.display.outerHeight() +
				currentTest.display.position().top -
				$testsContainer.height()
			);

			if (currentTest.setup) {
				currentTest.setup.call(this._testObjectThis);
			}

			currentTest.test.call(this._testObjectThis, _bind(this._done, this));
		} else {
			$testsContainer.scrollTop($testsContainer[0].scrollHeight);

			console.info('Test finished!');
		}
	};

	TestRunner.prototype.run = function () {
		this._setupTests();

		setTimeout(function () {
			$('#tests').scrollTop(0);
		});

		this._runNext();
	};

	TestRunner.prototype.test = function (options, test) {
		this._tests.push({
			title: options.title,
			instructions: options.instructions,
			setup: options.setup,
			teardown: options.teardown,
			test: test
		});
	};

	TestRunner.prototype.setup = function (init) {
		var testObjectThis = this._testObjectThis;

		define('jquery', [], function () {
			return jQuery;
		});

		require.config({
			baseUrl: '../../../src'
		});

		require([
			'jquery.sceditor'
		], function () {
			init.call(testObjectThis);
		});
	};


	window.runner = new TestRunner();
}());
