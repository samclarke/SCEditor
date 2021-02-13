import RangeHelper from 'src/lib/RangeHelper.js';
import * as utils from 'tests/unit/utils.js';
import rangy from 'rangy';
import DOMPurify from 'dompurify';

var editableDiv, rangeHelper;

var KEYWORDS = [
	['keyword', 'replacement'],
	[':)', 'imgSmile'],
	['bold', '<b>bold</b>']
];


QUnit.module('lib/RangeHelper', {
	beforeEach: function () {
		var fixture = document.getElementById('qunit-fixture');

		editableDiv = document.createElement('div');
		editableDiv.contentEditable = true;

		fixture.appendChild(editableDiv);

		rangeHelper = new RangeHelper(window, document, DOMPurify.sanitize);
	}
});


QUnit.test('insertHTML() - Text with node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertHTML('orange <b>and</b> pink');

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The orange <b>and</b> pink dog.</p>'
	));
});

QUnit.test('insertHTML() - Single node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertHTML(
		'<span>orange</span> <b>and</b> <em><b>pink</b></em>'
	);

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The <span>orange</span> <b>and</b> ' +
			'<em><b>pink</b></em> dog.</p>'
	));
});

QUnit.test('insertHTML() - Before and after', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertHTML('<em>', '</em>');

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The <em>quick brown fox jumps over the lazy</em> dog.</p>'
	));
});


QUnit.test('insertNode() - Text node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertNode(utils.htmlToNode('orange and pink'));

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The orange and pink dog.</p>'
	));
});

QUnit.test('insertNode() - Text node with another node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertNode(utils.htmlToFragment('orange <b>and</b> pink'));

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The orange <b>and</b> pink dog.</p>'
	));
});

QUnit.test('insertNode() - Before and after', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertNode(
		utils.htmlToFragment('<b>before</b>'),
		utils.htmlToFragment('<em>after</em>')
	);

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The <b>before</b>quick brown fox jumps over the ' +
			'lazy<em>after</em> dog.</p>'
	));
});


QUnit.test('hasSelection() - With selection', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	range.selectNode(editableDiv.firstChild);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.hasSelection(), true);
});

QUnit.test('hasSelection() - No selection', function (assert) {
	rangy.getSelection().removeAllRanges();

	assert.strictEqual(rangeHelper.hasSelection(), false);
});


QUnit.test('selectedHtml() - Text only', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	assert.htmlEqual(
		rangeHelper.selectedHtml(),
		'quick brown fox jumps over the lazy'
	);
});

QUnit.test('selectedHtml() - Text plus part of node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown <span>fox jumps</span> over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.childNodes[1].firstChild, 3);

	sel.setSingleRange(range);

	assert.htmlEqual(
		rangeHelper.selectedHtml(),
		'quick brown <span>fox</span>'
	);
});

QUnit.test('selectedHtml() - No selection', function (assert) {
	rangy.getSelection().removeAllRanges();

	assert.strictEqual(rangeHelper.selectedHtml(), '');
});


QUnit.test('parentNode() - Text only', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 30);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.parentNode(), para.firstChild);
});

QUnit.test('parentNode() - Text plus part of node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown <span>fox jumps</span> over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.childNodes[1].firstChild, 3);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.parentNode(), para);
});


QUnit.test('getFirstBlockParent() - Text only', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 30);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getFirstBlockParent(), para);
});

QUnit.test('getFirstBlockParent() - Text plus part of node', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown <span>fox jumps</span> over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.childNodes[1].firstChild, 3);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getFirstBlockParent(), para);
});


QUnit.test('insertNodeAt() - End', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertNodeAt(false, utils.htmlToFragment('<b>test</b>'));

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The quick brown fox jumps over the lazy<b>test</b> dog.</p>'
	));
});

QUnit.test('insertNodeAt() - Start', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);

	sel.setSingleRange(range);

	rangeHelper.insertNodeAt(true, utils.htmlToFragment('<b>test</b> '));

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The <b>test</b> quick brown fox jumps over the lazy dog.</p>'
	));
});


QUnit.test('restoreRange()', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	range.setStart(para.firstChild, 20);
	sel.setSingleRange(range);

	rangeHelper.saveRange();
	sel.removeAllRanges();
	rangeHelper.restoreRange();

	// Insert | at cursor as it's easier to check than ranges.
	rangeHelper.insertNode(document.createTextNode('|'));

	assert.nodesEqual(para, utils.htmlToNode(
		'<p>The quick brown fox |jumps over the lazy dog.</p>'
	));
});


QUnit.test('saveRange() - Start is before end marker', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox <br />jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	range.setStart(para.firstChild, 20);
	sel.setSingleRange(range);

	rangeHelper.saveRange();

	var $markers = $(editableDiv).find('.sceditor-selection');

	assert.ok($($markers[0]).is('#sceditor-start-marker'));
	assert.ok($($markers[1]).is('#sceditor-end-marker'));
});

