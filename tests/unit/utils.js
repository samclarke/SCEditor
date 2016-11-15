define(function () {
	'use strict';

	var htmlToDiv = function (html) {
		var container = document.createElement('div');

		// IE < 9 strips whitespace from innerHTML.
		// To fix it wrap the HTML in a <pre> tag so IE keeps the
		// whitespce intact and then move the children out of the
		// <pre> tag.
		container.innerHTML = '<pre>' + html + '</pre>';

		var pre = container.firstChild;
		while (pre.firstChild) {
			container.appendChild(pre.firstChild);
		}
		container.removeChild(pre);

		$('#qunit-fixture').append(container);

		return container;
	};

	var htmlToNode = function (html) {
		var container  = htmlToDiv(html);
		var childNodes = [];

		for (var i = 0; i < container.childNodes.length; i++) {
			childNodes.push(container.childNodes[i]);
		}

		return childNodes.length === 1 ? childNodes[0] : childNodes;
	};

	var htmlToFragment = function (html) {
		var container = htmlToDiv(html);
		var frag      = document.createDocumentFragment();

		while (container.firstChild) {
			frag.appendChild(container.firstChild);
		}

		return frag;
	};

	var nodeToHtml = function (node) {
		var container = document.createElement('div');
		container.appendChild(node);

		return container.innerHTML;
	};

	var stripWhiteSpace = function (str) {
		if (!str) {
			return str;
		}

		return str.replace(/[\r\n\s\t]/g, '');
	};

	return {
		htmlToDiv: htmlToDiv,
		htmlToNode: htmlToNode,
		nodeToHtml: nodeToHtml,
		htmlToFragment: htmlToFragment,
		stripWhiteSpace: stripWhiteSpace
	};
});
