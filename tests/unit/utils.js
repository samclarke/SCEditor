define(function (require) {
	'use strict';

	var browser = require('lib/browser');
	var escape  = require('lib/escape');


	var htmlToDiv = function (html) {
		var container = document.createElement('div');

		container.innerHTML = html;

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
/*
	String.prototype.ieUrlFix = function (str) {
		if(!browser.ie || browser.ie > 7) {
			return this;
		}

		var urlParts = window.location.href.split('/');
		urlParts.pop();

		return this.replace(
			new RegExp(escape.regexEscape(urlParts.join('/')) + '/', 'g'),
			''
		);
	};*/

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
