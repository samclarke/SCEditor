import * as dom from 'src/lib/dom.js';
import * as utils from 'tests/unit/utils.js';

var IS_PHANTOMJS = navigator.userAgent.indexOf('PhantomJS') > -1;

QUnit.module('lib/dom');

QUnit.test('createElement() - Simple', function (assert) {
	var node = dom.createElement('div');
	assert.ok(node, 'Is defined');
	assert.equal(node.tagName.toLowerCase(), 'div', 'TagName');
});

QUnit.test('createElement() - Attributes', function (assert) {
	var node = dom.createElement('div', {
		contentEditable: true,
		'data-test': 'value'
	});

	assert.ok(node, 'Is defined');
	assert.ok(node.contentEditable, 'Is contentEditable');
	assert.ok(node.hasAttribute('data-test'), 'Has attribute');
	assert.equal(node.getAttribute('data-test'), 'value', 'Attribute value');
});

QUnit.test('createElement() - Style', function (assert) {
	var node = dom.createElement('div', {
		style: 'font-size: 100px; font-weight: bold'
	});

	assert.ok(node, 'Is defined');
	assert.equal(node.style.fontSize, '100px', 'Font size');
	assert.equal(node.style.fontWeight, 'bold', 'Font weight');
});

QUnit.test('parents()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');
	var a = document.createElement('a');

	div.appendChild(p);
	p.appendChild(a);

	assert.deepEqual(dom.parents(a), [p, div], 'No selector');
	assert.deepEqual(dom.parents(a, 'p'), [p], 'Simple selector');
	assert.deepEqual(dom.parents(a, 'p,div,em'), [p, div], 'Complex selector');
});

QUnit.test('parent()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');

	div.appendChild(p);

	assert.notOk(dom.parent(p, 'p'), 'Paragraph');
	assert.strictEqual(dom.parent(p, 'div'), div, 'Div');
});

QUnit.test('closest()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');

	div.appendChild(p);

	assert.strictEqual(dom.closest(p, 'p'), p, 'Paragraph');
	assert.strictEqual(dom.closest(p, 'div'), div, 'Div');
	assert.notOk(dom.closest(p, 'input'), 'No match');
});

QUnit.test('appendChild()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');

	div.appendChild(p);

	dom.remove(p);

	assert.notOk(p.parentNode);
	assert.notOk(div.firstChild);
});

QUnit.test('appendChild()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');

	dom.appendChild(div, p);

	assert.strictEqual(div.firstChild, p);
});

QUnit.test('find()', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');
	var a = document.createElement('a');
	var text = document.createTextNode('');

	div.appendChild(p);
	div.appendChild(a);
	div.appendChild(text);

	var paragraphs = dom.find(div, 'p');
	assert.equal(paragraphs.length, 1, 'Select paragraphs');

	var paragraphs = dom.find(div, '*');
	assert.equal(paragraphs.length, 2, 'Select all');
});

QUnit.test('on()', function (assert) {
	var div = document.createElement('div');
	var called = false;

	dom.on(div, 'test', function () {
		called = true;
	});

	dom.trigger(div, 'test');
	assert.ok(called);
});

QUnit.test('on() - Selector', function (assert) {
	// PhantomJS sets the wrong event.target for dispatch event
	if (IS_PHANTOMJS) {
		assert.expect(0);
		return;
	}

	var div = document.createElement('div');
	var p = document.createElement('p');
	var called = false;

	div.appendChild(p);

	dom.on(div, 'test', 'p', function () {
		called = true;
	});

	dom.trigger(div, 'test');
	assert.notOk(called, 'Not matching selector');

	dom.trigger(p, 'test');
	assert.ok(called, 'Matching selector');
});

QUnit.test('off()', function (assert) {
	var div = document.createElement('div');
	var called = false;
	var fn = function () {
		called = true;
	};

	dom.on(div, 'test', fn);
	dom.off(div, 'test', fn);

	dom.trigger(div, 'test');
	assert.notOk(called);
});

QUnit.test('off() - Selector', function (assert) {
	var div = document.createElement('div');
	var p = document.createElement('p');
	var called = false;
	var fn = function () {
		called = true;
	};

	div.appendChild(p);

	dom.on(div, 'test', 'p', fn);
	dom.off(div, 'test', 'p', fn);

	dom.trigger(div, 'test');
	assert.notOk(called, 'Not matching selector');

	dom.trigger(p, 'test');
	assert.notOk(called, 'Matching selector');
});

