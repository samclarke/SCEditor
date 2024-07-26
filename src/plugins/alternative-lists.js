/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor alternative lists plugin
 * This plugin implements phpBB style of the lists:
 * [list]
 * [*]item
 * [*]item
 * [/list]
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	var utils = sceditor.utils;

	function isFunction(fn) {
		return typeof fn === 'function';
	}

	sceditor.plugins['alternative-lists'] = function () {
		var base = this;

		/**
		 * Private functions
		 * @private
		 */
		var bulletHandler;
		var orderedHandler;
		var insertListTag;

		base.init = function () {
			var opts = this.opts;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			// Override only txtExec implementation
			sceditor.command.get('orderedlist').txtExec = orderedHandler;
			sceditor.command.get('bulletlist').txtExec = bulletHandler;

			// Override current implementation
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

					if (listType === '1') {
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

			sceditor.formats.bbcode.set('ul', {
				tags: {
					ul: null
				},
				breakStart: true,
				isInline: false,
				skipLastLineBreak: true,
				format: '[list]{0}[/list]',
				html: '<ul>{0}</ul>'
			});

			sceditor.formats.bbcode.set('ol', {
				tags: {
					ol: null
				},
				breakStart: true,
				isInline: false,
				skipLastLineBreak: true,
				format: '[list=1]{0}[/list]',
				html: '<ol>{0}</ol>'
			});

			sceditor.formats.bbcode.set('li', {
				tags: {
					li: null
				},
				isInline: false,
				closedBy: ['/ul', '/ol', '/list', '*', 'li'],
				format: '[*]{0}',
				html: '<li>{0}</li>'
			});

			sceditor.formats.bbcode.set('*', {
				isInline: false,
				excludeClosing: true,
				closedBy: ['/ul', '/ol', '/list', '*', 'li'],
				html: '<li>{0}</li>'
			});
		};

		insertListTag = function (editor, listType, selected) {
			var content = '';

			utils.each(selected.split(/\r?\n/), function (item) {
				content += (content ? '\n' : '') +
					'[*]' + item;
			});

			if (listType === '') {
				editor.insertText('[list]\n' + content + '\n[/list]');
			} else {
				editor.insertText('[list=' + listType + ']\n' + content +
				'\n[/list]');
			}
		};

		/**
		 * Function for the txtExec and exec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		orderedHandler = function (caller, selected) {
			var editor = this;

			insertListTag(editor, '1', selected);
		};

		bulletHandler = function (caller, selected) {
			var editor = this;

			insertListTag(editor, '', selected);
		};

	};
})(sceditor);
