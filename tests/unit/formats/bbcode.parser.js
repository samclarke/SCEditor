import * as utils from 'tests/unit/utils.js';
import 'src/formats/bbcode.js';


QUnit.module('formats/bbcode#Parser', {
	beforeEach: function () {
		this.parser = new sceditor.BBCodeParser({});
	}
});


QUnit.test('Fix invalid nesting', function (assert) {
	assert.equal(
		utils.stripWhiteSpace(this.parser.toBBCode('[b]test[code]test[/code]test[/b]')),
		'[b]test[/b][code]test[/code][b]test[/b]',
		'Block level tag in an inline tag with content before and after'
	);

	assert.equal(
		utils.stripWhiteSpace(this.parser.toBBCode('[b]test[code]test[/code][/b]')),
		'[b]test[/b][code]test[/code]',
		'Block level tag in an inline tag with content before'
	);

	assert.equal(
		utils.stripWhiteSpace(
			this.parser.toBBCode('[b][i][s]test[code]test[/code]test[/s][/i][/b]')
		),
		'[b][i][s]test[/s][/i][/b][code]test[/code]' +
			'[b][i][s]test[/s][/i][/b]',
		'Deeply nested block in inline tags'
	);

	assert.equal(
		utils.stripWhiteSpace(
			this.parser.toBBCode('[size=3]test[code]test[/code]test[/size]')
		),
		'[size=3]test[/size][code]test[/code][size=3]test[/size]',
		'Preserve attributes'
	);

	assert.equal(
		this.parser.toBBCode(
			'[ul]' +
				'[color=#444444]' +
					'[li]test[/li]\n' +
					'[li]test[/li]\n' +
					'[li]test[/li]\n' +
				'[/color]' +
			'[/ul]'
		),
		'[ul]\n' +
			'[li][color=#444444]test[/color][/li]\n' +
			'[li][color=#444444]test[/color][/li]\n' +
			'[li][color=#444444]test[/color][/li]\n' +
		'[/ul]\n',
		'Move newlines'
	);
});


QUnit.test('Rename BBCode', function (assert) {
	sceditor.formats.bbcode.rename('b', 'testbold');
	this.parser = new sceditor.BBCodeParser({});

	assert.ok(
		!!sceditor.formats.bbcode.get('testbold'),
		'Can get renamed BBCode'
	);

	assert.ok(
		!sceditor.formats.bbcode.get('b'),
		'Cannot get BBCode by old name'
	);

	assert.equal(
		this.parser.toHTML('[testbold]test[/testbold]'),
		'<div><strong>test</strong></div>\n',
		'Will convert renamed BBCode'
	);

	sceditor.formats.bbcode.rename('testbold', 'b');

	assert.ok(
		!sceditor.formats.bbcode.get('testbold'),
		'Should not be able to get old BBCode name'
	);
});


QUnit.test('Self closing tag', function (assert) {
	assert.equal(
		this.parser.toBBCode('[hr]test'),
		'[hr]\ntest',
		'Self closing'
	);
});


QUnit.test('Tag closed by another tag', function (assert) {
	assert.equal(
		this.parser.toBBCode('[list][*] test[*] test 2[/list]'),
		'[list]\n[*] test[/*]\n[*] test 2[/*]\n[/list]\n',
		'List [*]'
	);
});



QUnit.test('BBCode closed outside block', function (assert) {
	assert.equal(
		this.parser.toBBCode('[b]test[code]test[/b][/code]test[/b]'),
		'[b]test[/b][code]test[/b][/code]\n[b]test[/b]',
		'Code with closing tag inside'
	);

	assert.equal(
		this.parser.toBBCode('[b]test[quote]test[/b][/quote]\ntest[/b]'),
		'[b]test[/b][quote][b]test[/b][/quote]\ntest[/b]',
		'Quote with closing tag inside'
	);

	assert.equal(
		this.parser.toBBCode('[code][b]something[/code]\n[b]something[/b]'),
		'[code][b]something[/code]\n[b]something[/b]',
		'Code with tag closed outside'
	);

	assert.equal(
		this.parser.toBBCode('[quote][b]something[/quote]\n[b]something[/b]'),
		'[quote][b]something[/b][/quote]\n[b][b]something[/b][/b]',
		'Quote with tag closed outside'
	);
});

