/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Video plugin
 * This plugin replaces the youtube command with "add video" command, which
 * will recognize youtube and facebook URLs (hopefully other URLs as well
 * in the future) and generate the tags accordingly
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	sceditor.plugins.video = function () {
		var base = this;

		/**
		 * Private functions
		 * @private
		 */
		var commandHandler;

		base.init = function () {
			var opts = this.opts;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			if (opts.toolbar === sceditor.defaultOptions.toolbar) {
				opts.toolbar = opts.toolbar.replace(',image,',
					',image,video,');
			}

			// Remove youtube command
			sceditor.command.remove('youtube');

			// Add new movie command
			sceditor.command.set('video', {
				exec: commandHandler,
				txtExec: commandHandler,
				tooltip: 'Insert a video (YouTube, Facebook)'
			});

			/*
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
			*/
		};

		/**
		 * Function for the txtExec and exec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		commandHandler = function (caller, selected) {
			var editor = this;

			editor.insertText(selected);
		};
	};
})(sceditor);
