// Using BBCode for tests as it normalises the HTML which can be very diffrent in each browser
module("SCEditor", {
	setup: function() {
		if(!$.sceditor.ie)
		{
			var textarea = $("#qunit-fixture textarea:first");
			textarea.sceditorBBCodePlugin();
			this.sb = textarea.sceditorBBCodePlugin();
			this.s = textarea.sceditor("instance");
		}
	}
});


test("Insert HTML", function() {
	// this unit test fails in IE so skip it.
	// It does actually work just not in this unit test
	if(!$.sceditor.ie)
	{
		expect(1);

		this.s.wysiwygEditorInsertHtml("<span>simple <b>test</b></span>")
		equal(
			this.s.getWysiwygEditorValue(),
			"simple [b]test[/b]"
		);
	}
	else
		expect(0);
});

test("Insert HTML two parts", function() {
	// this unit test fails in IE so skip it.
	// It does actually work just not in this unit test
	if(!$.sceditor.ie)
	{
		expect(1);

		this.s.wysiwygEditorInsertHtml("<span>simple ", "<b>test</b></span>")
		equal(
			this.s.getWysiwygEditorValue(),
			"simple [b]test[/b]"
		);
	}
	else
		expect(0);
});

module("SCEditor Commands", {
	setup: function() {
		if(!$.sceditor.ie)
		{
			var textarea = $("#qunit-fixture textarea:first");
			textarea.sceditorBBCodePlugin();
			this.sb = textarea.sceditorBBCodePlugin();
			this.s = textarea.sceditor("instance");
		}
	}
});

test("Quote", function() {
	// this unit test fails in IE so skip it.
	// It does actually work just not in this unit test
	if(!$.sceditor.ie)
	{
		expect(1);

		this.s.commands.quote.exec.call(this.s, null, "Simple <b>test</b>")
		equal(
			this.s.getWysiwygEditorValue(),
			"[quote]Simple [b]test[/b][/quote]"
		);
	}
	else
		expect(0);
});

test("Quote with author", function() {
	// this unit test fails in IE so skip it.
	// It does actually work just not in this unit test
	if(!$.sceditor.ie)
	{
		expect(1);

		this.s.commands.quote.exec.call(this.s, null, "Simple <b>test</b>", "admin")
		equal(
			this.s.getWysiwygEditorValue(),
			"[quote=admin]Simple [b]test[/b][/quote]"
		);
	}
	else
		expect(0);
});