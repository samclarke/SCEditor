import SCEditor from 'src/lib/SCEditor.js';
import defaultCommands from 'src/lib/defaultCommands.js';
import defaultOptions from 'src/lib/defaultOptions.js';
import * as utils from 'tests/unit/utils.js';
import rangy from 'rangy';


// The selection based tests fail in phantom although they do work in
// Chrome and Safari which are both based on Webkit. Should investigate
// further but looks like phantomJS but rather than an editor but.
// Might be an issue with phantomJS and iframes that have  selections.
var IS_PHANTOMJS = navigator.userAgent.indexOf('PhantomJS') > -1;

var $textarea;
var sceditor;
var $fixture = $('#qunit-module-fixture');

var testFormat = function () {
	this.toHtml = function () {
		return '<p><b>test wysiwyg</b></p>';
	};

	this.toSource = function () {
		return '<p><b>test source</b></p>';
	};
};

var reloadEditor = function (config) {
	reloadEditor.isCustomConfig = !!config;

	if (sceditor) {
		sceditor.destroy();
	}

	var textarea = $('<textarea></textarea>')
		.width(400)
		.height(300)
		.val('<p>The quick brown fox jumps over the lazy dog.<br /></p>')
		.get(0);

	$fixture
		.empty()
		.append(textarea);

	sceditor  = new SCEditor(textarea, config || {});
	$textarea = $(textarea);
};


QUnit.module('lib/SCEditor', {
	before: function () {
		SCEditor.commands       = defaultCommands;
		SCEditor.defaultOptions = defaultOptions;

		SCEditor.formats.test = testFormat;

		defaultOptions.style = '../../src/themes/content/default.css';
		defaultOptions.emoticonsRoot    = '../../';
		defaultOptions.emoticonsEnabled = false;

		reloadEditor();
	},
	after: function () {
		defaultOptions.style = 'jquery.sceditor.default.css';
		defaultOptions.emoticonsRoot    = '';
		defaultOptions.emoticonsEnabled = true;

		delete SCEditor.formats.test;

		if (sceditor) {
			sceditor.destroy();
		}
	},
	beforeEach: function () {
		if (reloadEditor.isCustomConfig) {
			reloadEditor();
		}

		sceditor.sourceMode(false);

		sceditor.val('<p>The quick brown fox jumps over ' +
			'the lazy dog.<br /></p>', false);
	}
});

QUnit.test('autofocus', function (assert) {
	if (IS_PHANTOMJS) {
		return assert.expect(0);
	}

	reloadEditor({
		autofocus: true,
		autofocusEnd: false
	});

	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var sel    = rangy.getIframeSelection(iframe);

	assert.ok(sel.rangeCount, 'At elast 1 range exists');

	var range  = sel.getRangeAt(0);
	var cursor = body.ownerDocument.createTextNode('|');

	range.insertNode(cursor);

	assert.nodesEqual(body.firstChild, utils.htmlToNode(
		'<p>|The quick brown fox jumps over the lazy dog.<br /></p>'
	));
});


QUnit.test('autofocusEnd', function (assert) {
	reloadEditor({
		autofocus: true,
		autofocusEnd: true
	});

	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var sel    = rangy.getIframeSelection(iframe);

	assert.ok(sel.rangeCount, 'At elast 1 range exists');

	var range  = sel.getRangeAt(0);
	var cursor = body.ownerDocument.createTextNode('|');

	range.insertNode(cursor);

	var expected = '<p>The quick brown fox jumps ' +
		'over the lazy dog.|<br /></p>';

	assert.nodesEqual(body.firstChild, utils.htmlToNode(expected));
});


QUnit.test('readOnly()', function (assert) {
	var body = sceditor.getBody();

	assert.strictEqual(sceditor.readOnly(), false);
	assert.strictEqual(body.contentEditable, 'true');

	assert.strictEqual(sceditor.readOnly(true), sceditor);
	assert.strictEqual(sceditor.readOnly(), true);
	assert.strictEqual(body.contentEditable, 'false');

	assert.strictEqual(sceditor.readOnly(false), sceditor);
	assert.strictEqual(sceditor.readOnly(), false);
	assert.strictEqual(body.contentEditable, 'true');
});


QUnit.test('rtl()', function (assert) {
	var body = sceditor.getBody();

	assert.strictEqual(sceditor.rtl(), false);

	assert.strictEqual(sceditor.rtl(true), sceditor);
	assert.strictEqual(sceditor.rtl(), true);
	assert.strictEqual(body.dir, 'rtl');

	assert.strictEqual(sceditor.rtl(false), sceditor);
	assert.strictEqual(sceditor.rtl(), false);
	assert.strictEqual(body.dir, 'ltr');
});


