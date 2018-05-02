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
(function (sceditor) {
	'use strict';

	var IE_VER = sceditor.ie;

	// In IE < 11 a BR at the end of a block level element
	// causes a double line break.
	var IE_BR_FIX = IE_VER && IE_VER < 11;

	var dom = sceditor.dom;
	var utils = sceditor.utils;

	var css = dom.css;
	var attr = dom.attr;
	var is = dom.is;
	var removeAttr = dom.removeAttr;
	var convertElement = dom.convertElement;
	var extend = utils.extend;
	var each = utils.each;
	var isEmptyObject = utils.isEmptyObject;

	var getEditorCommand = sceditor.command.get;

	var defaultCommandsOverrides = {
		bold: {
			txtExec: ['<strong>', '</strong>']
		},
		italic: {
			txtExec: ['<em>', '</em>']
		},
		underline: {
			txtExec: ['<span style="text-decoration:underline;">', '</span>']
		},
		strike: {
			txtExec: ['<span style="text-decoration:line-through;">', '</span>']
		},
		subscript: {
			txtExec: ['<sub>', '</sub>']
		},
		superscript: {
			txtExec: ['<sup>', '</sup>']
		},
		left: {
			txtExec: ['<div style="text-align:left;">', '</div>']
		},
		center: {
			txtExec: ['<div style="text-align:center;">', '</div>']
		},
		right: {
			txtExec: ['<div style="text-align:right;">', '</div>']
		},
		justify: {
			txtExec: ['<div style="text-align:justify;">', '</div>']
		},
		font: {
			txtExec: function (caller) {
				var editor = this;

				getEditorCommand('font')._dropDown(
					editor,
					caller,
					function (font) {
						editor.insertText('<span style="font-family:' +
							font + ';">', '</span>');
					}
				);
			}
		},
		size: {
			txtExec: function (caller) {
				var editor = this;

				getEditorCommand('size')._dropDown(
					editor,
					caller,
					function (size) {
						editor.insertText('<span style="font-size:' +
							size + ';">', '</span>');
					}
				);
			}
		},
		color: {
			txtExec: function (caller) {
				var editor = this;

				getEditorCommand('color')._dropDown(
					editor,
					caller,
					function (color) {
						editor.insertText('<span style="color:' +
							color + ';">', '</span>');
					}
				);
			}
		},
		bulletlist: {
			txtExec: ['<ul><li>', '</li></ul>']
		},
		orderedlist: {
			txtExec: ['<ol><li>', '</li></ol>']
		},
		table: {
			txtExec: ['<table><tr><td>', '</td></tr></table>']
		},
		horizontalrule: {
			txtExec: ['<hr />']
		},
		code: {
			txtExec: ['<code>', '</code>']
		},
		image: {
			txtExec: function (caller, selected) {
				var	editor  = this;

				getEditorCommand('image')._dropDown(
					editor,
					caller,
					selected,
					function (url, width, height) {
						var attrs  = '';

						if (width) {
							attrs += ' width="' + width + '"';
						}

						if (height) {
							attrs += ' height="' + height + '"';
						}

						editor.insertText(
							'<img' + attrs + ' src="' + url + '" />'
						);
					}
				);
			}
		},
		email: {
			txtExec: function (caller, selected) {
				var	editor  = this;

				getEditorCommand('email')._dropDown(
					editor,
					caller,
					function (url, text) {
						editor.insertText(
							'<a href="mailto:' + url + '">' +
								(text || selected || url) +
							'</a>'
						);
					}
				);
			}
		},
		link: {
			txtExec: function (caller, selected) {
				var	editor  = this;

				getEditorCommand('link')._dropDown(
					editor,
					caller,
					function (url, text) {
						editor.insertText(
							'<a href="' + url + '">' +
								(text || selected || url) +
							'</a>'
						);
					}
				);
			}
		},
		quote: {
			txtExec: ['<blockquote>', '</blockquote>']
		},
		youtube: {
			txtExec: function (caller) {
				var editor = this;

				getEditorCommand('youtube')._dropDown(
					editor,
					caller,
					function (id, time) {
						editor.insertText(
							'<iframe width="560" height="315" ' +
							'src="https://www.youtube.com/embed/{id}?' +
							'wmode=opaque&start=' + time + '" ' +
							'data-youtube-id="' + id + '" ' +
							'frameborder="0" allowfullscreen></iframe>'
						);
					}
				);
			}
		},
		rtl: {
			txtExec: ['<div stlye="direction:rtl;">', '</div>']
		},
		ltr: {
			txtExec: ['<div stlye="direction:ltr;">', '</div>']
		}
	};

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
					var tagName = node.nodeName.toLowerCase();

					// IE comment
					if (tagName === '!') {
						handleComment(node);
					} else {
						handleElement(node, parentIsPre);
					}
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
						if (!firstChild || (!IE_BR_FIX &&
							node.childNodes.length === 1 &&
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
	xhtmlFormat.converters = [
		{
			tags: {
				'*': {
					width: null
				}
			},
			conv: function (node) {
				css(node, 'width', attr(node, 'width'));
				removeAttr(node, 'width');
			}
		},
		{
			tags: {
				'*': {
					height: null
				}
			},
			conv: function (node) {
				css(node, 'height', attr(node, 'height'));
				removeAttr(node, 'height');
			}
		},
		{
			tags: {
				'li': {
					value: null
				}
			},
			conv: function (node) {
				removeAttr(node, 'value');
			}
		},
		{
			tags: {
				'*': {
					text: null
				}
			},
			conv: function (node) {
				css(node, 'color', attr(node, 'text'));
				removeAttr(node, 'text');
			}
		},
		{
			tags: {
				'*': {
					color: null
				}
			},
			conv: function (node) {
				css(node, 'color', attr(node, 'color'));
				removeAttr(node, 'color');
			}
		},
		{
			tags: {
				'*': {
					face: null
				}
			},
			conv: function (node) {
				css(node, 'fontFamily', attr(node, 'face'));
				removeAttr(node, 'face');
			}
		},
		{
			tags: {
				'*': {
					align: null
				}
			},
			conv: function (node) {
				css(node, 'textAlign', attr(node, 'align'));
				removeAttr(node, 'align');
			}
		},
		{
			tags: {
				'*': {
					border: null
				}
			},
			conv: function (node) {
				css(node, 'borderWidth', attr(node, 'border'));
				removeAttr(node, 'border');
			}
		},
		{
			tags: {
				applet: {
					name: null
				},
				img: {
					name: null
				},
				layer: {
					name: null
				},
				map: {
					name: null
				},
				object: {
					name: null
				},
				param: {
					name: null
				}
			},
			conv: function (node) {
				if (!attr(node, 'id')) {
					attr(node, 'id', attr(node, 'name'));
				}

				removeAttr(node, 'name');
			}
		},
		{
			tags: {
				'*': {
					vspace: null
				}
			},
			conv: function (node) {
				css(node, 'marginTop', attr(node, 'vspace') - 0);
				css(node, 'marginBottom', attr(node, 'vspace') - 0);
				removeAttr(node, 'vspace');
			}
		},
		{
			tags: {
				'*': {
					hspace: null
				}
			},
			conv: function (node) {
				css(node, 'marginLeft', attr(node, 'hspace') - 0);
				css(node, 'marginRight', attr(node, 'hspace') - 0);
				removeAttr(node, 'hspace');
			}
		},
		{
			tags: {
				'hr': {
					noshade: null
				}
			},
			conv: function (node) {
				css(node, 'borderStyle', 'solid');
				removeAttr(node, 'noshade');
			}
		},
		{
			tags: {
				'*': {
					nowrap: null
				}
			},
			conv: function (node) {
				css(node, 'whiteSpace', 'nowrap');
				removeAttr(node, 'nowrap');
			}
		},
		{
			tags: {
				big: null
			},
			conv: function (node) {
				css(convertElement(node, 'span'), 'fontSize', 'larger');
			}
		},
		{
			tags: {
				small: null
			},
			conv: function (node) {
				css(convertElement(node, 'span'), 'fontSize', 'smaller');
			}
		},
		{
			tags: {
				b: null
			},
			conv: function (node) {
				convertElement(node, 'strong');
			}
		},
		{
			tags: {
				u: null
			},
			conv: function (node) {
				css(convertElement(node, 'span'), 'textDecoration',
					'underline');
			}
		},
		{
			tags: {
				s: null,
				strike: null
			},
			conv: function (node) {
				css(convertElement(node, 'span'), 'textDecoration',
					'line-through');
			}
		},
		{
			tags: {
				dir: null
			},
			conv: function (node) {
				convertElement(node, 'ul');
			}
		},
		{
			tags: {
				center: null
			},
			conv: function (node) {
				css(convertElement(node, 'div'), 'textAlign', 'center');
			}
		},
		{
			tags: {
				font: {
					size: null
				}
			},
			conv: function (node) {
				css(node, 'fontSize', css(node, 'fontSize'));
				removeAttr(node, 'size');
			}
		},
		{
			tags: {
				font: null
			},
			conv: function (node) {
				// All it's attributes will be converted
				// by the attribute converters
				convertElement(node, 'span');
			}
		},
		{
			tags: {
				'*': {
					type: ['_moz']
				}
			},
			conv: function (node) {
				removeAttr(node, 'type');
			}
		},
		{
			tags: {
				'*': {
					'_moz_dirty': null
				}
			},
			conv: function (node) {
				removeAttr(node, '_moz_dirty');
			}
		},
		{
			tags: {
				'*': {
					'_moz_editor_bogus_node': null
				}
			},
			conv: function (node) {
				node.parentNode.removeChild(node);
			}
		}
	];

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
}(sceditor));
