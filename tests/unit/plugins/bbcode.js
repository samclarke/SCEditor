define([
	'lib/SCEditor',
	'tests/unit/utils',
	'lib/browser',
	'plugins/bbcode'
], function (SCEditor, utils, browser) {
	'use strict';

	// In IE < 11 a BR at the end of a block level element
	// causes a line break. In all other browsers it's collapsed.
	var IE_BR_FIX = browser.ie && browser.ie < 11;
	var IE_BR_STR = IE_BR_FIX ? '' : '<br />';


	module('plugins/bbcode', {
		setup: function () {
			this.mockEditor = {
				opts: $.extend({}, SCEditor.defaultOptions)
			};

			this.plugin = new SCEditor.plugins.bbcode();
			this.plugin.init.call(this.mockEditor);

			this.htmlToBBCode = function (html) {
				var $html = $(utils.htmlToDiv(html));

				return this.plugin.signalToSource('', $html);
			};
		}
	});


	test('To BBCode method', function (assert) {
		assert.equal(
			this.mockEditor.toBBCode(utils.htmlToDiv('<b>test</b>')),
			'[b]test[/b]',
			'DOM test'
		);

		assert.equal(
			this.mockEditor.toBBCode($(utils.htmlToDiv('<b>test</b>'))),
			'[b]test[/b]',
			'jQuery DOM test'
		);

		assert.equal(
			this.mockEditor.toBBCode('<b>test</b>'),
			'[b]test[/b]',
			'HTML String test'
		);
	});


	test('From BBCode method', function (assert) {
		assert.htmlEqual(
			this.mockEditor.fromBBCode('[b]test[/b]'),
			'<div><strong>test</strong></div>\n'
		);
	});

	test('From BBCode method as fragment', function (assert) {
		assert.htmlEqual(
			this.mockEditor.fromBBCode('[b]test[/b]', true),
			'<strong>test</strong>',
			'As fragment'
		);
	});


	test('BBcode to HTML trim', function (assert) {
		this.mockEditor = {
			opts: $.extend({}, $.sceditor.defaultOptions, { bbcodeTrim: true })
		};

		this.plugin = new SCEditor.plugins.bbcode();
		this.plugin.init.call(this.mockEditor);


		assert.htmlEqual(
			this.plugin.signalToWysiwyg(
				'\n\n[quote]test[/quote]\n\n'
			),
			'<blockquote>test' + IE_BR_STR + '</blockquote>',
			'Block level'
		);

		assert.htmlEqual(
			this.plugin.signalToWysiwyg(
				'\n\n[b]test[/b]\n\n'
			),
			'<div><strong>test</strong></div>\n',
			'Inline'
		);
	});


	test('HTML to BBCode trim', function (assert) {
		this.mockEditor = {
			opts: $.extend({}, $.sceditor.defaultOptions, { bbcodeTrim: true })
		};

		this.plugin = new SCEditor.plugins.bbcode();
		this.plugin.init.call(this.mockEditor);

		this.htmlToBBCode = function (html) {
			var $html = $(utils.htmlToDiv(html));

			return this.plugin.signalToSource('', $html);
		};


		assert.equal(
			this.htmlToBBCode('<div><br /><br /></div>' +
				'<blockquote>test</blockquote><div><br /><br /></div>'),
			'[quote]test[/quote]',
			'Block level'
		);

		assert.equal(
			this.htmlToBBCode('<div><br /><br /><strong>test</strong>' +
				'<br /><br /><br /></div>'),
			'[b]test[/b]',
			'Inline'
		);
	});


	module('plugins/bbcode - HTML to BBCode', {
		setup: function () {
			this.mockEditor = {
				opts: $.extend({}, SCEditor.defaultOptions)
			};

			this.plugin = new SCEditor.plugins.bbcode();
			this.plugin.init.call(this.mockEditor);

			this.htmlToBBCode = function (html) {
				var $html = $(utils.htmlToDiv(html));

				return this.plugin.signalToSource('', $html);
			};
		}
	});


	test('Remove empty', function (assert) {
		assert.equal(
			this.htmlToBBCode('<b>' + IE_BR_STR + '</b>'),
			'',
			'Empty tag with newline'
		);

		assert.equal(
			this.htmlToBBCode('<b></b>'),
			'',
			'Empty tag'
		);

		assert.equal(
			this.htmlToBBCode('<b><span>' + IE_BR_STR + '</span></b>'),
			'',
			'Empty tag with only whitespace content'
		);

		assert.equal(
			this.htmlToBBCode(
				'<b><span><span><span></span><span></span></span>   </span></b>'
			),
			' ',
			'Empty tag with only whitespace content'
		);

		assert.equal(
			this.htmlToBBCode('test<b><span><br /></span></b>test'),
			'test\ntest',
			'Empty tag with only whitespace between words'
		);

		assert.equal(
			this.htmlToBBCode('test<b><i> </i></b>test'),
			'test test',
			'Nested empty tags with only whitespace between words'
		);
	});


	test('Should not remove whitespace in code tags', function (assert) {
		var result = this.htmlToBBCode(
			'<code><pre>Some    White \n   \n   space</pre></code>'
		);

		assert.equal(result, '[code]Some    White \n   \n   space[/code]\n');
	});

	test('Should remove whitespace in non-code tags', function (assert) {
		var result = this.htmlToBBCode(
			'     <div>   lots   </div>   \n of   junk   \n\n\n        \n  j'
		);

		assert.equal(result, 'lots \nof junk j');
	});


	test('New line handling', function (assert) {
		assert.equal(
			this.htmlToBBCode(
				'textnode' +
				'<div>new line before and after </div>' +
				'textnode'
			),
			'textnode\nnew line before and after \ntextnode',
			'Textnode before and after block level element'
		);

		assert.equal(
			this.htmlToBBCode(
				'textnode <span>no new line before and after </span>textnode'
			),
			'textnode no new line before and after textnode',
			'Textnode before and after inline element'
		);

		assert.equal(
			this.htmlToBBCode(
				'test<div>' +
					'<strong><em>test' + IE_BR_STR + '</em></strong>' +
				'</div>test'
			),
			'test\n[b][i]test[/i][/b]\ntest',
			'Block inside inline that is the last child of a block'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div>text<div>text</div>text</div>'
			),
			'text\ntext\ntext',
			'Nested divs'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div><span>text</span><div>text</div><span>text</span></div>'
			),
			'text\ntext\ntext',
			'Nested div with span siblings'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div>' +
					'<div>text</div>' +
					'<div>text</div>' +
					'<div>text</div>' +
				'</div>'
			),
			'text\ntext\ntext',
			'Nested div with div siblings'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div>' +
					'<div>text</div>' +
					'<div>' + IE_BR_STR + '</div>' +
					'<div>text</div>' +
				'</div>'
			),
			'text\n\ntext',
			'Nested div with br and div siblings'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div>text</div>' +
				'<div>' + IE_BR_STR + '</div>' +
				'<ul><li>text</li></ul>'
			),
			'text\n\n[ul]\n[li]text[/li]\n[/ul]\n',
			'Div siblings with a list'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div>text</div>' +
				'<div>' + IE_BR_STR + '</div>' +
				'<div>' + IE_BR_STR + '</div>' +
				'<ul><li>text</li></ul>'
			),
			'text\n\n\n[ul]\n[li]text[/li]\n[/ul]\n',
			'Multiple div siblings with a list'
		);

		assert.equal(
			this.htmlToBBCode('<div>text<br />text</div>'),
			'text\ntext',
			'BR tag'
		);

		assert.equal(
			this.htmlToBBCode('<div>text<br />text' + IE_BR_STR + '</div>'),
			'text\ntext',
			'Collapsed end BR tag'
		);

		assert.equal(
			this.htmlToBBCode(
				'<ul><li>newline<br />' + IE_BR_STR + '</li></ul>'
			),
			'[ul]\n[li]newline\n[/li]\n[/ul]\n',
			'List item last child block level'
		);

		assert.equal(
			this.htmlToBBCode(
				'<div><code>newline' + IE_BR_STR + '</code></div>' +
				'<div>newline</div>'
			),
			'[code]newline[/code]\nnewline',
			'Block level last child'
		);
	});


	test('Bold', function (assert) {
		assert.equal(
			this.htmlToBBCode('<span style="font-weight: bold">test</span>'),
			'[b]test[/b]',
			'CSS bold'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-weight: 800">test</span>'),
			'[b]test[/b]',
			'CSS bold number'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-weight: normal">test</span>'),
			'test',
			'CSS not bold'
		);

		assert.equal(
			this.htmlToBBCode('<b>test</b>'),
			'[b]test[/b]',
			'B tag'
		);

		assert.equal(
			this.htmlToBBCode('<strong>test</strong>'),
			'[b]test[/b]',
			'Strong tag'
		);
	});


	test('Italic', function (assert) {
		assert.equal(
			this.htmlToBBCode('<span style="font-style: italic">test</span>'),
			'[i]test[/i]',
			'CSS italic'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-style: oblique">test</span>'),
			'[i]test[/i]',
			'CSS oblique'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-style: normal">test</span>'),
			'test',
			'CSS normal'
		);

		assert.equal(
			this.htmlToBBCode('<em>test</em>'),
			'[i]test[/i]',
			'Em tag'
		);

		assert.equal(
			this.htmlToBBCode('<i>test</i>'),
			'[i]test[/i]',
			'I tag'
		);
	});


	test('Underline', function (assert) {
		assert.equal(
			this.htmlToBBCode(
				'<span style="text-decoration: underline">test</span>'
			),
			'[u]test[/u]',
			'CSS underline'
		);

		assert.equal(
			this.htmlToBBCode(
				'<span style="text-decoration: normal">test</span>'
			),
			'test',
			'CSS normal'
		);

		assert.equal(
			this.htmlToBBCode('<u>test</u>'),
			'[u]test[/u]',
			'U tag'
		);
	});


	test('Strikethrough', function (assert) {
		assert.equal(
			this.htmlToBBCode(
				'<span style="text-decoration: line-through">test</span>'
			),
			'[s]test[/s]',
			'CSS line-through'
		);

		assert.equal(
			this.htmlToBBCode(
				'<span style="text-decoration: normal">test</span>'
			),
			'test',
			'CSS normal'
		);

		assert.equal(
			this.htmlToBBCode('<s>test</s>'),
			'[s]test[/s]',
			'S tag'
		);

		assert.equal(
			this.htmlToBBCode('<strike>test</strike>'),
			'[s]test[/s]',
			'strike tag'
		);
	});


	test('Subscript', function (assert) {
		assert.equal(
			this.htmlToBBCode('<sub>test</sub>'),
			'[sub]test[/sub]',
			'Sub tag'
		);
	});


	test('Superscript', function (assert) {
		assert.equal(
			this.htmlToBBCode('<sup>test</sup>'),
			'[sup]test[/sup]',
			'Sup tag'
		);
	});


	test('Font face', function (assert) {
		assert.equal(
			this.htmlToBBCode('<span style="font-family: Arial">test</span>'),
			'[font=Arial]test[/font]',
			'CSS'
		);

		assert.equal(
			this.htmlToBBCode(
				'<span  style="font-family: Arial Black">test</span>'
			),
			'[font=Arial Black]test[/font]',
			'CSS font with space in name'
		);

		assert.equal(
			this.htmlToBBCode(
				'<span  style="font-family: \'Arial Black\'">test</span>'
			),
			'[font=Arial Black]test[/font]',
			'CSS font with space in name wrapped in quotes'
		);

		assert.equal(
			this.htmlToBBCode('<font face="Arial">test</font>'),
			'[font=Arial]test[/font]',
			'Font tag face attribute'
		);

		assert.equal(
			this.htmlToBBCode('<font face="Arial Black">test</font>'),
			'[font=Arial Black]test[/font]',
			'Font tag face attribute with space in name'
		);

		assert.equal(
			this.htmlToBBCode('<font face="\'Arial Black\'">test</font>'),
			'[font=Arial Black]test[/font]',
			'Font tag face attribute with space in name wrapped in quotes'
		);

		assert.equal(
			utils.stripWhiteSpace(this.htmlToBBCode(
				'<span style="font-family: \'Arial Black\', Arial">test</span>'
			)).replace(/"/g, '\''),
			utils.stripWhiteSpace(
				'[font=\'Arial Black\',Arial]test[/font]'
			).replace(/"/g, '\''),
			'Font with space and another without quotes'
		);
	});


	test('Size', function (assert) {
		assert.equal(
			this.htmlToBBCode('<span style="font-size: 11px">test</span>'),
			'[size=1]test[/size]',
			'CSS px'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-size: 1100px">test</span>'),
			'[size=7]test[/size]',
			'CSS px too large'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-size: 0.5em">test</span>'),
			'[size=1]test[/size]',
			'CSS em'
		);

		assert.equal(
			this.htmlToBBCode('<span style="font-size: 50%">test</span>'),
			'[size=1]test[/size]',
			'CSS percent'
		);

		assert.equal(
			this.htmlToBBCode('<font size="1">test</font>'),
			'[size=1]test[/size]',
			'Font tag size attribute'
		);
	});


	test('colour', function (assert) {
		assert.equal(
			this.htmlToBBCode('<span style="color: #ffffff">test</span>'),
			'[color=#ffffff]test[/color]',
			'CSS normal'
		);

		assert.equal(
			this.htmlToBBCode('<span style="color: #fff">test</span>'),
			'[color=#ffffff]test[/color]',
			'CSS short hand'
		);

		assert.equal(
			this.htmlToBBCode('<span style="color: rgb(255,255,255)">test</span>'),
			'[color=#ffffff]test[/color]',
			'CSS RGB'
		);

		assert.equal(
			this.htmlToBBCode('<font color="#000">test</font>'),
			'[color=#000000]test[/color]',
			'Font tag color attribute short'
		);

		assert.equal(
			this.htmlToBBCode('<font color="#000000">test</font>'),
			'[color=#000000]test[/color]',
			'Font tag color attribute normal'
		);

		assert.equal(
			this.htmlToBBCode('<font color="rgb(0,0,0)">test</font>'),
			'[color=#000000]test[/color]',
			'Font tag color attribute rgb'
		);
	});


	test('List', function (assert) {
		assert.equal(
			this.htmlToBBCode('<ul><li>test' + IE_BR_STR + '</li></ul>'),
			'[ul]\n[li]test[/li]\n[/ul]\n',
			'UL tag'
		);

		assert.equal(
			this.htmlToBBCode('<ol><li>test' + IE_BR_STR + '</li></ol>'),
			'[ol]\n[li]test[/li]\n[/ol]\n',
			'OL tag'
		);

		assert.equal(
			this.htmlToBBCode(
				'<ul>' +
					'<li>test' +
						'<ul>' +
							'<li>sub' + IE_BR_STR + '</li>' +
						'</ul>' +
					'</li>' +
				'</ul>'
			),
			'[ul]\n[li]test\n[ul]\n[li]sub[/li]\n[/ul]\n[/li]\n[/ul]\n',
			'Nested UL tag'
		);
	});


	test('Table', function (assert) {
		assert.equal(
			this.htmlToBBCode(
				'<table>' +
					'<tr><th>test</th></tr>' +
					'<tr><td>data1</td></tr>' +
				'</table>'
			),
			'[table]' +
				'[tr][th]test[/th]\n[/tr]\n' +
				'[tr][td]data1[/td]\n[/tr]\n' +
			'[/table]\n'
		);
	});


	test('Emoticons', function (assert) {
		assert.equal(
			this.htmlToBBCode('<img data-sceditor-emoticon=":)"" />'),
			':)',
			'Img tag'
		);
	});


	test('Horizontal rule', function (assert) {
		assert.equal(
			this.htmlToBBCode('<hr />'),
			'[hr]\n',
			'HR tag'
		);
	});


	test('Image', function (assert) {
		assert.equal(
			this.htmlToBBCode(
				'<img width=10 height=10 src="http://example.com/test.png" />'
			),
			'[img=10x10]http://example.com/test.png[/img]',
			'Image tag with width and height attributes'
		);

		assert.equal(
			this.htmlToBBCode(
				'<img src="http://www.sceditor.com/emoticons/smile.png" />'
			),
			'[img]http://www.sceditor.com/emoticons/smile.png[/img]',
			'Image no attributes'
		);

		assert.equal(
			this.htmlToBBCode(
				'<img src="http://www.sceditor.com/404.png" width="200" />'
			),
			'[img]http://www.sceditor.com/404.png[/img]',
			'Non-loaded image with width attribute'
		);
	});

	asyncTest('Image dimensions when loaded', function (assert) {
		var finished = false;
		var plugin = this.plugin;
		var div = utils.htmlToDiv(
			'<img src="http://www.sceditor.com/emoticons/smile.png" ' +
				'width="200" />'
		);

		var loaded = function () {
			if (finished) {
				return;
			}

			// IE < 9 fires loaded before the image is complete
			// so must check
			if (!div.firstChild.complete) {
				setTimeout(loaded, 100);
				return;
			}

			finished = true;

			assert.equal(
				plugin.signalToSource('', $(div)),
				'[img=200x200]http://www.sceditor.com/emoticons/smile.png[/img]'
			);

			QUnit.start();
		};

		if (!div.firstChild.complete) {
			div.firstChild.onload = loaded;
		}

		loaded();
	});


	test('URL', function (assert) {
		assert.equal(
			this.htmlToBBCode('<a href="http://test.com/">Test</a>'),
			'[url=http://test.com/]Test[/url]',
			'Anchor tag'
		);

		assert.equal(
			this.htmlToBBCode('<a href="http://test.com/"></a>'),
			'[url=http://test.com/][/url]',
			'Empty anchor tag'
		);
	});


	test('Email', function (assert) {
		assert.equal(
			this.htmlToBBCode('<a href="mailto:test@test.com">Test</a>'),
			'[email=test@test.com]Test[/email]',
			'A tag name'
		);

		assert.equal(
			this.htmlToBBCode(
				'<a href="mailto:test@test.com">test@test.com</a>'
			),
			'[email=test@test.com]test@test.com[/email]',
			'A tag e-mail'
		);

		assert.equal(
			this.htmlToBBCode('<a href="mailto:test@test.com"></a>'),
			'',
			'Empty e-mail tag'
		);
	});


	test('Quote', function (assert) {
		assert.equal(
			this.htmlToBBCode('<blockquote>Testing 1.2.3....</blockquote>'),
			'[quote]Testing 1.2.3....[/quote]\n',
			'Simple quote'
		);

		assert.equal(
			this.htmlToBBCode(
				'<blockquote><cite>admin</cite>Testing 1.2.3....</blockquote>'
			),
			'[quote=admin]Testing 1.2.3....[/quote]\n',
			'Quote with cite (author)'
		);

		assert.equal(
			this.htmlToBBCode(
				'<blockquote>' +
					'<cite>admin</cite>Testing 1.2.3....' +
					'<blockquote>' +
						'<cite>admin</cite>Testing 1.2.3....' +
					'</blockquote>' +
				'</blockquote>'
			),
			'[quote=admin]Testing 1.2.3....\n[quote=admin]Testing 1.2.3....' +
				'[/quote]\n[/quote]\n',
			'Nested quote with cite (author)'
		);

		assert.equal(
			this.htmlToBBCode(
				'<blockquote>' +
					'<cite>admin</cite>' +
					'<cite>this should be ignored</cite> Testing 1.2.3....' +
				'</blockquote>'
			),
			'[quote=admin]this should be ignored Testing 1.2.3....[/quote]\n',
			'Quote with 2 cites (author)'
		);
	});


	test('Code', function (assert) {
		assert.equal(
			this.htmlToBBCode('<code>Testing 1.2.3....</code>'),
			'[code]Testing 1.2.3....[/code]\n',
			'Simple code'
		);

		assert.equal(
			this.htmlToBBCode(
				'<code><b>ignore this</b> Testing 1.2.3....</code>'
			),
			'[code]ignore this Testing 1.2.3....[/code]\n',
			'Code with styling'
		);
	});


	test('Left', function (assert) {
		var isIeOrEdge = browser.ie || 'msImeAlign' in document.body.style;

		// IE will return text-align when a parents direction is changed
		// so will be skipped in IE unless the direction is different
		// from the parent alignment
		assert.equal(
			this.htmlToBBCode('<div style="text-align: left">test</div>'),
			isIeOrEdge ? 'test' : '[left]test[/left]\n',
			'CSS text-align'
		);

		assert.equal(
			this.htmlToBBCode('<div align="left">test</div>'),
			isIeOrEdge ? 'test' : '[left]test[/left]\n',
			'Align attribute'
		);
	});


	test('Right', function (assert) {
		assert.equal(
			this.htmlToBBCode('<div style="text-align: right">test</div>'),
			'[right]test[/right]\n',
			'CSS text-align'
		);

		assert.equal(
			this.htmlToBBCode('<div align="right">test</div>'),
			'[right]test[/right]\n',
			'Align attribute'
		);
	});


	test('Centre', function (assert) {
		assert.equal(
			this.htmlToBBCode('<div style="text-align: center">test</div>'),
			'[center]test[/center]\n',
			'CSS text-align'
		);

		assert.equal(
			this.htmlToBBCode('<div align="center">test</div>'),
			'[center]test[/center]\n',
			'Align attribute'
		);
	});


	test('Justify', function (assert) {
		assert.equal(
			this.htmlToBBCode('<div style="text-align: justify">test</div>'),
			'[justify]test[/justify]\n',
			'CSS text-align'
		);

		assert.equal(
			this.htmlToBBCode('<div align="justify">test</div>'),
			'[justify]test[/justify]\n',
			'Align attribute'
		);
	});


	test('YouTube', function (assert) {
		assert.equal(
			this.htmlToBBCode('<iframe data-youtube-id="xyz"></iframe>'),
			'[youtube]xyz[/youtube]'
		);
	});
});
