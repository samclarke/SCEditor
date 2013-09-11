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
			this.plugin.signalToSource('', html2dom('<div></div>', true)),
			'',
			'Single div'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><br /></div>', true)),
			'',
			'Single div with br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span><br /></span>', true)),
			'',
			'Single span with br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><div></div></div>', true)),
			'',
			'Nested div'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span> <br /></span>', true)),
			'',
			'Single span with space and br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div> <br />		</div>', true)),
			'',
			'Single div with spaces and br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<input name="test" />', true)),
			'<input name="test" />',
			'Input tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span>test<br /></span>', true)).ignoreSpace(),
			'<span>test<br /></span>'.ignoreSpace(),
			'Single span with text and br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div>', true)).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Single div with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div><div><br /></div>', true)).ignoreSpace(),
			'<div>test</div><div><br /></div>'.ignoreSpace(),
			'Div with br as line seperator'
		);
	});


	test('Allowed tags', function() {
		expect(6);

		$.sceditor.plugins.xhtml.allowedTags = ['strong', 'a'];

		equal(
			this.plugin.signalToSource('', html2dom('<div><strong>test</strong><a href="#">test link</a></div>', true)).ignoreSpace(),
			'<strong>test</strong><a href="#">test link</a>'.ignoreSpace(),
			'Allowed tags in disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><div><strong>test</strong></div></div>', true)).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace(),
			'Allowed tags in nested disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<strong>test</strong><div>test</div>', true)).ignoreSpace(),
			'<strong>test</strong>test'.ignoreSpace(),
			'Allowed tag and disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div>test', true)).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag with text sibling'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div><div>test</div>', true)).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Sibling disallowed tags'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div>', true)).ignoreSpace(),
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
			this.plugin.signalToSource('', html2dom('<div><strong>test</strong><a href="#">test link</a></div>', true)).ignoreSpace(),
			'<strong>test</strong><a href="#">test link</a>'.ignoreSpace(),
			'Allowed tags in disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><div><strong>test</strong></div></div>', true)).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace(),
			'Allowed tags in nested disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<strong>test</strong><div>test</div>', true)).ignoreSpace(),
			'<strong>test</strong> test'.ignoreSpace(),
			'Allowed tag and disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test<div>test', true)).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('test<div>test<div>', true)).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Disallowed tag as last child'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div><div>test</div>', true)).ignoreSpace(),
			'test test'.ignoreSpace(),
			'Sibling disallowed tags'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div>', true)).ignoreSpace(),
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
			this.plugin.signalToSource('', html2dom('<div data-test="not allowed">test</div>', true)).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-allowed="allowed">test</div>', true)).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed attribute'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-test="not allowed" data-allowed="allowed">test</div>', true)).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<a href="#">test</a><div href="#">test</div>', true)).ignoreSpace(),
			'<a href="#">test</a><div>test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes for specific tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-a="a">test</div>', true)).ignoreSpace(),
			'<div data-only-a="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-a="aaaaaa">test</div>', true)).ignoreSpace(),
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
			this.plugin.signalToSource('', html2dom('<div data-test="not allowed">test</div>', true)).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-allowed="allowed">test</div>', true)).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed attribute'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-test="not allowed" data-allowed="allowed">test</div>', true)).ignoreSpace(),
			'<div data-allowed="allowed">test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<a href="#">test</a><div href="#">test</div>', true)).ignoreSpace(),
			'<a href="#">test</a><div>test</div>'.ignoreSpace(),
			'Allowed and disallowed attributes for specific tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-a="a">test</div>', true)).ignoreSpace(),
			'<div data-only-a="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-a="aaaaaa">test</div>', true)).ignoreSpace(),
			'<div>test</div>'.ignoreSpace(),
			'Disallowed attribute with specific value'
		);

		// Reset for next test
		$.sceditor.plugins.xhtml.disallowedAttribs = {};
	});

	test('Indentation', function() {
		expect(9);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test</div>', true)),
			'<div>\n\ttest\n</div>',
			'Div with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span>test</span>', true)),
			'<span>test</span>',
			'Span with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><div>test</div></div>', true)),
			'<div>\n\t<div>\n\t\ttest\n\t</div>\n</div>',
			'Nested div with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span><span>test</span></span>', true)),
			'<span><span>test</span></span>',
			'Nested span with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div><span>test</span></div>', true)),
			'<div>\n\t<span>test</span>\n</div>',
			'Span with text in a div'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<span>test<div>test</div>test</span>', true)),
			'<span>test\n\t<div>\n\t\ttest\n\t</div>\n\ttest</span>',
			'Nested span with text'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<pre>  test  </pre>', true)),
			'<pre>  test  </pre>',
			'Pre tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test<pre>  test  </pre>test</div>', true)),
			'<div>\n\ttest\n\t<pre>  test  </pre>\n\ttest\n</div>',
			'Div with pre tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<pre>  <div>test</div>  </pre>', true)),
			'<pre>  <div>test</div>  </pre>',
			'Pre tag with div child'
		);
	});

	test('Comment', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<div><!-- test --></div>', true)).ignoreAll(),
			'<div><!-- test --></div>'.ignoreAll()
		);
	});

	test('Serialize', function() {
		expect(3);

		var XHTMLSerializer = new $.sceditor.XHTMLSerializer();
		equal(
			XHTMLSerializer.serialize(html2dom('<div><span>test</span></div>').firstChild).ignoreAll(),
			'<div><span>test</span></div>'.ignoreAll(),
			'Serialise all'
		);

		equal(
			XHTMLSerializer.serialize(html2dom('<div><span>test</span></div>').firstChild, true).ignoreAll(),
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
			this.plugin.signalToSource('', html2dom('<div>&lt;&amp&gt;</div>', true)).ignoreAll(),
			'<div>&lt;&amp&gt;</div>'.ignoreAll()
		);
	});

	test('Ignored elements', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<div>test<span class="sceditor-ignore">test</span>test</div>', true)).ignoreAll(),
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
			this.plugin.signalToSource('', html2dom('<div data-only-ab="a">test</div>', true)).ignoreSpace(),
			'<div data-only-ab="a">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-ab="b">test</div>', true)).ignoreSpace(),
			'<div data-only-ab="b">test</div>'.ignoreSpace(),
			'Allowed attribute with specific value'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div data-only-ab="c">test</div>', true)).ignoreSpace(),
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
			this.plugin.signalToSource('', html2dom('<div width="200">test</div>', true)).ignoreAll(),
			'<div style="width: 200px;">test</div>'.ignoreAll(),
			'Div width'
		);
	});

	test('Height', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<div height="200">test</div>', true)).ignoreAll(),
			'<div style="height: 200px;">test</div>'.ignoreAll(),
			'Div height'
		);
	});

	test('Text', function() {
		expect(4);

		var result;

		equal(
			this.plugin.signalToSource('', html2dom('<div text="red">test</div>', true)).ignoreAll(),
			'<div style="color: red;">test</div>'.ignoreAll(),
			'Div named colour'
		);

		result = this.plugin.signalToSource('', html2dom('<div text="#f00">test</div>', true)).ignoreAll();
		ok(
			result === '<div style="color: #f00;">test</div>'.ignoreAll() ||
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div short hex colour'
		);

		result = this.plugin.signalToSource('', html2dom('<div text="#ff0000">test</div>', true)).ignoreAll();
		ok(
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div hex colour'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div text="rgb(255,0,0)">test</div>', true)).ignoreAll(),
			'<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div rgb colour'
		);
	});

	test('Color', function() {
		expect(4);

		var result;

		equal(
			this.plugin.signalToSource('', html2dom('<div color="red">test</div>', true)).ignoreAll(),
			'<div style="color: red;">test</div>'.ignoreAll(),
			'Div named colour'
		);

		result = this.plugin.signalToSource('', html2dom('<div color="#f00">test</div>', true)).ignoreAll();
		ok(
			result === '<div style="color: #f00;">test</div>'.ignoreAll() ||
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div short hex colour'
		);

		result = this.plugin.signalToSource('', html2dom('<div color="#ff0000">test</div>', true)).ignoreAll();
		ok(
			result === '<div style="color: #ff0000;">test</div>'.ignoreAll() ||
			result === '<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div hex colour'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div color="rgb(255,0,0)">test</div>', true)).ignoreAll(),
			'<div style="color: rgb(255,0,0);">test</div>'.ignoreAll(),
			'Div rgb colour'
		);
	});

	test('Face', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<div face="Arial">test</div>', true)).ignoreAll(),
			'<div style="font-family: Arial;">test</div>'.ignoreAll(),
			'Div font'
		);

		var result = this.plugin.signalToSource('', html2dom('<div face="Arial Black">test</div>', true)).ignoreAll();
		ok(
			result === '<div style="font-family: Arial Black;">test</div>'.ignoreAll() ||
			result === '<div style="font-family: \'Arial Black\';">test</div>'.ignoreAll(),
			'Div font with space'
		);
	});

	test('Align', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<div align="left">test</div>', true)).ignoreAll(),
			'<div style="text-align: left;">test</div>'.ignoreAll(),
			'Left'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div align="center">test</div>', true)).ignoreAll(),
			'<div style="text-align: center;">test</div>'.ignoreAll(),
			'Center'
		);
	});

	test('Border', function() {
		expect(2);

		var ret;

		ret = this.plugin.signalToSource('', html2dom('<div border="1">test</div>', true)).ignoreSpace();
		ok(
			!/border=/i.test(ret) && /-width:1/i.test(ret)
		);

		ret = this.plugin.signalToSource('', html2dom('<div border="0">test</div>', true)).ignoreSpace();
		ok(
			!/border=/i.test(ret) && /-width:0/i.test(ret)
		);
	});

	test('HR noshade', function() {
		expect(1);

		var ret = this.plugin.signalToSource('', html2dom('<hr noshade />', true));
		ok(
			!/noshade/.test(ret) && /solid/.test(ret)
		);
	});

	test('Name', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<img name="test" />', true)).ignoreSpace(),
			'<img id="test" />'.ignoreSpace(),
			'Image with name'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<img name="test" id="one" />', true)).ignoreSpace(),
			'<img id="one" />'.ignoreSpace(),
			'Image with name and id'
		);
	});

	test('VSpace', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<img vspace="20" />', true)).ignoreAll(),
			'<img style="margin-top:20px;margin-bottom:20px;" />'.ignoreAll()
		);
	});

	test('HSpace', function() {
		expect(1);

		ok(
			this.plugin.signalToSource('', html2dom('<img hspace="20" />', true)).ignoreAll(),
			'<img style="margin-left:20px;margin-right:20px;" />'.ignoreAll() || '<img style="margin-right:20pxmargin-left:20px"/>'.ignoreAll()
		);
	});

	test('Big', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<big>test</big>', true)).ignoreAll(),
			'<span style="font-size:larger;">test</span>'.ignoreAll(),
			'Single <big>'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<big><big>test</big></big>', true)).ignoreAll(),
			'<span style="font-size:larger;"><span style="font-size:larger;">test</span></span>'.ignoreAll(),
			'Nested <big>'
		);
	});

	test('Small', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<small>test</small>', true)).ignoreAll(),
			'<span style="font-size:smaller;">test</span>'.ignoreAll(),
			'Single <small>'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<small><small>test</small></small>', true)).ignoreAll(),
			'<span style="font-size:smaller;"><span style="font-size:smaller;">test</span></span>'.ignoreAll(),
			'Nested <small>'
		);
	});

	test('B - Bold', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<b>test</b>', true)).ignoreSpace(),
			'<strong>test</strong>'.ignoreSpace()
		);
	});

	test('U - Underline', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<u>test</u>', true)).ignoreAll(),
			'<span style="text-decoration: underline;">test</span>'.ignoreAll()
		);
	});

	test('I - Italic', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<i>test</i>', true)).ignoreSpace(),
			'<em>test</em>'.ignoreSpace()
		);
	});

	test('Strikethrough', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<s>test</s>', true)).ignoreAll(),
			'<span style="text-decoration: line-through;">test</span>'.ignoreAll(),
			'S tag'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<strike>test</strike>', true)).ignoreAll(),
			'<span style="text-decoration: line-through;">test</span>'.ignoreAll(),
			'Strike tag'
		);
	});

	test('Dir tag', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<dir><li>test</li></dir>', true)).ignoreSpace(),
			'<ul><li>test</li></ul>'.ignoreSpace()
		);
	});

	test('Center tag', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<center>test</center>', true)).ignoreAll(),
			'<div style="text-align: center;">test</div>'.ignoreAll()
		);
	});

	test('Font', function() {
		expect(4);

		equal(
			this.plugin.signalToSource('', html2dom('<font>test</font>', true)).ignoreAll(),
			'<span>test</span>'.ignoreAll(),
			'Without attributes'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<font face="arial">test</font>', true)).ignoreAll(),
			'<span style="font-family: arial;">test</span>'.ignoreAll(),
			'With font attribute'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<font color="red">test</font>', true)).ignoreAll(),
			'<span style="color: red;">test</span>'.ignoreAll(),
			'With color attribute'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<font size="5">test</font>', true)).ignoreAll(),
			'<span style="font-size:24px;">test</span>'.ignoreAll(),
			'With size attribute'
		);
	});

	test('Nowrap attribute', function() {
		expect(1);

		equal(
			this.plugin.signalToSource('', html2dom('<table><tbody><tr><td nowrap>test</tr></tbody></table>', true)).ignoreAll(),
			'<table><tbody><tr><tdstyle=\"white-space:nowrap\">test</td></tr></tbody></table>'.ignoreAll()
		);
	});

	test('List item value attribute', function() {
		expect(2);

		equal(
			this.plugin.signalToSource('', html2dom('<ol><li value="2">test</li></ol>', true)).ignoreAll(),
			'<ol><li>test</li></ol>'.ignoreAll(),
			'li tag with value attribtue'
		);

		var ret = this.plugin.signalToSource('', html2dom('<input type="text" value="2" />', true)).ignoreAll();
		ok(
			/value="2"/.test(ret),
			'input with value attribute'
		);
	});

	test('Mozilla\'s junk attributes fix', function() {
		expect(4);

		equal(
			this.plugin.signalToSource('', html2dom('<br type="_moz">', true)),
			'<br />',
			'Type _moz on br'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div type="_moz">Bad Mozilla!</div>', true)).ignoreSpace(),
			'<div>Bad Mozilla!</div>'.ignoreSpace(),
			'Type _moz on div'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div _moz_dirty="">Mozilla attributes!</div>', true)).ignoreSpace(),
			'<div>Mozilla attributes!</div>'.ignoreSpace(),
			'_moz_dirty attribute on div'
		);

		equal(
			this.plugin.signalToSource('', html2dom('<div _moz_editor_bogus_node="">Shhh, I\'m not really here.</div>', true)).ignoreSpace(),
			''.ignoreSpace(),
			'_moz_editor_bogus_node attribute on div'
		);
	});
})();