(function () {
	// Report QUnit results to SauceLabs
	var log = [];

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

		// Send istanbul coverage to grunt
		if (window.__grunt_contrib_qunit__) {
			window.__grunt_contrib_qunit__('qunit.coverage', window.__coverage__);
		}
	});

	QUnit.testStart(function (testDetails) {
		QUnit.log = function (details) {
			if (!details.result) {
				details.name = testDetails.name;
				log.push(details);
			}
		};
	});

	// Add moduleSetup and moduleTeardown properties to the
	// modules settings and add support for a module fixture
	// div#qunit-module-fixture
	var oldModule = QUnit.module;
	QUnit.module = function (name, settings) {
		settings = settings || {};

		if (settings.moduleSetup) {
			QUnit.moduleStart(function (details) {
				$('#qunit-module-fixture').empty();

				if (details.name === name) {
					settings.moduleSetup();
				}
			});
		}

		if (settings.moduleTeardown) {
			QUnit.moduleDone(function (details) {
				if (details.name === name) {
					settings.moduleTeardown();
				}

				$('#qunit-module-fixture').empty();
			});
		}

		oldModule(name, settings);
	};
}());
