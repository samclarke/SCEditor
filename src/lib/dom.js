define(function (require) {
	'use strict';

	var $       = require('jquery');
	var browser = require('./browser');

	var _propertyNameCache = {};

	var dom = {
		/**
		 * Loop all child nodes of the passed node
		 *
		 * The function should accept 1 parameter being the node.
		 * If the function returns false the loop will be exited.
		 *
		 * @param  {HTMLElement} node
		 * @param  {Function} func       Callback which is called with every
		 *                               child node as the first argument.
		 * @param  {bool} innermostFirst If the innermost node should be passed
		 *                               to the function before it's parents.
		 * @param  {bool} siblingsOnly   If to only traverse the nodes siblings
		 * @param  {bool} reverse        If to traverse the nodes in reverse
		 */
		// eslint-disable-next-line max-params
		traverse: function (node, func, innermostFirst, siblingsOnly, reverse) {
			if (node) {
				node = reverse ? node.lastChild : node.firstChild;

				while (node) {
					var next = reverse ?
						node.previousSibling :
						node.nextSibling;

					if (
						(!innermostFirst && func(node) === false) ||
						(!siblingsOnly && dom.traverse(
							node, func, innermostFirst, siblingsOnly, reverse
						) === false) ||
						(innermostFirst && func(node) === false)
					) {
						return false;
					}

					// move to next child
					node = next;
				}
			}
		},

		/**
		 * Like traverse but loops in reverse
		 * @see traverse
		 */
		rTraverse: function (node, func, innermostFirst, siblingsOnly) {
			this.traverse(node, func, innermostFirst, siblingsOnly, true);
		},

		/**
		 * Parses HTML
		 *
		 * @param {String} html
		 * @param {Document} context
		 * @since 1.4.4
		 * @return {Array}
		 */
		parseHTML: function (html, context) {
			var	ret = [],
				tmp = (context || document).createElement('div');

			tmp.innerHTML = html;

			$.merge(ret, tmp.childNodes);

			return ret;
		},

		/**
		 * Checks if an element has any styling.
		 *
		 * It has styling if it is not a plain <div> or <p> or
		 * if it has a class, style attribute or data.
		 *
		 * @param  {HTMLElement} elm
		 * @return {Boolean}
		 * @since 1.4.4
		 */
		hasStyling: function (elm) {
			var $elm = $(elm);

			return elm && (!$elm.is('p,div') || elm.className ||
				$elm.attr('style') || !$.isEmptyObject($elm.data()));
		},

		/**
		 * Converts an element from one type to another.
		 *
		 * For example it can convert the element <b> to <strong>
		 *
		 * @param  {HTMLElement} oldElm
		 * @param  {String}      toTagName
		 * @return {HTMLElement}
		 * @since 1.4.4
		 */
		convertElement: function (oldElm, toTagName) {
			var	child, attr,
				oldAttrs = oldElm.attributes,
				attrsIdx = oldAttrs.length,
				newElm   = oldElm.ownerDocument.createElement(toTagName);

			while (attrsIdx--) {
				attr = oldAttrs[attrsIdx];

				// IE < 8 returns all possible attributes instead of just
				// the specified ones so have to check it is specified.
				if (!browser.ie || attr.specified) {
					// IE < 8 doesn't return the CSS for the style attribute
					// so must copy it manually
					if (browser.ie < 8 && /style/i.test(attr.name)) {
						dom.copyCSS(oldElm, newElm);
					} else {
						// Some browsers parse invalid attributes names like
						// 'size"2' which throw an exception when set, just
						// ignore these.
						try {
							newElm.setAttribute(attr.name, attr.value);
						} catch (ex) {}
					}
				}
			}

			while ((child = oldElm.firstChild)) {
				newElm.appendChild(child);
			}

			oldElm.parentNode.replaceChild(newElm, oldElm);

			return newElm;
		},

		/**
		 * List of block level elements separated by bars (|)
		 * @type {string}
		 */
		blockLevelList: '|body|hr|p|div|h1|h2|h3|h4|h5|h6|address|pre|form|' +
			'table|tbody|thead|tfoot|th|tr|td|li|ol|ul|blockquote|center|',

		/**
		 * List of elements that do not allow children separated by bars (|)
		 *
		 * @param {Node} node
		 * @return {bool}
		 * @since  1.4.5
		 */
		canHaveChildren: function (node) {
			// 1  = Element
			// 9  = Document
			// 11 = Document Fragment
			if (!/11?|9/.test(node.nodeType)) {
				return false;
			}

			// List of empty HTML tags separated by bar (|) character.
			// Source: http://www.w3.org/TR/html4/index/elements.html
			// Source: http://www.w3.org/TR/html5/syntax.html#void-elements
			return ('|iframe|area|base|basefont|br|col|frame|hr|img|input|wbr' +
				'|isindex|link|meta|param|command|embed|keygen|source|track|' +
				'object|').indexOf('|' + node.nodeName.toLowerCase() + '|') < 0;
		},

		/**
		 * Checks if an element is inline
		 *
		 * @return {bool}
		 */
		isInline: function (elm, includeCodeAsBlock) {
			var tagName,
				nodeType = (elm || {}).nodeType || 3;

			if (nodeType !== 1) {
				return nodeType === 3;
			}

			tagName = elm.tagName.toLowerCase();

			if (tagName === 'code') {
				return !includeCodeAsBlock;
			}

			return dom.blockLevelList.indexOf('|' + tagName + '|') < 0;
		},

		/**
		 * <p>Copys the CSS from 1 node to another.</p>
		 *
		 * <p>Only copies CSS defined on the element e.g. style attr.</p>
		 *
		 * @param {HTMLElement} from
		 * @param {HTMLElement} to
		 */
		copyCSS: function (from, to) {
			to.style.cssText = from.style.cssText + to.style.cssText;
		},

		/**
		 * Fixes block level elements inside in inline elements.
		 *
		 * @param {HTMLElement} node
		 */
		fixNesting: function (node) {
			var	getLastInlineParent = function (node) {
				while (dom.isInline(node.parentNode, true)) {
					node = node.parentNode;
				}

				return node;
			};

			dom.traverse(node, function (node) {
				// Any blocklevel element inside an inline element needs fixing.
				if (node.nodeType === 1 && !dom.isInline(node, true) &&
					dom.isInline(node.parentNode, true)) {
					var	parent  = getLastInlineParent(node),
						rParent = parent.parentNode,
						before  = dom.extractContents(parent, node),
						middle  = node;

					// copy current styling so when moved out of the parent
					// it still has the same styling
					dom.copyCSS(parent, middle);

					rParent.insertBefore(before, parent);
					rParent.insertBefore(middle, parent);
				}
			});
		},

		/**
		 * Finds the common parent of two nodes
		 *
		 * @param {HTMLElement} node1
		 * @param {HTMLElement} node2
		 * @return {HTMLElement}
		 */
		findCommonAncestor: function (node1, node2) {
			// Not as fast as making two arrays of parents and comparing
			// but is a lot smaller and as it's currently only used with
			// fixing invalid nesting it doesn't need to be very fast
			return $(node1).parents().has($(node2)).first();
		},

		getSibling: function (node, previous) {
			if (!node) {
				return null;
			}

			return (previous ? node.previousSibling : node.nextSibling) ||
				dom.getSibling(node.parentNode, previous);
		},

		/**
		 * Removes unused whitespace from the root and all it's children
		 *
		 * @name removeWhiteSpace^1
		 * @param {HTMLElement} root
		 */
		/**
		 * Removes unused whitespace from the root and all it's children.
		 *
		 * If preserveNewLines is true, new line characters will not be removed
		 *
		 * @name removeWhiteSpace^2
		 * @param {HTMLElement} root
		 * @param {boolean}     preserveNewLines
		 * @since 1.4.3
		 */
		removeWhiteSpace: function (root, preserveNewLines) {
			var	nodeValue, nodeType, next, previous, previousSibling,
				cssWhiteSpace, nextNode, trimStart,
				getSibling        = dom.getSibling,
				isInline          = dom.isInline,
				node              = root.firstChild;

			while (node) {
				nextNode  = node.nextSibling;
				nodeValue = node.nodeValue;
				nodeType  = node.nodeType;

				// 1 = element
				if (nodeType === 1 && node.firstChild) {
					cssWhiteSpace = $(node).css('whiteSpace');

					// Skip all pre & pre-wrap with any vendor prefix
					if (!/pre(\-wrap)?$/i.test(cssWhiteSpace)) {
						dom.removeWhiteSpace(
							node,
							/line$/i.test(cssWhiteSpace)
						);
					}
				}

				// 3 = textnode
				if (nodeType === 3 && nodeValue) {
					next            = getSibling(node);
					previous        = getSibling(node, true);
					trimStart       = false;

					while ($(previous).hasClass('sceditor-ignore')) {
						previous = getSibling(previous, true);
					}
					// If previous sibling isn't inline or is a textnode that
					// ends in whitespace, time the start whitespace
					if (isInline(node) && previous) {
						previousSibling = previous;

						while (previousSibling.lastChild) {
							previousSibling = previousSibling.lastChild;
						}

						trimStart = previousSibling.nodeType === 3 ?
							/[\t\n\r ]$/.test(previousSibling.nodeValue) :
							!isInline(previousSibling);
					}

					// Clear zero width spaces
					nodeValue = nodeValue.replace(/\u200B/g, '');

					// Strip leading whitespace
					if (!previous || !isInline(previous) || trimStart) {
						nodeValue = nodeValue.replace(
							preserveNewLines ? /^[\t ]+/ : /^[\t\n\r ]+/,
							''
						);
					}

					// Strip trailing whitespace
					if (!next || !isInline(next)) {
						nodeValue = nodeValue.replace(
							preserveNewLines ? /[\t ]+$/ : /[\t\n\r ]+$/,
							''
						);
					}

					// Remove empty text nodes
					if (!nodeValue.length) {
						root.removeChild(node);
					} else {
						node.nodeValue = nodeValue.replace(
							preserveNewLines ? /[\t ]+/g : /[\t\n\r ]+/g,
							' '
						);
					}
				}

				node = nextNode;
			}
		},

		/**
		 * Extracts all the nodes between the start and end nodes
		 *
		 * @param {HTMLElement} startNode	The node to start extracting at
		 * @param {HTMLElement} endNode		The node to stop extracting at
		 * @return {DocumentFragment}
		 */
		extractContents: function (startNode, endNode) {
			var	extract,
				commonAncestor = dom
					.findCommonAncestor(startNode, endNode)
					.get(0),
				startReached   = false,
				endReached     = false;

			extract = function (root) {
				var clone,
					docFrag = startNode.ownerDocument.createDocumentFragment();

				dom.traverse(root, function (node) {
					// if end has been reached exit loop
					if (endReached || node === endNode) {
						endReached = true;

						return false;
					}

					if (node === startNode) {
						startReached = true;
					}

					// if the start has been reached and this elm contains
					// the end node then clone it
					// if this node contains the start node then add it
					if ($.contains(node, startNode) ||
						(startReached && $.contains(node, endNode))) {
						clone = node.cloneNode(false);

						clone.appendChild(extract(node));
						docFrag.appendChild(clone);

					// otherwise move it if its parent isn't already part of it
					} else if (startReached && !$.contains(docFrag, node)) {
						docFrag.appendChild(node);
					}
				}, false);

				return docFrag;
			};

			return extract(commonAncestor);
		},

		/**
		 * Gets the offset position of an element
		 *
		 * @param  {HTMLElement} obj
		 * @return {Object} An object with left and top properties
		 */
		getOffset: function (obj) {
			var	pLeft = 0,
				pTop = 0;

			while (obj) {
				pLeft += obj.offsetLeft;
				pTop  += obj.offsetTop;
				obj   = obj.offsetParent;
			}

			return {
				left: pLeft,
				top: pTop
			};
		},

		/**
		 * Gets the value of a CSS property from the elements style attribute
		 *
		 * @param  {HTMLElement} elm
		 * @param  {String} property
		 * @return {String}
		 */
		getStyle: function (elm, property) {
			var	$elm, direction, styleValue,
				elmStyle = elm.style;

			if (!elmStyle) {
				return '';
			}

			if (!_propertyNameCache[property]) {
				_propertyNameCache[property] = $.camelCase(property);
			}

			property   = _propertyNameCache[property];
			styleValue = elmStyle[property];

			// Add an exception for text-align
			if ('textAlign' === property) {
				$elm       = $(elm);
				direction  = elmStyle.direction;
				styleValue = styleValue || $elm.css(property);

				if ($elm.parent().css(property) === styleValue ||
					$elm.css('display') !== 'block' ||
					$elm.is('hr') || $elm.is('th')) {
					return '';
				}
// check all works with changes and merge with prev?
				// IE changes text-align to the same as the current direction
				// so skip unless its not the same
				if ((/right/i.test(styleValue) && direction === 'rtl') ||
					(/left/i.test(styleValue) && direction === 'ltr')) {
					return '';
				}
			}

			return styleValue;
		},

		/**
		 * Tests if an element has a style.
		 *
		 * If values are specified it will check that the styles value
		 * matches one of the values
		 *
		 * @param  {HTMLElement} elm
		 * @param  {String} property
		 * @param  {String|Array} values
		 * @return {Boolean}
		 */
		hasStyle: function (elm, property, values) {
			var styleValue = dom.getStyle(elm, property);

			if (!styleValue) {
				return false;
			}

			return !values || styleValue === values ||
				($.isArray(values) && $.inArray(styleValue, values) > -1);
		}
	};

	return dom;
});
