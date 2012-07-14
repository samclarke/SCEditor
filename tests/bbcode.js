module("BBCode Parser", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
	}
});

test("White space removal", function() {
	expect(2);

	// pre used to populate the code tag in IE, could you a style.
	equal(
		this.sb.getHtmlHandler("", html2dom("<code><pre>Some            White \n      \n     space</pre></code>", true)).replace(/\r/g, '\n'),
		"[code]Some            White \n      \n     space[/code]",
		"Leave code spaces"
	);

	var ret = this.sb.getHtmlHandler("", html2dom("     <div>   lots   </div>   \n of   junk   \n\n\n\n\n         \n  j", true));

	ok(
		ret === "lots \n of junk j" || ret === "lots \nof junk j",
		"White Space Removal"
	);
});

test("Invalid nesting", function() {
	expect(1);

	var $dom = html2dom("<span style='color: #000'>this<blockquote>is</blockquote>a test</span>", true);
	$.sceditor.dom.fixNesting($dom[0]);

	equal(
		this.sb.getHtmlHandler("", $dom),
		"[color=#000000]this[/color][quote]is[/quote][color=#000000]a test[/color]",
		"Invalid block level nesting"
	);
});

test("Newlines DOM nesting", function() {
	expect(2);

	equal(
		this.sb.getHtmlHandler("", html2dom("textnode<div>new line before and after </div>textnode", true)),
		"textnode\nnew line before and after \ntextnode",
		"textnode before and after block level element"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("textnode <span>no new line before and after </span>textnode", true)),
		"textnode no new line before and after textnode",
		"textnode before and after inline element"
	);
});



module("HTML to BBCodes", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
	}
});

test("Bold", function() {
	expect(5);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-weight: bold'>test</span>", true)),
		"[b]test[/b]",
		"CSS bold"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-weight: 800'>test</span>", true)),
		"[b]test[/b]",
		"CSS bold"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-weight: normal'>test</span>", true)),
		"test",
		"CSS not bold"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b>test</b>", true)),
		"[b]test[/b]",
		"B tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<strong>test</strong>", true)),
		"[b]test[/b]",
		"Strong tag"
	);
});

test("Italic", function() {
	expect(5);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-style: italic'>test</span>", true)),
		"[i]test[/i]",
		"CSS italic"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-style: oblique'>test</span>", true)),
		"[i]test[/i]",
		"CSS oblique"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-style: normal'>test</span>", true)),
		"test",
		"CSS normal"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<em>test</em>", true)),
		"[i]test[/i]",
		"Em tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<i>test</i>", true)),
		"[i]test[/i]",
		"I tag"
	);
});

test("Underline", function() {
	expect(3);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='text-decoration: underline'>test</span>", true)),
		"[u]test[/u]",
		"CSS underline"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='text-decoration: normal'>test</span>", true)),
		"test",
		"CSS normal"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<u>test</u>", true)),
		"[u]test[/u]",
		"U tag"
	);
});

test("Strikethrough", function() {
	expect(4);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='text-decoration: line-through'>test</span>", true)),
		"[s]test[/s]",
		"CSS line-through"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='text-decoration: normal'>test</span>", true)),
		"test",
		"CSS normal"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<s>test</s>", true)),
		"[s]test[/s]",
		"S tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<strike>test</strike>", true)),
		"[s]test[/s]",
		"strike tag"
	);
});

test("Subscript", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<sub>test</sub>", true)),
		"[sub]test[/sub]",
		"Sub tag"
	);
});

test("Superscript", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<sup>test</sup>", true)),
		"[sup]test[/sup]",
		"Sup tag"
	);
});

test("Font face", function() {
	expect(6);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-family: Arial'>test</span>", true)),
		"[font=Arial]test[/font]",
		"CSS"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span  style='font-family: Arial Black'>test</span>", true)),
		"[font=Arial Black]test[/font]",
		"CSS space"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span  style='font-family: \"Arial Black\"'>test</span>", true)),
		"[font=Arial Black]test[/font]",
		"CSS space with quotes"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font face='Arial'>test</font>", true)),
		"[font=Arial]test[/font]",
		"Font tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font face='Arial Black'>test</font>", true)),
		"[font=Arial Black]test[/font]",
		"Font tag with space"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font face=\"'Arial Black'\">test</font>", true)),
		"[font=Arial Black]test[/font]",
		"Font tag with space & quotes"
	);
});