QUnit.test('BBCode closed outside block - No children fix', function (assert) {
	this.parser = new sceditor.BBCodeParser({
		fixInvalidChildren: false
	});

	assert.equal(
		this.parser.toBBCode('[b]test[code]test[/b][/code]test[/b]'),
		'[b]test[/b][code][b]test[/b][/code]\ntest[/b]',
		'Code with closing tag inside'
	);

	assert.equal(
		this.parser.toBBCode('[b]test[quote]test[/b][/quote]\ntest[/b]'),
		'[b]test[/b][quote][b]test[/b][/quote]\ntest[/b]',
		'Quote with closing tag inside'
	);

	assert.equal(
		this.parser.toBBCode('[code][b]something[/code]\n[b]something[/b]'),
		'[code][b]something[/b][/code]\n[b][b]something[/b][/b]',
		'Code with tag closed outside'
	);

	assert.equal(
		this.parser.toBBCode('[quote][b]something[/quote]\n[b]something[/b]'),
		'[quote][b]something[/b][/quote]\n[b][b]something[/b][/b]',
		'Quote with tag closed outside'
	);
});


QUnit.test('Closing parent tag from child', function (assert) {
	assert.equal(
		this.parser.toBBCode('[b][color]test[/b][/color]'),
		'[b][color]test[/color][/b]',
		'Closing parent tag from child tag'
	);

	assert.equal(
		this.parser.toBBCode('[b]test[color]test[/b]test[/color]'),
		'[b]test[color]test[/color][/b][color]test[/color]',
		'Closing parent tag from child tag with content before and after'
	);

	assert.equal(
		this.parser.toBBCode('[b][s][i][color]test[/i][/s][/b][/color]'),
		'[b][s][i][color]test[/color][/i][/s][/b]',
		'Closing parent tag from deeply nested child tag'
	);

	assert.equal(
		this.parser.toBBCode('[color][b][s][i]test[/color][/i][/s][/b]'),
		'[color][b][s][i]test[/i][/s][/b][/color]',
		'Closing parent tag from deeply nested child tag'
	);

	assert.equal(
		this.parser.toBBCode('[left][list][*]xyz[/left][list][*]abc[/list]'),
		'[left][list]\n[*]xyz[/*]\n[/list]\n[/left]\n[list]\n[*][list]\n' +
			'[*]abc[/*]\n[/list]\n[/*]\n[/list]\n',
		'Closing parent tag from list item'
	);
});


QUnit.test('Missing tags', function (assert) {
	assert.equal(
		this.parser.toBBCode('[b][color][/b]'),
		'[b][color][/b]',
		'Missing closing tag'
	);

	assert.equal(
		this.parser.toBBCode('[b][/color][/b]'),
		'[b][/color][/b]',
		'Missing opening tag'
	);
});


QUnit.test('Unknown tags', function (assert) {
	assert.equal(
		this.parser.toBBCode('[b][unknown][/b]'),
		'[b][unknown][/b]',
		'Unknown tag missing end'
	);

	assert.equal(
		this.parser.toBBCode('[b][unknown]test[/unknown][/b]'),
		'[b][unknown]test[/unknown][/b]',
		'Unknown tag with end'
	);

	assert.equal(
		this.parser.toBBCode('[b][unknown][/unknown][/b]'),
		'[b][unknown][/unknown][/b]',
		'Empty unknown tag with end'
	);

	assert.equal(
		this.parser.toHTML('[b][unknown]test[/unknown][/b]'),
		'<div><strong>[unknown]test[/unknown]</strong></div>\n',
		'Empty unknown tag with end to HTML'
	);

	assert.htmlEqual(
		this.parser.toHTML('[nonexistant aaa]'),
		'<div>[nonexistant aaa]</div>\n',
		'Unknown tag with attribute'
	);
});

