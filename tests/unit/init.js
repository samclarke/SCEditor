(function () {
	// Report QUnit results to SauceLabs
	var log = [];

	// dompurify PhantomJS support
	// See: https://github.com/cure53/DOMPurify/issues/502#issuecomment-763651764
	if ('_phantom' in window) {
		const orig = Object.getOwnPropertyDescriptor;
		Object.getOwnPropertyDescriptor = function (obj, prop) {
			if (prop === 'cloneNode') {
				return {
					value: function () {
						return this.cloneNode();
					}
				};
			}
			if (prop === 'nextSibling' ||
				prop === 'childNodes' ||
				prop === 'parentNode') {
				return {
					value: function () {
						return this[prop];
					}
				};
			}

			return orig(obj, prop);
		};
	}

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

		// For SauceLabs
		// eslint-disable-next-line dot-notation
		window['global_test_results'] = testResults;

		// Send istanbul coverage to grunt
		if ('_phantom' in window && window.__coverage__) {
			alert(JSON.stringify(['qunit.coverage', window.__coverage__]));
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
