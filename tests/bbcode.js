module("BBCode Parser", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
	}
});

test("White space removal", function() {
	expect(2);
	
	var code = document.createElement("div");
	var space = document.createElement("div");
	code.innerHTML = "&nbsp; &nbsp; &nbsp;\n<code>Some            White \n      \n     space</code>";
	space.innerHTML = "     <div>   lots   </div>   \n of   junk   \n\n\n\n\n         \n  j";

	equal(
		this.sb.getTextHandler(this.sb.getHtmlHandler("", $(code))),
		"<code><div>Some &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;White </div><div> &nbsp; &nbsp; &nbsp;</div> &nbsp; &nbsp; space</code>",
		"Leave non-breaking & code spaces"
	);
	equal(
		this.sb.getTextHandler(this.sb.getHtmlHandler("", $(space))),
		"<div>lots </div> of junk j",
		"White Space Removal"
	);
});

test("Invalid nesting", function() {
	expect(2);
	
	var test1 = document.createElement("div");
	var test2 = document.createElement("div");
	test1.innerHTML = "<b><i>test</b>test2</i>";
	test2.innerHTML = "<span style='color: #000'>this<blockquote>is</blockquote>a test</span>";
	
	// Opera fails if test2 dom is not rendered
	$("#qunit-fixture").append(test2);
	
	$.sceditor.dom.fixNesting(test2);
	
	equal(
		this.sb.getHtmlHandler("", $(test1)),
		"[b][i]test[/i][/b][i]test2[/i]",
		"Invalid tag nesting"
	);
	equal(
		this.sb.getHtmlHandler("", $(test2)),
		"[color=#000000]this[/color][quote]is[/quote][color=#000000]a test[/color]",
		"Invalid block level nesting"
	);
});


module("BBCodes", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
	}
});

test("Font colour", function() {
	expect(3);
	
	var test1 = document.createElement("div");
	var test2 = document.createElement("div");
	var test3 = document.createElement("div");
	test1.innerHTML = "<span style='color: #000000'>test</span>";
	test2.innerHTML = "<span style='color: #000'>test</span>";
	test3.innerHTML = "<span style='color: rgb(0,0,0)'>test</span>";
	
	equal(this.sb.getHtmlHandler("", $(test1)),
		"[color=#000000]test[/color]",
		"Normal");
	equal(this.sb.getHtmlHandler("", $(test2)),
		"[color=#000000]test[/color]",
		"Short hand");
	equal(this.sb.getHtmlHandler("", $(test3)),
		"[color=#000000]test[/color]",
		"RGB");
});