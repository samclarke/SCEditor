define([
	'lib/SCEditor',
	'tests/unit/utils',
	'plugins/xhtml'
], function (SCEditor, utils) {
	'use strict';

	var moduleSetup = function () {
		this.mockEditor = {
			opts: $.extend({}, SCEditor.defaultOptions)
		};

		this.plugin = new SCEditor.plugins.xhtml();
		this.plugin.init.call(this.mockEditor);

		this.filterHtml = function (html) {
			var $html = $(utils.htmlToDiv(html));

			return this.plugin.signalToSource('', $html);
		};

		this.filterStripWhiteSpace = function (html) {
			return utils
				.stripWhiteSpace(this.filterHtml(html))
				// IE < 9 outputs styles in upper case
				.replace(/style="[^"]+"/g, function (match) {
					return match
						.toLowerCase()
						// Make sure the last ; is added to the style attribute
						.replace(/;?"$/, ';"');
				});
		};
	};


	module('plugins/xhtml', {
		setup: moduleSetup
	});


	test('White space removal', function (assert) {
		assert.htmlEqual(
			this.filterHtml('<div>text\ntext</div>'),
			'<div>\n\ttext text\n</div>',
			'Text with newline between'
		);

		assert.htmlEqual(
			this.filterHtml('<div>text  \n  text</div>'),
			'<div>\n\ttext text\n</div>',
			'Text with spaces and newline between'
		);

		assert.htmlEqual(
			this.filterHtml('<div>text     text</div>'),
			'<div>\n\ttext text\n</div>',
			'Text with multiple spaces'
		);
	});


	test('Remove empty tags', function (assert) {
		assert.htmlEqual(
			this.filterHtml('<div></div>'),
			'',
			'Single div'
		);

		assert.htmlEqual(
			this.filterHtml('<div><br /></div>'),
			'',
			'Single div with br'
		);

		assert.htmlEqual(
			this.filterHtml('<div><br /></div><div><br /></div>'),
			'<div>\n\t<br />\n</div>\n<div>\n\t<br />\n</div>',
			'Single div with br and sibling'
		);

		assert.htmlEqual(
			this.filterHtml('<div><strong><br /></strong></div>'),
			'',
			'Single div with single strong with br'
		);

		assert.htmlEqual(
			this.filterHtml('<span><br /></span>'),
			'',
			'Single span with br'
		);

		assert.htmlEqual(
			this.filterHtml('<p><span class="sceditor-ignore">ignored</span></p>'),
			'',
			'Single p with ignored child'
		);

		assert.htmlEqual(
			this.filterHtml('<div><div></div></div>'),
			'',
			'Nested div'
		);
	});


	test('Should not remove non-empty tags', function (assert) {
		assert.htmlEqual(
			this.filterHtml('<input name="test" />'),
			'<p>\n\t<input name="test" />\n</p>',
			'Input tag'
		);

		assert.htmlEqual(
			this.filterHtml(
				'<iframe src="http://example.com"></iframe>'
			),
			'<p>\n\t<iframe src="http://example.com"></iframe>\n</p>',
			'Iframe tag'
		);

		assert.htmlEqual(
			this.filterHtml('<span>test<br /></span>'),
			'<p>\n\t<span>test<br /></span>\n</p>',
			'Single span with text and br'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div>'),
			'<div>\n\ttest\n</div>',
			'Single div with text'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div><div><br /></div>'),
			'<div>\n\ttest\n</div>\n<div>\n\t<br />\n</div>',
			'Div with br as line seperator'
		);

		assert.htmlEqual(
			this.filterHtml('<div><strong>test</strong></div><div><strong><br /></strong></div>'),
			'<div>\n\t<strong>test</strong>\n</div>\n<div>\n\t<strong><br /></strong>\n</div>',
			'Div with strong with br as line seperator'
		);

		assert.htmlEqual(
			this.filterHtml('<span>&nbsp;<br /></span>'),
			'<p>\n\t<span>&nbsp;<br /></span>\n</p>',
			'Single span with space and br'
		);

		assert.htmlEqual(
			this.filterHtml('<div>&nbsp; <br />		</div>'),
			'<div>\n\t&nbsp; <br /> \n</div>',
			'Single div with spaces and br'
		);
	});


	test('Should wrap adjacent inline nodes of root in paragraphs', function (assert) {
		assert.htmlEqual(
			this.filterHtml('text\ntext'),
			'<p>\n\ttext text\n</p>',
			'Text with newline'
		);

		assert.htmlEqual(
			this.filterHtml('text<strong>text</strong>text'),
			'<p>\n\ttext<strong>text</strong>text\n</p>',
			'Text with bold tag in between'
		);

		assert.htmlEqual(
			this.filterHtml('\n\n   <div>text</div>   \n'),
			'<div>\n\ttext\n</div>',
			'Div surrounded by white space'
		);
	});


	test('Allowed tags', function (assert) {
		$.sceditor.plugins.xhtml.allowedTags = ['strong', 'a'];

		assert.htmlEqual(
			this.filterHtml(
				'<div><strong>test</strong><a href="#">test link</a></div>'
			),
			'<p>\n\t<strong>test</strong><a href="#">test link</a>\n</p>',
			'Allowed tags in disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml(
				'<div><div><strong>test</strong></div></div>'
			),
			'<p>\n\t<strong>test</strong>\n</p>',
			'Allowed tags in nested disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml('<strong>test</strong><div>test</div>'),
			'<p>\n\t<strong>test</strong> test\n</p>',
			'Allowed tag and disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div>test'),
			'<p>\n\ttest test\n</p>',
			'Disallowed tag with text sibling'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div><div>test</div>'),
			'<p>\n\ttest test\n</p>',
			'Sibling disallowed tags'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div>'),
			'<p>\n\ttest\n</p>',
			'Only disallowed tag'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedTags = [];
	});


	test('Should not convert the I tag', function (assert) {
		// Should be left as it's part of HTML5'
		assert.equal(
			this.filterStripWhiteSpace('<i>test</i>'),
			utils.stripWhiteSpace('<p><i>test</i></p>')
		);
	});


	test('Disallowed tags', function (assert) {
		$.sceditor.plugins.xhtml.disallowedTags = ['div'];

		assert.htmlEqual(
			this.filterHtml(
				'<div><strong>test</strong><a href="#">test link</a></div>'
			),
			'<p>\n\t<strong>test</strong><a href="#">test link</a>\n</p>',
			'Allowed tags in disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml(
				'<div><div><strong>test</strong></div></div>'
			),
			'<p>\n\t<strong>test</strong>\n</p>',
			'Allowed tags in nested disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml('<strong>test</strong><div>test</div>'),
			'<p>\n\t<strong>test</strong> test\n</p>',
			'Allowed tag and disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test<div>test'),
			'<p>\n\ttest test\n</p>',
			'Disallowed tag'
		);

		assert.htmlEqual(
			this.filterHtml('test<div>test<div>'),
			'<p>\n\ttest test\n</p>',
			'Disallowed tag as last child'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div><div>test</div>'),
			'<p>\n\ttest test\n</p>',
			'Sibling disallowed tags'
		);

		assert.htmlEqual(
			this.filterHtml('<div>test</div>'),
			'<p>\n\ttest\n</p>',
			'Only disallowed tag'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.disallowedTags = [];
	});


	test('Allowed attributes', function (assert) {
		$.sceditor.plugins.xhtml.allowedAttribs['*'] = {
			'data-allowed': null,
			'data-only-a': ['a']
		};
		$.sceditor.plugins.xhtml.allowedAttribs.a = {
			'href': null
		};

		assert.htmlEqual(
			this.filterHtml('<div data-test="not allowed">test</div>'),
			'<div>\n\ttest\n</div>',
			'Disallowed attributes'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-allowed="allowed">test</div>'),
			'<div data-allowed="allowed">\n\ttest\n</div>',
			'Allowed attribute'
		);

		assert.htmlEqual(
			this.filterHtml(
				'<div data-test="not allowed" data-allowed="allowed">test</div>'
			),
			'<div data-allowed="allowed">\n\ttest\n</div>',
			'Allowed and disallowed attributes'
		);

		assert.htmlEqual(
			this.filterHtml('<a href="#">test</a><div href="#">test</div>'),
			'<p>\n\t<a href="#">test</a>\n</p>\n<div>\n\ttest\n</div>',
			'Allowed and disallowed attributes for specific tag'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-only-a="a">test</div>'),
			'<div data-only-a="a">\n\ttest\n</div>',
			'Allowed attribute with specific value'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-only-a="aaaaaa">test</div>'),
			'<div>\n\ttest\n</div>',
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedAttribs = {};
	});


	test('Disallowed attributes', function (assert) {
		$.sceditor.plugins.xhtml.disallowedAttribs['*'] = {
			'data-test': null,
			'data-only-a': ['aaaaaa']
		};
		$.sceditor.plugins.xhtml.disallowedAttribs.div = {
			'href': null
		};

		assert.htmlEqual(
			this.filterHtml('<div data-test="not allowed">test</div>'),
			'<div>\n\ttest\n</div>',
			'Disallowed attributes'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-allowed="allowed">test</div>'),
			'<div data-allowed="allowed">\n\ttest\n</div>',
			'Allowed attribute'
		);

		assert.htmlEqual(
			this.filterHtml(
				'<div data-test="not allowed" data-allowed="allowed">test</div>'
			),
			'<div data-allowed="allowed">\n\ttest\n</div>',
			'Allowed and disallowed attributes'
		);

		assert.htmlEqual(
			this.filterHtml('<a href="#">test</a><div href="#">test</div>'),
			'<p>\n\t<a href="#">test</a>\n</p>\n<div>\n\ttest\n</div>',
			'Allowed and disallowed attributes for specific tag'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-only-a="a">test</div>'),
			'<div data-only-a="a">\n\ttest\n</div>',
			'Allowed attribute with specific value'
		);

		assert.htmlEqual(
			this.filterHtml('<div data-only-a="aaaaaa">test</div>'),
			'<div>\n\ttest\n</div>',
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.disallowedAttribs = {};
	});


	test('Indentation', function (assert) {
		assert.equal(
			this.filterHtml('<div>test</div>'),
			'<div>\n\ttest\n</div>',
			'Div with text'
		);

		assert.equal(
			this.filterHtml('<span>test</span>'),
			'<p>\n\t<span>test</span>\n</p>',
			'Span with text'
		);

		assert.equal(
			this.filterHtml('<div><div>test</div></div>'),
			'<div>\n\t<div>\n\t\ttest\n\t</div>\n</div>',
			'Nested div with text'
		);

		assert.equal(
			this.filterHtml('<span><span>test</span></span>'),
			'<p>\n\t<span><span>test</span></span>\n</p>',
			'Nested span with text'
		);

		assert.equal(
			this.filterHtml('<div><span>test</span></div>'),
			'<div>\n\t<span>test</span>\n</div>',
			'Span with text in a div'
		);

		assert.equal(
			this.filterHtml('<span>test<div>test</div>test</span>'),
			'<p>\n\t<span>test\n\t\t<div>\n\t\t\ttest\n\t\t</div>\n\t\ttest</span>\n</p>',
			'Nested span with text'
		);

		assert.equal(
			this.filterHtml('<pre>  test  </pre>'),
			'<pre>  test  </pre>',
			'Pre tag'
		);

		assert.equal(
			this.filterHtml('<div>test<pre>  test  </pre>test</div>'),
			'<div>\n\ttest\n\t<pre>  test  </pre>\n\ttest\n</div>',
			'Div with pre tag'
		);

		assert.equal(
			this.filterHtml('<pre>  <div>test</div>  </pre>'),
			'<pre>  <div>test</div>  </pre>',
			'Pre tag with div child'
		);
	});


	test('Comments', function (assert) {
		var ret = this.filterStripWhiteSpace('<div><!-- test -->test</div>');

		assert.ok(
			// Some browsers keep comments, some throw them away. This
			// is to check that the plugin can cope with comments without
			// blowing up.
			ret === utils.stripWhiteSpace(
				'<div><!-- test -->test</div>') ||
			ret === utils.stripWhiteSpace('<div>test</div>')
		);
	});


	test('Serialize', function (assert) {
		var XHTMLSerializer = new $.sceditor.XHTMLSerializer();
		assert.equal(
			XHTMLSerializer.serialize(
				utils.htmlToNode('<div><span>test</span></div>')
			),
			'<div>\n\t<span>test</span>\n</div>',
			'Serialise all'
		);

		assert.equal(
			XHTMLSerializer.serialize(
				utils.htmlToNode('<div><span>test</span></div>'),
				true
			),
			'<span>test</span>',
			'Serialise only children'
		);

		var frag = document.createDocumentFragment();
		frag.appendChild(document.createTextNode('testing'));
		assert.equal(
			XHTMLSerializer.serialize(frag),
			'testing',
			'Serialise Fragment'
		);
	});


	test('Entities', function (assert) {
		assert.equal(
			this.filterHtml('<div>&lt;&amp;&gt;</div>'),
			'<div>\n\t&lt;&amp;&gt;\n</div>'
		);
	});


	test('Iframes', function (assert) {
		assert.equal(
			this.filterHtml(
				'<iframe src="http://example.com"></iframe>'
			),
			'<p>\n\t<iframe src="http://example.com"></iframe>\n</p>'
		);
	});


	test('Ignored elements', function (assert) {
		assert.equal(
			this.filterHtml(
				'<div>test<span class="sceditor-ignore">test</span>test</div>'
			),
			'<div>\n\ttesttest\n</div>'
		);
	});


	test('Merge attributes', function (assert) {
		$.sceditor.plugins.xhtml.allowedAttribs['*'] = {
			'data-only-ab': ['a']
		};
		$.sceditor.plugins.xhtml.allowedAttribs.div = {
			'data-only-ab': ['b']
		};

		assert.equal(
			this.filterHtml('<div data-only-ab="a">test</div>'),
			'<div data-only-ab="a">\n\ttest\n</div>',
			'Allowed attribute with specific value'
		);

		assert.equal(
			this.filterHtml('<div data-only-ab="b">test</div>'),
			'<div data-only-ab="b">\n\ttest\n</div>',
			'Allowed attribute with specific value'
		);

		assert.equal(
			this.filterHtml('<div data-only-ab="c">test</div>'),
			'<div>\n\ttest\n</div>',
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedAttribs = {};
	});



	module('plugins/xhtml - Converters', {
		setup: moduleSetup
	});


	test('Width', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<div width="200">test</div>'),
			utils.stripWhiteSpace('<div style="width: 200px;">test</div>'),
			'Div width'
		);
	});


	test('Height', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<div height="200">test</div>'),
			utils.stripWhiteSpace('<div style="height: 200px;">test</div>'),
			'Div height'
		);
	});


	test('Text', function (assert) {
		var result;

		assert.equal(
			this.filterStripWhiteSpace('<div text="red">test</div>'),
			utils.stripWhiteSpace('<div style="color: red;">test</div>'),
			'Div named colour'
		);

		result = this.filterStripWhiteSpace('<div text="#f00">test</div>');
		assert.ok(
			result === utils.stripWhiteSpace(
				'<div style="color: #f00;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: #ff0000;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: rgb(255,0,0);">test</div>'),
			'Div short hex colour'
		);

		result = this.filterStripWhiteSpace('<div text="#ff0000">test</div>');
		assert.ok(
			result === utils.stripWhiteSpace(
				'<div style="color: #ff0000;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: rgb(255, 0, 0);">test</div>'),
			'Div hex colour'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div text="rgb(255,0,0)">test</div>'),
			utils.stripWhiteSpace(
				'<div style="color: rgb(255,0,0);">test</div>'
			),
			'Div rgb colour'
		);
	});


	test('Color', function (assert) {
		var result;

		assert.equal(
			this.filterStripWhiteSpace('<div color="red">test</div>'),
			utils.stripWhiteSpace('<div style="color: red;">test</div>'),
			'Div named colour'
		);

		result = this.filterStripWhiteSpace('<div color="#f00">test</div>');
		assert.ok(
			result === utils.stripWhiteSpace(
				'<div style="color: #f00;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: #ff0000;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: rgb(255,0,0);">test</div>'),
			'Div short hex colour'
		);

		result = this.filterStripWhiteSpace('<div color="#ff0000">test</div>');
		assert.ok(
			result === utils.stripWhiteSpace(
				'<div style="color: #ff0000;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="color: rgb(255,0,0);">test</div>'),
			'Div hex colour'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div color="rgb(255,0,0)">test</div>'),
			utils.stripWhiteSpace(
				'<div style="color: rgb(255,0,0);">test</div>'),
			'Div rgb colour'
		);
	});


	test('Face', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<div face="arial">test</div>'),
			utils.stripWhiteSpace(
				'<div style="font-family: arial;">test</div>'
			),
			'Div font'
		);

		var result = this.filterStripWhiteSpace(
			'<div face="arial black">test</div>'
		);

		assert.ok(
			result === utils.stripWhiteSpace(
				'<div style="font-family: arial black;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="font-family: &quot;arial black&quot;;">test</div>') ||
			result === utils.stripWhiteSpace(
				'<div style="font-family: \'arial black\';">test</div>'),
			'Div font with space'
		);
	});


	test('Align', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<div align="left">test</div>'),
			utils.stripWhiteSpace('<div style="text-align: left;">test</div>'),
			'Left'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div align="center">test</div>'),
			utils.stripWhiteSpace(
				'<div style="text-align: center;">test</div>'),
			'Center'
		);
	});


	test('Border', function (assert) {
		var ret;

		ret = this.filterStripWhiteSpace('<div border="1">test</div>');
		assert.ok(
			!/border=/i.test(ret) && /-width:1/i.test(ret)
		);

		ret = this.filterStripWhiteSpace('<div border="0">test</div>');
		assert.ok(
			!/border=/i.test(ret) && /-width:0/i.test(ret)
		);
	});


	test('HR noshade', function (assert) {
		var ret = this.filterStripWhiteSpace('<hr noshade />');
		assert.ok(
			!/noshade/.test(ret) && /solid/.test(ret)
		);
	});


	test('Name', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<img name="test" />'),
			utils.stripWhiteSpace('<p><img id="test" /></p>'),
			'Image with name'
		);

		assert.equal(
			this.filterStripWhiteSpace('<img name="test" id="one" />'),
			utils.stripWhiteSpace('<p><img id="one" /></p>'),
			'Image with name and id'
		);
	});


	test('VSpace', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<img vspace="20" />'),
			utils.stripWhiteSpace(
				'<p><img style="margin-top:20px;margin-bottom:20px;" /></p>')
		);
	});


	test('HSpace', function (assert) {
		assert.ok(
			this.filterStripWhiteSpace('<img hspace="20" />'),
			utils.stripWhiteSpace(
				'<p><img style="margin-left:20px;margin-right:20px;" /></p>') ||
			utils.stripWhiteSpace(
				'<p><img style="margin-right:20pxmargin-left:20px"/></p>')
		);
	});


	test('Big', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<big>test</big>'),
			utils.stripWhiteSpace(
				'<p><span style="font-size:larger;">test</span></p>'),
			'Single <big>'
		);

		assert.equal(
			this.filterStripWhiteSpace('<big><big>test</big></big>'),
			utils.stripWhiteSpace('<p><span style="font-size:larger;">' +
				'<span style="font-size:larger;">test</span></span></p>'),
			'Nested <big>'
		);
	});


	test('Small', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<small>test</small>'),
			utils.stripWhiteSpace(
				'<p><span style="font-size:smaller;">test</span></p>'),
			'Single <small>'
		);

		assert.equal(
			this.filterStripWhiteSpace('<small><small>test</small></small>'),
			utils.stripWhiteSpace('<p><span style="font-size:smaller;">' +
				'<span style="font-size:smaller;">test</span></span></p>'),
			'Nested <small>'
		);
	});


	test('B - Bold', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<b>test</b>'),
			utils.stripWhiteSpace('<p><strong>test</strong></p>')
		);
	});


	test('U - Underline', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<u>test</u>'),
			utils.stripWhiteSpace(
				'<p><span style="text-decoration: underline;">test</span></p>')
		);
	});


	test('Strikethrough', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<s>test</s>'),
			utils.stripWhiteSpace(
				'<p><span style="text-decoration: line-through;">test</span></p>'),
			'S tag'
		);

		assert.equal(
			this.filterStripWhiteSpace('<strike>test</strike>'),
			utils.stripWhiteSpace(
				'<p><span style="text-decoration: line-through;">test</span></p>'),
			'Strike tag'
		);
	});


	test('Dir tag', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<dir><li>test</li></dir>'),
			utils.stripWhiteSpace('<ul><li>test</li></ul>')
		);
	});


	test('Center tag', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<center>test</center>'),
			utils.stripWhiteSpace('<div style="text-align: center;">test</div>')
		);
	});


	test('Font', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<font>test</font>'),
			utils.stripWhiteSpace('<p><span>test</span></p>'),
			'Without attributes'
		);

		assert.equal(
			this.filterStripWhiteSpace('<font face="arial">test</font>'),
			utils.stripWhiteSpace(
				'<p><span style="font-family: arial;">test</span></p>'),
			'With font attribute'
		);

		var ret = this.filterStripWhiteSpace('<font color="red">test</font>');
		assert.ok(
			ret === utils.stripWhiteSpace('<p><span style="color: red;">' +
				'test</span></p>') ||
			ret === utils.stripWhiteSpace('<p><span style="color: #ff0000;">' +
				'test</span></p>'),
			'With color attribute'
		);

		assert.equal(
			this.filterStripWhiteSpace('<font size="5">test</font>'),
			utils.stripWhiteSpace('<p><span style="font-size:24px;">test</span></p>'),
			'With size attribute'
		);
	});


	test('Nowrap attribute', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace(
				'<table><tbody><tr><td nowrap>test</tr></tbody></table>'
			).replace(';', ''),

			utils.stripWhiteSpace(
				'<table><tbody><tr>' +
					'<td style=\"white-space:nowrap\">test</td>' +
				'</tr></tbody></table>'
			)
		);
	});


	test('List item value attribute', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<ol><li value="2">test</li></ol>'),
			utils.stripWhiteSpace('<ol><li>test</li></ol>'),
			'li tag with value attribtue'
		);

		var ret = this.filterStripWhiteSpace('<input type="text" value="2" />');
		assert.ok(
			/value="2"/i.test(ret),
			'input with value attribute'
		);
	});


	test('Mozilla\'s junk attributes fix', function (assert) {
		assert.equal(
			this.filterStripWhiteSpace('<br type="_moz">'),
			utils.stripWhiteSpace('<p><br /></p>'),
			'Type _moz on br'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div type="_moz">Bad Mozilla!</div>'),
			utils.stripWhiteSpace('<div>Bad Mozilla!</div>'),
			'Type _moz on div'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div _moz_dirty="">Mozilla!</div>'),
			utils.stripWhiteSpace('<div>Mozilla!</div>'),
			'_moz_dirty attribute on div'
		);

		assert.equal(
			this.filterStripWhiteSpace('<div _moz_editor_bogus_node="">' +
				'Shhh, I\'m not really here.</div>'),
			'',
			'_moz_editor_bogus_node attribute on div'
		);
	});
});