QUnit.test('Do not strip start and end spaces', function (assert) {
	assert.equal(
		this.parser.toHTML('\n\n[quote]test[/quote]\n\n\n\n'),
		'<div><br /></div>\n' +
		'<div><br /></div>\n' +
		'<blockquote>test<br /></blockquote>' +
		'<div><br /></div>\n' +
		'<div><br /></div>\n' +
		'<div><br /><br /></div>\n'
	);
});


QUnit.test('New Line Handling', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[list][*]test\n[*]test2\nline\n[/list]'),

		'<ul>' +
			'<li>test<br /></li>' +
			'<li>test2<br />line<br /></li>' +
		'</ul>',

		'List with non-closed [*]'
	);

	assert.htmlEqual(
		this.parser.toHTML('[code]test\nline\n[/code]'),
		'<code>test<br />line<br /><br /></code>',
		'Code test'
	);

	assert.htmlEqual(
		this.parser.toHTML('[quote]test\nline\n[/quote]'),
		'<blockquote>test<br />line<br /><br /></blockquote>',
		'Quote test'
	);

	assert.htmlEqual(
		this.parser.toHTML('[quote][center]test[/center][/quote]'),

		'<blockquote>' +
			'<div align="center">test<br /></div>' +
		'</blockquote>',

		'Two block-level elements together'
	);
});


QUnit.test('Attributes QuoteType.auto', function (assert) {
	// Remove the [quote] tag default quoteType so will use the default
	// one specified by the parser
	sceditor.formats.bbcode.set('quote', {
		quoteType: null
	});

	this.parser = new sceditor.BBCodeParser({
		quoteType: sceditor.BBCodeParser.QuoteType.auto
	});

	assert.equal(
		this.parser.toBBCode(
			'[quote author=poster date=1353794172 ' +
				'link=topic=2.msg4#msg4]hi[/quote]'
		),
		'[quote author=poster date=1353794172 ' +
				'link="topic=2.msg4#msg4"]hi[/quote]\n',
		'Attribute with value that contains an equals'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster\\\'s\']hi[/quote]'
		),
		'[quote author=poster\'s]hi[/quote]\n',
		'Quoted attribute with a single quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster"s\']hi[/quote]'
		),
		'[quote author=poster"s]hi[/quote]\n',
		'Quoted attribute with a double quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=This is all the author date=12345679]hi[/quote]'
		),
		'[quote author="This is all the author" date=12345679]hi[/quote]\n',
		'Attribute with spaces'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote=te=st test=ex=tra]hi[/quote]'
		),
		'[quote="te=st" test="ex=tra"]hi[/quote]\n',
		'Default attribute with equal'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote ' +
				'quoted=\'words word=word\\\' link=lala=lalala\' ' +
				'author=anything that does not have an equals after it ' +
				'date=1353794172 ' +
				'link=anythingEvenEquals=no space up to the equals ' +
				'test=la' +
			']asd[/quote]'
		),
		'[quote ' +
			'quoted="words word=word\' link=lala=lalala" ' +
			'author="anything that does not have an equals after it" ' +
			'date=1353794172 ' +
			'link="anythingEvenEquals=no space up to the equals" ' +
			'test=la' +
		']asd[/quote]\n',
		'Multi-Attribute test'
	);

	// Reset [quote]'s default quoteType
	sceditor.formats.bbcode.set('quote', {
		quoteType: sceditor.BBCodeParser.QuoteType.never
	});
});


