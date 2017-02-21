/**
 * sinon-qunit 1.0.0, 2010/12/09
 *
 * @author Christian Johansen (christian@cjohansen.no)
 *
 * (The BSD License)
 */
/*global sinon, QUnit, test*/
sinon.assert.fail = function (msg) {
	QUnit.ok(false, msg);
};

sinon.assert.pass = function (assertion) {
	QUnit.ok(true, assertion);
};

sinon.config = {
	injectIntoThis: true,
	injectInto: null,
	properties: ['spy', 'stub', 'mock', 'clock', 'sandbox'],
	useFakeTimers: true,
	useFakeServer: false
};
