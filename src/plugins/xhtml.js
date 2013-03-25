/*!pl SCEditor | (C) 2011-2013, Sam Clarke | sceditor.com/license */
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
 * @version 1.4.2
 * @requires jQuery
 */

// ==ClosureCompiler==
// @output_file_name xhtml.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*jshint smarttabs: true, jquery: true, eqnull:true, curly: false */
/*global prompt: true*/

(function($) {
	'use strict';

	/**
	 * XHTMLSerializer part of the XHTML plugin.
	 *
	 * @class XHTMLSerializer
	 * @name jQuery.sceditor.XHTMLSerializer
	 * @since v1.4.1
	 */
	$.sceditor.XHTMLSerializer = function() {
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
			indent,
			canIndent,
			newline;

		/**
		 * Escapes XHTML entities
		 * @param  {String} str
		 * @return {String}
		 * @private
		 */
		escapeEntites = function(str) {
			var entites = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;'
			};

			return !str ? '' : str.replace(/[&<>"]/g, function(entity) {
				return entites[entity] || entity;
			});
		};

		/**
		 * @param  {string} str
		 * @return {string}
		 * @private
		 */
		trim = function(str) {
			return str
				// new lines in text nodes are always ignored in normal handling
				.replace(/[\r\n]/, "")
				.replace(/[^\S|\u00A0]+/g, " ");
		};

		/**
		 * Serializes a node to XHTML
		 * @param  {Node}	node		Node to serialize
		 * @param  {Boolean}	onlyChildren	If to only serialize the nodes children and not the node its self
		 * @return {String}			The serialized node
		 * @name serialize
		 * @memberOf jQuery.sceditor.XHTMLSerializer.prototype
		 * @since v1.4.1
		 */
		base.serialize = function(node, onlyChildren) {
			outputStringBuilder = [];

			if(onlyChildren)
			{
				node = node.firstChild;

				while(node)
				{
					serializeNode(node);
					node = node.nextSibling;
				}
			}
			else
				serializeNode(node);

			return outputStringBuilder.join('');
		};

		/**
		 * Serializes a node to the outputStringBuilder
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		serializeNode = function(node) {
			switch(node.nodeType)
			{
				case 1: // element
					var tagName = node.nodeName.toLowerCase();

					// IE comment
					if(tagName === '!')
						handleComment(node);


					handleElement(node);
					break;

				case 3: // text
					handleText(node);
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
		handleDoc = function(node) {
			var	child;

			child = node.firstChild;

			while(child)
			{
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
		handleElement = function(node) {
			var	child, attr,
				tagName     = node.nodeName.toLowerCase(),
				i           = node.attributes.length,
				selfClosing = !node.firstChild && /^(?:area|base|br|col|embed|hr|img|input|link|meta|param)$/.test(tagName);

			if(canIndent(node))
				indent();

			outputStringBuilder.push('<' + tagName);
			while(i--)
			{
				attr = node.attributes[i];
				outputStringBuilder.push(" ", attr.name.toLowerCase(), '="', escapeEntites(attr.value), '"');
			}
			outputStringBuilder.push(selfClosing ? ' />' : '>');

			currentIndent++;

			child = node.firstChild;
			while(child)
			{
				serializeNode(child);
				child = child.nextSibling;
			}

			currentIndent--;

			if(!selfClosing)
			{
				if(canIndent(node) && node.firstChild)
					indent();

				outputStringBuilder.push('</', tagName, '>');
			}
		};

		/**
		 * Handles CDATA nodes
		 * @param  {Node} node
		 * @return {void}
		 * @private
		 */
		handleCdata =  function(node) {
			indent();

			outputStringBuilder.push('<![CDATA[', escapeEntites(node.nodeValue), ']]>');
		};

		/**
		 * Handles comment nodes
		 * @param  {Node} node
		 * @return {void}
		 * @private
		 */
		handleComment = function(node) {
			indent();

			outputStringBuilder.push('<!-- ', escapeEntites(node.nodeValue), ' -->');
		};

		/**
		 * Handles test nodes
		 * @param  {Node} node
		 * @return {void}
		 * @private
		 */
		handleText = function(node) {
			var text = trim(node.nodeValue);

			if(text)
			{
				if(canIndent(node))
					indent();

				outputStringBuilder.push(escapeEntites(text));
			}
		};

		/**
		 * Adds indent to the outputStringBuilder
		 * @return {void}
		 * @private
		 */
		indent = function() {
			var i = currentIndent;

			newline();

			while(i--)
				outputStringBuilder.push(opts.indentStr);
		};

		/**
		 * Checks if should indent the node or not
		 * @param  {Node} node
		 * @return {boolean}
		 * @private
		 */
		canIndent = function(node) {
			if(node.nodeType !== 1)
			{
				if(node.previousSibling && $.sceditor.dom.isInline(node.previousSibling))
					return false;

				node = node.parentNode;
			}

			// first child of a block element
			if(!node.previousSibling && !$.sceditor.dom.isInline(node.parentNode))
				return true;

			return !$.sceditor.dom.isInline(node);
		};

		/**
		 * Adds a new line to the outputStringBuilder
		 * @return {void}
		 * @private
		 */
		newline = function() {
			// Don't add a new line if it's the first element
			if(outputStringBuilder.length)
				outputStringBuilder.push('\n');
		};
	};

	/**
	 * SCEditor XHTML plugin
	 * @class xhtml
	 * @name jQuery.sceditor.plugins.xhtml
	 * @since v1.4.1
	 */
	$.sceditor.plugins.xhtml = function() {
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
		var	mergeSourceModeCommands,
			convertTags,
			convertNode,
			removetags,
			mergeAttribsFilters,
			removeAttribs;


		/**
		 * Init
		 * @return {void}
		 */
		base.init = function() {
			if(!$.isEmptyObject($.sceditor.plugins.xhtml.converters || {}))
			{
				$.each($.sceditor.plugins.xhtml.converters, function(idx, converter) {
					$.each(converter.tags, function(tagname) {
						if(!tagConvertersCache[tagname])
							tagConvertersCache[tagname] = [];

						tagConvertersCache[tagname].push(converter);
					});
				});
			}

			mergeSourceModeCommands(this);
		};

		/**
		 * Add textExec's to the default commands so
		 * they work in source mode
		 * @param  {jQuery.sceditor} editor
		 * @return {Void}
		 * @private
		 */
		mergeSourceModeCommands = function(editor) {
			var merge = {
				bold: { txtExec: ['<strong>', '</strong>'] },
				italic: { txtExec: ['<em>', '</em>'] },
				underline: { txtExec: ['<span style="text-decoration: underline;">', '<span>'] },
				strike: { txtExec: ['<span style="text-decoration: line-through;">', '<span>'] },
				subscript: { txtExec: ['<sub>', '</sub>'] },
				superscript: { txtExec: ['<sup>', '</sup>'] },
				left: { txtExec: ['<div style="text-align: left;">', '<div>'] },
				center: { txtExec: ['<div style="text-align: center;">', '<div>'] },
				right: { txtExec: ['<div style="text-align: right;">', '<div>'] },
				justify: { txtExec: ['<div style="text-align: justify;">', '<div>'] },
				font: { txtExec: function(caller) {
					var editor = this;

					$.sceditor.command.get('font')._dropDown(
						editor,
						caller,
						function(fontName) {
							editor.insertText('<span style="font-family: '+fontName+';">', '</span>');
						}
					);
				} },
				size: { txtExec: function(caller) {
					var editor = this;

					$.sceditor.command.get('size')._dropDown(
						editor,
						caller,
						function(fontSize) {
							editor.insertText('<span style="font-size: '+fontSize+';">', '</span>');
						}
					);
				} },
				color: { txtExec: function(caller) {
					var editor = this;

					$.sceditor.command.get('color')._dropDown(
						editor,
						caller,
						function(color) {
							editor.insertText('<span style="color: '+color+';">', '</span>');
						}
					);
				} },
				bulletlist: { txtExec: ['<ul><li>', '</li></ul>'] },
				orderedlist: { txtExec: ['<ol><li>', '</li></ol>'] },
				table: { txtExec: ['<table><tr><td>', '</td></tr></table>'] },
				horizontalrule: { txtExec: ['<hr />'] },
				code: { txtExec: ['<code>', '</code>'] },
				image: { txtExec: function(caller, selected) {
					var url = prompt(this._('Enter the image URL:'), selected);

					if(url)
						this.insertText('<img src="' + url + '" />');
				} },
				email: { txtExec: function(caller, selected) {
					var	display = selected && selected.indexOf('@') > -1 ? null : selected,
						email	= prompt(this._('Enter the e-mail address:'), (display ? '' : selected)),
						text	= prompt(this._('Enter the displayed text:'), display || email) || email;

					if(email)
						this.insertText('<a href="mailto:' + email + '">' + text + '</a>');
				} },
				link: { txtExec: function(caller, selected) {
					var	display = selected && selected.indexOf('http://') > -1 ? null : selected,
						url	= prompt(this._('Enter URL:'), (display ? 'http://' : selected)),
						text	= prompt(this._('Enter the displayed text:'), display || url) || url;

					if(url)
						this.insertText('<a href="' + url + '">' + text + '</a>');
				} },
				quote: { txtExec: ['<blockquote>', '</blockquote>'] },
				youtube: { txtExec: function(caller) {
					var editor = this;

					$.sceditor.command.get('youtube')._dropDown(
						editor,
						caller,
						function(id) {
							editor.insertText('<iframe width="560" height="315" src="http://www.youtube.com/embed/{id}?wmode=opaque" data-youtube-id="' + id + '" frameborder="0" allowfullscreen></iframe>');
						}
					);
				} },
				rtl: { txtExec: ['<div stlye="direction: rtl;">', '</div>'] },
				ltr: { txtExec: ['<div stlye="direction: ltr;">', '</div>'] }
			};

			editor.commands = $.extend(true, {}, merge, editor.commands);
		};

		/**
		 * Converts the WYSIWYG content to XHTML
		 * @param  {String} html
		 * @param  {Node} domBody
		 * @return {String}
		 * @memberOf jQuery.sceditor.plugins.xhtml.prototype
		 */
		base.signalToSource = function(html, domBody) {
			domBody = domBody.jquery ? domBody[0] : domBody;

			// remove selection markers
			$(domBody).find('.sceditor-selection').remove();

			convertTags(domBody);
			removetags(domBody);
			removeAttribs(domBody);

			return (new $.sceditor.XHTMLSerializer()).serialize(domBody, true);
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
		base.signalToWysiwyg = function(text) {
			return text;
		};

		/**
		 * Converts a tags name to the name specified
		 *
		 * @param  {Node} elm
		 * @param  {String} newtagName
		 * @return {Node} The new node
		 * @memberOf jQuery.sceditor.plugins.xhtml.prototype
		 */
		base.convertTagTo = function(elm, newtagName) {
			var	child, attr,
				i      = elm.attributes.length,
				newTag = elm.ownerDocument.createElement(newtagName);

			while(i--)
			{
				attr = elm.attributes[i];
				newTag.setAttribute(attr.name, attr.value);
			}

			while((child = elm.firstChild))
				newTag.appendChild(child);

			elm.parentNode.replaceChild(newTag, elm);

			return newTag;
		};

		/**
		 * [convertNode description]
		 * @param  {[type]} tagName [description]
		 * @param  {[type]} $node   [description]
		 * @return {[type]}         [description]
		 * @private
		 */
		convertNode = function(tagName, $node) {
			if(tagConvertersCache[tagName])
			{
				$.each(tagConvertersCache[tagName], function(idx, converter) {
					if(converter.tags[tagName])
					{
						$.each(converter.tags[tagName], function(attr, values) {
							if(typeof $node.attr(attr) === 'undefined')
								return;

							if(values && $.inArray($node.attr(attr), values) < 0)
								return;

							converter.conv.call(base, $node[0]);
						});
					}
					else if(converter.conv)
						converter.conv.call(base, $node[0]);
				});
			}
		};
		/**
		 * Converts any tags/attributes to their XHTML equivalents
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		convertTags = function(node) {
			if(!tagConvertersCache)
				return;

			$.sceditor.dom.traverse(node, function(node) {
				var	$node   = $(node),
					tagName = node.nodeName.toLowerCase();

				if(!tagConvertersCache)
					return;

				convertNode('*', $node);
				convertNode(tagName, $node);
			}, true);
		};

		/**
		 * Removes any tags that are not white listed or if no
		 * tags are white listed it will remove any tags that
		 * are black listed.
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		removetags = function(node) {
			$.sceditor.dom.traverse(node, function(node) {
				var	tagName        = node.nodeName.toLowerCase(),
					allowedtags    = $.sceditor.plugins.xhtml.allowedTags,
					disallowedTags = $.sceditor.plugins.xhtml.disallowedTags;

				// cdata section
				if(node.nodeType === 4)
					tagName = '!cdata';
				// comment
				else if(tagName === '!' || node.nodeType === 8)
					tagName = '!comment';

				// 3 is text node which do not get filtered
				if(allowedtags && allowedtags.length && node.nodeType !== 3)
				{
					if($.inArray(tagName, allowedtags) < 0 && node.parentNode)
						node.parentNode.removeChild(node);
				}
				else if(disallowedTags && disallowedTags.length && node.nodeType !== 3)
				{
					if($.inArray(tagName, disallowedTags) > -1 && node.parentNode)
						node.parentNode.removeChild(node);
				}
			});
		};

		/**
		 * Merges two sets of attribute filters into one
		 * @param  {Object}
		 * @param  {Object}
		 * @return {Object}
		 * @private
		 */
		mergeAttribsFilters = function(filtersA, filtersB) {
			var ret = {};

			if(filtersA)
				$.extend(ret, filtersA);

			if(!filtersB)
				return ret;

			$.each(filtersB, function(attrName, values) {

				if($.isArray(ret[attrName]))
				{
					if($.isArray(values))
						ret[attrName] = $.merge(ret[attrName], values);
				}
				else
					ret[attrName] = values;
			});

			return ret;
		};

		/**
		 * Removes any attributes that are not white listed or
		 * if no attributes are white listed it will remove
		 * any attributes that are black listed.
		 * @param  {Node} node
		 * @return {Void}
		 * @private
		 */
		removeAttribs = function(node) {
			attrsCache = {};

			$.sceditor.dom.traverse(node, function(node) {
				if(!node.attributes)
					return;

				var	attr, removeAttr,
					tagName           = node.nodeName.toLowerCase(),
					allowedAttribs    = $.sceditor.plugins.xhtml.allowedAttribs,
					disallowedAttribs = $.sceditor.plugins.xhtml.disallowedAttribs,
					attrsLength       = node.attributes.length;

				if(allowedAttribs && !$.isEmptyObject(allowedAttribs) && attrsLength)
				{
					if(!attrsCache[tagName])
						attrsCache[tagName] = mergeAttribsFilters(allowedAttribs['*'], allowedAttribs[tagName]);

					while(attrsLength--)
					{
						attr       = node.attributes[attrsLength];
						removeAttr = typeof attrsCache[tagName][attr.name] === 'undefined';

						if($.isArray(attrsCache[tagName][attr.name]) && $.inArray(attr.value, attrsCache[tagName][attr.name]) < 0)
							removeAttr = true;

						if(removeAttr)
							node.removeAttribute(attr.name);
					}
				}
				else if(disallowedAttribs && !$.isEmptyObject(disallowedAttribs) && attrsLength)
				{
					if(!attrsCache[tagName])
						attrsCache[tagName] = mergeAttribsFilters(disallowedAttribs['*'], disallowedAttribs[tagName]);

					while(attrsLength--)
					{
						attr       = node.attributes[attrsLength];
						removeAttr = typeof attrsCache[tagName][attr.name] !== 'undefined';
// this should check if only certian values so should be === null?
						if($.isArray(attrsCache[tagName][attr.name]) && $.inArray(attr.value, attrsCache[tagName][attr.name]) > -1)
							removeAttr = true;

						if(removeAttr)
							node.removeAttribute(attr.name);
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
	$.sceditor.plugins.xhtml.converters = [
		{
			tags: {
				'*': {
					width: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('width', $node.attr('width')).removeAttr('width');
			}
		},
		{
			tags: {
				'*': {
					height: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('height', $node.attr('height')).removeAttr('height');
			}
		},
		{
			tags: {
				'li': {
					value: null
				}
			},
			conv: function(node) {
				$(node).removeAttr('value');
			}
		},
		{
			tags: {
				'*': {
					text: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('color', $node.attr('text')).removeAttr('text');
			}
		},
		{
			tags: {
				'*': {
					size: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('font-size', $node.css('font-size')).removeAttr('size');
			}
		},
		{
			tags: {
				'*': {
					color: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('color', $node.attr('color')).removeAttr('color');
			}
		},
		{
			tags: {
				'*': {
					face: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('font-family', $node.attr('face')).removeAttr('face');
			}
		},
		{
			tags: {
				'*': {
					language: null
				}
			},
			conv: function(node) {
				var	$node = $(node),
					lang  = $node.attr('language');

				if(/jscript|javascript|js/i.test(lang))
					$node.attr('type', 'text/javascript');
				else if(/vb/i.test(lang))
					$node.attr('type', 'text/vbscript');

				$node.removeAttr('language');
			}
		},
		{
			tags: {
				'*': {
					align: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('text-align', $node.attr('align')).removeAttr('align');
			}
		},
		{
			tags: {
				'*': {
					border: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('border-size', $node.attr('border')).removeAttr('border');
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
			conv: function(node) {
				$(node).removeAttr('name');
			}
		},
		{
			tags: {
				'hr': {
					noshade: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('border-style', 'solid').removeAttr('noshade');
			}
		},
		{
			tags: {
				'*': {
					nowrap: null
				}
			},
			conv: function(node) {
				var $node = $(node);

				$node.css('white-space', 'nowrap').removeAttr('nowrap');
			}
		},
		{
			tags: {
				big: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'span')).css('font-size', 'larger');
			}
		},
		{
			tags: {
				small: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'span')).css('font-size', 'smaller');
			}
		},
		{
			tags: {
				b: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'strong'));
			}
		},
		{
			tags: {
				u: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'span')).css('text-decoration', 'underline');
			}
		},
		{
			tags: {
				i: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'em'));
			}
		},
		{
			tags: {
				s: null,
				strike: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'span')).css('text-decoration', 'line-through');
			}
		},
		{
			tags: {
				dir: null
			},
			conv: function(node) {
				this.convertTagTo(node, 'ul');
			}
		},
		{
			tags: {
				center: null
			},
			conv: function(node) {
				$(this.convertTagTo(node, 'div')).css('text-align', 'center');
			}
		},
		{
			tags: {
				font: null
			},
			conv: function(node) {
				// All it's attributes will be converted by the attribute converters
				this.convertTagTo(node, 'span');
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
	$.sceditor.plugins.xhtml.allowedAttribs = {
	};

	/**
	 * Attributes that are not allowed.
	 *
	 * Only used if allowed attributes is null or empty.
	 * @type {Object}
	 * @name jQuery.sceditor.plugins.xhtml.disallowedAttribs
	 * @since v1.4.1
	 */
	$.sceditor.plugins.xhtml.disallowedAttribs = { };

	/**
	 * Array containing all the allowed tags.
	 *
	 * If null or empty all tags will be allowed.
	 * @type {Array}
	 * @name jQuery.sceditor.plugins.xhtml.allowedTags
	 * @since v1.4.1
	 */
	$.sceditor.plugins.xhtml.allowedTags = [];

	/**
	 * Array containing all the disallowed tags.
	 *
	 * Only used if allowed tags is null or empty.
	 * @type {Array}
	 * @name jQuery.sceditor.plugins.xhtml.disallowedTags
	 * @since v1.4.1
	 */
	$.sceditor.plugins.xhtml.disallowedTags = [];
})(jQuery);