QUnit.test('Attributes QuoteType.never', function (assert) {
	// Remove the [quote] tag default quoteType so will use the default
	// one specified by the parser
	sceditor.formats.bbcode.set('quote', {
		quoteType: null
	});

	this.parser = new $.sceditor.BBCodeParser({
		quoteType: $.sceditor.BBCodeParser.QuoteType.never
	});

	assert.equal(
		this.parser.toBBCode(
			'[quote author=poster date=1353794172 ' +
				'link=topic=2.msg4#msg4]hi[/quote]'
		),
		'[quote author=poster date=1353794172 ' +
				'link=topic=2.msg4#msg4]hi[/quote]\n',
		'Attribute with value that contains an equals'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster\\\'s\']hi[/quote]'
		),
		'[quote author=poster\'s]hi[/quote]\n',
		'Quoted attribute with a single quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster"s\']hi[/quote]'
		),
		'[quote author=poster"s]hi[/quote]\n',
		'Quoted attribute with a double quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=This is all the author date=12345679]hi[/quote]'
		),
		'[quote author=This is all the author date=12345679]hi[/quote]\n',
		'Attribute with spaces'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote=te=st test=ex=tra]hi[/quote]'
		),
		'[quote=te=st test=ex=tra]hi[/quote]\n',
		'Default attribute with equal'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote ' +
				'quoted=\'words word=word\\\' link=lala=lalala\' ' +
				'author=anything that does not have an equals after it ' +
				'date=1353794172 ' +
				'link=anythingEvenEquals=no space up to the equals ' +
				'test=la' +
			']asd[/quote]'
		),
		'[quote ' +
			'quoted=words word=word\' link=lala=lalala ' +
			'author=anything that does not have an equals after it ' +
			'date=1353794172 ' +
			'link=anythingEvenEquals=no space up to the equals ' +
			'test=la' +
		']asd[/quote]\n',
		'Multi-Attribute test'
	);

	// Reset [quote]'s default quoteType
	sceditor.formats.bbcode.set('quote', {
		quoteType: sceditor.BBCodeParser.QuoteType.never
	});
});


QUnit.test('Attributes QuoteType.always', function (assert) {
	// Remove the [quote] tag default quoteType so will use the default
	// one specified by the parser
	sceditor.formats.bbcode.set('quote', {
		quoteType: null
	});

	this.parser = new $.sceditor.BBCodeParser({
		quoteType: $.sceditor.BBCodeParser.QuoteType.always
	});

	assert.equal(
		this.parser.toBBCode(
			'[quote author=poster date=1353794172 ' +
				'link=topic=2.msg4#msg4]hi[/quote]'
		),
		'[quote author="poster" date="1353794172" ' +
				'link="topic=2.msg4#msg4"]hi[/quote]\n',
		'Attribute with value that contains an equals'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster\\\'s\']hi[/quote]'
		),
		'[quote author="poster\'s"]hi[/quote]\n',
		'Quoted attribute with a single quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster"s\']hi[/quote]'
		),
		'[quote author="poster\\"s"]hi[/quote]\n',
		'Quoted attribute with a double quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=This is all the author date=12345679]hi[/quote]'
		),
		'[quote author="This is all the author" ' +
			'date="12345679"]hi[/quote]\n',
		'Attribute with spaces'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote=te=st test=ex=tra]hi[/quote]'
		),
		'[quote="te=st" test="ex=tra"]hi[/quote]\n',
		'Default attribute with equal'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote="test\\"s\\"s" test="test\\"s\\"s"]hi[/quote]'
		),
		'[quote="test\\"s\\"s" test="test\\"s\\"s"]hi[/quote]\n',
		'Attribute with multiple quotes inside'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote ' +
				'quoted=\'words word=word\\\' link=lala=lalala\' ' +
				'author=anything that does not have an equals after it ' +
				'date=1353794172 ' +
				'link=anythingEvenEquals=no space up to the equals ' +
				'test=la' +
			']asd[/quote]'
		),
		'[quote ' +
			'quoted="words word=word\' link=lala=lalala" ' +
			'author="anything that does not have an equals after it" ' +
			'date="1353794172" ' +
			'link="anythingEvenEquals=no space up to the equals" ' +
			'test="la"' +
		']asd[/quote]\n',
		'Multi-Attribute test'
	);

	// Reset [quote]'s default quoteType
	sceditor.formats.bbcode.set('quote', {
		quoteType: sceditor.BBCodeParser.QuoteType.never
	});
});


