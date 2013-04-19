/*global module, $, test, expect, equal, html2dom, ignoreSpaces, ok*/
(function() {
	'use strict';

	module("XHTML Converters", {
		setup: function() {
			this.plugin = new $.sceditor.plugins.xhtml();
			this.plugin.init.call({
				opts: $.extend({}, $.sceditor.defaultOptions)
			});
		}
	});

	test("Width", function() {
		expect(1);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div width="200">test</div>', true))),
			ignoreSpaces('<div style="width: 200px;">test</div>'),
			"Div width"
		);
	});

	test("Height", function() {
		expect(1);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div height="200">test</div>', true))),
			ignoreSpaces('<div style="height: 200px;">test</div>'),
			"Div height"
		);
	});

	test("Text", function() {
		expect(4);

		var result;

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div text="red">test</div>', true))),
			ignoreSpaces('<div style="color: red;">test</div>'),
			'Div named colour'
		);

		result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div text="#f00">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="color: #ff0000;">test</div>') ||
			result === ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			'Div short hex colour'
		);

		result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div text="#ff0000">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="color: #ff0000;">test</div>') ||
			result === ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			'Div hex colour'
		);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div text="rgb(255,0,0)">test</div>', true))),
			ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			"Div rgb colour"
		);
	});

	test("Color", function() {
		expect(4);

		var result;

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div color="red">test</div>', true))),
			ignoreSpaces('<div style="color: red;">test</div>'),
			'Div named colour'
		);

		result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div color="#f00">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="color: #ff0000;">test</div>') ||
			result === ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			'Div short hex colour'
		);

		result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div color="#ff0000">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="color: #ff0000;">test</div>') ||
			result === ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			'Div hex colour'
		);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div color="rgb(255,0,0)">test</div>', true))),
			ignoreSpaces('<div style="color: rgb(255,0,0);">test</div>'),
			"Div rgb colour"
		);
	});

	test("Face", function() {
		expect(2);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div face="Arial">test</div>', true))),
			ignoreSpaces('<div style="font-family: Arial;">test</div>'),
			'Div font'
		);

		var result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div face="Arial Black">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="font-family: Arial Black;">test</div>') ||
			result === ignoreSpaces('<div style="font-family: \'Arial Black\';">test</div>'),
			'Div font with space'
		);
	});

	test("Face", function() {
		expect(2);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div face="Arial">test</div>', true))),
			ignoreSpaces('<div style="font-family: Arial;">test</div>'),
			'Div font'
		);

		var result = ignoreSpaces(this.plugin.signalToSource('', html2dom('<div face="Arial Black">test</div>', true)));
		ok(
			result === ignoreSpaces('<div style="font-family: Arial Black;">test</div>') ||
			result === ignoreSpaces('<div style="font-family: \'Arial Black\';">test</div>'),
			'Div font with space'
		);
	});

	test("Align", function() {
		expect(2);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div align="left">test</div>', true))),
			ignoreSpaces('<div style="text-align: left;">test</div>'),
			'Left'
		);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div align="center">test</div>', true))),
			ignoreSpaces('<div style="text-align: center;">test</div>'),
			'Center'
		);
	});
/*
	test("Border", function() {
		expect(2);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div border="1">test</div>', true))),
			ignoreSpaces('<div style="border-width: 1px;">test</div>'),
			'border=1'
		);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<div border="0">test</div>', true))),
			ignoreSpaces('<div style="border-width: 0px;">test</div>'),
			'border=0'
		);
	});

	test("HR noshade", function() {
		expect(1);

		equal(
			ignoreSpaces(this.plugin.signalToSource('', html2dom('<hr noshade />', true))),
			ignoreSpaces('<hr style="border-style: solid;" />')
		);
	});*/
})();