QUnit.test('attr()', function (assert) {
	var div = document.createElement('div');

	dom.attr(div, 'test', 'value');
	assert.ok(div.hasAttribute('test'), 'Add attribute');

	assert.equal(dom.attr(div, 'test'), 'value', 'Get attribute');

	dom.attr(div, 'test', 'new-value');
	assert.equal(div.getAttribute('test'), 'new-value', 'Add attribute');

	dom.attr(div, 'test', null);
	assert.notOk(div.hasAttribute('test'), 'Remove attribute');
});

QUnit.test('removeAttr()', function (assert) {
	var div = document.createElement('div');

	div.setAttribute('test', 'test');

	assert.ok(div.hasAttribute('test'));
	dom.removeAttr(div, 'test');
	assert.notOk(div.hasAttribute('test'));
});

QUnit.test('show()', function (assert) {
	var div = document.createElement('div');

	dom.hide(div);
	assert.equal(div.style.display, 'none', 'Should hide node');
});

QUnit.test('show()', function (assert) {
	var div = document.createElement('div');

	div.style.display = 'none';

	dom.show(div);
	assert.equal(div.style.display, '', 'Should show node');
});

QUnit.test('toggle()', function (assert) {
	var div = document.createElement('div');
	var fixture = document.getElementById('qunit-fixture');

	fixture.appendChild(div);

	dom.toggle(div);
	assert.equal(div.style.display, 'none', 'Should hide node');

	dom.toggle(div);
	assert.equal(div.style.display, '', 'Should show node');
});

QUnit.test('css()', function (assert) {
	var div = document.createElement('div');
	var fixture = document.getElementById('qunit-fixture');

	fixture.appendChild(div);

	dom.css(div, 'width', 100);
	assert.equal(div.style.width, '100px', 'Convert numbers into pixels');

	dom.css(div, { width: 32 });
	assert.equal(div.style.width, '32px', 'Set object');

	dom.css(div, 'width', '110px');
	assert.equal(div.style.width, '110px', 'Set pixels');

	dom.css(div, 'width', '10em');
	assert.equal(div.style.width, '10em', 'Set em');

	dom.css(div, 'width', '50%');
	assert.equal(div.style.width, '50%', 'Set percent');

	assert.close(
		parseInt(dom.css(div, 'width')),
		fixture.clientWidth / 2,
		1,
		'Get computed value'
	);
});

QUnit.test('data()', function (assert) {
	var text = document.createTextNode('');
	var div = document.createElement('div');
	div.setAttribute('data-test', 'test');
	div.setAttribute('data-another-test', 'test');
	div.setAttribute('ignored', 'test');

	assert.deepEqual(dom.data(div), {
		'another-test': 'test',
		'test': 'test'
	});
	assert.equal(dom.data(div, 'test'), 'test');
	assert.equal(dom.data(div, 'another-test'), 'test');

	dom.data(div, 'test', 'new-value');
	assert.equal(dom.data(div, 'test'), 'new-value');

	dom.data(div, 'test', 1);
	assert.strictEqual(dom.data(div, 'test'), '1');

	dom.data(text, 'test', 'test');
	assert.strictEqual(dom.data(text, 'test'), undefined);
});

QUnit.test('is()', function (assert) {
	var div = document.createElement('div');
	div.className = 'test';

	assert.ok(dom.is(div, 'div'));
	assert.ok(dom.is(div, '.test'));
	assert.notOk(dom.is());
	assert.notOk(dom.is(null));
	assert.notOk(dom.is(div, 'p'));
	assert.notOk(dom.is(div, '.testing'));
});

QUnit.test('contains()', function (assert) {
	var parent = document.createElement('div');
	var child = document.createElement('div');

	parent.appendChild(child);

	assert.ok(dom.contains(parent, child));
	assert.notOk(dom.contains(parent, parent));
	assert.notOk(dom.contains(child, parent));
});

QUnit.test('insertBefore()', function (assert) {
	var parent = document.createElement('div');
	var first = document.createElement('div');
	var last = document.createElement('div');

	parent.appendChild(first);
	parent.appendChild(last);

	assert.strictEqual(dom.previousElementSibling(last), first);
	assert.strictEqual(dom.previousElementSibling(last, 'div'), first);
	assert.strictEqual(dom.previousElementSibling(last, 'p'), null);
	assert.strictEqual(dom.previousElementSibling(first), null);
});

