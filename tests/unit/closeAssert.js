define(function () {
	'use strict';

	var isClose = function (actual, expected, maxDiff) {
		return (actual >= expected - maxDiff || actual <= expected + maxDiff);
	};

	QUnit.assert.close = function (actual, expected, maxDiff, message) {
		message = message || 'Expected ' + actual +
			' to be within ' + expected + '+-' + maxDiff;

		QUnit.push(
			isClose(actual, expected, maxDiff),
			actual,
			expected + ' +-' + maxDiff,
			message
		);
	};

	QUnit.assert.notClose = function (actual, expected, maxDiff, message) {
		message = message || 'Expected ' + actual +
			' to not be within ' + expected + '+-' + maxDiff;

		QUnit.push(
			!isClose(actual, expected, maxDiff),
			actual,
			expected + ' +-' + maxDiff,
			message
		);
	};
});