QUnit.test('Attributes QuoteType custom', function (assert) {
	// Remove the [quote] tag default quoteType so will use the default
	// one specified by the parser
	sceditor.formats.bbcode.set('quote', {
		quoteType: null
	});

	this.parser = new $.sceditor.BBCodeParser({
		quoteType: function (str) {
			return '\'' +
				str.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') +
				'\'';
		}
	});

	assert.equal(
		this.parser.toBBCode(
			'[quote author=poster date=1353794172 ' +
				'link=topic=2.msg4#msg4]hi[/quote]'
		),
		'[quote author=\'poster\' date=\'1353794172\' ' +
				'link=\'topic=2.msg4#msg4\']hi[/quote]\n',
		'Attribute with value that contains an equals'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster\\\'s\\\'s\']hi[/quote]'
		),
		'[quote author=\'poster\\\'s\\\'s\']hi[/quote]\n',
		'Quoted attribute with a single quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=\'poster"s\']hi[/quote]'
		),
		'[quote author=\'poster"s\']hi[/quote]\n',
		'Quoted attribute with a double quote'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote author=This is all the author date=12345679]hi[/quote]'
		),
		'[quote author=\'This is all the author\' ' +
			'date=\'12345679\']hi[/quote]\n',
		'Attribute with spaces'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote=te=st test=ex=tra]hi[/quote]'
		),
		'[quote=\'te=st\' test=\'ex=tra\']hi[/quote]\n',
		'Default attribute with equal'
	);

	assert.equal(
		this.parser.toBBCode(
			'[quote ' +
				'quoted=\'words word=word\\\' link=lala=lalala\' ' +
				'author=anything that does not have an equals after it ' +
				'date=1353794172 ' +
				'link=anythingEvenEquals=no space up to the equals ' +
				'test=la' +
			']asd[/quote]'
		),
		'[quote ' +
			'quoted=\'words word=word\\\' link=lala=lalala\' ' +
			'author=\'anything that does not have an equals after it\' ' +
			'date=\'1353794172\' ' +
			'link=\'anythingEvenEquals=no space up to the equals\' ' +
			'test=\'la\'' +
		']asd[/quote]\n',
		'Multi-Attribute test'
	);

	// Reset [quote]'s default quoteType
	sceditor.formats.bbcode.set('quote', {
		quoteType: sceditor.BBCodeParser.QuoteType.never
	});
});


QUnit.module('formats/bbcode#Parser - To HTML', {
	beforeEach: function () {
		this.parser = new sceditor.BBCodeParser({});
	}
});


QUnit.test('Bold', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[b]test[/b]'),
		'<div><strong>test</strong></div>\n'
	);
});


QUnit.test('Italic', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[i]test[/i]'),
		'<div><em>test</em></div>\n'
	);
});


QUnit.test('Underline', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[u]test[/u]'),
		'<div><u>test</u></div>\n'
	);
});


QUnit.test('Strikethrough', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[s]test[/s]'),
		'<div><s>test</s></div>\n'
	);
});


QUnit.test('Subscript', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[sub]test[/sub]'),
		'<div><sub>test</sub></div>\n'
	);
});


QUnit.test('Superscript', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[sup]test[/sup]'),
		'<div><sup>test</sup></div>\n'
	);
});


QUnit.test('Font face', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[font=arial]test[/font]'),
		'<div><font face="arial">test</font></div>\n',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[font=arial black]test[/font]'),
		'<div><font face="arial black">test</font></div>\n',
		'Space'
	);

	assert.htmlEqual(
		this.parser.toHTML('[font="arial black"]test[/font]'),
		'<div><font face="arial black">test</font></div>\n',
		'Quotes'
	);
});


QUnit.test('Size', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[size=4]test[/size]'),
		'<div><font size="4">test</font></div>\n',
		'Normal'
	);
});


QUnit.test('Font colour', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[color=#000]test[/color]'),
		'<div><font color="#000000">test</font></div>\n',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[color=black]test[/color]'),
		'<div><font color="black">test</font></div>\n',
		'Named'
	);
});


