/*global module, $, test, expect, equal, html2dom, ignoreSpaces*/
(function() {
	'use strict';

	module("DOM Class");

	test("Traversal", function() {
		expect(4);

		var check = "";
		$.sceditor.dom.traverse(
			html2dom("<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>"),
			function(node) {
				if(node.nodeType === 3)
					check += node.nodeValue;
			}
		);
		equal(
			check,
			"12345",
			"Traverse all"
		);

		check = "";
		$.sceditor.dom.rTraverse(
			html2dom("<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>"),
			function(node) {
				if(node.nodeType === 3)
					check += node.nodeValue;
			}
		);
		equal(
			check,
			"54321",
			"Reverse traverse all"
		);

		check = "";
		$.sceditor.dom.traverse(
			html2dom("<code><span><b></b></span><span><b></b><b></b></span></code>"),
			function(node) {
				check += node.nodeName.toLowerCase() + ':';
			},
			true
		);
		equal(
			check,
			"b:span:b:b:span:code:",
			"Traverse innermost first"
		);


		check = "";
		$.sceditor.dom.traverse(
			html2dom("1<span>ignore</span>2<span>ignore</span>3"),
			function(node) {
				if(node.nodeType === 3)
					check += node.nodeValue;
			},
			false,
			true
		);
		equal(
			check,
			"123",
			"Traverse only siblings first"
		);
	});


	test("Fix nesting", function() {
		expect(3);

		var node = html2dom("<span>span<div style=\"font-weight: bold;\">div</div>span</span>");
		$.sceditor.dom.fixNesting(node);
		equal(
			ignoreSpaces(node.innerHTML.toLowerCase()),
			ignoreSpaces("<span>span</span><div style=\"font-weight: bold" + ($.sceditor.ie ? '': ';') + "\">div</div><span>span</span>"),
			"Simple fix"
		);

		node = html2dom("<span style=\"font-weight: bold;\">span<div>div</div>span</span>");
		$.sceditor.dom.fixNesting(node);
		equal(
			ignoreSpaces(node.innerHTML.toLowerCase()),
			ignoreSpaces("<span style=\"font-weight: bold" + ($.sceditor.ie ? '': ';') +
				"\">span</span><div style=\"font-weight: bold" + ($.sceditor.ie ? '': ';') +
				"\">div</div><span style=\"font-weight: bold" + ($.sceditor.ie ? '': ';') + "\">span</span>"),
			"Fix with CSS"
		);

		node = html2dom("<span>span<span>span<div style=\"font-weight: bold;\">div</div>span</span>span</span>");
		$.sceditor.dom.fixNesting(node);
		equal(
			ignoreSpaces(node.innerHTML.toLowerCase()),
			ignoreSpaces("<span>span<span>span</span></span><div style=\"font-weight: bold" + ($.sceditor.ie ? '': ';') +
				"\">div</div><span><span>span</span>span</span>"),
			"Deeper fix"
		);
	});

	test("Remove White Space", function() {
		expect(8);

		var node = html2dom("<span>   </span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span></span>",
			"Span spaces"
		);


		node = html2dom("<div>    <span>  \t\t\t\t </span>\t\t\t</div><div></div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div><span></span></div><div></div>",
			"Nested span spaces"
		);


		node = html2dom("<span>test</span><span><span>  test  </span></span><span>test</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test</span><span><span> test </span></span><span>test</span>",
			"Nested sibling check"
		);


		node = html2dom("<span><span><span><span>test  </span></span></span></span><span><span><span><span>  test  </span></span></span></span><span>  test</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span><span><span><span>test </span></span></span></span><span><span><span><span>test </span></span></span></span><span>test</span>",
			"Deeply nested sibling space collapse"
		);


		node = html2dom("<span>test  </span><span><span>  test  </span></span><span>  test</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test </span><span><span>test </span></span><span>test</span>",
			"Sibling space collapse check"
		);


		node = html2dom("<div>    <span>  \t\tcontent\t\t </span>\t\t\t</div><div></div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div><span>content </span></div><div></div>",
			"Nested span with content"
		);


		node = html2dom("<div>    <pre>  \t\tcontent\t\t </pre>\t\t\t</div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div><pre>  \t\tcontent\t\t </pre></div>",
			"Nested content in pre tag"
		);


		node = html2dom("<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>",
			"Nested content with parent pre tag"
		);
	});

	test("Block level white space", function() {
		expect(5);

		var node = html2dom("<div>test\ntest</div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div>test test</div>",
			"Newline in textnode"
		);

		node = html2dom("<div>test\n</div><div></div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div>test</div><div></div>",
			"Newline after textnode"
		);

		node = html2dom("<div>test\n </div><div></div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div>test</div><div></div>",
			"Newline after textnode and a space"
		);

		node = html2dom("<div>\ntest</div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div>test</div>",
			"Newline at start of textnode"
		);

		node = html2dom("<div> \ntest</div>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<div>test</div>",
			"Newline and space at start of textnode"
		);
	});

	test("Inline white space", function() {
		expect(5);

		var node = html2dom("<span>test\ntest</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test test</span>",
			"Newline in textnode"
		);

		node = html2dom("<span>test\n</span><span></span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test </span><span></span>",
			"Newline after textnode"
		);

		node = html2dom("<span>test\n </span><span></span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test </span><span></span>",
			"Newline after textnode and a space"
		);

		node = html2dom("<span>\ntest</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test</span>",
			"Newline at start of textnode"
		);

		node = html2dom("<span> \ntest</span>");
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			"<span>test</span>",
			"Newline and space at start of textnode"
		);
	});
})();