QUnit.test('saveRange() - Start is before end in selection', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	range.setStart(para.firstChild, 4);
	range.setEnd(para.firstChild, 39);
	sel.setSingleRange(range);

	rangeHelper.saveRange();

	var $markers = $(editableDiv).find('.sceditor-selection');

	assert.ok($($markers[0]).is('#sceditor-start-marker'));
	assert.ok($($markers[1]).is('#sceditor-end-marker'));
});


QUnit.test('selectOuterText() - Left only', function (assert) {
	var range = rangy.createRangyRange();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);
	range.setEnd(para.firstChild, 20);

	rangy.getSelection().setSingleRange(range);
	rangeHelper.selectOuterText(10);

	var selectedRange = rangy.getSelection().getRangeAt(0);

	range.setStart(para.firstChild, 10);
	range.setEnd(para.firstChild, 20);

	assert.strictEqual(range.compareBoundaryPoints(
		range.START_TO_START, selectedRange
	), 0);

	assert.strictEqual(range.compareBoundaryPoints(
		range.END_TO_END, selectedRange
	), 0);
});

QUnit.test('selectOuterText() - Left & Right', function (assert) {
	var range = rangy.createRangyRange();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);
	range.setEnd(para.firstChild, 20);

	rangy.getSelection().setSingleRange(range);

	rangeHelper.selectOuterText(10, 10);
	var selectedRange = rangy.getSelection().getRangeAt(0);

	range.setStart(para.firstChild, 10);
	range.setEnd(para.firstChild, 30);

	assert.strictEqual(range.compareBoundaryPoints(
		range.START_TO_START, selectedRange
	), 0);

	assert.strictEqual(range.compareBoundaryPoints(
		range.END_TO_END, selectedRange
	), 0);
});

QUnit.test('selectOuterText() - Left & Right over adjacent nodes', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML = '<p></p>';

	var para = editableDiv.firstChild;
	var doc = para.ownerDocument;

	para.appendChild(doc.createTextNode('The quick brown '));
	para.appendChild(doc.createTextNode('fox '));
	para.appendChild(doc.createTextNode('jumps over the lazy dog.'));

	range.setStart(para.childNodes[1], 2);
	range.setEnd(para.childNodes[1], 2);

	sel.setSingleRange(range);

	rangeHelper.selectOuterText(10, 10);

	range.setStart(para.firstChild, 8);
	range.setEnd(para.lastChild, 8);

	assert.strictEqual(range.compareBoundaryPoints(
		range.START_TO_START, sel.getRangeAt(0)
	), 0);

	assert.strictEqual(range.compareBoundaryPoints(
		range.END_TO_END, sel.getRangeAt(0)
	), 0);
});


QUnit.test('getOuterText() - Before', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getOuterText(true, 4), 'fox ');
});

QUnit.test('getOuterText() - Before split nodes', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML = '<p></p>';

	var para = editableDiv.firstChild;
	var doc = para.ownerDocument;

	para.appendChild(doc.createTextNode('The quick brown '));
	para.appendChild(doc.createTextNode('fox '));
	para.appendChild(doc.createTextNode('jumps over the lazy dog.'));

	range.setStart(para.childNodes[2], 0);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getOuterText(true, 10), 'brown fox ');
});

QUnit.test('getOuterText() - Before with paragraph as start', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML = '<p></p>';

	var para = editableDiv.firstChild;
	var doc = para.ownerDocument;

	para.appendChild(doc.createTextNode('The quick brown '));
	para.appendChild(doc.createTextNode('fox '));
	para.appendChild(doc.createTextNode('jumps over the lazy dog.'));

	range.setStart(para, 2);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getOuterText(true, 10), 'brown fox ');
});

QUnit.test('getOuterText() - After', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getOuterText(false, 5), 'jumps');
});

QUnit.test('getOuterText() - After split nodes', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML = '<p></p>';

	var para = editableDiv.firstChild;
	var doc = para.ownerDocument;

	para.appendChild(doc.createTextNode('The quick brown '));
	para.appendChild(doc.createTextNode('fox '));
	para.appendChild(doc.createTextNode('jumps over the lazy dog.'));

	range.setStart(para.firstChild, 16);

	sel.setSingleRange(range);

	assert.strictEqual(rangeHelper.getOuterText(false, 9), 'fox jumps');
});

QUnit.test('getOuterText() - After with paragraph as start', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML = '<p></p>';

	var para = editableDiv.firstChild;
	var doc = para.ownerDocument;

	para.appendChild(doc.createTextNode('The quick brown '));
	para.appendChild(doc.createTextNode('fox '));
	para.appendChild(doc.createTextNode('jumps over the lazy dog.'));

	range.setStart(para, 0);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.getOuterText(false, 25),
		'The quick brown fox jumps'
	);
});