QUnit.test('List', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[ul][li]test[/li][/ul]'),
		'<ul><li>test<br /></li></ul>',
		'UL'
	);

	assert.htmlEqual(
		this.parser.toHTML('[ol][li]test[/li][/ol]'),
		'<ol><li>test<br /></li></ol>',
		'OL'
	);

	assert.htmlEqual(
		this.parser.toHTML('[ul][li]test[ul][li]sub[/li][/ul][/li][/ul]'),
		'<ul><li>test<ul><li>sub<br /></li></ul></li></ul>',
		'Nested UL'
	);
});


QUnit.test('Table', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[table][tr][th]test[/th][/tr]' +
			'[tr][td]data1[/td][/tr][/table]'),
		'<div><table><tr><th>test<br /></th></tr>' +
			'<tr><td>data1<br /></td></tr></table></div>\n',
		'Normal'
	);
});


QUnit.test('Horizontal rule', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[hr]'),
		'<hr />',
		'Normal'
	);
});


QUnit.test('Image', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[img=10x10]http://test.com/test.png[/img]'),
		'<div><img width="10" height="10" ' +
			'src="http://test.com/test.png" /></div>\n',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[img width=10]http://test.com/test.png[/img]'),
		'<div><img width="10" src="http://test.com/test.png" /></div>\n',
		'Width only'
	);

	assert.htmlEqual(
		this.parser.toHTML('[img height=10]http://test.com/test.png[/img]'),
		'<div><img height="10" src="http://test.com/test.png" /></div>\n',
		'Height only'
	);

	assert.htmlEqual(
		this.parser.toHTML('[img]http://test.com/test.png[/img]'),
		'<div><img src="http://test.com/test.png" /></div>\n',
		'No size'
	);

	assert.htmlEqual(
		this.parser.toHTML(
			'[img]http://test.com/test.png?test&&test[/img]'
		),
		'<div><img src="http://test.com/test.png?test&amp;&amp;test" ' +
			'/></div>\n',
		'Ampersands in URL'
	);
});


QUnit.test('URL', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[url=http://test.com/]test[/url]'),
		'<div><a href="http://test.com/">test</a></div>\n',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[url]http://test.com/[/url]'),
		'<div><a href="http://test.com/">http://test.com/</a></div>\n',
		'Only URL'
	);

	assert.htmlEqual(
		this.parser.toHTML('[url=http://test.com/?test&&test]test[/url]'),
		'<div><a href="http://test.com/?test&amp;&amp;test">' +
			'test</a></div>\n',
		'Ampersands in URL'
	);

	assert.htmlEqual(
		this.parser.toHTML('[url]http://test.com/?test&&test[/url]'),
		'<div><a href="http://test.com/?test&amp;&amp;test">' +
			'http://test.com/?test&amp;&amp;test</a></div>\n',
		'Ampersands in URL'
	);
});


QUnit.test('Email', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[email=test@test.com]test[/email]'),
		'<div><a href="mailto:test@test.com">test</a></div>\n',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[email]test@test.com[/email]'),
		'<div><a href="mailto:test@test.com">test@test.com</a></div>\n',
		'Only e-mail'
	);
});


QUnit.test('Quote', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[quote]Testing 1.2.3....[/quote]'),
		'<blockquote>Testing 1.2.3....<br /></blockquote>',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[quote=admin]Testing 1.2.3....[/quote]'),
		'<blockquote><cite>admin</cite>Testing 1.2.3....<br /></blockquote>',
		'With author'
	);
});


QUnit.test('Code', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[code]Testing 1.2.3....[/code]'),
		'<code>Testing 1.2.3....<br /></code>',
		'Normal'
	);

	assert.htmlEqual(
		this.parser.toHTML('[code]Testing [b]test[/b][/code]'),
		'<code>Testing [b]test[/b]<br /></code>',
		'Normal'
	);
});


QUnit.test('Left', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[left]Testing 1.2.3....[/left]'),
		'<div align="left">Testing 1.2.3....<br /></div>',
		'Normal'
	);
});


QUnit.test('Right', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[right]Testing 1.2.3....[/right]'),
		'<div align="right">Testing 1.2.3....<br /></div>',
		'Normal'
	);
});


