import PluginManager from 'src/lib/PluginManager.js';

var fakeEditor = {};
var fakePlugin;
var fakePluginTwo;
var pluginManager;

QUnit.module('lib/PluginManager', {
	beforeEach: function () {
		fakePlugin    = function () {};
		fakePluginTwo = function () {};

		pluginManager = new PluginManager(fakeEditor);
		PluginManager.plugins.fakePlugin = fakePlugin;
		PluginManager.plugins.fakePluginTwo = fakePluginTwo;
	},
	afterEach: function () {
		sinon.restore();
	}
});


QUnit.test('call()', function (assert) {
	var arg = {};
	var firstSpy = sinon.spy();
	var secondSpy = sinon.spy();

	fakePlugin.prototype.signalTest = firstSpy;
	fakePluginTwo.prototype.signalTest = secondSpy;

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	pluginManager.call('test', arg);

	assert.ok(firstSpy.calledOnce);
	assert.ok(firstSpy.calledOn(fakeEditor));
	assert.ok(firstSpy.calledWithExactly(arg));
	assert.ok(secondSpy.calledOnce);
	assert.ok(secondSpy.calledOn(fakeEditor));
	assert.ok(secondSpy.calledWithExactly(arg));

	assert.ok(firstSpy.calledBefore(secondSpy));
});


QUnit.test('callOnlyFirst()', function (assert) {
	var arg = {};

	var stub = sinon.stub();
	stub.returns(1);

	fakePlugin.prototype.signalTest = stub;
	fakePluginTwo.prototype.signalTest = sinon.spy();

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	assert.ok(pluginManager.callOnlyFirst('test', arg));

	assert.ok(fakePlugin.prototype.signalTest.calledOnce);
	assert.ok(fakePlugin.prototype.signalTest.calledOn(fakeEditor));
	assert.ok(fakePlugin.prototype.signalTest.calledWithExactly(arg));
	assert.ok(!fakePluginTwo.prototype.signalTest.called);
});


QUnit.test('hasHandler()', function (assert) {
	fakePlugin.prototype.signalTest = sinon.spy();
	fakePluginTwo.prototype.signalTest = sinon.spy();
	fakePluginTwo.prototype.signalTestTwo = sinon.spy();

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	assert.ok(pluginManager.hasHandler('test'));
	assert.ok(pluginManager.hasHandler('testTwo'));
});

QUnit.test('hasHandler() - No handler', function (assert) {
	fakePlugin.prototype.signalTest = sinon.spy();

	pluginManager.register('fakePlugin');

	assert.ok(!pluginManager.hasHandler('teSt'));
	assert.ok(!pluginManager.hasHandler('testTwo'));
});


QUnit.test('exists()', function (assert) {
	assert.ok(pluginManager.exists('fakePlugin'));
	assert.ok(!pluginManager.exists('noPlugin'));
});


QUnit.test('isRegistered()', function (assert) {
	pluginManager.register('fakePlugin');

	assert.ok(pluginManager.isRegistered('fakePlugin'));
	assert.ok(!pluginManager.isRegistered('fakePluginTwo'));
});


QUnit.test('register() - No plugin', function (assert) {
	assert.strictEqual(pluginManager.register('noPlugin'), false);
});

QUnit.test('register() - Call init', function (assert) {
	fakePlugin.prototype.init = sinon.spy();
	fakePluginTwo.prototype.init = sinon.spy();

	assert.strictEqual(pluginManager.register('fakePlugin'), true);

	assert.ok(fakePlugin.prototype.init.calledOnce);
	assert.ok(fakePlugin.prototype.init.calledOn(fakeEditor));
	assert.ok(!fakePluginTwo.prototype.init.called);
});

QUnit.test('register() - Called twice', function (assert) {
	fakePlugin.prototype.init = sinon.spy();

	assert.strictEqual(pluginManager.register('fakePlugin'), true);
	assert.strictEqual(pluginManager.register('fakePlugin'), false);

	assert.ok(fakePlugin.prototype.init.calledOnce);
	assert.ok(fakePlugin.prototype.init.calledOn(fakeEditor));
});


QUnit.test('deregister()', function (assert) {
	fakePlugin.prototype.destroy = sinon.spy();
	fakePluginTwo.prototype.destroy = sinon.spy();

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	pluginManager.deregister('fakePlugin');

	assert.ok(fakePlugin.prototype.destroy.calledOnce);
	assert.ok(fakePlugin.prototype.destroy.calledOn(fakeEditor));
	assert.ok(!fakePluginTwo.prototype.destroy.calledOnce);
});

QUnit.test('deregister() - Called twice', function (assert) {
	fakePlugin.prototype.destroy = sinon.spy();
	fakePluginTwo.prototype.destroy = sinon.spy();

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	pluginManager.deregister('fakePlugin');
	pluginManager.deregister('fakePlugin');

	assert.ok(fakePlugin.prototype.destroy.calledOnce);
	assert.ok(fakePlugin.prototype.destroy.calledOn(fakeEditor));
	assert.ok(!fakePluginTwo.prototype.destroy.calledOnce);
});


QUnit.test('destroy()', function (assert) {
	fakePlugin.prototype.destroy = sinon.spy();
	fakePluginTwo.prototype.destroy = sinon.spy();

	pluginManager.register('fakePlugin');
	pluginManager.register('fakePluginTwo');

	pluginManager.destroy();

	assert.ok(fakePlugin.prototype.destroy.calledOnce);
	assert.ok(fakePlugin.prototype.destroy.calledOn(fakeEditor));
	assert.ok(fakePluginTwo.prototype.destroy.calledOnce);
	assert.ok(fakePluginTwo.prototype.destroy.calledOn(fakeEditor));
});