test("Size", function() {
	expect(6);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-size: 11px'>test</span>", true)),
		"[size=1]test[/size]",
		"CSS px"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-size: 1100px'>test</span>", true)),
		"[size=7]test[/size]",
		"CSS px too large"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-size: 0.5em'>test</span>", true)),
		"[size=1]test[/size]",
		"CSS em"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='font-size: 50%'>test</span>", true)),
		"[size=1]test[/size]",
		"CSS %"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font size='1'>test</font>", true)),
		"[size=1]test[/size]",
		"Size tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font size=1>test</font>", true)),
		"[size=1]test[/size]",
		"Size tag"
	);
});

test("Font colour", function() {
	expect(6);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='color: #000000'>test</span>", true)),
		"[color=#000000]test[/color]",
		"Normal"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='color: #000'>test</span>", true)),
		"[color=#000000]test[/color]",
		"Short hand"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span style='color: rgb(0,0,0)'>test</span>", true)),
		"[color=#000000]test[/color]",
		"RGB"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font color='#000'>test</span>", true)),
		"[color=#000000]test[/color]",
		"Font tag short"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font color='#000000'>test</span>", true)),
		"[color=#000000]test[/color]",
		"Font tag normal"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<font color='rgb(0,0,0)'>test</span>", true)),
		"[color=#000000]test[/color]",
		"Font tag rgb"
	);
});

test("List", function() {
	expect(2);

	equal(
		this.sb.getHtmlHandler("", html2dom("<ul><li>test</li></ul>", true)),
		"[ul][li]test[/li][/ul]",
		"UL tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<ol><li>test</li></ol>", true)),
		"[ol][li]test[/li][/ol]",
		"OL tag"
	);
});

test("Table", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<table><tr><th>test</th></tr><tr><td>data1</td></tr></table>", true)),
		"[table][tr][th]test[/th][/tr][tr][td]data1[/td][/tr][/table]",
		"Table tag"
	);
});

test("Emoticons", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<img data-sceditor-emoticon=':)' />", true)),
		":)",
		"Img tag"
	);
});

test("Horizontal rule", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<hr />", true)),
		"[hr]",
		"HR tag"
	);
});

test("Image", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<img width=10 height=10 src='http://test.com/test.png' />", true)),
		"[img=10x10]http://test.com/test.png[/img]",
		"Img tag"
	);
});

test("URL", function() {
	expect(3);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='http://test.com/'>Test</a>", true)),
		"[url=http://test.com/]Test[/url]",
		"A tag name"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='http://test.com/'>http://test.com</a>", true)),
		"[url=http://test.com/]http://test.com[/url]",
		"A tag URL"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='http://test.com/'></a>", true)),
		"[url=http://test.com/][/url]",
		"A tag empty"
	);
});

test("Email", function() {
	expect(3);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='mailto:test@test.com'>Test</a>", true)),
		"[email=test@test.com]Test[/email]",
		"A tag name"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='mailto:test@test.com'>test@test.com</a>", true)),
		"[email=test@test.com]test@test.com[/email]",
		"A tag e-mail"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<a href='mailto:test@test.com'></a>", true)),
		"[email=test@test.com][/email]",
		"A tag empty"
	);
});

test("Quote", function() {
	expect(4);

	equal(
		this.sb.getHtmlHandler("", html2dom("<blockquote>Testing 1.2.3....</blockquote>", true)),
		"[quote]Testing 1.2.3....[/quote]",
		"Simple quote"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<blockquote><cite>admin</cite>Testing 1.2.3....</blockquote>", true)),
		"[quote=admin]Testing 1.2.3....[/quote]",
		"Quote with cite (author)"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<blockquote><cite>admin</cite>Testing 1.2.3....<blockquote><cite>admin</cite>Testing 1.2.3....</blockquote></blockquote>", true)),
		"[quote=admin]Testing 1.2.3....[quote=admin]Testing 1.2.3....[/quote][/quote]",
		"Nested quote with cite (author)"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<blockquote><cite>admin</cite><cite>this should be ignored</cite> Testing 1.2.3....</blockquote>", true)),
		"[quote=admin]this should be ignored Testing 1.2.3....[/quote]",
		"Quote with 2 cites (author)"
	);
});

test("Code", function() {
	expect(2);

	equal(
		this.sb.getHtmlHandler("", html2dom("<code>Testing 1.2.3....</code>", true)),
		"[code]Testing 1.2.3....[/code]",
		"Simple code"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<code><b>ignore this</b> Testing 1.2.3....</code>", true)),
		"[code]ignore this Testing 1.2.3....[/code]",
		"Code with styling"
	);
});

test("Left", function() {
	expect(2);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div style='text-align: left'>test</div>", true)),
		"[left]test[/left]",
		"Div CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p style='text-align: left'>test</p>", true)),
		"[left]test[/left]",
		"P CSS text-align"
	);
});