QUnit.test('Centre', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[center]Testing 1.2.3....[/center]'),
		'<div align="center">Testing 1.2.3....<br /></div>',
		'Normal'
	);
});


QUnit.test('Justify', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[justify]Testing 1.2.3....[/justify]'),
		'<div align="justify">Testing 1.2.3....<br /></div>',
		'Normal'
	);
});


QUnit.test('YouTube', function (assert) {
	assert.htmlEqual(
		this.parser.toHTML('[youtube]xyz[/youtube]'),
		'<div><iframe width="560" height="315" ' +
			'src="https://www.youtube-nocookie.com/embed/xyz?wmode=opaque" ' +
			'data-youtube-id="xyz" frameborder="0" allowfullscreen>' +
			'</iframe></div>\n',
		'Normal'
	);
});


QUnit.module('formats/bbcode#Parser - XSS', {
	beforeEach: function () {
		this.parser = new sceditor.BBCodeParser({});
	}
});


QUnit.test('[img]', function (assert) {
	assert.equal(
		this.parser.toHTML('[img]fake.png" onerror="alert(' +
			'String.fromCharCode(88,83,83))[/img]'),
		'<div><img src="fake.png&#34; onerror=&#34;alert(' +
			'String.fromCharCode(88,83,83))" /></div>\n',
		'Inject attribute'
	);

	assert.ok(
		!/src="javascript:/i.test(
			this.parser.toHTML('[img]javascript:alert(' +
				'String.fromCharCode(88,83,83))[/img]')
		),
		'JavaScript URL'
	);

	assert.ok(
		!/src="javascript:/i.test(
			this.parser.toHTML('[img]JaVaScRiPt:alert(' +
				'String.fromCharCode(88,83,83))[/img]')
		),
		'JavaScript URL casing'
	);

	assert.ok(
		!/src="jav/i.test(
			this.parser.toHTML('[img]jav&#x0A;ascript:alert(' +
				'String.fromCharCode(88,83,83))[/img]')
		),
		'JavaScript URL entities'
	);

	assert.ok(
		!/[img]onerror=j/i.test(
			this.parser.toHTML('[img]http://foo.com/fake.png [img] ' +
				'onerror=javascript:alert(String.fromCharCode(88,83,83))' +
				' [/img] [/img]')
		),
		'Nested [img]'
	);

	assert.equal(
		this.parser.toHTML('[img=\'"2]uri[/img]'),
		'<div><img width="&#39;&#34;2" height="&#39;&#34;2" src="uri" />' +
			'</div>\n',
		'Dimension attribute injection'
	);

	assert.equal(
		this.parser.toHTML('[img=\'"2x3]uri[/img]'),
		'<div><img width="&#39;&#34;2" height="3" src="uri" /></div>\n',
		'Width attribute injection'
	);

	assert.equal(
		this.parser.toHTML('[img=3x\'"2]uri[/img]'),
		'<div><img width="3" height="&#39;&#34;2" src="uri" /></div>\n',
		'Width attribute injection'
	);
});


