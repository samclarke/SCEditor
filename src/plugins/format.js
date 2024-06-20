/**
 * SCEditor Paragraph Formatting Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Paragraph Formatting Plugin
 * @author Sam Clarke
 */
(function (sceditor) {
	'use strict';

	sceditor.plugins.format = function () {
		var base = this;

		/**
		 * Default tags
		 * @type {Object}
		 * @private
		 */
		var xhtmlTags = {
			p: 'Paragraph',
			h1: 'Heading 1',
			h2: 'Heading 2',
			h3: 'Heading 3',
			h4: 'Heading 4',
			h5: 'Heading 5',
			h6: 'Heading 6',
			address: 'Address',
			pre: 'Preformatted Text'
		};

		// BBCode should not implement <p> tag, otherwise all the lines will be
		// wrapped with [p][/p] tags
		var bbcodeTags = {
			h1: 'Heading 1',
			h2: 'Heading 2',
			h3: 'Heading 3',
			h4: 'Heading 4',
			h5: 'Heading 5',
			h6: 'Heading 6',
			address: 'Address',
			pre: 'Preformatted Text'
		};

		// tags variable is assigned with the list from bbcodeTags or
		// xhtmlTags according to the used formatter engine. The rest
		// of the plugin logic uses that variable
		var tags;

		/**
		 * Private functions
		 * @private
		 */
		var	insertTag,
			formatCmd;


		base.init = function () {
			var	opts  = this.opts,
				pOpts = opts.paragraphformat;

			// Enable only for supported formats
			if (!opts.format ||
				(opts.format !== 'bbcode' && opts.format !== 'xhtml')) {
				return;
			}

			if (opts.format === 'xhtml') {
				tags = xhtmlTags;
			} else if (opts.format === 'bbcode') {
				tags = bbcodeTags;
			}

			if (pOpts) {
				if (pOpts.tags) {
					tags = pOpts.tags;
				}

				if (pOpts.excludeTags) {
					pOpts.excludeTags.forEach(function (val) {
						delete tags[val];
					});
				}
			}

			sceditor.command.set('format', {
				exec: formatCmd,
				txtExec: formatCmd,
				tooltip: 'Format Paragraph'
			});

			// Initialize BBCode handlers
			if (opts.format === 'bbcode') {
				sceditor.utils.each(tags, function (tag) {
					var handler = {
						tags: {},
						isInline: false,
						allowedChildren: ['#'],
						format: '[' + tag + ']{0}[/' + tag + ']',
						html: '<' + tag + '>{0}</' + tag + '>'
					};

					handler.tags[tag] = null;

					sceditor.formats.bbcode.set(tag, handler);
				});
			}

			if (opts.toolbar === sceditor.defaultOptions.toolbar) {
				opts.toolbar = opts.toolbar.replace(',color,',
					',color,format,');
			}
		};

		/**
		 * Inserts the specified tag into the editor
		 *
		 * @param  {sceditor} editor
		 * @param  {string} tag
		 * @private
		 */
		insertTag = function (editor, tag) {
			var	opts = editor.opts;

			if (editor.sourceMode()) {
				if (opts.format === 'bbcode') {
					editor.insert('[' + tag + ']', '[/' + tag + ']');
				} else {
					editor.insert('<' + tag + '>', '</' + tag + '>');
				}
			} else {
				editor.execCommand('formatblock', '<' + tag + '>');
			}

		};

		/**
		 * Function for the exec and txtExec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		formatCmd = function (caller) {
			var	editor   = this,
				content = document.createElement('div');

			sceditor.utils.each(tags, function (tag, val) {
				var link = document.createElement('a');
				link.className = 'sceditor-option';
				link.textContent = val.name || val;
				link.addEventListener('click', function (e) {
					editor.closeDropDown(true);

					if (val.exec) {
						val.exec(editor);
					} else {
						insertTag(editor, tag);
					}

					e.preventDefault();
				});

				content.appendChild(link);
			});

			editor.createDropDown(caller, 'format', content);
		};
	};
})(sceditor);
