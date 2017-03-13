import * as emoticons from 'src/lib/emoticons.js';
import * as utils from 'tests/unit/utils.js';

QUnit.module('lib/emoticons');

QUnit.test('replace()', function (assert) {
	var codes = {
		':)': '~happy~',
		':angel:': '~angel~'
	};

	var root = utils.htmlToDiv(':):angel:');

	emoticons.replace(root, codes);

	assert.nodesEqual(root, utils.htmlToDiv('~happy~~angel~'));
});

QUnit.test('replace() - code blocks', function (assert) {
	var codes = {
		':)': '~happy~'
	};

	var root = utils.htmlToDiv('<code>:)</code>');

	emoticons.replace(root, codes);

	assert.nodesEqual(root, utils.htmlToDiv('<code>:)</code>'));
});

QUnit.test('replace() - longest first', function (assert) {
	var codes = {
		':(': '~sad~',
		'>:(': '~angry~',
		'>:': '~grr~'
	};

	var root = utils.htmlToDiv('>:(');

	emoticons.replace(root, codes);

	assert.nodesEqual(root, utils.htmlToDiv('~angry~'));
});

QUnit.test('replace() - emoticonsCompat', function (assert) {
	var codes = {
		':)': '~happy~',
		':angel:': '~angel~'
	};

	var root = utils.htmlToDiv(':) :):) :)t :) t:) test:)test :angel:');

	emoticons.replace(root, codes, true);

	assert.nodesEqual(
		root,
		utils.htmlToDiv('~happy~ :):) :)t ~happy~ t:) test:)test ~angel~')
	);
});

QUnit.test('replace() - emoticonsCompat regex key', function (assert) {
	var codes = {
		'[^1-9]': '~happy~'
	};

	var root = utils.htmlToDiv('[^1-9]');

	emoticons.replace(root, codes, true);

	assert.nodesEqual(root, utils.htmlToDiv('~happy~'));
});

QUnit.test('checkWhitespace() - All have whitespace', function (assert) {
	var root = utils.htmlToDiv(
		'<img data-sceditor-emoticon=":)" /> test ' +
		'<img data-sceditor-emoticon=":)" /> test ' +
		'<img data-sceditor-emoticon=":)" />'
	);

	var mockRange = {
		startContainer: root.childNodes[1],
		startOffset: 2,
		collapseCalled: false,
		setStart: function (container, offset) {
			this.startContainer = container;
			this.startOffset = offset;
		},
		collapse: function () {
			this.collapseCalled = true;
		}
	};

	var mockRangeHelper = {
		selectedRange: mockRange,
		selectRangeCalled: false,
		cloneSelected: function () {
			return mockRange;
		},
		selectRange: function (range) {
			this.selectedRange = range;
			this.selectRangeCalled = true;
		}
	};

	emoticons.checkWhitespace(root, mockRangeHelper);

	assert.nodesEqual(root, utils.htmlToDiv(
		'<img data-sceditor-emoticon=":)" /> test ' +
		'<img data-sceditor-emoticon=":)" /> test ' +
		'<img data-sceditor-emoticon=":)" />'
	));

	assert.strictEqual(mockRange.startContainer, root.childNodes[1]);
	assert.strictEqual(mockRange.startOffset, 2);
	assert.notOk(mockRange.collapseCalled);
	assert.notOk(mockRangeHelper.selectRangeCalled);
});

QUnit.test('checkWhitespace() - Remove emoticons without whitespace', function (assert) {
	var root = utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test ' +
		'<img data-sceditor-emoticon=":)" />test ' +
		'<img data-sceditor-emoticon=":P" />'
	);

	var mockRange = {
		startContainer: root.childNodes[3],
		startOffset: 2,
		collapseCalled: false,
		setStart: function (container, offset) {
			this.startContainer = container;
			this.startOffset = offset;
		},
		collapse: function () {
			this.collapseCalled = true;
		}
	};

	var mockRangeHelper = {
		selectedRange: mockRange,
		selectRangeCalled: false,
		cloneSelected: function () {
			return mockRange;
		},
		selectRange: function (range) {
			this.selectedRange = range;
			this.selectRangeCalled = true;
		}
	};

	emoticons.checkWhitespace(root, mockRangeHelper);

	assert.nodesEqual(root, utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test ' +
		':)test ' +
		'<img data-sceditor-emoticon=":P" />'
	));

	assert.strictEqual(mockRange.startContainer, root.childNodes[1]);
	assert.strictEqual(mockRange.startOffset, 10);
	assert.ok(mockRange.collapseCalled);
	assert.ok(mockRangeHelper.selectRangeCalled);
});

QUnit.test('checkWhitespace() - Remove cursor placed before', function (assert) {
	var root = utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test' +
		'<img data-sceditor-emoticon=":)" /> test ' +
		'<img data-sceditor-emoticon=":P" />'
	);

	var mockRange = {
		startContainer: root.childNodes[1],
		startOffset: 2,
		collapseCalled: false,
		setStart: function (container, offset) {
			this.startContainer = container;
			this.startOffset = offset;
		},
		collapse: function () {
			this.collapseCalled = true;
		}
	};

	var mockRangeHelper = {
		selectedRange: mockRange,
		selectRangeCalled: false,
		cloneSelected: function () {
			return mockRange;
		},
		selectRange: function (range) {
			this.selectedRange = range;
			this.selectRangeCalled = true;
		}
	};

	emoticons.checkWhitespace(root, mockRangeHelper);

	assert.nodesEqual(root, utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test' +
		':) test ' +
		'<img data-sceditor-emoticon=":P" />'
	));

	assert.strictEqual(mockRange.startContainer, root.childNodes[1]);
	assert.strictEqual(mockRange.startOffset, 2);
	assert.ok(mockRange.collapseCalled);
	assert.ok(mockRangeHelper.selectRangeCalled);
});

QUnit.test('checkWhitespace() - Remove cursor placed after', function (assert) {
	var root = utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test ' +
		'<img data-sceditor-emoticon=":)" />test ' +
		'<img data-sceditor-emoticon=":P" />'
	);

	var mockRange = {
		startContainer: root,
		startOffset: 3,
		collapseCalled: false,
		setStart: function (container, offset) {
			this.startContainer = container;
			this.startOffset = offset;
		},
		collapse: function () {
			this.collapseCalled = true;
		}
	};

	var mockRangeHelper = {
		selectedRange: mockRange,
		selectRangeCalled: false,
		cloneSelected: function () {
			return mockRange;
		},
		selectRange: function (range) {
			this.selectedRange = range;
			this.selectRangeCalled = true;
		}
	};

	emoticons.checkWhitespace(root, mockRangeHelper);

	assert.nodesEqual(root, utils.htmlToDiv(
		'<img data-sceditor-emoticon=":P" /> test ' +
		':)test ' +
		'<img data-sceditor-emoticon=":P" />'
	));

	assert.strictEqual(mockRange.startContainer, root.childNodes[1]);
	assert.strictEqual(mockRange.startOffset, 8);
	assert.ok(mockRange.collapseCalled);
	assert.ok(mockRangeHelper.selectRangeCalled);
});

QUnit.test('checkWhitespace() - no emoticons', function (assert) {
	assert.expect(0);

	var root = utils.htmlToDiv('testing 123...');

	emoticons.checkWhitespace(root, {});
});

QUnit.test('checkWhitespace() - null current block', function (assert) {
	assert.expect(0);

	emoticons.checkWhitespace(undefined, {});
	emoticons.checkWhitespace(null, {});
});
