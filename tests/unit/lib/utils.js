import * as utils from 'src/lib/utils.js';

QUnit.module('lib/utils');


QUnit.test('isEmptyObject()', function (assert) {
	assert.ok(utils.isEmptyObject({}));
	assert.ok(utils.isEmptyObject([]));

	assert.notOk(utils.isEmptyObject({ a: 'a' }));
	assert.notOk(utils.isEmptyObject([1]));
});

QUnit.test('extend() - merge', function (assert) {
	var a = { a: 'foo' };
	var b = { b: 'bar' };

	assert.deepEqual(utils.extend(a, b), { a: 'foo', b: 'bar' });
});

QUnit.test('extend() - replace', function (assert) {
	var a = { a: 'foo' };
	var b = { a: 'bar' };

	assert.deepEqual(utils.extend(a, b), { a: 'bar' });
});

QUnit.test('extend() - null', function (assert) {
	var a = { a: null };
	var b = { b: null, c: null };

	assert.deepEqual(utils.extend(a, a), { a: null });
	assert.deepEqual(utils.extend(a, b), { a: null, b: null, c: null });
	assert.deepEqual(utils.extend(b, a), { a: null, b: null, c: null });
});

QUnit.test('extend() - is immutable', function (assert) {
	var record = {};

	utils.extend({}, record, { foo: 'bar' });
	assert.equal(record.foo, undefined);
});

QUnit.test('extend() - is mutable', function (assert) {
	var record = {};

	utils.extend(record, { foo: 'bar' });
	assert.equal(record.foo, 'bar');
});

QUnit.test('extend() - null as argument', function (assert) {
	var a = { foo: 'bar' };
	var b = null;
	var c = void 0;

	assert.deepEqual(utils.extend({}, b, a, c), { foo: 'bar' });
});

QUnit.test('extend() - mixed types', function (assert) {
	var target = {};
	var child = {};
	var childOverriden = {};
	var childArray = [1, 2, 3];
	var childArrayOverriden = [1];

	var result = utils.extend(target, {
		key: childOverriden,
		ignore: undefined,
		array: childArrayOverriden,
		prop: 'overriden',
		extra: '@'
	}, {
		key: child,
		array: childArray,
		prop: 'a'
	});

	assert.strictEqual(result, target);
	assert.strictEqual(result.key, child);
	assert.strictEqual(result.array, childArray);

	assert.deepEqual(result, {
		key: child,
		array: childArray,
		prop: 'a',
		extra: '@'
	});
});

QUnit.test('extend() - deep with mixed types', function (assert) {
	var target = {};
	var child = {};

	var result = utils.extend(true, target, {
		child: child,
		ignore: undefined,
		key: {
			prop: 'overriden',
			extra: 'a'
		},
		array: [1, 1, 1],
		prop: 'overriden',
		extra: 'a'
	}, {
		key: {
			prop: 'a'
		},
		array: [2, 3],
		prop: 'a'
	});

	assert.strictEqual(result, target);
	assert.notStrictEqual(result.child, child);

	assert.deepEqual(result, {
		child: {},
		key: {
			prop: 'a',
			extra: 'a'
		},
		array: [2, 3, 1],
		prop: 'a',
		extra: 'a'
	});
});

QUnit.test('extend() - prototype pollution', function (assert) {
	var a = {};
	var maliciousPayload = '{"__proto__":{"oops":"It works!"}}';

	assert.strictEqual(a.oops, undefined);
	utils.extend({}, maliciousPayload);
	assert.strictEqual(a.oops, undefined);

	utils.extend(true, {}, JSON.parse('{"__proto__":{"pollution":true}}'));
	assert.notStrictEqual({}.pollution, true);

	utils.extend(true, {}, JSON.parse('{"constructor":{"prototype":{"pollution":true}}}'));
	assert.notStrictEqual({}.pollution, true);
});

QUnit.test('extend() - deep string', function (assert) {
	var a = { a: {foo: 'bar' } };
	var b = { a: {foo: { 'bar': 'baz' } } };

	assert.deepEqual(utils.extend(true, {}, a, b), { a: {foo: { 'bar': 'baz' } } });
});

QUnit.test('extend() - deep number', function (assert) {
	var a = { a: {foo: 123 } };
	var b = { a: {foo: { 'bar': 'baz' } } };

	assert.deepEqual(utils.extend(true, {}, a, b), { a: {foo: { 'bar': 'baz' } } });
});

QUnit.test('extend() - deep false', function (assert) {
	var a = { a: {foo: false } };
	var b = { a: {foo: { 'bar': 'baz' } } };

	assert.deepEqual(utils.extend(true, {}, a, b), { a: {foo: { 'bar': 'baz' } } });
});


QUnit.test('arrayRemove()', function (assert) {
	var array = [1, 2, 3, 3, 4, 5];

	utils.arrayRemove(array, 1);
	assert.equal(array.length, 5);

	utils.arrayRemove(array, 1);
	assert.equal(array.length, 5);

	utils.arrayRemove(array, 3);
	assert.equal(array.length, 4);
	assert.equal(array.indexOf(3), 1);
});

QUnit.test('each() - Array', function (assert) {
	var count = 0;
	var validValues = ['idx0', 'idx1', 'idx4', 'idx5'];
	var validKeys = [0, 1, 2, 3, 4];
	var array = ['idx0', 'idx1', 'idx4', 'idx5'];

	utils.each(array, function (index, value) {
		count++;
		assert.strictEqual(value, validValues.shift());
		assert.strictEqual(index, validKeys.shift());
	});

	assert.equal(count, 4);
});

QUnit.test('each() - Object', function (assert) {
	var count = 0;
	var validValues = ['idx0', 'idx1', 'idx4', 'idx5'];
	var validKeys = ['0', '1', '4', '5'];
	var object = {
		0: 'idx0',
		1: 'idx1',
		4: 'idx4',
		5: 'idx5'
	};

	utils.each(object, function (key, value) {
		count++;
		assert.strictEqual(key, validKeys.shift());
		assert.strictEqual(value, validValues.shift());
	});

	assert.equal(count, 4);
});

QUnit.test('each() - Array like', function (assert) {
	var count = 0;
	var validValues = ['idx0', 'idx1', undefined, undefined, 'idx4'];
	var validKeys = [0, 1, 2, 3, 4];
	var arrayLike = {
		length: 5,
		0: 'idx0',
		1: 'idx1',
		4: 'idx4',
		5: 'idx5'
	};

	utils.each(arrayLike, function (index, value) {
		count++;
		assert.strictEqual(value, validValues.shift());
		assert.strictEqual(index, validKeys.shift());
	});


	assert.equal(count, 5);
});
