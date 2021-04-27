/**
 * SCEditor XHTML Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */

import defaultCommandsOverrides from './xhtml.commands.js';
import converters from './xhtml.converters.js';

var dom = sceditor.dom;
var utils = sceditor.utils;

var css = dom.css;
var is = dom.is;
var removeAttr = dom.removeAttr;
var extend = utils.extend;
var each = utils.each;
var isEmptyObject = utils.isEmptyObject;

/**
 * XHTMLSerializer part of the XHTML plugin.
 *
 * @class XHTMLSerializer
 * @name jQuery.sceditor.XHTMLSerializer
 * @since v1.4.1
 */
sceditor.XHTMLSerializer = function () {
	var base = this;

	var opts = {
		indentStr: '\t'
	};

	/**
	 * Array containing the output, used as it's faster
	 * than string concatenation in slow browsers.
	 * @type {Array}
	 * @private
	 */
	var outputStringBuilder = [];

	/**
	 * Current indention level
	 * @type {number}
	 * @private
	 */
	var currentIndent = 0;

	// TODO: use escape.entities
	/**
	 * Escapes XHTML entities
	 *
	 * @param  {string} str
	 * @return {string}
	 * @private
	 */
	function escapeEntities(str) {
		var entities = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			'\xa0': '&nbsp;'
		};

		return !str ? '' : str.replace(/[&<>"\xa0]/g, function (entity) {
			return entities[entity] || entity;
		});
	};

	/**
	 * @param  {string} str
	 * @return {string}
	 * @private
	 */
	function trim(str) {
		return str
			// New lines will be shown as spaces so just convert to spaces.
			.replace(/[\r\n]/, ' ')
			.replace(/[^\S|\u00A0]+/g, ' ');
	};

	/**
	 * Serializes a node to XHTML
	 *
	 * @param  {Node} node            Node to serialize
	 * @param  {boolean} onlyChildren If to only serialize the nodes
	 *                                children and not the node
	 *                                itself
	 * @return {string}               The serialized node
	 * @name serialize
	 * @memberOf jQuery.sceditor.XHTMLSerializer.prototype
	 * @since v1.4.1
	 */
	base.serialize = function (node, onlyChildren) {
		outputStringBuilder = [];

		if (onlyChildren) {
			node = node.firstChild;

			while (node) {
				serializeNode(node);
				node = node.nextSibling;
			}
		} else {
			serializeNode(node);
		}

		return outputStringBuilder.join('');
	};

	/**
	 * Serializes a node to the outputStringBuilder
	 *
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function serializeNode(node, parentIsPre) {
		switch (node.nodeType) {
			case 1: // element
				handleElement(node, parentIsPre);
				break;

			case 3: // text
				handleText(node, parentIsPre);
				break;

			case 4: // cdata section
				handleCdata(node);
				break;

			case 8: // comment
				handleComment(node);
				break;

			case 9: // document
			case 11: // document fragment
				handleDoc(node);
				break;

			// Ignored types
			case 2: // attribute
			case 5: // entity ref
			case 6: // entity
			case 7: // processing instruction
			case 10: // document type
			case 12: // notation
				break;
		}
	};

	/**
	 * Handles doc node
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function handleDoc(node) {
		var	child = node.firstChild;

		while (child) {
			serializeNode(child);
			child = child.nextSibling;
		}
	};

	/**
	 * Handles element nodes
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function handleElement(node, parentIsPre) {
		var	child, attr, attrValue,
			tagName     = node.nodeName.toLowerCase(),
			isIframe    = tagName === 'iframe',
			attrIdx     = node.attributes.length,
			firstChild  = node.firstChild,
			// pre || pre-wrap with any vendor prefix
			isPre       = parentIsPre ||
				/pre(?:\-wrap)?$/i.test(css(node, 'whiteSpace')),
			selfClosing = !node.firstChild && !dom.canHaveChildren(node) &&
				!isIframe;

		if (is(node, '.sceditor-ignore')) {
			return;
		}

		output('<' + tagName, !parentIsPre && canIndent(node));
		while (attrIdx--) {
			attr = node.attributes[attrIdx];

			attrValue = attr.value;

			output(' ' + attr.name.toLowerCase() + '="' +
				escapeEntities(attrValue) + '"', false);
		}
		output(selfClosing ? ' />' : '>', false);

		if (!isIframe) {
			child = firstChild;
		}

		while (child) {
			currentIndent++;

			serializeNode(child, isPre);
			child = child.nextSibling;

			currentIndent--;
		}

		if (!selfClosing) {
			output(
				'</' + tagName + '>',
				!isPre && !isIframe && canIndent(node) &&
					firstChild && canIndent(firstChild)
			);
		}
	};

	/**
	 * Handles CDATA nodes
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function handleCdata(node) {
		output('<![CDATA[' + escapeEntities(node.nodeValue) + ']]>');
	};

	/**
	 * Handles comment nodes
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function handleComment(node) {
		output('<!-- ' + escapeEntities(node.nodeValue) + ' -->');
	};

	/**
	 * Handles text nodes
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function handleText(node, parentIsPre) {
		var text = node.nodeValue;

		if (!parentIsPre) {
			text = trim(text);
		}

		if (text) {
			output(escapeEntities(text), !parentIsPre && canIndent(node));
		}
	};

	/**
	 * Adds a string to the outputStringBuilder.
	 *
	 * The string will be indented unless indent is set to boolean false.
	 * @param  {string} str
	 * @param  {boolean} indent
	 * @return {void}
	 * @private
	 */
	function output(str, indent) {
		var i = currentIndent;

		if (indent !== false) {
			// Don't add a new line if it's the first element
			if (outputStringBuilder.length) {
				outputStringBuilder.push('\n');
			}

			while (i--) {
				outputStringBuilder.push(opts.indentStr);
			}
		}

		outputStringBuilder.push(str);
	};

	/**
	 * Checks if should indent the node or not
	 * @param  {Node} node
	 * @return {boolean}
	 * @private
	 */
	function canIndent(node) {
		var prev = node.previousSibling;

		if (node.nodeType !== 1 && prev) {
			return !dom.isInline(prev);
		}

		// first child of a block element
		if (!prev && !dom.isInline(node.parentNode)) {
			return true;
		}

		return !dom.isInline(node);
	};
};