QUnit.test('replaceKeyword() - No matches', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false
		),
		false
	);
});

QUnit.test('replaceKeyword() - Match after', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox boldjumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown fox <b>bold</b>jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - Match before', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown foxbold jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 23);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown fox<b>bold</b> jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - Match after with current char', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox oldjumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false,
			'b'
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown fox <b>bold</b>jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - Match before with current char', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown foxbol jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 22);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false,
			'd'
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown fox<b>bold</b> jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - Match that is too far behind', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown foxbold jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 24);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false,
			'd'
		),
		false
	);
});

QUnit.test('replaceKeyword() - Match that is too far forward', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox boldjumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 20);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false,
			'b'
		),
		false
	);
});

QUnit.test('replaceKeyword() - Match in middle', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown foxkeyord jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 22);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			false,
			'w'
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown foxreplacement jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - Middle with spaces required', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox keyord jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 23);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			true,
			'w'
		),
		true
	);

	assert.htmlEqual(
		editableDiv.innerHTML,
		'<p>The quick brown fox replacement jumps over the lazy dog.</p>'
	);
});

QUnit.test('replaceKeyword() - No match space required', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown foxkeyord jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;
	range.setStart(para.firstChild, 22);

	sel.setSingleRange(range);

	assert.strictEqual(
		rangeHelper.replaceKeyword(
			KEYWORDS,
			true,
			false,
			false,
			true,
			'w'
		),
		false
	);
});

QUnit.test(
	'replaceKeyword() - Current char space when spaces required',
	function (assert) {
		var range = rangy.createRangyRange();
		var sel   = rangy.getSelection();

		editableDiv.innerHTML =
			'<p>The quick brown fox keywordjumps over the lazy dog.</p>';

		var para = editableDiv.firstChild;
		range.setStart(para.firstChild, 27);

		sel.setSingleRange(range);

		assert.strictEqual(
			rangeHelper.replaceKeyword(
				KEYWORDS,
				true,
				false,
				false,
				true,
				' '
			),
			true
		);

		assert.htmlEqual(
			editableDiv.innerHTML,
			'<p>The quick brown fox replacementjumps over the lazy dog.</p>'
		);
	}
);


QUnit.test('compare() - To current selection', function (assert) {
	var rangeA = rangy.createNativeRange();
	var rangeB = rangy.createNativeRange();
	var sel    = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	if (rangeA.moveToElementText) {
		rangeA.moveToElementText(para);
		rangeA.moveStart('character', 20);

		rangeB.moveToElementText(para);
		rangeB.moveStart('character', 20);

		rangeA.select();
	} else {
		rangeA.setStart(para.firstChild, 20);
		rangeB.setStart(para.firstChild, 20);

		sel.setSingleRange(rangeA);
	}

	assert.strictEqual(rangeHelper.compare(rangeB), true);
});

QUnit.test('compare() - Equal', function (assert) {
	var rangeA = rangy.createNativeRange();
	var rangeB = rangy.createNativeRange();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	if (rangeA.moveToElementText) {
		rangeA.moveToElementText(para);
		rangeA.moveStart('character', 20);
		rangeA.moveEnd('character', 20);

		rangeB.moveToElementText(para);
		rangeB.moveStart('character', 20);
		rangeB.moveEnd('character', 20);
	} else {
		rangeA.setStart(para.firstChild, 20);
		rangeA.setEnd(para.firstChild, 20);

		rangeB.setStart(para.firstChild, 20);
		rangeB.setEnd(para.firstChild, 20);
	}

	assert.strictEqual(rangeHelper.compare(rangeA, rangeB), true);
});

QUnit.test('compare() - Not equal', function (assert) {
	var rangeA = rangy.createNativeRange();
	var rangeB = rangy.createNativeRange();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	var para = editableDiv.firstChild;

	if (rangeA.moveToElementText) {
		rangeA.moveToElementText(para);
		rangeA.moveStart('character', 25);
		rangeA.moveEnd('character', 25);

		rangeB.moveToElementText(para);
		rangeB.moveStart('character', 20);
		rangeB.moveEnd('character', 20);
	} else {
		rangeA.setStart(para.firstChild, 25);
		rangeA.setEnd(para.firstChild, 25);

		rangeB.setStart(para.firstChild, 20);
		rangeB.setEnd(para.firstChild, 20);
	}

	assert.strictEqual(rangeHelper.compare(rangeA, rangeB), false);
});


QUnit.test('clear()', function (assert) {
	var range = rangy.createRangyRange();
	var sel   = rangy.getSelection();

	editableDiv.innerHTML =
		'<p>The quick brown fox jumps over the lazy dog.</p>';

	range.selectNode(editableDiv.firstChild);

	sel.setSingleRange(range);

	rangeHelper.clear();

	assert.strictEqual(rangeHelper.hasSelection(), false);
});
