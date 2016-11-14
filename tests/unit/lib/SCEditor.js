define([
	'lib/SCEditor',
	'lib/defaultCommands',
	'lib/defaultOptions',
	'lib/browser',
	'tests/unit/utils',
	'rangy'
], function (SCEditor, defaultCommands, defaultOptions, browser, utils, rangy) {
	'use strict';

	// The selection based tests fail in phantom although they do work in
	// Chrome and Safari which are both based on Webkit. Should investigate
	// further but looks like phantomJS but rather than an editor but.
	// Might be an issue with phantomJS and iframes that have  selections.
	var IS_PHANTOMJS = navigator.userAgent.indexOf('PhantomJS') > -1;

	var $textarea;
	var sceditor;
	var $fixture = $('#qunit-module-fixture');

	var testPlugin = function () {
		this.signalToWysiwyg = function () {
			return '<b>test wysiwyg</b>';
		};

		this.signalToSource = function () {
			return '<b>test source</b>';
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


	module('lib/SCEditor', {
		moduleSetup: function () {
			SCEditor.commands       = defaultCommands;
			SCEditor.defaultOptions = defaultOptions;

			SCEditor.plugins.test = testPlugin;

			defaultOptions.style = '../../src/jquery.sceditor.default.css';
			defaultOptions.emoticonsRoot    = '../../';
			defaultOptions.emoticonsEnabled = false;

			reloadEditor();
		},
		moduleTeardown: function () {
			defaultOptions.style = 'jquery.sceditor.default.css';
			defaultOptions.emoticonsRoot    = '';
			defaultOptions.emoticonsEnabled = true;

			delete SCEditor.plugins.test;

			if (sceditor) {
				sceditor.destroy();
			}
		},
		setup: function () {
			if (reloadEditor.isCustomConfig) {
				reloadEditor();
			}

			sceditor.sourceMode(false);

			sceditor.val('<p>The quick brown fox jumps over ' +
				'the lazy dog.<br /></p>', false);
		}
	});


	test('data(\'sceditor\')', function (assert) {
		assert.ok($textarea.data('sceditor') === sceditor);
	});


	test('autofocus', function (assert) {
		if (IS_PHANTOMJS) {
			return expect(0);
		}

		reloadEditor({
			autofocus: true,
			autofocusEnd: false
		});

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
		var sel    = rangy.getIframeSelection(iframe);
		var range  = sel.getRangeAt(0);
		var cursor = body.ownerDocument.createTextNode('|');

		range.insertNode(cursor);

		assert.nodesEqual(body.firstChild, utils.htmlToNode(
			'<p>|The quick brown fox jumps over the lazy dog.<br /></p>'
		));
	});


	test('autofocusEnd', function (assert) {
		reloadEditor({
			autofocus: true,
			autofocusEnd: true
		});

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
		var sel    = rangy.getIframeSelection(iframe);
		var range  = sel.getRangeAt(0);
		var cursor = body.ownerDocument.createTextNode('|');

		range.insertNode(cursor);

		var expected = '<p>The quick brown fox jumps ' +
			'over the lazy dog.|<br /></p>';

		// IE treats <br />'s as newlines even at the end of blocks so
		// if it is a BR, the cursor should be placed after the
		if (browser.ie && browser.ie < 11) {
			expected = '<p>The quick brown fox jumps ' +
			'over the lazy dog.<br />|</p>';
		}

		assert.nodesEqual(body.firstChild, utils.htmlToNode(expected));
	});


	test('readOnly()', function (assert) {
		var body = sceditor.getBody().get(0);

		assert.strictEqual(sceditor.readOnly(), false);
		assert.strictEqual(body.contentEditable, 'true');

		assert.strictEqual(sceditor.readOnly(true), sceditor);
		assert.strictEqual(sceditor.readOnly(), true);
		assert.strictEqual(body.contentEditable, 'false');

		assert.strictEqual(sceditor.readOnly(false), sceditor);
		assert.strictEqual(sceditor.readOnly(), false);
		assert.strictEqual(body.contentEditable, 'true');
	});


	test('rtl()', function (assert) {
		var body = sceditor.getBody().get(0);

		assert.strictEqual(sceditor.rtl(), false);

		assert.strictEqual(sceditor.rtl(true), sceditor);
		assert.strictEqual(sceditor.rtl(), true);
		assert.strictEqual(body.dir, 'rtl');

		assert.strictEqual(sceditor.rtl(false), sceditor);
		assert.strictEqual(sceditor.rtl(), false);
		assert.strictEqual(body.dir, 'ltr');
	});


	test('width()', function (assert) {
		var $container = $fixture.children('.sceditor-container');

		assert.equal(sceditor.width(), $container.width());
		assert.equal(sceditor.width('200'), sceditor);

		assert.equal(sceditor.width(), $container.width());
		assert.close($container.width(), 200, 1);
	});


	test('height()', function (assert) {
		var $container = $fixture.children('.sceditor-container');

		assert.equal(sceditor.height(), $container.height());
		assert.equal(sceditor.height('200'), sceditor);

		assert.equal(sceditor.height(), $container.height());
		assert.close($container.height(), 200, 1);
	});


	test('maximize()', function (assert) {
		var $container = $fixture.children('.sceditor-container');

		assert.strictEqual(sceditor.maximize(), false);
		assert.equal(sceditor.maximize(true), sceditor);
		assert.strictEqual(sceditor.maximize(), true);

		assert.close($container.width(), $(window).width(), 1);
		assert.close($container.height(), $(window).height(), 1);

		assert.equal(sceditor.maximize(false), sceditor);
		assert.strictEqual(sceditor.maximize(), false);
	});


	test('destroy()', function (assert) {
		sceditor.destroy();

		assert.equal($fixture.children('.sceditor-container').length, 0);
		assert.ok($textarea.is(':visible'));

		// Call again to make sure no exception is thrown
		sceditor.destroy();
		sceditor.destroy();

		reloadEditor();
	});


	test('wysiwygEditorInsertHtml()', function (assert) {
		if (IS_PHANTOMJS) {
			return expect(0);
		}

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
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

	test('wysiwygEditorInsertHtml() - Start and end', function (assert) {
		if (IS_PHANTOMJS) {
			return expect(0);
		}

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
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


	test('wysiwygEditorInsertText() - Start and end', function (assert) {
		if (IS_PHANTOMJS) {
			return expect(0);
		}

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
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

	test('wysiwygEditorInsertText() - Start and end', function (assert) {
		if (IS_PHANTOMJS) {
			return expect(0);
		}

		var iframe = sceditor.getContentAreaContainer().get(0);
		var body   = sceditor.getBody().get(0);
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


	test('sourceEditorInsertText()', function (assert) {
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

	test('sourceEditorInsertText() - Start and end', function (assert) {
		var sourceEditor = $('.sceditor-container textarea').get(0);

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
			sourceEditor.value,
			'<p>The quick "brown|" fox jumps over the lazy dog.<br /></p>'
		);
	});


	test('getWysiwygEditorValue() - Filter', function (assert) {
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
			plugins: 'test'
		});

		sceditor.getRangeHelper().clear();

		assert.htmlEqual(
			sceditor.getWysiwygEditorValue(false),
			'<b>test wysiwyg</b>'
		);

		assert.htmlEqual(
			sceditor.getWysiwygEditorValue(true),
			'<b>test source</b>'
		);
	});


	test('getSourceEditorValue()', function (assert) {
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


		reloadEditor({
			plugins: 'test'
		});

		sceditor.getRangeHelper().clear();
		sceditor.sourceMode(true);
		assert.htmlEqual(
			sceditor.getSourceEditorValue(false),
			'<b>test source</b>'
		);

		assert.htmlEqual(
			sceditor.getSourceEditorValue(true),
			'<b>test wysiwyg</b>'
		);
	});


	test('updateOriginal()', function (assert) {
		var textarea = $('textarea').first().get(0);
		var body = sceditor.getBody().get(0);

		body.innerHTML = '<div>text 1234...</div>';

		sceditor.getRangeHelper().clear();
		sceditor.updateOriginal();

		assert.htmlEqual(textarea.value, '<div>text 1234...</div>');
	});


	test('emoticons()', function (assert) {
		var $body = sceditor.getBody();

		sceditor.emoticons(true);
		sceditor.val('<p>Testing :) :( 123...</p>');

		assert.equal($body.find('img[data-sceditor-emoticon]').length, 2);

		sceditor.emoticons(false);

		assert.equal($body.find('img[data-sceditor-emoticon]').length, 0);
	});

	test('emoticons() - Longest first', function (assert) {
		reloadEditor({
			emoticons: {
				dropdown: {
					'>:(': 'emoticons/angry.png',
					':(': 'emoticons/sad.png'
				}
			}
		});

		var $body = sceditor.getBody();

		sceditor.emoticons(true);
		sceditor.val('<p>Testing :( >:( </p>');

		assert.equal($body.find('img[data-sceditor-emoticon=">:("]').length, 1);
		assert.equal($body.find('img[data-sceditor-emoticon=":("]').length, 1);
	});
});
