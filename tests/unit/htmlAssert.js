define(function (require) {
	'use strict';

	var utils = require('tests/unit/utils');

	var normalize = function (parentNode) {
		var nextSibling,
			node = parentNode.firstChild;

		while (node) {
			if (node.nodeType === 3) {
				nextSibling = node.nextSibling;

				while ((nextSibling = node.nextSibling) &&
					nextSibling.nodeType === 3) {

					node.nodeValue += nextSibling.nodeValue;
					parentNode.removeChild(nextSibling);

					nextSibling = node.nextSibling;
				}
			} else {
				normalize(node);
			}

			node = node.nextSibling;
		}
	};

	var compareNodes = function (nodeA, nodeB) {
		if (nodeA.nodeName.toLowerCase() !== nodeB.nodeName.toLowerCase() ||
			nodeA.nodeValue !== nodeB.nodeValue ||
			nodeA.nodeType  !== nodeB.nodeType ||
			nodeA.className !== nodeB.className) {
			return false;
		}

		if (nodeA.nodeType === 1) {
			if (nodeA.attributes.length !== nodeB.attributes.length ||
				nodeA.childNodes.length !== nodeB.childNodes.length) {
				return false;
			}
			for (var attrIdx = 0; attrIdx < nodeA.attributes.length; attrIdx++) {
				var aAttr = nodeA.attributes[attrIdx];

				if (typeof aAttr.specified === 'undefined' || aAttr.specified) {
					if (aAttr.name === 'style') {
						if (nodeA.style.cssText !== nodeB.style.cssText) {
							return false;
						}
					} else if (nodeB.getAttribute(aAttr.name) !== aAttr.value) {
						return false;
					}
				}
			}

			for (var i = 0; i < nodeA.childNodes.length; i++) {
				if (!compareNodes(nodeA.childNodes[i], nodeB.childNodes[i])) {
					return false;
				}
			}
		}

		return true;
	};

	var compareHtml = function (actual, expected) {
		if (actual === expected) {
			return true;
		}

		if (!actual || !expected || typeof actual !== 'string' ||
			typeof expected !== 'string') {
			return false;
		}

		var nodeA = utils.htmlToDiv(actual);
		var nodeB = utils.htmlToDiv(expected);

		if (nodeA.innerHTML === nodeB.innerHTML) {
			return true;
		}

		return compareNodes(nodeA, nodeB);
	};

	QUnit.assert.htmlEqual = function (actual, expected, message) {
		message = message || 'Expected HTML to be equal';

		QUnit.push(compareHtml(actual, expected), actual, expected, message);
	};

	QUnit.assert.htmlNotEqual = function (actual, expected, message) {
		message = message || 'Expected HTML to not be equal';

		QUnit.push(!compareHtml(actual, expected), actual, expected, message);
	};

	QUnit.assert.nodesEqual = function (actual, expected, message) {
		message = message || 'Expected nodes to be equal';

		normalize(actual);
		normalize(expected);

		QUnit.push(
			compareNodes(actual, expected),
			actual.innerHTML,
			expected.innerHTML,
			message
		);
	};

	QUnit.assert.nodesNodeEqual = function (actual, expected, message) {
		message = message || 'Expected nodes to not be equal';

		normalize(actual);
		normalize(expected);

		QUnit.push(
			!compareNodes(actual, expected),
			actual.innerHTML,
			expected.innerHTML,
			message
		);
	};
});
