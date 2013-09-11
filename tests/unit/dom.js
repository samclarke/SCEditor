(function() {
	'use strict';

	module('SCEditor - DOM object');

	test('Traversal', function() {
		expect(4);

		var result = '';
		$.sceditor.dom.traverse(
			'<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>'.toDOM(),
			function(node) {
				if(node.nodeType === 3)
					result += node.nodeValue;
			}
		);
		equal(
			result,
			'12345',
			'Traverse all'
		);


		result = '';
		$.sceditor.dom.rTraverse(
			'<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>'.toDOM(),
			function(node) {
				if(node.nodeType === 3)
					result += node.nodeValue;
			}
		);
		equal(
			result,
			'54321',
			'Reverse traverse all'
		);


		result = '';
		$.sceditor.dom.traverse(
			'<code><span><b></b></span><span><b></b><b></b></span></code>'.toDOM(),
			function(node) {
				result += node.nodeName.toLowerCase() + ':';
			},
			true
		);
		equal(
			result,
			'b:span:b:b:span:code:',
			'Traverse innermost first'
		);


		result = '';
		$.sceditor.dom.traverse(
			'1<span>ignore</span>2<span>ignore</span>3'.toDOM(),
			function(node) {
				if(node.nodeType === 3)
					result += node.nodeValue;
			},
			false,
			true
		);
		equal(
			result,
			'123',
			'Traverse only siblings first'
		);
	});


	test('Fix nesting', function() {
		expect(3);

		var node = '<span>span<div style="font-weight: bold;">div</div>span</span>'.toDOM();
		$.sceditor.dom.fixNesting(node);
		equal(
			node.innerHTML.ignoreAll(),
			('<span>span</span><div style="font-weight: bold">div</div><span>span</span>').ignoreAll(),
			'Simple fix'
		);


		node = '<span style="font-weight: bold;">span<div>div</div>span</span>'.toDOM();
		$.sceditor.dom.fixNesting(node);
		equal(
			node.innerHTML.ignoreAll(),
			('<span style="font-weight: bold' +
				'">span</span><div style="font-weight: bold' +
				'">div</div><span style="font-weight: bold">span</span>').ignoreAll(),
			'Fix with CSS'
		);


		node = '<span>span<span>span<div style="font-weight: bold;">div</div>span</span>span</span>'.toDOM();
		$.sceditor.dom.fixNesting(node);
		equal(
			node.innerHTML.ignoreAll(),
			('<span>span<span>span</span></span><div style="font-weight: bold' +
							'">div</div><span><span>span</span>span</span>').ignoreAll(),
			'Deeper fix'
		);
	});


	test('parseHTML', function() {
		expect(3);

		var node, parsed;


		parsed = $.sceditor.dom.parseHTML('<span>one</span>');
		equal(
			parsed.length,
			1,
			'Parse single node'
		);


		node   = '<span>span<div style="font-weight: bold;">div</div>span</span>'.toDOM();
		parsed = $.sceditor.dom.parseHTML('<span>span<div style="font-weight: bold;">div</div>span</span>');
		equal(
			parsed[0].outerHTML,
			node.innerHTML,
			'Parse single node'
		);


		parsed = $.sceditor.dom.parseHTML('<span>one</span><span>two</span><span>three</span>');
		equal(
			parsed.length,
			3,
			'Parse multiple nodes'
		);
	});


	// IE 8 and below adds new lines when calling innerHTML even through
	// they don't exist in the DOM. Instead of fixing it, just skip IE < 8
	// for this test.
	if(!$.sceditor.ie || $.sceditor.ie > 8)
	test('Remove White Space', function() {
		expect(9);

		var node = '<span>   </span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span></span>',
			'Span spaces'
		);


		node = '<div>    <span>  \t\t\t\t </span>\t\t\t</div><div></div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div><span></span></div><div></div>',
			'Nested span spaces'
		);


		node = '<span>test</span><span><span>  test  </span></span><span>test</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test</span><span><span> test </span></span><span>test</span>',
			'Nested sibling check'
		);


		node = '<span><span><span><span>test  </span></span></span></span><span><span><span><span>  test  </span></span></span></span><span>  test</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span><span><span><span>test </span></span></span></span><span><span><span><span>test </span></span></span></span><span>test</span>',
			'Deeply nested sibling space collapse'
		);


		node = '<span>test  </span><span><span>  test  </span></span><span>  test</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test </span><span><span>test </span></span><span>test</span>',
			'Sibling space collapse check'
		);


		node = '<div>    <span>  \t\tcontent\t\t </span>\t\t\t</div><div></div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div><span>content </span></div><div></div>',
			'Nested span with content'
		);


		node = '<div>    <pre>  \t\tcontent\t\t </pre>\t\t\t</div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div><pre>  \t\tcontent\t\t </pre></div>',
			'Nested content in pre tag'
		);


		node = '<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>',
			'Nested content with parent pre tag'
		);

		node = '<div>test <img src="emoticons/smile.png"> test.</div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test <img src="emoticons/smile.png"> test.</div>',
			'Text next to image.'
		);
	});

	// IE 8 and below adds new lines when calling innerHTML even through
	// they don't exist in the DOM. Instead of fixing it, just skip IE < 8
	// for this test.
	if(!$.sceditor.ie || $.sceditor.ie > 8)
	test('Block level white space', function() {
		expect(5);

		var node = '<div>test\ntest</div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test test</div>',
			'Newline in textnode'
		);

		node = '<div>test\n</div><div></div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test</div><div></div>',
			'Newline after textnode'
		);

		node = '<div>test\n </div><div></div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test</div><div></div>',
			'Newline after textnode and a space'
		);

		node = '<div>\ntest</div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test</div>',
			'Newline at start of textnode'
		);

		node = '<div> \ntest</div>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<div>test</div>',
			'Newline and space at start of textnode'
		);
	});

	test('Inline white space', function() {
		expect(5);

		var node = '<span>test\ntest</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test test</span>',
			'Newline in textnode'
		);

		node = '<span>test\n</span><span></span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test </span><span></span>',
			'Newline after textnode'
		);

		node = '<span>test\n </span><span></span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test </span><span></span>',
			'Newline after textnode and a space'
		);

		node = '<span>\ntest</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test</span>',
			'Newline at start of textnode'
		);

		node = '<span> \ntest</span>'.toDOM();
		$.sceditor.dom.removeWhiteSpace(node);
		equal(
			node.innerHTML.toLowerCase(),
			'<span>test</span>',
			'Newline and space at start of textnode'
		);
	});
})();