/**
 * SCEditor XHTML plugin
 * @class xhtml
 * @name jQuery.sceditor.plugins.xhtml
 * @since v1.4.1
 */
function xhtmlFormat() {
	var base = this;

	/**
	 * Tag converters cache
	 * @type {Object}
	 * @private
	 */
	var tagConvertersCache = {};

	/**
	 * Attributes filter cache
	 * @type {Object}
	 * @private
	 */
	var attrsCache = {};

	/**
	 * Init
	 * @return {void}
	 */
	base.init = function () {
		if (!isEmptyObject(xhtmlFormat.converters || {})) {
			each(
				xhtmlFormat.converters,
				function (idx, converter) {
					each(converter.tags, function (tagname) {
						if (!tagConvertersCache[tagname]) {
							tagConvertersCache[tagname] = [];
						}

						tagConvertersCache[tagname].push(converter);
					});
				}
			);
		}

		this.commands = extend(true,
			{}, defaultCommandsOverrides, this.commands);
	};

	/**
	 * Converts the WYSIWYG content to XHTML
	 *
	 * @param  {boolean} isFragment
	 * @param  {string} html
	 * @param  {Document} context
	 * @param  {HTMLElement} [parent]
	 * @return {string}
	 * @memberOf jQuery.sceditor.plugins.xhtml.prototype
	 */
	function toSource(isFragment, html, context) {
		var xhtml,
			container = context.createElement('div');
		container.innerHTML = html;

		css(container, 'visibility', 'hidden');
		context.body.appendChild(container);

		convertTags(container);
		removeTags(container);
		removeAttribs(container);

		if (!isFragment) {
			wrapInlines(container);
		}

		xhtml = (new sceditor.XHTMLSerializer()).serialize(container, true);

		context.body.removeChild(container);

		return xhtml;
	};

	base.toSource = toSource.bind(null, false);

	base.fragmentToSource = toSource.bind(null, true);;

	/**
	 * Runs all converters for the specified tagName
	 * against the DOM node.
	 * @param  {string} tagName
	 * @return {Node} node
	 * @private
	 */
	function convertNode(tagName, node) {
		if (!tagConvertersCache[tagName]) {
			return;
		}

		tagConvertersCache[tagName].forEach(function (converter) {
			if (converter.tags[tagName]) {
				each(converter.tags[tagName], function (attr, values) {
					if (!node.getAttributeNode) {
						return;
					}

					attr = node.getAttributeNode(attr);

					if (!attr || values && values.indexOf(attr.value) < 0) {
						return;
					}

					converter.conv.call(base, node);
				});
			} else if (converter.conv) {
				converter.conv.call(base, node);
			}
		});
	};

	/**
	 * Converts any tags/attributes to their XHTML equivalents
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function convertTags(node) {
		dom.traverse(node, function (node) {
			var	tagName = node.nodeName.toLowerCase();

			convertNode('*', node);
			convertNode(tagName, node);
		}, true);
	};

	/**
	 * Tests if a node is empty and can be removed.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 * @private
	 */
	function isEmpty(node, excludeBr) {
		var	rect,
			childNodes     = node.childNodes,
			tagName        = node.nodeName.toLowerCase(),
			nodeValue      = node.nodeValue,
			childrenLength = childNodes.length,
			allowedEmpty   = xhtmlFormat.allowedEmptyTags || [];

		if (excludeBr && tagName === 'br') {
			return true;
		}

		if (is(node, '.sceditor-ignore')) {
			return true;
		}

		if (allowedEmpty.indexOf(tagName) > -1 || tagName === 'td' ||
			!dom.canHaveChildren(node)) {

			return false;
		}

		// \S|\u00A0 = any non space char
		if (nodeValue && /\S|\u00A0/.test(nodeValue)) {
			return false;
		}

		while (childrenLength--) {
			if (!isEmpty(childNodes[childrenLength],
				excludeBr && !node.previousSibling && !node.nextSibling)) {
				return false;
			}
		}

		// Treat tags with a width and height from CSS as not empty
		if (node.getBoundingClientRect &&
			(node.className || node.hasAttributes('style'))) {
			rect = node.getBoundingClientRect();
			return !rect.width || !rect.height;
		}

		return true;
	};

	/**
	 * Removes any tags that are not white listed or if no
	 * tags are white listed it will remove any tags that
	 * are black listed.
	 *
	 * @param  {Node} rootNode
	 * @return {void}
	 * @private
	 */
	function removeTags(rootNode) {
		dom.traverse(rootNode, function (node) {
			var	remove,
				tagName         = node.nodeName.toLowerCase(),
				parentNode      = node.parentNode,
				nodeType        = node.nodeType,
				isBlock         = !dom.isInline(node),
				previousSibling = node.previousSibling,
				nextSibling     = node.nextSibling,
				isTopLevel      = parentNode === rootNode,
				noSiblings      = !previousSibling && !nextSibling,
				empty           = tagName !== 'iframe' && isEmpty(node,
					isTopLevel && noSiblings && tagName !== 'br'),
				document        = node.ownerDocument,
				allowedTags     = xhtmlFormat.allowedTags,
				firstChild   	= node.firstChild,
				disallowedTags  = xhtmlFormat.disallowedTags;

			// 3 = text node
			if (nodeType === 3) {
				return;
			}

			if (nodeType === 4) {
				tagName = '!cdata';
			} else if (tagName === '!' || nodeType === 8) {
				tagName = '!comment';
			}

			if (nodeType === 1) {
				// skip empty nlf elements (new lines automatically
				// added after block level elements like quotes)
				if (is(node, '.sceditor-nlf')) {
					if (!firstChild || (node.childNodes.length === 1 &&
						/br/i.test(firstChild.nodeName))) {
						// Mark as empty,it will be removed by the next code
						empty = true;
					} else {
						node.classList.remove('sceditor-nlf');

						if (!node.className) {
							removeAttr(node, 'class');
						}
					}
				}
			}

			if (empty) {
				remove = true;
			// 3 is text node which do not get filtered
			} else if (allowedTags && allowedTags.length) {
				remove = (allowedTags.indexOf(tagName) < 0);
			} else if (disallowedTags && disallowedTags.length) {
				remove = (disallowedTags.indexOf(tagName) > -1);
			}

			if (remove) {
				if (!empty) {
					if (isBlock && previousSibling &&
						dom.isInline(previousSibling)) {
						parentNode.insertBefore(
							document.createTextNode(' '), node);
					}

					// Insert all the childen after node
					while (node.firstChild) {
						parentNode.insertBefore(node.firstChild,
							nextSibling);
					}

					if (isBlock && nextSibling &&
						dom.isInline(nextSibling)) {
						parentNode.insertBefore(
							document.createTextNode(' '), nextSibling);
					}
				}

				parentNode.removeChild(node);
			}
		}, true);
	};

	/**
	 * Merges two sets of attribute filters into one
	 *
	 * @param  {Object} filtersA
	 * @param  {Object} filtersB
	 * @return {Object}
	 * @private
	 */
	function mergeAttribsFilters(filtersA, filtersB) {
		var ret = {};

		if (filtersA) {
			extend(ret, filtersA);
		}

		if (!filtersB) {
			return ret;
		}

		each(filtersB, function (attrName, values) {
			if (Array.isArray(values)) {
				ret[attrName] = (ret[attrName] || []).concat(values);
			} else if (!ret[attrName]) {
				ret[attrName] = null;
			}
		});

		return ret;
	};

	/**
	 * Wraps adjacent inline child nodes of root
	 * in paragraphs.
	 *
	 * @param {Node} root
	 * @private
	 */
	function wrapInlines(root) {
		// Strip empty text nodes so they don't get wrapped.
		dom.removeWhiteSpace(root);

		var wrapper;
		var node = root.firstChild;
		var next;
		while (node) {
			next = node.nextSibling;

			if (dom.isInline(node) && !is(node, '.sceditor-ignore')) {
				if (!wrapper) {
					wrapper = root.ownerDocument.createElement('p');
					node.parentNode.insertBefore(wrapper, node);
				}

				wrapper.appendChild(node);
			} else {
				wrapper = null;
			}

			node = next;
		}
	};

	/**
	 * Removes any attributes that are not white listed or
	 * if no attributes are white listed it will remove
	 * any attributes that are black listed.
	 * @param  {Node} node
	 * @return {void}
	 * @private
	 */
	function removeAttribs(node) {
		var	tagName, attr, attrName, attrsLength, validValues, remove,
			allowedAttribs    = xhtmlFormat.allowedAttribs,
			isAllowed         = allowedAttribs &&
				!isEmptyObject(allowedAttribs),
			disallowedAttribs = xhtmlFormat.disallowedAttribs,
			isDisallowed      = disallowedAttribs &&
				!isEmptyObject(disallowedAttribs);

		attrsCache = {};

		dom.traverse(node, function (node) {
			if (!node.attributes) {
				return;
			}

			tagName     = node.nodeName.toLowerCase();
			attrsLength = node.attributes.length;

			if (attrsLength) {
				if (!attrsCache[tagName]) {
					if (isAllowed) {
						attrsCache[tagName] = mergeAttribsFilters(
							allowedAttribs['*'],
							allowedAttribs[tagName]
						);
					} else {
						attrsCache[tagName] = mergeAttribsFilters(
							disallowedAttribs['*'],
							disallowedAttribs[tagName]
						);
					}
				}

				while (attrsLength--) {
					attr        = node.attributes[attrsLength];
					attrName    = attr.name;
					validValues = attrsCache[tagName][attrName];
					remove      = false;

					if (isAllowed) {
						remove = validValues !== null &&
							(!Array.isArray(validValues) ||
								validValues.indexOf(attr.value) < 0);
					} else if (isDisallowed) {
						remove = validValues === null ||
							(Array.isArray(validValues) &&
								validValues.indexOf(attr.value) > -1);
					}

					if (remove) {
						node.removeAttribute(attrName);
					}
				}
			}
		});
	};
};

