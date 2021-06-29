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

	function isFunction(fn) {
		return typeof fn === 'function';
	}

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
		* Use aleternative list format configration option.
		* Default: True
		*
		* Alternative list format craetes lists in phpBB format:
		* [list=type]
		* [*]text
		* [*]text
		* [/list]
		* @type {Boolean}
		*/
		var alternativeLists = true;

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

				if (pOpts.alternativeLists) {
					alternativeLists = pOpts.alternativeLists;
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

			sceditor.formats.bbcode.set('list', {
				breakStart: true,
				isInline: false,
				skipLastLineBreak: true,
				html: function (token, attrs, content) {
					var listType = 'disc';
					var toHtml = null;

					if (attrs.defaultattr) {
						listType = attrs.defaultattr;
					}

					if (bulletList[listType]) {
						// This listType belongs to bulletList (UL)
						toHtml = sceditor.formats.bbcode.get('ul').html;
					} else if (orderedList[listType]) {
						// This listType belongs to orderedList (OL)
						toHtml = sceditor.formats.bbcode.get('ol').html;
					} else {
						// unknown listType, use default bullet list behavior
						toHtml = sceditor.formats.bbcode.get('ul').html;
					}

					if (isFunction(toHtml)) {
						return toHtml.call(this, token, attrs, content);
					} else {
						token.attrs['0'] = content;
						return sceditor.formats.bbcode.formatBBCodeString(
							toHtml, token.attrs);
					}
				}
			});

			sceditor.formats.bbcode.set('li', {
				tags: {
					li: null
				},
				isInline: false,
				closedBy: ['/ul', '/ol', '/list', '*', 'li'],
				format: function (element, content) {
					if (alternativeLists) {
						return '[*]' + content;
					} else {
						return '[li]' + content + '[/li]';
					}
				},
				html: '<li>{0}</li>'
			});

			if (alternativeLists) {
				sceditor.formats.bbcode.set('*', {
					isInline: false,
					excludeClosing: true,
					closedBy: ['/ul', '/ol', '/list', '*', 'li'],
					html: '<li>{0}</li>'
				});
			}

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
					var listTag = 'ol';

					if (alternativeLists) {
						listTag = 'list';
					}

					if ((tagType && tagType !== '1' ||
						alternativeLists) && list[tagType]) {
						return '[' + listTag + '=' + tagType + ']' +
							content +
							'[/' + listTag + ']';
					} else {
						return '[' + listTag + ']' +
							content +
							'[/' + listTag + ']';
					}
				},
				html: function (token, attrs, content) {
					var tagType = '1';
					var styleType;
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
					var listTag = 'ul';

					if (alternativeLists) {
						listTag = 'list';
					}

					if (listType && listType !== 'disc' && list[listType]) {
						return '[' + listTag + '=' + listType + ']' +
							content +
							'[/' + listTag + ']';
					} else {
						return '[' + listTag + ']' +
							content +
							'[/' + listTag + ']';
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
					var listTag = 'ol';
					var itemStart = '[li]';
					var itemEnd = '[/li]';

					if (alternativeLists) {
						listTag = 'list';
						itemStart = '[*]';
						itemEnd = '';
					}

					editor.closeDropDown(true);
					fixFirefoxListBug(this);

					if (editor.sourceMode()) {
						var content = '';

						selected.split(/\r?\n/).forEach(function (item) {
							content += (content ? '\n' : '') +
								itemStart + item + itemEnd;
						});

						if (tagType === '1' && !alternativeLists) {
							editor.insertText(
								'[' + listTag + ']\n' +
								content +
								'\n[/' + listTag + ']'
							);
						} else {
							editor.insertText(
								'[' + listTag + '=' + tagType + ']\n' +
								content +
								'\n[/' + listTag + ']'
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
					var listTag = 'ul';
					var itemStart = '[li]';
					var itemEnd = '[/li]';

					if (alternativeLists) {
						listTag = 'list';
						itemStart = '[*]';
						itemEnd = '';
					}

					editor.closeDropDown(true);
					fixFirefoxListBug(this);

					if (editor.sourceMode()) {
						var content = '';

						selected.split(/\r?\n/).forEach(function (item) {
							content += (content ? '\n' : '') +
								itemStart + item + itemEnd;
						});

						if (tagType === 'disc') {
							editor.insertText(
								'[' + listTag + ']\n' +
								content +
								'\n[/' + listTag + ']'
							);
						} else {
							editor.insertText(
								'[' + listTag + '=' + tagType + ']\n' +
								content +
								'\n[/' + listTag + ']'
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
