/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Inline-Code Plugin for BBCode format
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	var dom = sceditor.dom;

	var IE_VER = sceditor.ie;
	// In IE < 11 a BR at the end of a block level element
	// causes a line break. In all other browsers it's collapsed.
	var IE_BR_FIX = IE_VER && IE_VER < 11;

	sceditor.plugins.code = function () {
		var base = this;

		/**
		 * Private functions
		 * @private
		 */
		var	insertTag,
			formatCmd;

		base.init = function () {
			var	opts  = this.opts;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			// The plugin will override current code implementation
			this.commands.code = {
				exec: formatCmd,
				txtExec: formatCmd,
				tooltip: 'Code'
			};

			sceditor.formats.bbcode.set('code', {
				tags: {
					code: null
				},
				isInline: true,
				allowedChildren: function (parent) {
					if (parent.name === 'code') {
						return ['#', '#newline'];
					} else {
						// Newlines are not allowed for inline elements
						return ['#'];
					}
				},
				format: function (element, content) {
					if (dom.is(element, '.inline')) {
						return '[c]' + content + '[/c]';
					} else {
						return '[code]' + content + '[/code]';
					}
				},
				html: function (token, attrs, content) {
					if (dom.is(token, '.inline')) {
						return '<code class="inline">' + content + '</code>';
					} else {
						return '<code>' + content + '</code>';
					}
				}
			});

			sceditor.formats.bbcode.set('c', {
				tags: {
					c: null
				},
				isInline: true,
				allowedChildren: ['#'],
				format: '[c]{0}[/c]',
				html: '<code class="inline">{0}</code>'
			});
		};

		/**
		 * Inserts the specified tag into the editor
		 *
		 * @param  {sceditor} editor
		 * @private
		 */
		insertTag = function (editor) {
			var range = editor.getRangeHelper().selectedRange();
			var selected = editor.getRangeHelper().selectedHtml();
			var wholeLine = false;
			var inline = false;

			// prevent double code blocks one inside the other
			if (selected.includes('<code')) {
				return;
			}

			// Check if the whole line was selected
			// It could be the whole text of the text type node (3)
			// or innerHTML of an element node (1) if there were some markups
			// in the text, so its containted in a paragraph <p>...</p>
			if ((range.commonAncestorContainer.nodeType === 3 &&
				range.commonAncestorContainer.wholeText === selected) ||
				(range.commonAncestorContainer.nodeType === 1 &&
				range.commonAncestorContainer.innerHTML === selected)) {
				wholeLine = true;
			}

			if (!wholeLine && selected &&
				selected.length > 0 && !selected.includes('<p>')) {
				inline = true;
			}

			if (editor.sourceMode()) {
				if (inline) {
					editor.insert('[c]', '[/c]');
				} else {
					editor.insert('[code]', '[/code]');
				}
			} else {
				if (inline) {
					editor.wysiwygEditorInsertHtml(
						'<code class="inline">', '</code>'
					);
				} else {
					editor.wysiwygEditorInsertHtml(
						'<code>',
						(IE_BR_FIX ? '' : '<br />') + '</code>'
					);
				}
			}

		};

		/**
		 * Function for the exec and txtExec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		formatCmd = function () {
			var	editor = this;

			insertTag(editor);
		};
	};
})(sceditor);
