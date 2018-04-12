/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor list enhancement plugin
 * This plugin expands the implementation of the list commands, adding dropdown
 * options to select between different list types
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	var dom = sceditor.dom;

	/**
	* Fixes a bug in FF where it sometimes wraps
	* new lines in their own list item.
	* See issue #359
	*/
	function fixFirefoxListBug(editor) {
		// Only apply to Firefox as will break other browsers.
		if ('mozHidden' in document) {
			var node = editor.getBody();
			var next;

			while (node) {
				next = node;

				if (next.firstChild) {
					next = next.firstChild;
				} else {

					while (next && !next.nextSibling) {
						next = next.parentNode;
					}

					if (next) {
						next = next.nextSibling;
					}
				}

				if (node.nodeType === 3 && /[\n\r\t]+/.test(node.nodeValue)) {
					// Only remove if newlines are collapsed
					if (!/^pre/.test(dom.css(node.parentNode, 'whiteSpace'))) {
						dom.remove(node);
					}
				}

				node = next;
			}
		}
	}

	sceditor.plugins['list-enhanced'] = function () {
		var base = this;

		/**
		* Default configuration of the ordered list options.
		*
		* The list should include BBCode tagName, valid css style
		* list-style-type and the description of the option that
		* will be shown in the dropdown list
		*
		* The format of the list is:
		* bbCode-type: { "type": style-type, "description": Description }
		*
		* @type {Object}
		*/
		var orderedList = {
			'1': {
				type: 'decimal',
				description: 'Decimal numbers (1, 2, 3, 4)'
			},
			'a': {
				type: 'lower-alpha',
				description: 'Alphabetic lowercase (a, b, c, d)'
			},
			'A': {
				type: 'upper-alpha',
				description: 'Alphabetic uppercase (A, B, C, D)'
			},
			'i': {
				type: 'lower-roman',
				description: 'Roman lowercase (i, ii, iii, iv)'
			},
			'I': {
				type: 'upper-roman',
				description: 'Roman uppercase (I, II, III, IV)'
			}
		};

		/**
		* Default configuration of the bullet list options.
		*
		* The list should include BBCode tagName, which is valid css style name
		* and the description of the option that will be shown in the
		* dropdown list
		*
		* The format of the list is:
		* bbCode-type: Description
		*
		* @type {Object}
		*/
		var bulletList = {
			'disc': 'Bullet',
			'circle': 'Circle',
			'square': 'Square',
			'none': 'None'
		};

		/**
		 * Private functions
		 * @private
		 */
		var	bulletHandler;
		var	orderedHandler;

		base.init = function () {
			var opts = this.opts;
			var pOpts = opts.listEnhanced;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			if (pOpts) {
				if (pOpts.orderedList) {
					orderedList = pOpts.orderedList;
				}

				if (pOpts.bulletList) {
					bulletList = pOpts.bulletList;
				}
			}

			// The plugin will override current implementation
			sceditor.command.set('orderedlist', {
				exec: orderedHandler,
				txtExec: orderedHandler,
				tooltip: 'Ordered list'
			});

			sceditor.command.set('bulletlist', {
				exec: bulletHandler,
				txtExec: bulletHandler,
				tooltip: 'Bullet list'
			});

			sceditor.formats.bbcode.set('ol', {
				tags: {
					ol: null
				},
				breakStart: true,
				isInline: false,
				skipLastLineBreak: true,
				format: function (element, content) {
					var tagType = dom.attr(element, 'data-tagtype');
					var list = orderedList;

					if (tagType && tagType !== '1' && list[tagType]) {
						return '[ol=' + tagType + ']' + content + '[/ol]';
					} else {
						return '[ol]' + content + '[/ol]';
					}
				},
				html: function (token, attrs, content) {
					var tagType = '1';
					var styleType = 'decimal';
					var list = orderedList;
					var attr = attrs.defaultattr;

					if (attr) {
						tagType = attr;
					}

					// Specified list type is not valid, backup to default
					if (!list[tagType]) {
						tagType = '1';
					}

					styleType = list[tagType].type;

					return '<ol style="list-style-type:' + styleType + '" ' +
						'data-tagtype="' + tagType + '">' + content + '</ol>';
				}
			});

			sceditor.formats.bbcode.set('ul', {
				tags: {
					ul: null
				},
				breakStart: true,
				isInline: false,
				skipLastLineBreak: true,
				format: function (element, content) {
					var listType = element.style['list-style-type'];
					var list = bulletList;

					if (listType && listType !== 'disc' && list[listType]) {
						return '[ul=' + listType + ']' + content + '[/ul]';
					} else {
						return '[ul]' + content + '[/ul]';
					}
				},
				html: function (token, attrs, content) {
					var listType = 'disc';
					var attr = attrs.defaultattr;
					var list = bulletList;

					if (attr) {
						listType = attr;
					}

					// Specified list type is not valid, backup to default
					if (!list[listType]) {
						listType = 'disc';
					}

					return '<ul style="list-style-type:' + listType + '">' +
						content + '</ul>';
				}
			});
		};

		/**
		 * Function for the txtExec and exec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		orderedHandler = function (caller, selected) {
			var	editor = this;
			var content = document.createElement('div');

			sceditor.utils.each(orderedList, function (tag, item) {
				var link = document.createElement('a');
				link.className = 'sceditor-listtype-option';
				link.setAttribute('data-tagtype', tag);
				link.textContent = item.description;;
				link.addEventListener('click', function (e) {
					var tagType = dom.attr(this, 'data-tagtype');

					editor.closeDropDown(true);
					fixFirefoxListBug(this);

					if (editor.sourceMode()) {
						var content = '';

						selected.split(/\r?\n/).forEach(function (item) {
							content += (content ? '\n' : '') +
								'[li]' + item + '[/li]';
						});

						if (tagType === '1') {
							editor.insertText(
								'[ol]\n' + content + '\n[/ol]'
							);
						} else {
							editor.insertText(
								'[ol=' + tagType + ']\n' + content + '\n[/ol]'
							);
						}
					} else {
						var styleType = orderedList[tagType].type;

						editor.wysiwygEditorInsertHtml(
							'<ol style="list-style-type:' + styleType +
							'" data-tagtype="' + tagType +
							'"><li><br></li></ol>'
						);
					}

					e.preventDefault();
				});

				content.appendChild(link);
			});

			editor.createDropDown(caller, 'listtype-picker', content);
		};

		bulletHandler = function (caller, selected) {
			var	editor = this;
			var content = document.createElement('div');

			sceditor.utils.each(bulletList, function (styleType, description) {
				var ul = document.createElement('ul');
				var link = document.createElement('a');
				var li = document.createElement('li');
				ul.appendChild(li);
				li.appendChild(link);
				ul.style.listStyleType = styleType;
				ul.className = 'sceditor-listtype';
				link.className = 'sceditor-listtype-option';
				link.setAttribute('data-tagtype', styleType);
				link.textContent = description;;
				link.addEventListener('click', function (e) {
					var tagType = dom.attr(this, 'data-tagtype');

					editor.closeDropDown(true);
					fixFirefoxListBug(this);

					if (editor.sourceMode()) {
						var content = '';

						selected.split(/\r?\n/).forEach(function (item) {
							content += (content ? '\n' : '') +
								'[li]' + item + '[/li]';
						});

						if (tagType === 'disc') {
							editor.insertText(
								'[ul]\n' + content + '\n[/ul]'
							);
						} else {
							editor.insertText(
								'[ul=' + tagType + ']\n' + content + '\n[/ul]'
							);
						}
					} else {
						editor.wysiwygEditorInsertHtml(
							'<ul style="list-style-type:' + tagType + '">' +
							'<li><br></li></ul>'
						);
					}

					e.preventDefault();
				});

				content.appendChild(ul);
			});

			editor.createDropDown(caller, 'listtype-picker', content);
		};

	};
})(sceditor);