test("Right", function() {
	expect(4);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div style='text-align: right'>test</div>", true)),
		"[right]test[/right]",
		"Div CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p style='text-align: right'>test</p>", true)),
		"[right]test[/right]",
		"P CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p align='right'>test</p>", true)),
		"[right]test[/right]",
		"P align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div align='right'>test</div>", true)),
		"[right]test[/right]",
		"Div align"
	);
});

test("Centre", function() {
	expect(4);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div style='text-align: center'>test</div>", true)),
		"[center]test[/center]",
		"Div CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p style='text-align: center'>test</p>", true)),
		"[center]test[/center]",
		"P CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p align='center'>test</p>", true)),
		"[center]test[/center]",
		"P align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div align='center'>test</div>", true)),
		"[center]test[/center]",
		"Div align"
	);
});

test("Justify", function() {
	expect(4);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div style='text-align: justify'>test</div>", true)),
		"[justify]test[/justify]",
		"Div CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p style='text-align: justify'>test</p>", true)),
		"[justify]test[/justify]",
		"P CSS text-align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<p align='justify'>test</p>", true)),
		"[justify]test[/justify]",
		"P align"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<div align='justify'>test</div>", true)),
		"[justify]test[/justify]",
		"Div align"
	);
});

test("YouTube", function() {
	expect(1);

	equal(
		this.sb.getHtmlHandler("", html2dom("<iframe data-youtube-id='xyz'></iframe>", true)),
		"[youtube]xyz[/youtube]",
		"Div CSS text-align"
	);
});



module("BBCode to HTML", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
	}
});

test("Bold", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[b]test[/b]").toLowerCase(),
		"<div><strong>test</strong></div>"
	);
});

test("Italic", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[i]test[/i]").toLowerCase(),
		"<div><em>test</em></div>"
	);
});

test("Underline", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[u]test[/u]").toLowerCase(),
		"<div><u>test</u></div>"
	);
});

test("Strikethrough", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[s]test[/s]").toLowerCase(),
		"<div><s>test</s></div>"
	);
});

test("Subscript", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[sub]test[/sub]").toLowerCase(),
		"<div><sub>test</sub></div>"
	);
});

test("Superscript", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[sup]test[/sup]").toLowerCase(),
		"<div><sup>test</sup></div>"
	);
});

test("Font face", function() {
	expect(3);

	equal(
		this.sb.getTextHandler("[font=arial]test[/font]"),
		html2dom("<div><font face=\"arial\">test</font></div>").innerHTML,
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[font=arial black]test[/font]"),
		html2dom("<div><font face=\"arial black\">test</font></div>").innerHTML,
		"Space"
	);

	equal(
		this.sb.getTextHandler("[font='arial black']test[/font]"),
		html2dom("<div><font face=\"arial black\">test</font></div>").innerHTML,
		"Quotes"
	);
});

test("Size", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[size=4]test[/size]"),
		html2dom("<div><font size=\"4\">test</font></div>").innerHTML,
		"Normal"
	);
});

test("Font colour", function() {
	expect(2);

	equal(
		this.sb.getTextHandler("[color=#000]test[/color]"),
		html2dom("<div><font color=\"#000\">test</font></div>").innerHTML,
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[color=black]test[/color]"),
		html2dom("<div><font color=\"black\">test</font></div>").innerHTML,
		"Named"
	);
});

test("List", function() {
	expect(2);

	equal(
		this.sb.getTextHandler("[ul][li]test[/li][/ul]"),
		html2dom("<ul><li>test</li></ul>").innerHTML,
		"UL"
	);

	equal(
		this.sb.getTextHandler("[ol][li]test[/li][/ol]"),
		html2dom("<ol><li>test</li></ol>").innerHTML,
		"OL"
	);
});

test("Table", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[table][tr][th]test[/th][/tr][tr][td]data1[/td][/tr][/table]"),
		html2dom("<table><tr><th>test</th></tr><tr><td>data1<br class=\"sceditor-ignore\"></td></tr></table>").innerHTML,
		"Normal"
	);
});

test("Horizontal rule", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[hr]").toLowerCase(),
		"<hr>",
		"Normal"
	);
});

test("Image", function() {
	expect(4);

	equal(
		this.sb.getTextHandler("[img=10x10]http://test.com/test.png[/img]"),
		html2dom("<div><img width=\"10\" height=\"10\" src=\"http://test.com/test.png\"></div>").innerHTML,
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[img width=10]http://test.com/test.png[/img]"),
		html2dom("<div><img width=\"10\" src=\"http://test.com/test.png\"></div>").innerHTML,
		"Width only"
	);

	equal(
		this.sb.getTextHandler("[img height=10]http://test.com/test.png[/img]"),
		html2dom("<div><img height=\"10\" src=\"http://test.com/test.png\"></div>").innerHTML,
		"Height only"
	);

	equal(
		this.sb.getTextHandler("[img]http://test.com/test.png[/img]").toLowerCase(),
		"<div><img src=\"http://test.com/test.png\"></div>",
		"No size"
	);
});

