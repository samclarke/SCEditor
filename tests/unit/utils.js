export function htmlToDiv(html) {
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

export function htmlToNode(html) {
	var container  = htmlToDiv(html);
	var childNodes = [];

	for (var i = 0; i < container.childNodes.length; i++) {
		childNodes.push(container.childNodes[i]);
	}

	return childNodes.length === 1 ? childNodes[0] : childNodes;
};

export function htmlToFragment(html) {
	var container = htmlToDiv(html);
	var frag      = document.createDocumentFragment();

	while (container.firstChild) {
		frag.appendChild(container.firstChild);
	}

	return frag;
}

export function nodeToHtml(node) {
	var container = document.createElement('div');
	container.appendChild(node);

	return container.innerHTML;
};

export function stripWhiteSpace(str) {
	if (!str) {
		return str;
	}

	return str.replace(/[\r\n\s\t]/g, '');
}