QUnit.test('width()', function (assert) {
	var $container = $fixture.children('.sceditor-container');

	assert.equal(sceditor.width(), $container.width());
	assert.equal(sceditor.width('200'), sceditor);

	assert.equal(sceditor.width(), $container.width());
	assert.close($container.width(), 200, 1);
});


QUnit.test('height()', function (assert) {
	var $container = $fixture.children('.sceditor-container');

	assert.equal(sceditor.height(), $container.height());
	assert.equal(sceditor.height('200'), sceditor);

	assert.equal(sceditor.height(), $container.height());
	assert.close($container.height(), 200, 1);
});


QUnit.test('maximize()', function (assert) {
	var $container = $fixture.children('.sceditor-container');

	assert.strictEqual(sceditor.maximize(), false);
	assert.equal(sceditor.maximize(true), sceditor);
	assert.strictEqual(sceditor.maximize(), true);

	assert.close($container.width(), $(window).width(), 1);
	assert.close($container.height(), $(window).height(), 1);

	assert.equal(sceditor.maximize(false), sceditor);
	assert.strictEqual(sceditor.maximize(), false);
});


QUnit.test('destroy()', function (assert) {
	sceditor.destroy();

	assert.equal($fixture.children('.sceditor-container').length, 0);
	assert.ok($textarea.is(':visible'));

	// Call again to make sure no exception is thrown
	sceditor.destroy();
	sceditor.destroy();

	reloadEditor();
});

QUnit.test('destroy() - Unbind updateOriginal', function (assert) {
	var textarea = document.createElement('textarea');
	var submit = document.createElement('input');
	submit.type = 'submit';

	var form = document.createElement('form');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
	});
	form.appendChild(submit);
	form.appendChild(textarea);

	$fixture.append(form);

	var sceditor = new SCEditor(textarea, { format: 'bbcode' });
	sceditor.val('testing');
	submit.click();

	assert.equal(textarea.value, 'testing');

	sceditor.val('testing 123');
	sceditor.destroy();
	submit.click();

	assert.equal(textarea.value, 'testing');
	form.parentNode.removeChild(form);
});


QUnit.test('wysiwygEditorInsertHtml()', function (assert) {
	if (IS_PHANTOMJS) {
		return assert.expect(0);
	}

	sceditor.focus();
	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var range  = rangy.createRange(body.ownerDocument);
	var sel    = rangy.getIframeSelection(iframe);

	range.setStart(body.firstChild.firstChild, 10);
	range.setEnd(body.firstChild.firstChild, 10);
	sel.setSingleRange(range);

	sceditor.wysiwygEditorInsertHtml('<b>test</b>');

	// This is the easiest way to make sure the cursor is still in the
	// correct position.
	sceditor.wysiwygEditorInsertHtml('|');

	assert.nodesEqual(body.firstChild, utils.htmlToNode(
		'<p>The quick <b>test|</b>brown fox ' +
			'jumps over the lazy dog.<br /></p>'
	));
});

QUnit.test('wysiwygEditorInsertHtml() - Start and end', function (assert) {
	if (IS_PHANTOMJS) {
		return assert.expect(0);
	}

	sceditor.focus();
	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var range  = rangy.createRange(body.ownerDocument);
	var sel    = rangy.getIframeSelection(iframe);

	range.setStart(body.firstChild.firstChild, 10);
	range.setEnd(body.firstChild.firstChild, 15);
	sel.setSingleRange(range);

	sceditor.wysiwygEditorInsertHtml('<b>', '</b>');

	// This is the easiest way to make sure the cursor is still in the
	// correct position.
	sceditor.wysiwygEditorInsertHtml('|');

	assert.nodesEqual(body.firstChild, utils.htmlToNode(
		'<p>The quick <b>brown|</b> fox ' +
			'jumps over the lazy dog.<br /></p>'
	));
});


QUnit.test('wysiwygEditorInsertText() - Start and end', function (assert) {
	if (IS_PHANTOMJS) {
		return assert.expect(0);
	}

	sceditor.focus();
	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var range  = rangy.createRange(body.ownerDocument);
	var sel    = rangy.getIframeSelection(iframe);

	range.setStart(body.firstChild.firstChild, 10);
	range.setEnd(body.firstChild.firstChild, 10);
	sel.setSingleRange(range);

	sceditor.wysiwygEditorInsertText('<&>test');

	// This is the easiest way to make sure the cursor is still in the
	// correct position.
	sceditor.wysiwygEditorInsertText('|');

	assert.nodesEqual(body.firstChild, utils.htmlToNode(
		'<p>The quick &lt;&amp;&gt;test|brown fox ' +
			'jumps over the lazy dog.<br /></p>'
	));
});