QUnit.test('insertBefore()', function (assert) {
	var parent = document.createElement('div');
	var ref = document.createElement('div');
	var first = document.createElement('div');

	parent.appendChild(ref);

	dom.insertBefore(first, ref);

	assert.strictEqual(parent.firstChild, first);
});

QUnit.test('hasClass()', function (assert) {
	var div = document.createElement('div');

	div.className = 'test';

	assert.equal(dom.hasClass(div, 'another-test'), false);
	assert.equal(dom.hasClass(div, 'test'), true);
});

QUnit.test('removeClass()', function (assert) {
	var div = document.createElement('div');

	div.className = 'test another-test';

	dom.removeClass(div, 'another-test');
	assert.equal(div.className.trim(), 'test');

	dom.removeClass(div, 'test');
	assert.equal(div.className.trim(), '');
});

QUnit.test('addClass()', function (assert) {
	var div = document.createElement('div');

	dom.addClass(div, 'test');
	assert.equal(div.className.trim(), 'test');

	dom.addClass(div, 'another-test');
	assert.equal(div.className.trim(), 'test another-test');
});

QUnit.test('toggleClass()', function (assert) {
	var div = document.createElement('div');

	dom.toggleClass(div, 'test');
	assert.equal(div.className.trim(), 'test', 'Add class');

	dom.toggleClass(div, 'test');
	assert.equal(div.className, '', 'Remove class');

	dom.toggleClass(div, 'test', true);
	dom.toggleClass(div, 'test', true);
	assert.equal(div.className.trim(), 'test', 'Add class via state');

	dom.toggleClass(div, 'test', false);
	dom.toggleClass(div, 'test', false);
	assert.equal(div.className, '', 'Remove class via state');
});

QUnit.test('width()', function (assert) {
	var div = document.createElement('div');
	var fixture = document.getElementById('qunit-fixture');

	fixture.appendChild(div);

	dom.width(div, 100);
	assert.equal(div.style.width, '100px', 'Number width');

	dom.width(div, '10em');
	assert.equal(div.style.width, '10em', 'Em width');

	dom.width(div, '100px');
	assert.equal(dom.width(div), 100, 'Get width');
});

QUnit.test('height()', function (assert) {
	var div = document.createElement('div');
	var fixture = document.getElementById('qunit-fixture');

	fixture.appendChild(div);

	dom.height(div, 100);
	assert.equal(div.style.height, '100px', 'Number height');

	dom.height(div, '10em');
	assert.equal(div.style.height, '10em', 'Em height');

	dom.height(div, '100px');
	assert.equal(dom.height(div), 100, 'Get height');
});

QUnit.test('trigger()', function (assert) {
	var div = document.createElement('div');
	var detail = {};

	div.addEventListener('custom-event', function (e) {
		assert.strictEqual(e.detail, detail);
	});

	dom.trigger(div, 'custom-event', detail);
});

QUnit.test('isVisible()', function (assert) {
	var div = document.createElement('div');
	var fixture = document.getElementById('qunit-fixture');

	fixture.appendChild(div);
	dom.hide(div);
	assert.equal(dom.isVisible(div), false, 'Should be false when hidden');

	dom.show(div);
	assert.equal(dom.isVisible(div), true, 'Should be true when visible');

	fixture.removeChild(div);
	assert.equal(dom.isVisible(div), false, 'Deattached should be false');
});

