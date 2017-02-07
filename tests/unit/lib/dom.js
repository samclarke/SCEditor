define([
	'lib/dom',
	'tests/unit/utils'
], function (dom, utils) {
	'use strict';

	module('lib/dom');


	test('traverse()', function (assert) {
		var result = '';
		var node   = utils.htmlToDiv(
			'<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>'
		);

		dom.traverse(node, function (node) {
			if (node.nodeType === 3) {
				result += node.nodeValue;
			}
		});

		assert.equal(result, '12345');
	});

	test('traverse() - Innermost first', function (assert) {
		var result = '';
		var node   = utils.htmlToDiv(
			'<code><span><b></b></span><span><b></b><b></b></span></code>'
		);

		dom.traverse(node, function (node) {
			result += node.nodeName.toLowerCase() + ':';
		}, true);

		assert.equal(result, 'b:span:b:b:span:code:');
	});

	test('traverse() - Siblings only', function (assert) {
		var result = '';
		var node   = utils.htmlToDiv(
			'1<span>ignore</span>2<span>ignore</span>3'
		);

		dom.traverse(node, function (node) {
			if (node.nodeType === 3) {
				result += node.nodeValue;
			}
		}, false, true);

		assert.equal(result, '123');
	});

	test('rTraverse()', function (assert) {
		var result = '';
		var node   = utils.htmlToDiv(
			'<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>'
		);

		dom.rTraverse(node, function (node) {
			if (node.nodeType === 3) {
				result += node.nodeValue;
			}
		});

		assert.equal(result, '54321');
	});


	test('parseHTML()', function (assert) {
		var result = dom.parseHTML(
			'<span>span<div style="font-weight: bold;">div</div>span</span>'
		);

		assert.ok($.isArray(result));
		assert.equal(result.length, 1);
		assert.nodesEqual(
			result[0],
			utils.htmlToNode(
				'<span>span<div style="font-weight: bold;">div</div>span</span>'
			)
		);
	});

	test('parseHTML() - Parse multiple', function (assert) {
		var result = dom.parseHTML(
			'<span>one</span><span>two</span><span>three</span>'
		);

		assert.ok($.isArray(result));
		assert.equal(result.length, 3);
	});


	test('hasStyling()', function (assert) {
		var node = utils.htmlToNode('<pre></pre>');

		assert.ok(dom.hasStyling(node));
	});

	test('hasStyling() - Non-styled div', function (assert) {
		var node = utils.htmlToNode('<div></div>');

		assert.ok(!dom.hasStyling(node));
	});

	test('hasStyling() - Div with class', function (assert) {
		var node = utils.htmlToNode('<div class="test"></div>');

		assert.ok(dom.hasStyling(node));
	});

	test('hasStyling() - Div with style attribute', function (assert) {
		var node = utils.htmlToNode('<div style="color: red;"></div>');

		assert.ok(dom.hasStyling(node));
	});


	test('convertElement()', function (assert) {
		var node = utils.htmlToDiv(
			'<i style="font-weight: bold;">' +
				'span' +
				'<div>' +
					'div' +
				'</div>' +
				'span' +
			'</i>'
		);

		var newNode = dom.convertElement(node.firstChild, 'em');

		assert.equal(newNode, node.firstChild);

		assert.nodesEqual(
			newNode,
			utils.htmlToNode(
				'<em style="font-weight: bold;">' +
					'span' +
					'<div>' +
						'div' +
					'</div>' +
					'span' +
				'</em>'
			)
		);
	});

	test('convertElement() - Invalid attribute name', function (assert) {
		var node = utils.htmlToDiv(
			'<i size"2"="" good="attr">test</i>'
		);

		var newNode = dom.convertElement(node.firstChild, 'em');

		assert.equal(newNode, node.firstChild);

		assert.nodesEqual(
			newNode,
			utils.htmlToNode(
				'<em good="attr">test</em>'
			)
		);
	});


	test('fixNesting() - With styling', function (assert) {
		var node = utils.htmlToDiv(
			'<span style="font-weight: bold;">' +
				'span' +
				'<div>' +
					'div' +
				'</div>' +
				'span' +
			'</span>'
		);

		dom.fixNesting(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<span style="font-weight: bold;">' +
					'span' +
				'</span>' +
				'<div style="font-weight: bold;">' +
					'div' +
				'</div>' +
				'<span style="font-weight: bold;">' +
					'span' +
				'</span>'
			)
		);
	});

	test('fixNesting() - Deeply nested', function (assert) {
		var node = utils.htmlToDiv(
			'<span>' +
				'span' +
				'<span>' +
					'span' +
					'<div style="font-weight: bold;">' +
						'div' +
					'</div>' +
					'span' +
				'</span>' +
				'span' +
			'</span>'
		);

		dom.fixNesting(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<span>' +
					'span' +
					'<span>' +
						'span' +
					'</span>' +
				'</span>' +
				'<div style="font-weight: bold;">' +
					'div' +
				'</div>' +
				'<span>' +
					'<span>' +
						'span' +
					'</span>' +
					'span' +
				'</span>'
			)
		);
	});

	test('fixNesting() - Nested list', function (assert) {
		var node = utils.htmlToDiv(
			'<ul>' +
				'<li>first</li>' +
				'<ol><li>middle</li></ol>' +
				'<li>second</li>' +
			'</ul>'
		);

		dom.fixNesting(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<ul>' +
					'<li>first' +
						'<ol><li>middle</li></ol>' +
					'</li>' +
					'<li>second</li>' +
				'</ul>'
			)
		);
	});

	test('fixNesting() - Nested list, no previous item', function (assert) {
		var node = utils.htmlToDiv(
			'<ul>' +
				'<ol><li>middle</li></ol>' +
				'<li>first</li>' +
			'</ul>'
		);

		dom.fixNesting(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<ul>' +
					'<li>' +
						'<ol><li>middle</li></ol>' +
					'</li>' +
					'<li>first</li>' +
				'</ul>'
			)
		);
	});

	test('fixNesting() - Deeply nested list', function (assert) {
		var node = utils.htmlToDiv(
			'<ul>' +
				'<li>one</li>' +
				'<ul>' +
					'<li>two</li>' +
					'<ul>' +
						'<li>three</li>' +
					'</ul>' +
				'</ul>' +
			'</ul>'
		);

		dom.fixNesting(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<ul>' +
					'<li>one' +
						'<ul>' +
							'<li>two' +
								'<ul>' +
									'<li>three</li>' +
								'</ul>' +
							'</li>' +
						'</ul>' +
					'</li>' +
				'</ul>'
			)
		);
	});

	test('removeWhiteSpace() - Preserve line breaks', function (assert) {
		var node = utils.htmlToDiv(
			'<div style="white-space: pre-line">    ' +
				'<span>  \n\ncontent\n\n  </span>\n\n  ' +
			'</div>'
		);

		dom.removeWhiteSpace(node);

		assert.nodesEqual(
			node,
			utils.htmlToDiv(
				'<div style="white-space: pre-line">' +
					'<span>\n\ncontent\n\n </span>\n\n ' +
				'</div>'
			)
		);
	});

	test(
		'removeWhiteSpace() - Siblings with start and end spaces',
		function (assert) {
			var html = '<span>  test</span><span>  test  </span>';
			var node = utils.htmlToDiv(html);

			// Must move to a fragment as the other HTML on the QUnit test page
			// interferes with this test
			var frag = document.createDocumentFragment();
			frag.appendChild(node);

			dom.removeWhiteSpace(node);

			assert.htmlEqual(
				node.innerHTML.toLowerCase(),
				'<span>test</span><span> test</span>'
			);
		}
	);

	test(
		'removeWhiteSpace() - Block then span with start spaces',
		function (assert) {
			var html = '<div>test</div><span>  test  </span>';
			var node = utils.htmlToDiv(html);

			// Must move to a fragment as the other HTML on the QUnit test page
			// interferes with this test
			var frag = document.createDocumentFragment();
			frag.appendChild(node);

			dom.removeWhiteSpace(node);

			assert.htmlEqual(
				node.innerHTML.toLowerCase(),
				'<div>test</div><span>test</span>'
			);
		}
	);

	test(
		'removeWhiteSpace() - Divs with start and end spaces',
		function (assert) {
			var html = '<div>  test  </div><div>  test  </div>';
			var node = utils.htmlToDiv(html);

			// Must move to a fragment as the other HTML on the QUnit test page
			// interferes with this test
			var frag = document.createDocumentFragment();
			frag.appendChild(node);

			dom.removeWhiteSpace(node);

			assert.htmlEqual(
				node.innerHTML.toLowerCase(),
				'<div>test</div><div>test</div>'
			);
		}
	);

	test('removeWhiteSpace() - New line chars', function (assert) {
		var html = '<span>\ntest\n\n</span><span>\n\ntest\n</span>';
		var node = utils.htmlToDiv(html);

		// Must move to a fragment as the other HTML on the QUnit test page
		// interferes with this test
		var frag = document.createDocumentFragment();
		frag.appendChild(node);

		dom.removeWhiteSpace(node);

		assert.htmlEqual(
			node.innerHTML.toLowerCase(),
			'<span>test </span>' +
			'<span>test</span>'
		);
	});

	test('removeWhiteSpace() - With .sceditor-ignore siblings', function (assert) {
		var node = utils.htmlToDiv(
			'<span>test</span>' +
			'<span class="sceditor-ignore">  test  </span>' +
			'<span>  test</span>'
		);

		dom.removeWhiteSpace(node);

		assert.htmlEqual(
			node.innerHTML.toLowerCase(),
			'<span>test</span>' +
			'<span class="sceditor-ignore"> test </span>' +
			'<span> test</span>'
		);
	});

	test('removeWhiteSpace() - Nested span space', function (assert) {
		var node = utils.htmlToNode(
			'<div>' +
				'<div>    <span>  \t\t\t\t </span>\t\t\t</div> ' +
				'<div>  </div>' +
			'</div>'
		);

		dom.removeWhiteSpace(node);

		assert.htmlEqual(
			node.innerHTML.toLowerCase(),
			'<div><span></span> </div><div></div>'
		);
	});

	test('removeWhiteSpace() - Pre tag', function (assert) {
		var node = utils.htmlToDiv(
			'<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>'
		);

		dom.removeWhiteSpace(node);

		assert.htmlEqual(
			node.innerHTML.toLowerCase(),
			'<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>'
		);
	});

	test('removeWhiteSpace() - Deeply nested siblings', function (assert) {
		var node = utils.htmlToDiv(
			'<span>' +
				'<span>' +
					'<span>' +
						'<span>test  </span>' +
					'</span>' +
				'</span>' +
			'</span>' +
			'<span>' +
				'<span>' +
					'<span>' +
						'<span>' +
							'<span>  test  </span>' +
						'</span>' +
					'</span>' +
				'</span>' +
			'</span>' +
			'<span>  test</span>'
		);

		dom.removeWhiteSpace(node);

		assert.htmlEqual(
			node.innerHTML.toLowerCase(),
			'<span>' +
				'<span>' +
					'<span>' +
						'<span>test </span>' +
					'</span>' +
				'</span>' +
			'</span>' +
			'<span>' +
				'<span>' +
					'<span>' +
						'<span>' +
							'<span>test </span>' +
						'</span>' +
					'</span>' +
				'</span>' +
			'</span>' +
			'<span>test</span>'
		);
	});

	test('removeWhiteSpace() - Text next to image', function (assert) {
		var node = utils.htmlToNode(
			'<div>test  <img src="../../emoticons/smile.png">  test.</div>'
		);

		dom.removeWhiteSpace(node);

		assert.nodesEqual(
			node,
			utils.htmlToNode(
				'<div>test <img src="../../emoticons/smile.png"> test.</div>'
			)
		);
	});


	test('extractContents()', function (assert) {
		var node  = utils.htmlToNode(
			'<div>' +
				'<span>ignored</span>' +
				'<div id="start">' +
					'<span>test</span>' +
				'</div>' +
				'<span>test</span>' +
				'<span id="end">end</span>' +
				'<span>ignored</span>' +
			'</div>'
		);
		var start = $(node).find('#start').get(0);
		var end   = $(node).find('#end').get(0);

		assert.nodesEqual(
			dom.extractContents(start, end),
			utils.htmlToFragment(
				'<div id="start">' +
					'<span>test</span>' +
				'</div>' +
				'<span>test</span>'
			)
		);
	});

	test('extractContents() - End inside start', function (assert) {
		var node  = utils.htmlToNode(
			'<div>' +
				'<span>ignored</span>' +
				'<div id="start">' +
					'<span>test</span>' +
					'<span>test</span>' +
					'<span id="end">end</span>' +
					'<span>ignored</span>' +
				'</div>' +
				'<span>ignored</span>' +
			'</div>'
		);
		var start = $(node).find('#start').get(0);
		var end   = $(node).find('#end').get(0);

		assert.nodesEqual(
			dom.extractContents(start, end),
			utils.htmlToFragment(
				'<div id="start">' +
					'<span>test</span>' +
					'<span>test</span>' +
				'</div>'
			)
		);
	});

	test('extractContents() - Start inside end', function (assert) {
		var node  = utils.htmlToNode(
			'<div>' +
				'<span>ignored</span>' +
				'<div id="end">' +
					'<span>test</span>' +
					'<span>test</span>' +
					'<span id="start">end</span>' +
					'<span>ignored</span>' +
				'</div>' +
				'<span>ignored</span>' +
			'</div>'
		);
		var start = $(node).find('#start').get(0);
		var end   = $(node).find('#end').get(0);

		assert.htmlEqual(
			utils.nodeToHtml(dom.extractContents(start, end)),
			''
		);
	});


	test('getStyle()', function (assert) {
		var node = utils.htmlToNode(
			'<div style="font-weight: bold; font-size: 10px;' +
			'text-align: right;">test</div>'
		);

		assert.strictEqual(
			dom.getStyle(node, 'font-weight'),
			'bold',
			'Normal CSS property'
		);

		assert.strictEqual(
			dom.getStyle(node, 'fontSize'),
			'10px',
			'Camel case CSS property'
		);

		assert.strictEqual(
			dom.getStyle(node, 'text-align'),
			'right',
			'Text-align'
		);

		assert.strictEqual(
			dom.getStyle(node, 'color'),
			'',
			'Undefined CSS property'
		);
	});

	test('getStyle() - Normalise text-align', function (assert) {
		var node = utils.htmlToNode(
			'<div style="direction: rtl;text-align: right;">test</div>'
		);

		// If direction is left-to-right and text-align is right,
		// it shouldn't return anything.
		assert.strictEqual(dom.getStyle(node, 'direction'), 'rtl');
		assert.strictEqual(dom.getStyle(node, 'textAlign'), '');
	});

	test('getStyle() - No style attribute', function (assert) {
		var node = utils.htmlToNode('<div>test</div>');

		assert.strictEqual(dom.getStyle(node, 'color'), '');
	});


	test('hasStyle()', function (assert) {
		var node = utils.htmlToNode(
			'<div style="font-weight: bold;">test</div>'
		);

		assert.ok(
			dom.hasStyle(node, 'font-weight'),
			'Normal CSS property'
		);

		assert.ok(
			dom.hasStyle(node, 'fontWeight'),
			'Camel case CSS property'
		);

		assert.ok(
			dom.hasStyle(node, 'font-weight', 'bold'),
			'String value'
		);

		assert.ok(
			dom.hasStyle(node, 'fontWeight', ['@', 'bold', '123']),
			'Array of values'
		);
	});

	test('hasStyle() - Invalid', function (assert) {
		var node = utils.htmlToNode(
			'<div style="font-weight: bold;">test</div>'
		);

		assert.ok(
			!dom.hasStyle(node, 'font-weight', 'Bold'),
			'Invalid string'
		);

		assert.ok(
			!dom.hasStyle(node, 'fontWeight', ['@', 'normal', '123']),
			'Invalid array'
		);

		assert.ok(
			!dom.hasStyle(node, 'color'),
			'Undefined property'
		);
	});


	test('hasStyle() - No style attribute', function (assert) {
		var node = utils.htmlToNode('<div>test</div>');

		assert.ok(!dom.hasStyle(node, 'color'));
	});
});
