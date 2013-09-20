(function() {
	'use strict';


	module('XHTML Plugin', {
		setup: function() {
			this.plugin = new $.sceditor.plugins.xhtml();
			this.plugin.init.call({
				opts: $.extend({}, $.sceditor.defaultOptions)
			});
		}
	});

	test('Remove empty tags', function() {
		expect(10);

		equal(
			this.plugin.signalToSource('', '<div></div>'.toJquery()),
			'',
			'Single div'
		);

		equal(
			this.plugin.signalToSource('', '<div><br /></div>'.toJquery()),
			'',
			'Single div with br'
		);

		equal(
			this.plugin.signalToSource('', '<span><br /></span>'.toJquery()),
			'',
			'Single span with br'
		);

		equal(
			this.plugin.signalToSource('', '<div><div></div></div>'.toJquery()),
			'',
			'Nested div'
		);

		equal(
			this.plugin.signalToSource('', '<span> <br /></span>'.toJquery()),
			'',
			'Single span with space and br'
		);

		equal(
			this.plugin.signalToSource('', '<div> <br />		</div>'.toJquery()),
			'',
			'Single div with spaces and br'
		);

		equal(
			this.plugin.signalToSource('', '<input name="test" />'.toJquery()),
			'<input name="test" />',
			'Input tag'
		);

		equal(
			this.plugin.signalToSource('', '<span>test<br /></span>'.toJquery()).ignoreSpace(),
			'<span>test<br /></span>'.ignoreSpace(),
			'Single span with text and br'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Single div with text'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div><div><br /></div>'.toJquery()).ignoreSpace(),
			'<div>test</div><div><br /></div>'.ignoreSpace(),
			'Div with br as line seperator'
		);
	});


	test('Allowed tags', function() {
		expect(6);

		$.sceditor.plugins.xhtml.allowedTags = ['strong', 'a'];

		equal(
			this.plugin.signalToSource('', '<div><strong>test</strong><a href="#">test link</a></div>'.toJquery()).ignoreSpace().ieURLFix(),
			'<strong>test</strong><a href="#">test link</a>'.ignoreSpace(),
			'Allowed tags in disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<div><div><strong>test</strong></div></div>'.toJquery()).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace(),
			'Allowed tags in nested disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<strong>test</strong><div>test</div>'.toJquery()).ignoreSpace(),
			'<strong>test</strong>test'.ignoreSpace(),
			'Allowed tag and disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div>test'.toJquery()).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag with text sibling'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div><div>test</div>'.toJquery()).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Sibling disallowed tags'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div>'.toJquery()).ignoreSpace(),
			'test'.ignoreSpace(),
			'Only disallowed tag'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedTags = [];
	});

	test('Disallowed tags', function() {
		expect(7);

		$.sceditor.plugins.xhtml.disallowedTags = ['div'];

		equal(
			this.plugin.signalToSource('', '<div><strong>test</strong><a href="#">test link</a></div>'.toJquery()).ignoreSpace().ieURLFix(),
			'<strong>test</strong><a href="#">test link</a>'.ignoreSpace(),
			'Allowed tags in disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<div><div><strong>test</strong></div></div>'.toJquery()).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace(),
			'Allowed tags in nested disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<strong>test</strong><div>test</div>'.toJquery()).ignoreSpace(),
			'<strong>test</strong> test'.ignoreSpace(),
			'Allowed tag and disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', '<div>test<div>test'.toJquery()).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', 'test<div>test<div>'.toJquery()).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag as last child'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div><div>test</div>'.toJquery()).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Sibling disallowed tags'
		);

		equal(
			this.plugin.signalToSource('', '<div>test</div>'.toJquery()).ignoreSpace(),
			'test'.ignoreSpace(),
			'Only disallowed tag'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.disallowedTags = [];
	});

	test('Allowed attributes', function() {
		expect(6);

		$.sceditor.plugins.xhtml.allowedAttribs['*'] = {
			'data-allowed': null,
			'data-only-a': ['a']
		};
		$.sceditor.plugins.xhtml.allowedAttribs.a = {
			'href': null
		};

		equal(
			this.plugin.signalToSource('', '<div data-test="not allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', '<div data-allowed="allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed attribute'
		);

		equal(
			this.plugin.signalToSource('', '<div data-test="not allowed" data-allowed="allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', '<a href="#">test</a><div href="#">test</div>'.toJquery()).ignoreSpace().ieURLFix(),
			'<a href="#">test</a><div>test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes for specific tag'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-a="a">test</div>'.toJquery()).ignoreSpace(),
			'<div data-only-a="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-a="aaaaaa">test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedAttribs = {};
	});

	test('Disallowed attributes', function() {
		expect(6);

		$.sceditor.plugins.xhtml.disallowedAttribs['*'] = {
			'data-test': null,
			'data-only-a': ['aaaaaa']
		};
		$.sceditor.plugins.xhtml.disallowedAttribs.div = {
			'href': null
		};

		equal(
			this.plugin.signalToSource('', '<div data-test="not allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', '<div data-allowed="allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed attribute'
		);

		equal(
			this.plugin.signalToSource('', '<div data-test="not allowed" data-allowed="allowed">test</div>'.toJquery()).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', '<a href="#">test</a><div href="#">test</div>'.toJquery()).ignoreSpace().ieURLFix(),
			'<a href="#">test</a><div>test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes for specific tag'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-a="a">test</div>'.toJquery()).ignoreSpace(),
			'<div data-only-a="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-a="aaaaaa">test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.disallowedAttribs = {};
	});

	test('Indentation', function() {
		expect(9);

		equal(
			this.plugin.signalToSource('', '<div>test</div>'.toJquery()),
			'<div>\n\ttest\n</div>',
			'Div with text'
		);

		equal(
			this.plugin.signalToSource('', '<span>test</span>'.toJquery()),
			'<span>test</span>',
			'Span with text'
		);

		equal(
			this.plugin.signalToSource('', '<div><div>test</div></div>'.toJquery()),
			'<div>\n\t<div>\n\t\ttest\n\t</div>\n</div>',
			'Nested div with text'
		);

		equal(
			this.plugin.signalToSource('', '<span><span>test</span></span>'.toJquery()),
			'<span><span>test</span></span>',
			'Nested span with text'
		);

		equal(
			this.plugin.signalToSource('', '<div><span>test</span></div>'.toJquery()),
			'<div>\n\t<span>test</span>\n</div>',
			'Span with text in a div'
		);

		equal(
			this.plugin.signalToSource('', '<span>test<div>test</div>test</span>'.toJquery()),
			'<span>test\n\t<div>\n\t\ttest\n\t</div>\n\ttest</span>',
			'Nested span with text'
		);

		equal(
			this.plugin.signalToSource('', '<pre>  test  </pre>'.toJquery()),
			'<pre>  test  </pre>',
			'Pre tag'
		);

		equal(
			this.plugin.signalToSource('', '<div>test<pre>  test  </pre>test</div>'.toJquery()),
			'<div>\n\ttest\n\t<pre>  test  </pre>\n\ttest\n</div>',
			'Div with pre tag'
		);

		equal(
			this.plugin.signalToSource('', '<pre>  <div>test</div>  </pre>'.toJquery()),
			'<pre>  <div>test</div>  </pre>',
			'Pre tag with div child'
		);
	});

	test('Comment', function() {
		expect(1);

		var ret = this.plugin.signalToSource('', '<div><!-- test -->test</div>'.toJquery()).ignoreAll();
		ok(
			ret == '<div><!-- test -->test</div>'.ignoreAll() || ret == '<div>test</div>'.ignoreAll()
		);
	});

	test('Serialize', function() {
		expect(3);

		var XHTMLSerializer = new $.sceditor.XHTMLSerializer();
		equal(
			XHTMLSerializer.serialize('<div><span>test</span></div>'.toDOM().firstChild).ignoreAll(),
			'<div><span>test</span></div>'.ignoreAll(),
			'Serialise all'
		);

		equal(
			XHTMLSerializer.serialize('<div><span>test</span></div>'.toDOM().firstChild, true).ignoreAll(),
			'<span>test</span>'.ignoreAll(),
			'Serialise only children'
		);

		var frag = document.createDocumentFragment();
		frag.appendChild(document.createTextNode('testing'));
		equal(
			XHTMLSerializer.serialize(frag).ignoreAll(),
			'testing'.ignoreAll(),
			'Serialise Fragment'
		);
	});

	test('Entities', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<div>&lt;&amp&gt;</div>'.toJquery()).ignoreAll(),
			'<div>&lt;&amp&gt;</div>'.ignoreAll()
		);
	});

	test('Ignored elements', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<div>test<span class="sceditor-ignore">test</span>test</div>'.toJquery()).ignoreAll(),
			'<div>testtest</div>'.ignoreAll()
		);
	});

	test('Merge attributes', function() {
		expect(3);

		$.sceditor.plugins.xhtml.allowedAttribs['*'] = {
			'data-only-ab': ['a']
		};
		$.sceditor.plugins.xhtml.allowedAttribs.div = {
			'data-only-ab': ['b']
		};

		equal(
			this.plugin.signalToSource('', '<div data-only-ab="a">test</div>'.toJquery()).ignoreSpace(),
			'<div data-only-ab="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-ab="b">test</div>'.toJquery()).ignoreSpace(),
			'<div data-only-ab="b">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', '<div data-only-ab="c">test</div>'.toJquery()).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.allowedAttribs = {};
	});


	module('XHTML Plugin - Converters', {
		setup: function() {
			this.plugin = new $.sceditor.plugins.xhtml();
			this.plugin.init.call({
				opts: $.extend({}, $.sceditor.defaultOptions)
			});
		}
	});

	test('Width', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<div width="200">test</div>'.toJquery()).ignoreAll(),
			'<div style="width: 200px;">test</div>'.ignoreAll(),
			'Div width'
		);
	});

	test('Height', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<div height="200">test</div>'.toJquery()).ignoreAll(),
			'<div style="height: 200px;">test</div>'.ignoreAll(),
			'Div height'
		);
	});

	test('Text', function() {
		expect(4);

		var result;

		equal(
			this.plugin.signalToSource('', '<div text="red">test</div>'.toJquery()).ignoreAll(),
			'<div style="color: red;">test</div>'.ignoreAll(),
			'Div named colour'
		);

		result = this.plugin.signalToSource('', '<div text="#f00">test</div>'.toJquery()).ignoreAll();
		ok(
			result === '<div style="color: #f00;">test</div>'.ignoreAll() ||
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div short hex colour'
		);

		result = this.plugin.signalToSource('', '<div text="#ff0000">test</div>'.toJquery()).ignoreAll();
		ok(
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div hex colour'
		);

		equal(
			this.plugin.signalToSource('', '<div text="rgb(255,0,0)">test</div>'.toJquery()).ignoreAll(),
			'<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div rgb colour'
		);
	});

	test('Color', function() {
		expect(4);

		var result;

		equal(
			this.plugin.signalToSource('', '<div color="red">test</div>'.toJquery()).ignoreAll(),
			'<div style="color: red;">test</div>'.ignoreAll(),
			'Div named colour'
		);

		result = this.plugin.signalToSource('', '<div color="#f00">test</div>'.toJquery()).ignoreAll();
		ok(
			result === '<div style="color: #f00;">test</div>'.ignoreAll() ||
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div short hex colour'
		);

		result = this.plugin.signalToSource('', '<div color="#ff0000">test</div>'.toJquery()).ignoreAll();
		ok(
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div hex colour'
		);

		equal(
			this.plugin.signalToSource('', '<div color="rgb(255,0,0)">test</div>'.toJquery()).ignoreAll(),
			'<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div rgb colour'
		);
	});

	test('Face', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<div face="Arial">test</div>'.toJquery()).ignoreAll(),
			'<div style="font-family: Arial;">test</div>'.ignoreAll(),
			'Div font'
		);

		var result = this.plugin.signalToSource('', '<div face="Arial Black">test</div>'.toJquery()).ignoreAll();
		ok(
			result === '<div style="font-family: Arial Black;">test</div>'.ignoreAll() ||
			result === '<div style="font-family: \'Arial Black\';">test</div>'.ignoreAll(),
			'Div font with space'
		);
	});

	test('Align', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<div align="left">test</div>'.toJquery()).ignoreAll(),
			'<div style="text-align: left;">test</div>'.ignoreAll(),
			'Left'
		);

		equal(
			this.plugin.signalToSource('', '<div align="center">test</div>'.toJquery()).ignoreAll(),
			'<div style="text-align: center;">test</div>'.ignoreAll(),
			'Center'
		);
	});

	test('Border', function() {
		expect(2);

		var ret;

		ret = this.plugin.signalToSource('', '<div border="1">test</div>'.toJquery()).ignoreSpace();
		ok(
			!/border=/i.test(ret) && /-width:1/i.test(ret)
		);

		ret = this.plugin.signalToSource('', '<div border="0">test</div>'.toJquery()).ignoreSpace();
		ok(
			!/border=/i.test(ret) && /-width:0/i.test(ret)
		);
	});

	test('HR noshade', function() {
		expect(1);

		var ret = this.plugin.signalToSource('', '<hr noshade />'.toJquery());
		ok(
			!/noshade/.test(ret) && /solid/.test(ret)
		);
	});

	test('Name', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<img name="test" />'.toJquery()).ignoreSpace(),
			'<img id="test" />'.ignoreSpace(),
			'Image with name'
		);

		equal(
			this.plugin.signalToSource('', '<img name="test" id="one" />'.toJquery()).ignoreSpace(),
			'<img id="one" />'.ignoreSpace(),
			'Image with name and id'
		);
	});

	test('VSpace', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<img vspace="20" />'.toJquery()).ignoreAll(),
			'<img style="margin-top:20px;margin-bottom:20px;" />'.ignoreAll()
		);
	});

	test('HSpace', function() {
		expect(1);

		ok(
			this.plugin.signalToSource('', '<img hspace="20" />'.toJquery()).ignoreAll(),
			'<img style="margin-left:20px;margin-right:20px;" />'.ignoreAll() || '<img style="margin-right:20pxmargin-left:20px"/>'.ignoreAll()
		);
	});

	test('Big', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<big>test</big>'.toJquery()).ignoreAll(),
			'<span style="font-size:larger;">test</span>'.ignoreAll(),
			'Single <big>'
		);

		equal(
			this.plugin.signalToSource('', '<big><big>test</big></big>'.toJquery()).ignoreAll(),
			'<span style="font-size:larger;"><span style="font-size:larger;">test</span></span>'.ignoreAll(),
			'Nested <big>'
		);
	});

	test('Small', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<small>test</small>'.toJquery()).ignoreAll(),
			'<span style="font-size:smaller;">test</span>'.ignoreAll(),
			'Single <small>'
		);

		equal(
			this.plugin.signalToSource('', '<small><small>test</small></small>'.toJquery()).ignoreAll(),
			'<span style="font-size:smaller;"><span style="font-size:smaller;">test</span></span>'.ignoreAll(),
			'Nested <small>'
		);
	});

	test('B - Bold', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<b>test</b>'.toJquery()).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace()
		);
	});

	test('U - Underline', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<u>test</u>'.toJquery()).ignoreAll(),
			'<span style="text-decoration: underline;">test</span>'.ignoreAll()
		);
	});

	test('I - Italic', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<i>test</i>'.toJquery()).ignoreSpace(),
			'<em>test</em>'.ignoreSpace()
		);
	});

	test('Strikethrough', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<s>test</s>'.toJquery()).ignoreAll(),
			'<span style="text-decoration: line-through;">test</span>'.ignoreAll(),
			'S tag'
		);

		equal(
			this.plugin.signalToSource('', '<strike>test</strike>'.toJquery()).ignoreAll(),
			'<span style="text-decoration: line-through;">test</span>'.ignoreAll(),
			'Strike tag'
		);
	});

	test('Dir tag', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<dir><li>test</li></dir>'.toJquery()).ignoreSpace(),
			'<ul><li>test</li></ul>'.ignoreSpace()
		);
	});

	test('Center tag', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<center>test</center>'.toJquery()).ignoreAll(),
			'<div style="text-align: center;">test</div>'.ignoreAll()
		);
	});

	test('Font', function() {
		expect(4);

		equal(
			this.plugin.signalToSource('', '<font>test</font>'.toJquery()).ignoreAll(),
			'<span>test</span>'.ignoreAll(),
			'Without attributes'
		);

		equal(
			this.plugin.signalToSource('', '<font face="arial">test</font>'.toJquery()).ignoreAll(),
			'<span style="font-family: arial;">test</span>'.ignoreAll(),
			'With font attribute'
		);

		equal(
			this.plugin.signalToSource('', '<font color="red">test</font>'.toJquery()).ignoreAll(),
			'<span style="color: red;">test</span>'.ignoreAll(),
			'With color attribute'
		);

		equal(
			this.plugin.signalToSource('', '<font size="5">test</font>'.toJquery()).ignoreAll(),
			'<span style="font-size:24px;">test</span>'.ignoreAll(),
			'With size attribute'
		);
	});

	test('Nowrap attribute', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', '<table><tbody><tr><td nowrap>test</tr></tbody></table>'.toJquery()).ignoreAll(),
			'<table><tbody><tr><tdstyle=\"white-space:nowrap\">test</td></tr></tbody></table>'.ignoreAll()
		);
	});

	test('List item value attribute', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', '<ol><li value="2">test</li></ol>'.toJquery()).ignoreAll(),
			'<ol><li>test</li></ol>'.ignoreAll(),
			'li tag with value attribtue'
		);

		var ret = this.plugin.signalToSource('', '<input type="text" value="2" />'.toJquery()).ignoreAll();
		ok(
			/value="2"/i.test(ret),
			'input with value attribute'
		);
	});

	test('Mozilla\'s junk attributes fix', function() {
		expect(4);

		equal(
			this.plugin.signalToSource('', '<br type="_moz">'.toJquery()),
			'<br />',
			'Type _moz on br'
		);

		equal(
			this.plugin.signalToSource('', '<div type="_moz">Bad Mozilla!</div>'.toJquery()).ignoreSpace(),
			'<div>Bad Mozilla!</div>'.ignoreSpace(),
			'Type _moz on div'
		);

		equal(
			this.plugin.signalToSource('', '<div _moz_dirty="">Mozilla attributes!</div>'.toJquery()).ignoreSpace(),
			'<div>Mozilla attributes!</div>'.ignoreSpace(),
			'_moz_dirty attribute on div'
		);

		equal(
			this.plugin.signalToSource('', '<div _moz_editor_bogus_node="">Shhh, I\'m not really here.</div>'.toJquery()).ignoreSpace(),
			''.ignoreSpace(),
			'_moz_editor_bogus_node attribute on div'
		);
	});
})();