QUnit.test('traverse()', function (assert) {
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

QUnit.test('traverse() - Innermost first', function (assert) {
	var result = '';
	var node   = utils.htmlToDiv(
		'<code><span><b></b></span><span><b></b><b></b></span></code>'
	);

	dom.traverse(node, function (node) {
		result += node.nodeName.toLowerCase() + ':';
	}, true);

	assert.equal(result, 'b:span:b:b:span:code:');
});

QUnit.test('traverse() - Siblings only', function (assert) {
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

QUnit.test('rTraverse()', function (assert) {
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


QUnit.test('parseHTML()', function (assert) {
	var result = dom.parseHTML(
		'<span>span<div style="font-weight: bold;">div</div>span</span>'
	);

	assert.equal(result.nodeType, dom.DOCUMENT_FRAGMENT_NODE);
	assert.equal(result.childNodes.length, 1);
	assert.nodesEqual(
		result.firstChild,
		utils.htmlToNode(
			'<span>span<div style="font-weight: bold;">div</div>span</span>'
		)
	);
});

QUnit.test('parseHTML() - Parse multiple', function (assert) {
	var result = dom.parseHTML(
		'<span>one</span><span>two</span><span>three</span>'
	);

	assert.equal(result.nodeType, dom.DOCUMENT_FRAGMENT_NODE);
	assert.equal(result.childNodes.length, 3);
});


QUnit.test('hasStyling()', function (assert) {
	var node = utils.htmlToNode('<pre></pre>');

	assert.ok(dom.hasStyling(node));
});

QUnit.test('hasStyling() - Non-styled div', function (assert) {
	var node = utils.htmlToNode('<div></div>');

	assert.ok(!dom.hasStyling(node));
});

QUnit.test('hasStyling() - Div with class', function (assert) {
	var node = utils.htmlToNode('<div class="test"></div>');

	assert.ok(dom.hasStyling(node));
});

QUnit.test('hasStyling() - Div with style attribute', function (assert) {
	var node = utils.htmlToNode('<div style="color: red;"></div>');

	assert.ok(dom.hasStyling(node));
});


QUnit.test('convertElement()', function (assert) {
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

QUnit.test('convertElement() - Invalid attribute name', function (assert) {
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


QUnit.test('fixNesting() - With styling', function (assert) {
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

QUnit.test('fixNesting() - Deeply nested', function (assert) {
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

QUnit.test('fixNesting() - Nested list', function (assert) {
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

QUnit.test('fixNesting() - Nested list, no previous item', function (assert) {
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

QUnit.test('fixNesting() - Deeply nested list', function (assert) {
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

QUnit.test('removeWhiteSpace() - Preserve line breaks', function (assert) {
	var node = utils.htmlToDiv(
		'<div style="white-space: pre-line">    ' +
			'<span>  \n\ncontent\n\n  </span>\n\n  ' +
		'</div><div></div>'
	);

	dom.removeWhiteSpace(node);

	assert.nodesEqual(
		node,
		utils.htmlToDiv(
			'<div style="white-space: pre-line">' +
				'<span>\n\ncontent\n\n </span>\n\n' +
			'</div><div></div>'
		)
	);
});

QUnit.test(
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

QUnit.test(
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

QUnit.test(
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

QUnit.test('removeWhiteSpace() - New line chars', function (assert) {
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

QUnit.test('removeWhiteSpace() - With .sceditor-ignore siblings', function (assert) {
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

QUnit.test('removeWhiteSpace() - Nested span space', function (assert) {
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

QUnit.test('removeWhiteSpace() - Pre tag', function (assert) {
	var node = utils.htmlToDiv(
		'<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>'
	);

	dom.removeWhiteSpace(node);

	assert.htmlEqual(
		node.innerHTML.toLowerCase(),
		'<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>'
	);
});

QUnit.test('removeWhiteSpace() - Deeply nested siblings', function (assert) {
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

QUnit.test('removeWhiteSpace() - Text next to image', function (assert) {
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


QUnit.test('extractContents()', function (assert) {
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

QUnit.test('extractContents() - End inside start', function (assert) {
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

QUnit.test('extractContents() - Start inside end', function (assert) {
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


QUnit.test('getStyle()', function (assert) {
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

QUnit.test('getStyle() - Normalise text-align', function (assert) {
	var node = utils.htmlToNode(
		'<div style="direction: rtl;text-align: right;">test</div>'
	);

	// If direction is left-to-right and text-align is right,
	// it shouldn't return anything.
	assert.strictEqual(dom.getStyle(node, 'direction'), 'rtl');
	assert.strictEqual(dom.getStyle(node, 'textAlign'), '');
});

QUnit.test('getStyle() - No style attribute', function (assert) {
	var node = utils.htmlToNode('<div>test</div>');

	assert.strictEqual(dom.getStyle(node, 'color'), '');
});


QUnit.test('hasStyle()', function (assert) {
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

QUnit.test('hasStyle() - Invalid', function (assert) {
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


QUnit.test('hasStyle() - No style attribute', function (assert) {
	var node = utils.htmlToNode('<div>test</div>');

	assert.ok(!dom.hasStyle(node, 'color'));
});