test("URL", function() {
	expect(2);


	equal(
		this.sb.getTextHandler("[url=http://test.com/]Test[/url]").toLowerCase(),
			"<div><a href=\"http://test.com/\">test</a></div>",
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[url]http://test.com/[/url]").toLowerCase(),
		"<div><a href=\"http://test.com/\">http://test.com/</a></div>",
		"Only URL"
	);
});

test("Email", function() {
	expect(2);

	equal(
		this.sb.getTextHandler("[email=test@test.com]test[/email]").toLowerCase(),
		"<div><a href=\"mailto:test@test.com\">test</a></div>",
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[email]test@test.com[/email]").toLowerCase(),
		"<div><a href=\"mailto:test@test.com\">test@test.com</a></div>",
		"Only e-mail"
	);
});

test("Quote", function() {
	expect(2);

	equal(
		this.sb.getTextHandler("[quote]Testing 1.2.3....[/quote]").toLowerCase(),
		"<blockquote>testing 1.2.3....</blockquote>",
		"Normal"
	);

	equal(
		this.sb.getTextHandler("[quote=admin]Testing 1.2.3....[/quote]").toLowerCase(),
		"<blockquote><cite>admin</cite>testing 1.2.3....</blockquote>",
		"With author"
	);
});

test("Code", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[code]Testing 1.2.3....[/code]").toLowerCase(),
		"<div><code>testing 1.2.3....</code></div>",
		"Normal"
	);
});

test("Left", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[left]Testing 1.2.3....[/left]"),
		html2dom("<div align=\"left\">Testing 1.2.3....</div>").innerHTML,
		"Normal"
	);
});

test("Right", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[right]Testing 1.2.3....[/right]"),
		html2dom("<div align=\"right\">Testing 1.2.3....</div>").innerHTML,
		"Normal"
	);
});

test("Centre", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[center]Testing 1.2.3....[/center]"),
		html2dom("<div align=\"center\">Testing 1.2.3....</div>").innerHTML,
		"Normal"
	);
});

test("Justify", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[justify]Testing 1.2.3....[/justify]"),
		html2dom("<div align=\"justify\">Testing 1.2.3....</div>").innerHTML,
		"Normal"
	);
});

test("YouTube", function() {
	expect(1);

	equal(
		this.sb.getTextHandler("[youtube]xyz[/youtube]"),
		html2dom("<div><iframe width=\"560\" height=\"315\" src=\"http://www.youtube.com/embed/xyz?wmode=opaque\" data-youtube-id=\"xyz\" frameborder=\"0\" allowfullscreen></iframe></div>").innerHTML,
		"Normal"
	);
});


test("Stripping empty", function() {
	expect(8);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><br /></b>", true)),
		"",
		"Bold tag with newline"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b></b>", true)),
		"",
		"Empty bold tag"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><br />Content</b>", true)),
		"[b]\nContent[/b]",
		"Bold tag with content"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><span><br /></span></b>", true)),
		"",
		"Bold tag with only whitespace content"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><span><span><span></span><span></span></span><br /></span></b>", true)),
		"",
		"Bold tag with only whitespace content"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><span><br />test<span></b>", true)),
		"[b]\ntest[/b]",
		"Bold tag with nested content"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><span><br /><span>test<span><span></b>", true)),
		"[b]\ntest[/b]",
		"Bold tag with nested content"
	);

	equal(
		this.sb.getHtmlHandler("", html2dom("<b><span><span><img src='test.png' /><span><span></b>", true)),
		"[b][img]test.png[/img][/b]",
		"Bold tag with nested content"
	);
});


test("Strip Quotes", function() {
	expect(2);

	equal(
		this.sb.getHtmlHandler("", html2dom("<span  style='font-family: \"Arial Black\"'>test</span>", true)),
		"[font=Arial Black]test[/font]",
		"Quotes that should be stripped"
	);

	var ret = this.sb.getHtmlHandler("", html2dom("<span  style=\"font-family: 'Arial Black', Arial\">test</span>", true));
	ok(
		ret === "[font='Arial Black', Arial]test[/font]" || ret === '[font="Arial Black", Arial]test[/font]',
		"Quotes that shouldn't be stripped"
	);
});