QUnit.test('wysiwygEditorInsertText() - Start and end', function (assert) {
	if (IS_PHANTOMJS) {
		return assert.expect(0);
	}

	var iframe = sceditor.getContentAreaContainer();
	var body   = sceditor.getBody();
	var range  = rangy.createRange(body.ownerDocument);
	var sel    = rangy.getIframeSelection(iframe);

	range.setStart(body.firstChild.firstChild, 10);
	range.setEnd(body.firstChild.firstChild, 15);
	sel.setSingleRange(range);

	sceditor.wysiwygEditorInsertText('<b>', '</b>');

	// This is the easiest way to make sure the cursor is still in the
	// correct position.
	sceditor.wysiwygEditorInsertText('|');

	assert.nodesEqual(body.firstChild, utils.htmlToNode(
		'<p>The quick &lt;b&gt;brown&lt;/b&gt;| fox ' +
			'jumps over the lazy dog.<br /></p>'
	));
});


QUnit.test('wysiwygEditorInsertHtml()', function (assert) {
	var sourceEditor = $('.sceditor-container textarea').get(0);

	sceditor.sourceMode(true);
	sceditor.val('<p>The quick brown fox jumps ' +
		'over the lazy dog.<br /></p>');
	sceditor.sourceEditorCaret({
		start: 13,
		end: 13
	});
	sceditor.sourceEditorInsertText('light-');
	sceditor.sourceEditorInsertText('|');

	assert.htmlEqual(
		sourceEditor.value,
		'<p>The quick light-|brown fox jumps over the lazy dog.<br /></p>'
	);
});

QUnit.test('sourceEditorInsertText() - Start and end', function (assert) {
	sceditor.sourceMode(true);
	sceditor.val('<p>The quick brown fox jumps ' +
		'over the lazy dog.<br /></p>');
	sceditor.sourceEditorCaret({
		start: 13,
		end: 18
	});
	sceditor.sourceEditorInsertText('"', '"');
	sceditor.sourceEditorInsertText('|');

	assert.htmlEqual(
		sceditor.val(),
		'<p>The quick "brown|" fox jumps over the lazy dog.<br /></p>'
	);
});


QUnit.test('getWysiwygEditorValue() - Filter', function (assert) {
	sceditor.getRangeHelper().clear();

	assert.htmlEqual(
		sceditor.getWysiwygEditorValue(),
		'<p>The quick brown fox jumps over the lazy dog.<br /></p>'
	);

	assert.htmlEqual(
		sceditor.getWysiwygEditorValue(true),
		'<p>The quick brown fox jumps over the lazy dog.<br /></p>'
	);


	reloadEditor({
		format: 'test'
	});

	sceditor.getRangeHelper().clear();

	assert.htmlEqual(
		sceditor.getWysiwygEditorValue(false),
		'<p><b>test wysiwyg</b></p>'
	);

	assert.htmlEqual(
		sceditor.getWysiwygEditorValue(true),
		'<p><b>test source</b></p>'
	);
});


QUnit.test('getSourceEditorValue()', function (assert) {
	sceditor.getRangeHelper().clear();
	sceditor.sourceMode(true);
	sceditor.val('<p>The quick brown fox jumps ' +
		'over the lazy dog.<br /></p>');

	assert.htmlEqual(
		sceditor.getSourceEditorValue(true),
		'<p>The quick brown fox jumps over the lazy dog.<br /></p>'
	);

	assert.htmlEqual(
		sceditor.getSourceEditorValue(false),
		'<p>The quick brown fox jumps over the lazy dog.<br /></p>'
	);
});

QUnit.test('getSourceEditorValue() - Uses format', function (assert) {
	reloadEditor({
		format: 'test'
	});

	sceditor.getRangeHelper().clear();
	sceditor.sourceMode(true);
	assert.htmlEqual(
		sceditor.getSourceEditorValue(false),
		'<p><b>test source</b></p>'
	);

	assert.htmlEqual(
		sceditor.getSourceEditorValue(true),
		'<p><b>test wysiwyg</b></p>'
	);
});


