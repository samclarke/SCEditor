/*global module: true, $: true, test: true, expect: true, equal: true*/
(function() {
	"use strict";

	// Using BBCode for tests as it normalises the HTML which can be very diffrent in each browser
	module("SCEditor", {
		setup: function() {
			var $textarea = $("#qunit-fixture textarea:first");

			$textarea.sceditor({
				plugins: 'bbcode'
			});

			this.sceditor = $textarea.sceditor("instance");
		},
		teardown: function() {
			this.sceditor.destroy();
			this.sceditor = null;
		}
	});

	test("Insert HTML", function() {
		expect(1);

		this.sceditor.wysiwygEditorInsertHtml("<span>simple <b>test</b></span>");
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);
	});

	test("Insert HTML two parts", function() {
		expect(1);

		this.sceditor.wysiwygEditorInsertHtml("<span>simple ", "<b>test</b></span>");
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);
	});

	test("Insert HTML two parts without filter", function() {
		expect(1);

		this.sceditor.insert("<span>simple ", "<b>test</b></span>", false);
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);
	});

	test("Insert BBCode two parts", function() {
		expect(1);

		this.sceditor.insert("simple ", "[b]test[/b]");
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);
	});

	test("Insert mixed", function() {
		expect(1);

		this.sceditor.insert("<i>simple</i> [b]test[/b]", null, true, true, true);
		equal(
			this.sceditor.val(),
			"[i]simple[/i] [b]test[/b]"
		);
	});

	test("Insert mixed with escaped HTML", function() {
		expect(1);

		this.sceditor.insert("<i>simple</i>&lt;i&gt;test&lt;/i&gt; [b]test[/b]", null, true, true, true);
		equal(
			this.sceditor.val(),
			// This HTML is in BBCode so it is actually escaped.
			"[i]simple[/i]<i>test</i> [b]test[/b]"
		);
	});

	test("Insert mixed two parts", function() {
		expect(1);

		this.sceditor.insert("<i>simple</i> ", "[b]test[/b]", true, true, true);
		equal(
			this.sceditor.val(),
			"[i]simple[/i] [b]test[/b]"
		);
	});

	test("Val", function() {
		expect(2);

		this.sceditor.val("simple [b]test[/b]");
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);

		this.sceditor.val("simple <b>test</b>");
		equal(
			this.sceditor.val(),
			"simple <b>test</b>"
		);
	});

	test("Val filter", function() {
		expect(1);

		this.sceditor.val("<span>simple <b>test</b></span>", false);
		equal(
			this.sceditor.val(),
			"simple [b]test[/b]"
		);
	});


	module("SCEditor Commands", {
		setup: function() {
			var $textarea = $("#qunit-fixture textarea:first");

			$textarea.sceditor({
				plugins: 'bbcode'
			});

			this.sceditor = $textarea.sceditor("instance");
		},
		teardown: function() {
			this.sceditor.destroy();
			this.sceditor = null;
		}
	});

	test("Quote", function() {
		expect(1);

		this.sceditor.commands.quote.exec.call(this.sceditor, null, "Simple <b>test</b>");
		equal(
			this.sceditor.val(),
			"[quote]Simple [b]test[/b][/quote]"
		);
	});

	test("Quote with author", function() {
		expect(1);

		this.sceditor.commands.quote.exec.call(this.sceditor, null, "Simple <b>test</b>", "admin");
		equal(
			this.sceditor.val(),
			"[quote=admin]Simple [b]test[/b][/quote]"
		);
	});
})();
