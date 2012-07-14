// Using BBCode for tests as it normalises the HTML which can be very diffrent in each browser
module("SCEditor", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
		this.s = textarea.data("sceditor");
	}
});


test("Insert HTML", function() {
	expect(1);

	this.s.wysiwygEditorInsertHtml("<span>simple <b>test</b></span>")
	equal(
		this.s.getWysiwygEditorValue(),
		"simple [b]test[/b]"
	);
});

test("Insert HTML two parts", function() {
	expect(1);

	this.s.wysiwygEditorInsertHtml("<span>simple ", "<b>test</b></span>")
	equal(
		this.s.getWysiwygEditorValue(),
		"simple [b]test[/b]"
	);
});

module("SCEditor Commands", {
	setup: function() {
		var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
		this.sb = textarea.data("sceditorbbcode");
		this.s = textarea.data("sceditor");
	}
});

test("Quote", function() {
	expect(1);

	this.s.commands.quote.exec.call(this.s, null, "Simple <b>test</b>")
	equal(
		this.s.getWysiwygEditorValue(),
		"[quote]Simple [b]test[/b][/quote]"
	);
});

test("Quote with author", function() {
	expect(1);

	this.s.commands.quote.exec.call(this.s, null, "Simple <b>test</b>", "admin")
	equal(
		this.s.getWysiwygEditorValue(),
		"[quote=admin]Simple [b]test[/b][/quote]"
	);
});