QUnit.test('updateOriginal()', function (assert) {
	var textarea = $('textarea').get(1);
	var body = sceditor.getBody();

	body.innerHTML = '<div>text 1234...</div>';

	sceditor.getRangeHelper().clear();
	sceditor.updateOriginal();

	assert.htmlEqual(textarea.value, '<div>text 1234...</div>');
});


QUnit.test('emoticons()', function (assert) {
	var $body = $(sceditor.getBody());

	sceditor.emoticons(true);
	sceditor.val('<p>Testing :) :( 123...</p>');

	assert.equal($body.find('img[data-sceditor-emoticon]').length, 2);

	sceditor.emoticons(false);

	assert.equal($body.find('img[data-sceditor-emoticon]').length, 0);
});

QUnit.test('emoticons() - Longest first', function (assert) {
	reloadEditor({
		emoticons: {
			dropdown: {
				'>:(': 'emoticons/angry.png',
				':(': 'emoticons/sad.png'
			}
		}
	});

	var $body = $(sceditor.getBody());

	sceditor.emoticons(true);
	sceditor.val('<p>Testing :( >:( </p>');

	assert.equal($body.find('img[data-sceditor-emoticon=">:("]').length, 1);
	assert.equal($body.find('img[data-sceditor-emoticon=":("]').length, 1);
});

QUnit.test('Insert image XSS', function (assert) {
	var done = assert.async();

	reloadEditor({});

	var called = false;
	sceditor.getBody().xss = function () {
		called = true;
	};

	var button = document.getElementsByClassName('sceditor-button-image')[0];
	defaultCommands.image.exec.call(sceditor, button);

	var dropdown = document.getElementsByClassName('sceditor-insertimage')[0];
	var input = document.getElementById('image');
	var insertButton = dropdown.getElementsByClassName('button')[0];

	input.value = '<img src="http://url.to.file.which/not.exist" onerror=body.xss();>';
	insertButton.click();

	sceditor.getBody().addEventListener('error', function () {
		setTimeout(function () {
			assert.notOk(called);
			done();
		}, 1);
	}, true);
});

QUnit.test('Insert HTML filter JS', function (assert) {
	var done = assert.async();

	reloadEditor({
		format: 'bbcode'
	});

	var called = false;
	sceditor.getBody().xss = function () {
		called = true;
	};
	sceditor.wysiwygEditorInsertHtml('<img src="http://url.to.file.which/not.exist" onerror=body.xss();>');
	sceditor.getBody().addEventListener('error', function () {
		setTimeout(function () {
			assert.notOk(called);
			done();
		}, 1);
	}, true);
});


QUnit.test('Allow target=blank links', function (assert) {
	reloadEditor({
		format: 'xhtml'
	});

	sceditor.val(
		'<a href="#" target="_blank">blank</a>' +
		'<a href="#" rel="  noopener" target="_blank">safe</a>' +
		'<a href="#" rel="noreferrer" target="_blank">referer</a>' +
		'<a href="#" rel="noreferrernoopener" target="_blank">invalid noopener</a>' +
		'<a href="#" target="blank">removed</a>' +
		'<img src="removed.jpg" target="_blank" />'
	);
	assert.htmlEqual(sceditor.val(), '<p>\n	' +
		'<a href=\"#\" rel=\"noopener\" target=\"_blank\">blank</a>' +
		'<a href=\"#\" rel=\"noopener\" target=\"_blank\">safe</a>' +
		'<a href=\"#\" rel=\"noopener noreferrer\" target=\"_blank\">referer</a>' +
		'<a href=\"#\" rel=\"noopener noreferrernoopener\" target=\"_blank\">invalid noopener</a>' +
		'<a href="#">removed</a>' +
		'<img src=\"removed.jpg\" />\n' +
	'</p>');
});


QUnit.test('Do not wrap whitespace text nodes', function (assert) {
	var body = sceditor.getBody();
	var rangeHelper = sceditor.getRangeHelper();
	var testHtml = '<p>test</p>     ';

	sceditor.focus();

	body.innerHTML = testHtml;

	var range = rangeHelper.cloneSelected();
	range.setStartAfter(body.firstChild.firstChild);
	range.collapse(true);
	rangeHelper.selectRange(range);
	body.dispatchEvent(new Event('selectionchange'));

	var range = rangeHelper.cloneSelected();
	range.setStart(body.lastChild, 1);
	range.collapse(true);
	rangeHelper.selectRange(range);
	body.dispatchEvent(new Event('selectionchange'));

	assert.htmlEqual(body.innerHTML, testHtml);
});