QUnit.test('[url]', function (assert) {
	assert.equal(
		this.parser.toHTML(
			'[url]fake.png" ' +
				'onmouseover="alert(String.fromCharCode(88,83,83))[/url]'
		),

		'<div>' +
			'<a href="fake.png&#34; onmouseover=&#34;' +
				'alert(String.fromCharCode(88,83,83))">' +
					'fake.png&#34; onmouseover=&#34;alert(' +
					'String.fromCharCode(88,83,83))' +
			'</a>' +
		'</div>\n',

		'Inject attribute'
	);

	assert.ok(
		!/href="javascript:/i.test(
			this.parser.toHTML('[url]javascript:alert(' +
				'String.fromCharCode(88,83,83))[/url]')
		),
		'JavaScript URL'
	);

	assert.ok(
		!/href="javascript:/i.test(
			this.parser.toHTML('[url]JaVaScRiPt:alert(' +
				'String.fromCharCode(88,83,83))[/url]')
		),
		'JavaScript URL casing'
	);

	assert.ok(
		!/href="jav/i.test(
			this.parser.toHTML('[url]jav&#x0A;ascript:alert(' +
				'String.fromCharCode(88,83,83))[/url]')
		),
		'JavaScript URL entities'
	);

	assert.ok(
		!/href="jav/i.test(
			this.parser.toHTML('[url]jav	ascript:alert("XSS");[/url]')
		),
		'JavaScript URL entities'
	);

	assert.equal(
		this.parser.toHTML('[url]test@test.test<b>tet</b>[/url]'),
		'<div><a href="test@test.test&lt;b&gt;tet&lt;/b&gt;">' +
			'test@test.test&lt;b&gt;tet&lt;/b&gt;</a></div>\n',
		'Inject HTML'
	);

	assert.equal(
		this.parser.toHTML('[url=&#106;&#97;&#118;&#97;&#115;&#99;&#114;' +
			'&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;' +
			'&#39;&#88;&#83;&#83;&#39;&#41;]XSS[/url]'),

		'<div><a href="&amp;#106;&amp;#97;&amp;#118;&amp;#97;&amp;#115;' +
			'&amp;#99;&amp;#114;&amp;#105;&amp;#112;&amp;#116;&amp;#58;' +
			'&amp;#97;&amp;#108;&amp;#101;&amp;#114;&amp;#116;&amp;#40;' +
			'&amp;#39;&amp;#88;&amp;#83;&amp;#83;&amp;#39;&amp;#41;">' +
			'XSS</a></div>\n',

		'Inject HTML'
	);
});


QUnit.test('[email]', function (assert) {
	assert.equal(
		this.parser.toHTML(
			'[email]' +
				'fake@fake.com" onmouseover="alert(' +
					'String.fromCharCode(88,83,83))' +
			'[/email]'
		),

		'<div><a href="mailto:fake@fake.com&#34; ' +
			'onmouseover=&#34;alert(String.fromCharCode(88,83,83))">' +
			'fake@fake.com&#34; onmouseover=&#34;alert(' +
			'String.fromCharCode(88,83,83))</a></div>\n',

		'Inject attribute'
	);

	assert.equal(
		this.parser.toHTML('[email]test@test.test<b>tet</b>[/email]'),
		'<div><a href="mailto:test@test.test&lt;b&gt;tet&lt;/b&gt;">' +
			'test@test.test&lt;b&gt;tet&lt;/b&gt;</a></div>\n',
		'Inject HTML'
	);
});


QUnit.test('CSS injection', function (assert) {
	assert.equal(
		this.parser.toHTML('[color=#ff0000;xss:expression(' +
			'alert(String.fromCharCode(88,83,83)))]XSS[/color]'),
		'<div><font color="#ff0000;xss:expression(' +
			'alert(String.fromCharCode(88,83,83)))">XSS</font></div>\n',
		'Inject CSS expression'
	);

	assert.equal(
		this.parser.toHTML('[font=Impact, sans-serif;xss:expression(' +
			'alert(String.fromCharCode(88,83,83)))]XSS[/font]'),
		'<div><font face="Impact, sans-serif;xss:expression(' +
			'alert(String.fromCharCode(88,83,83)))">XSS</font></div>\n',
		'Inject CSS expression'
	);
});

QUnit.test('Break out of attribute', function (assert) {
	assert.equal(
		this.parser.toHTML('[font=Impact"brokenout]XSS[/font]'),
		'<div><font face="Impact&#34;brokenout">XSS</font></div>\n',
		'Inject CSS expression'
	);
});


QUnit.test('HTML injection', function (assert) {
	assert.equal(
		this.parser.toHTML('<script>alert("Hello");</script>'),
		'<div>&lt;script&gt;alert(&#34;Hello&#34;);&lt;/script&gt;</div>\n',
		'Inject HTML script'
	);

	assert.equal(
		this.parser.toHTML('[quote=test<b>test</b>test]test[/quote]'),
		'<blockquote><cite>test&lt;b&gt;test&lt;/b&gt;test</cite>' +
			'test<br /></blockquote>',
		'Inject HTML script'
	);
});
