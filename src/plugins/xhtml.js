/**
 * SCEditor XHTML Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 * @requires jQuery
 */
/*global prompt: true*/
(function ($) {
	'use strict';

	var SCEditor        = $.sceditor;
	var sceditorPlugins = SCEditor.plugins;
	var dom             = SCEditor.dom;

	var defaultCommandsOverrides = {
		bold: {
			txtExec: [
				'<strong>',
				'</strong>'
			]
		},
		italic: {
			txtExec: [
				'<em>',
				'</em>'
			]
		},
		underline: {
			txtExec: [
				'<span style="text-decoration: underline;">',
				'</span>'
			]
		},
		strike: {
			txtExec: [
				'<span style="text-decoration: line-through;">',
				'</span>'
			]
		},
		subscript: {
			txtExec: [
				'<sub>',
				'</sub>'
			]
		},
		superscript: {
			txtExec: [
				'<sup>',
				'</sup>'
			]
		},
		left: {
			txtExec: [
				'<div style="text-align: left;">',
				'</div>'
			]
		},
		center: {
			txtExec: [
				'<div style="text-align: center;">',
				'</div>'
			]
		},
		right: {
			txtExec: [
				'<div style="text-align: right;">',
				'</div>'
			]
		},
		justify: {
			txtExec: [
				'<div style="text-align: justify;">',
				'</div>'
			]
		},
		font: {
			txtExec: function (caller) {
				var editor = this;

				SCEditor.command.get('font')._dropDown(
					editor,
					caller,
					function (fontName) {
						editor.insertText('<span style="font-family: ' +
							fontName + ';">', '</span>');
					}
				);
			}
		},
		size: {
			txtExec: function (caller) {
				var editor = this;

				SCEditor.command.get('size')._dropDown(
					editor,
					caller,
					function (fontSize) {
						editor.insertText('<span style="font-size: ' +
							fontSize + ';">', '</span>');
					}
				);
			}
		},
		color: {
			txtExec: function (caller) {
				var editor = this;

				SCEditor.command.get('color')._dropDown(
					editor,
					caller,
					function (color) {
						editor.insertText('<span style="color: ' +
							color + ';">', '</span>');
					}
				);
			}
		},
		bulletlist: {
			txtExec: [
				'<ul><li>',
				'</li></ul>'
			]
		},
		orderedlist: {
			txtExec: [
				'<ol><li>',
				'</li></ol>'
			]
		},
		table: {
			txtExec: [
				'<table><tr><td>',
				'</td></tr></table>'
			]
		},
		horizontalrule: {
			txtExec: [
				'<hr />'
			]
		},
		code: {
			txtExec: [
				'<code>',
				'</code>'
			]
		},
		image: {
			txtExec: function (caller, selected) {
				var url = prompt(this._('Enter the image URL:'), selected);

				if (url) {
					this.insertText('<img src="' + url + '" />');
				}
			}
		},
		email: {
			txtExec: function (caller, sel) {
				var	email, text,
					display = sel && sel.indexOf('@') > -1 ? null : sel;

				email = prompt(
					this._('Enter the e-mail address:'),
					(display ? '' : sel)
				);

				text = prompt(
					this._('Enter the displayed text:'),
					display || email
				) || email;

				if (email) {
					this.insertText(
						'<a href="mailto:' + email + '">' + text + '</a>'
					);
				}
			}
		},
		link: {
			txtExec: function (caller, sel) {
				var display = sel && sel.indexOf('http://') > -1 ? null : sel,
					url  = prompt(this._('Enter URL:'),
						(display ? 'http://' : sel)),
					text = prompt(this._('Enter the displayed text:'),
						display || url) || url;

				if (url) {
					this.insertText(
						'<a href="' + url + '">' + text + '</a>'
					);
				}
			}
		},
		quote: {
			txtExec: [
				'<blockquote>',
				'</blockquote>'
			]
		},
		youtube: {
			txtExec: function (caller) {
				var editor = this;

				SCEditor.command.get('youtube')._dropDown(
					editor,
					caller,
					function (id) {
						editor.insertText(
							'<iframe width="560" height="315" ' +
							'src="http://www.youtube.com/embed/{id}?' +
							'wmode=opaque" data-youtube-id="' + id + '" ' +
							'frameborder="0" allowfullscreen></iframe>'
						);
					}
				);
			}
		},
		rtl: {
			txtExec: [
				'<div stlye="direction: rtl;">',
				'</div>'
			]
		},
		ltr: {
			txtExec: [
				'<div stlye="direction: ltr;">',
				'</div>'
			]
		}
	};

	/**
	 * XHTMLSerializer part of the XHTML plugin.
	 *
	 * @class XHTMLSerializer
	 * @name jQuery.sceditor.XHTMLSerializer
	 * @since v1.4.1
	 */
	SCEditor.XHTMLSerializer = function () {
		var base = this;

		var opts = {
			indentStr: '\t'
		};

		/**
		 * Array containing the output, used as it's faster
		 * than string concation in slow browsers.
		 * @type {Array}
		 * @private
		 */
		var outputStringBuilder = [];

		/**
		 * Current indention level
		 * @type {Number}
		 * @private
		 */
		var currentIndent = 0;

		/**
		 * @private
		 */
		var	escapeEntites,
			trim,
			serializeNode,
			handleDoc,
			handleElement,
			handleCdata,
			handleComment,
			handleText,
			output,
			canIndent;
// TODO: use escape.entities
		/**
		 * Escapes XHTML entities
		 *
		 * @param  {String} str
		 * @return {String}
		 * @private
		 */
		escapeEntites = function (str) {
			var entites = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;'
			};

			return !str ? '' : str.replace(/[&<>"]/g, function (entity) {
				return entites[entity] || entity;
			});
		};

		/**
		 * @param  {string} str
		 * @return {string}
		 * @private
		 */
		trim = function (str) {
			return str
				// New lines will be shown as spaces so just convert to spaces.
				.replace(/[\r\n]/, ' ')
				.replace(/[^\S|\u00A0]+/g, ' ');
		};

		/**
		 * Serializes a node to XHTML
		 *
		 * @param  {Node} node            Node to serialize
		 * @param  {Boolean} onlyChildren If to only serialize the nodes
		 *                                children and not the node
		 *                                itself
		 * @return {String}               The serialized node
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
		 * @return {Void}
		 * @private
		 */
		serializeNode = function (node, parentIsPre) {
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
		handleDoc = function (node) {
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
		handleElement = function (node, parentIsPre) {
			var	child, attr, attrValue,
				tagName     = node.nodeName.toLowerCase(),
				isIframe    = tagName === 'iframe',
				attrIdx     = node.attributes.length,
				firstChild  = node.firstChild,
				// pre || pre-wrap with any vendor prefix
				isPre       = parentIsPre ||
					/pre(?:\-wrap)?$/i.test($(node).css('whiteSpace')),
				selfClosing = !node.firstChild && !dom.canHaveChildren(node) &&
					!isIframe;

			if ($(node).hasClass('sceditor-ignore')) {
				return;
			}

			output('<' + tagName, !parentIsPre && canIndent(node));
			while (attrIdx--) {
				attr = node.attributes[attrIdx];

				// IE < 8 returns all possible attribtues not just specified
				// ones. IE < 8 also doesn't say value on input is specified
				// so just assume it is.
				if (!SCEditor.ie || attr.specified ||
					(tagName === 'input' && attr.name === 'value')) {
					// IE < 8 doesn't return the CSS for the style attribute
					if (SCEditor.ie < 8 && /style/i.test(attr.name)) {
						attrValue = node.style.cssText;
					} else {
						attrValue = attr.value;
					}

					output(' ' + attr.name.toLowerCase() + '="' +
						escapeEntites(attrValue) + '"', false);
				}
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
		handleCdata =  function (node) {
			output('<![CDATA[' + escapeEntites(node.nodeValue) + ']]>');
		};

		/**
		 * Handles comment nodes
		 * @param  {Node} node
		 * @return {void}
		 * @private
		 */
		handleComment = function (node) {
			output('<!-- ' + escapeEntites(node.nodeValue) + ' -->');
		};

		/**
		 * Handles text nodes
		 * @param  {Node} node
		 * @return {void}
		 * @private
		 */
		handleText = function (node, parentIsPre) {
			var text = node.nodeValue;

			if (!parentIsPre) {
				text = trim(text);
			}

			if (text) {
				output(escapeEntites(text), !parentIsPre && canIndent(node));
			}
		};

		/**
		 * Adds a string to the outputStringBuilder.
		 *
		 * The string will be indented unless indent is set to boolean false.
		 * @param  {String} str
		 * @param  {Boolean} indent
		 * @return {void}
		 * @private
		 */
		output = function (str, indent) {
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
		canIndent = function (node) {
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
	sceditorPlugins.xhtml = function () {
		var base = this;

		/**
		 * Tag converstions cache
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
		 * Private methods
		 * @private
		 */
		var	convertTags,
			convertNode,
			isEmpty,
			removeTags,
			mergeAttribsFilters,
			removeAttribs,
			wrapInlines;


		/**
		 * Init
		 * @return {void}
		 */
		base.init = function () {
			if (!$.isEmptyObject(sceditorPlugins.xhtml.converters || {})) {
				$.each(
					sceditorPlugins.xhtml.converters,
					function (idx, converter) {
						$.each(converter.tags, function (tagname) {
							if (!tagConvertersCache[tagname]) {
								tagConvertersCache[tagname] = [];
							}

							tagConvertersCache[tagname].push(converter);
						});
					}
				);
			}

			this.commands = $.extend(true,
				{}, defaultCommandsOverrides, this.commands);
		};

		/**
		 * Converts the WYSIWYG content to XHTML
		 * @param  {String} html
		 * @param  {Node} domBody
		 * @return {String}
		 * @memberOf jQuery.sceditor.plugins.xhtml.prototype
		 */
		base.signalToSource = function (html, domBody) {
			domBody = domBody.jquery ? domBody[0] : domBody;

			convertTags(domBody);
			removeTags(domBody);
			removeAttribs(domBody);
			wrapInlines(domBody);

			return (new SCEditor.XHTMLSerializer()).serialize(domBody, true);
		};

		/**
		 * Converts the XHTML to WYSIWYG content.
		 *
		 * This doesn't currently do anything as XHTML
		 * is valid WYSIWYG content.
		 * @param  {String} text
		 * @return {String}
		 * @memberOf jQuery.sceditor.plugins.xhtml.prototype
		 */
		base.signalToWysiwyg = function (text) {
			return text;
		};

		/**
		 * Deprecated, use dom.convertElement() instead.
		 * @deprecated
		 */
		base.convertTagTo = dom.convertElement;

		/**
		 * Runs all converters for the specified tagName
		 * against the DOM node.
		 * @param  {String} tagName
		 * @param  {jQuery} $node
		 * @return {Node} node
		 * @private
		 */
		convertNode = function (tagName, $node, node) {
			if (!tagConvertersCache[tagName]) {
				return;
			}

			$.each(tagConvertersCache[tagName], function (idx, converter) {
				if (converter.tags[tagName]) {
					$.each(converter.tags[tagName], function (attr, values) {
						if (!node.getAttributeNode) {
							return;
						}

						attr = node.getAttributeNode(attr);

						// IE < 8 always returns an attribute regardless of if
						// it has been specified so must check it.
						if (!attr || (SCEditor.ie < 8 && !attr.specified)) {
							return;
						}

						if (values && $.inArray(attr.value, values) < 0) {
							return;
						}

						converter.conv.call(base, node, $node);
					});
				} else if (converter.conv) {
					converter.conv.call(base, node, $node);
				}
			});
		};

		/**
		 * Converts any tags/attributes to their XHTML equivalents
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		convertTags = function (node) {
			dom.traverse(node, function (node) {
				var	$node   = $(node),
					tagName = node.nodeName.toLowerCase();

				convertNode('*', $node, node);
				convertNode(tagName, $node, node);
			}, true);
		};

		/**
		 * Tests if a node is empty and can be removed.
		 *
		 * @param  {Node} node
		 * @return {Boolean}
		 * @private
		 */
		isEmpty = function (node, excludeBr) {
			var	childNodes     = node.childNodes,
				tagName        = node.nodeName.toLowerCase(),
				nodeValue      = node.nodeValue,
				childrenLength = childNodes.length;

			if (excludeBr && tagName === 'br') {
				return true;
			}

			if (!dom.canHaveChildren(node)) {
				return false;
			}

			// \S|\u00A0 = any non space char
			if (nodeValue && /\S|\u00A0/.test(nodeValue)) {
				return false;
			}

			while (childrenLength--) {
				if (!isEmpty(childNodes[childrenLength],
					!node.previousSibling && !node.nextSibling)) {
					return false;
				}
			}

			return true;
		};

		/**
		 * Removes any tags that are not white listed or if no
		 * tags are white listed it will remove any tags that
		 * are black listed.
		 *
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		removeTags = function (node) {
			dom.traverse(node, function (node) {
				var	remove,
					tagName         = node.nodeName.toLowerCase(),
					empty           = tagName !== 'iframe' && isEmpty(node),
					parentNode      = node.parentNode,
					nodeType        = node.nodeType,
					isBlock         = !dom.isInline(node),
					previousSibling = node.previousSibling,
					nextSibling     = node.nextSibling,
					document        = node.ownerDocument,
					allowedtags     = sceditorPlugins.xhtml.allowedTags,
					disallowedTags  = sceditorPlugins.xhtml.disallowedTags;

				// 3 = text node
				if (nodeType === 3) {
					return;
				}

				if (nodeType === 4) {
					tagName = '!cdata';
				} else if (tagName === '!' || nodeType === 8) {
					tagName = '!comment';
				}

				if (empty) {
					remove = true;
				// 3 is text node which do not get filtered
				} else if (allowedtags && allowedtags.length) {
					remove = ($.inArray(tagName, allowedtags) < 0);
				} else if (disallowedTags && disallowedTags.length) {
					remove = ($.inArray(tagName, disallowedTags) > -1);
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
		mergeAttribsFilters = function (filtersA, filtersB) {
			var ret = {};

			if (filtersA) {
				$.extend(ret, filtersA);
			}

			if (!filtersB) {
				return ret;
			}

			$.each(filtersB, function (attrName, values) {
				if ($.isArray(values)) {
					ret[attrName] = $.merge(ret[attrName] || [], values);
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
		wrapInlines = function (root) {
			var adjacentInlines = [];
			var wrapAdjacents = function () {
				if (adjacentInlines.length) {
					$('<p>', root.ownerDocument)
						.insertBefore(adjacentInlines[0])
						.append(adjacentInlines);

					adjacentInlines = [];
				}
			};

			// Strip empty text nodes so they don't get wrapped.
			dom.removeWhiteSpace(root);

			var node = root.firstChild;
			while (node) {
				if (dom.isInline(node) && !$(node).is('.sceditor-ignore')) {
					adjacentInlines.push(node);
				} else {
					wrapAdjacents();
				}

				node = node.nextSibling;
			}

			wrapAdjacents();
		};

		/**
		 * Removes any attributes that are not white listed or
		 * if no attributes are white listed it will remove
		 * any attributes that are black listed.
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		removeAttribs = function (node) {
			var	tagName, attr, attrName, attrsLength, validValues, remove,
				allowedAttribs    = sceditorPlugins.xhtml.allowedAttribs,
				isAllowed         = allowedAttribs &&
					!$.isEmptyObject(allowedAttribs),
				disallowedAttribs = sceditorPlugins.xhtml.disallowedAttribs,
				isDisallowed      = disallowedAttribs &&
					!$.isEmptyObject(disallowedAttribs);

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
								(!$.isArray(validValues) ||
									$.inArray(attr.value, validValues) < 0);
						} else if (isDisallowed) {
							remove = validValues === null ||
								($.isArray(validValues) &&
									$.inArray(attr.value, validValues) > -1);
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
	sceditorPlugins.xhtml.converters = [
		{
			tags: {
				'*': {
					width: null
				}
			},
			conv: function (node, $node) {
				$node.css('width', $node.attr('width')).removeAttr('width');
			}
		},
		{
			tags: {
				'*': {
					height: null
				}
			},
			conv: function (node, $node) {
				$node.css('height', $node.attr('height')).removeAttr('height');
			}
		},
		{
			tags: {
				'li': {
					value: null
				}
			},
			conv: function (node, $node) {
				if (SCEditor.ie < 8) {
					node.removeAttribute('value');
				} else {
					$node.removeAttr('value');
				}
			}
		},
		{
			tags: {
				'*': {
					text: null
				}
			},
			conv: function (node, $node) {
				$node.css('color', $node.attr('text')).removeAttr('text');
			}
		},
		{
			tags: {
				'*': {
					color: null
				}
			},
			conv: function (node, $node) {
				$node.css('color', $node.attr('color')).removeAttr('color');
			}
		},
		{
			tags: {
				'*': {
					face: null
				}
			},
			conv: function (node, $node) {
				$node.css('fontFamily', $node.attr('face')).removeAttr('face');
			}
		},
		{
			tags: {
				'*': {
					align: null
				}
			},
			conv: function (node, $node) {
				$node.css('textAlign', $node.attr('align')).removeAttr('align');
			}
		},
		{
			tags: {
				'*': {
					border: null
				}
			},
			conv: function (node, $node) {
				$node
					.css('borderWidth',$node.attr('border'))
					.removeAttr('border');
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
			conv: function (node, $node) {
				if (!$node.attr('id')) {
					$node.attr('id', $node.attr('name'));
				}

				$node.removeAttr('name');
			}
		},
		{
			tags: {
				'*': {
					vspace: null
				}
			},
			conv: function (node, $node) {
				$node
					.css('marginTop', $node.attr('vspace') - 0)
					.css('marginBottom', $node.attr('vspace') - 0)
					.removeAttr('vspace');
			}
		},
		{
			tags: {
				'*': {
					hspace: null
				}
			},
			conv: function (node, $node) {
				$node
					.css('marginLeft', $node.attr('hspace') - 0)
					.css('marginRight', $node.attr('hspace') - 0)
					.removeAttr('hspace');
			}
		},
		{
			tags: {
				'hr': {
					noshade: null
				}
			},
			conv: function (node, $node) {
				$node.css('borderStyle', 'solid').removeAttr('noshade');
			}
		},
		{
			tags: {
				'*': {
					nowrap: null
				}
			},
			conv: function (node, $node) {
				$node.css('white-space', 'nowrap').removeAttr('nowrap');
			}
		},
		{
			tags: {
				big: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'span')).css('fontSize', 'larger');
			}
		},
		{
			tags: {
				small: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'span')).css('fontSize', 'smaller');
			}
		},
		{
			tags: {
				b: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'strong'));
			}
		},
		{
			tags: {
				u: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'span'))
					.css('textDecoration', 'underline');
			}
		},
		{
			tags: {
				i: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'em'));
			}
		},
		{
			tags: {
				s: null,
				strike: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'span'))
					.css('textDecoration', 'line-through');
			}
		},
		{
			tags: {
				dir: null
			},
			conv: function (node) {
				this.convertTagTo(node, 'ul');
			}
		},
		{
			tags: {
				center: null
			},
			conv: function (node) {
				$(this.convertTagTo(node, 'div'))
					.css('textAlign', 'center');
			}
		},
		{
			tags: {
				font: {
					size: null
				}
			},
			conv: function (node, $node) {
				var	size     = $node.css('fontSize'),
					fontSize = size;

				// IE < 8 sets a font tag with no size to +0 so
				// should just skip it.
				if (fontSize !== '+0') {
					// IE 8 and below incorrectly returns the value of the size
					// attribute instead of the px value so must convert it
					if (SCEditor.ie < 9) {
						fontSize = 10;

						if (size > 1) {
							fontSize = 13;
						}
						if (size > 2) {
							fontSize = 16;
						}
						if (size > 3) {
							fontSize = 18;
						}
						if (size > 4) {
							fontSize = 24;
						}
						if (size > 5) {
							fontSize = 32;
						}
						if (size > 6) {
							fontSize = 48;
						}
					}

					$node.css('fontSize', fontSize);
				}

				$node.removeAttr('size');
			}
		},
		{
			tags: {
				font: null
			},
			conv: function (node) {
				// All it's attributes will be converted
				// by the attribute converters
				this.convertTagTo(node, 'span');
			}
		},
		{
			tags: {
				'*': {
					type: ['_moz']
				}
			},
			conv: function (node, $node) {
				$node.removeAttr('type');
			}
		},
		{
			tags: {
				'*': {
					'_moz_dirty': null
				}
			},
			conv: function (node, $node) {
				$node.removeAttr('_moz_dirty');
			}
		},
		{
			tags: {
				'*': {
					'_moz_editor_bogus_node': null
				}
			},
			conv: function (node, $node) {
				$node.remove();
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
	sceditorPlugins.xhtml.allowedAttribs = {};

	/**
	 * Attributes that are not allowed.
	 *
	 * Only used if allowed attributes is null or empty.
	 * @type {Object}
	 * @name jQuery.sceditor.plugins.xhtml.disallowedAttribs
	 * @since v1.4.1
	 */
	sceditorPlugins.xhtml.disallowedAttribs = {};

	/**
	 * Array containing all the allowed tags.
	 *
	 * If null or empty all tags will be allowed.
	 * @type {Array}
	 * @name jQuery.sceditor.plugins.xhtml.allowedTags
	 * @since v1.4.1
	 */
	sceditorPlugins.xhtml.allowedTags = [];

	/**
	 * Array containing all the disallowed tags.
	 *
	 * Only used if allowed tags is null or empty.
	 * @type {Array}
	 * @name jQuery.sceditor.plugins.xhtml.disallowedTags
	 * @since v1.4.1
	 */
	sceditorPlugins.xhtml.disallowedTags = [];
}(jQuery));
