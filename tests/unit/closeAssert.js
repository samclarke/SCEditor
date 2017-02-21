var isNear = function (actual, expected, maxDiff) {
	return (actual >= expected - maxDiff || actual <= expected + maxDiff);
};

QUnit.assert.close = function (actual, expected, maxDiff, message) {
	message = message || 'Expected ' + actual +
		' to be within ' + expected + '+-' + maxDiff;

	this.pushResult({
		result: isNear(actual, expected, maxDiff),
		actual: actual,
		expected: expected + ' +-' + maxDiff,
		message: message
	});
};

QUnit.assert.notClose = function (actual, expected, maxDiff, message) {
	message = message || 'Expected ' + actual +
		' to not be within ' + expected + '+-' + maxDiff;

	this.pushResult({
		result: !isNear(actual, expected, maxDiff),
		actual: actual,
		expected: expected + ' +-' + maxDiff,
		message: message
	});
};
