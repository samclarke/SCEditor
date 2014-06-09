(function () {
	// Report QUnit results to SauceLabs
	var log = [];
	var testName;

	QUnit.done(function (testResults) {
		var tests = [];

		for (var i = 0, len = log.length; i < len; i++) {
			var details = log[i];
			tests.push({
				name: details.name,
				result: details.result,
				expected: details.expected,
				actual: details.actual,
				source: details.source
			});
		}

		testResults.tests = tests;

		/*jshint -W069 */
		window['global_test_results'] = testResults;
	});

	QUnit.testStart(function (testDetails) {
		QUnit.log = function (details) {
			if (!details.result) {
				details.name = testDetails.name;
				log.push(details);
			}
		};
	});


	// Don't start until requireJS has loaded the tests
	QUnit.config.autostart = false;
	QUnit.config.reorder = false;


	// Add moduleSetup and moduleTeardown properties to the
	// modules settings and add support for a module fixture
	// div#qunit-module-fixture
	var oldModule = window.module;
	window.module = function (name, settings) {
		settings = settings || {};

		if (settings.moduleSetup) {
			QUnit.moduleStart(function (details) {
				if (details.name == name) {
					settings.moduleSetup();
				}

				$('#qunit-module-fixture').empty();
			});
		}

		if (settings.moduleTeardown) {
			QUnit.moduleDone(function (details) {
				if (details.name == name) {
					settings.moduleTeardown();
				}

				$('#qunit-module-fixture').empty();
			});
		}

		oldModule(name, settings);
	};


	define('jquery', [], function () {
		return jQuery;
	});

	define('rangy', [], function () {
		return rangy;
	});

	require.config({
		baseUrl: '../../src',
		paths: {
			'tests': '../tests',
			'domReady': '../tests/libs/domReady-2.0.1'
		},
		shim: {
			'plugins/bbcode': ['jquery.sceditor'],
			'plugins/xhtml': ['jquery.sceditor']
		}
	});
}());