/**
 * Tag conveters, a converter is applied to all
 * tags that match the criteria.
 * @type {Array}
 * @name jQuery.sceditor.plugins.xhtml.converters
 * @since v1.4.1
 */
xhtmlFormat.converters = converters;

/**
 * Allowed attributes map.
 *
 * To allow an attribute for all tags use * as the tag name.
 *
 * Leave empty or null to allow all attributes. (the disallow
 * list will be used to filter them instead)
 * @type {Object}
 * @name jQuery.sceditor.plugins.xhtml.allowedAttribs
 * @since v1.4.1
 */
xhtmlFormat.allowedAttribs = {};

/**
 * Attributes that are not allowed.
 *
 * Only used if allowed attributes is null or empty.
 * @type {Object}
 * @name jQuery.sceditor.plugins.xhtml.disallowedAttribs
 * @since v1.4.1
 */
xhtmlFormat.disallowedAttribs = {};

/**
 * Array containing all the allowed tags.
 *
 * If null or empty all tags will be allowed.
 * @type {Array}
 * @name jQuery.sceditor.plugins.xhtml.allowedTags
 * @since v1.4.1
 */
xhtmlFormat.allowedTags = [];

/**
 * Array containing all the disallowed tags.
 *
 * Only used if allowed tags is null or empty.
 * @type {Array}
 * @name jQuery.sceditor.plugins.xhtml.disallowedTags
 * @since v1.4.1
 */
xhtmlFormat.disallowedTags = [];

/**
 * Array containing tags which should not be removed when empty.
 *
 * @type {Array}
 * @name jQuery.sceditor.plugins.xhtml.allowedEmptyTags
 * @since v2.0.0
 */
xhtmlFormat.allowedEmptyTags = [];

sceditor.formats.xhtml = xhtmlFormat;
