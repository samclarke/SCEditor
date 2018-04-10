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
		var tags = {
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
				sceditor.formats.bbcode.set('h1', {
					tags: {
						h1: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h1]{0}[/h1]',
					html: '<h1>{0}</h1>'
				});

				sceditor.formats.bbcode.set('h2', {
					tags: {
						h2: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h2]{0}[/h2]',
					html: '<h2>{0}</h2>'
				});

				sceditor.formats.bbcode.set('h3', {
					tags: {
						h3: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h3]{0}[/h3]',
					html: '<h3>{0}</h3>'
				});

				sceditor.formats.bbcode.set('h4', {
					tags: {
						h4: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h4]{0}[/h4]',
					html: '<h4>{0}</h4>'
				});

				sceditor.formats.bbcode.set('h5', {
					tags: {
						h5: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h5]{0}[/h5]',
					html: '<h5>{0}</h5>'
				});

				sceditor.formats.bbcode.set('h6', {
					tags: {
						h6: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[h6]{0}[/h6]',
					html: '<h6>{0}</h6>'
				});

				sceditor.formats.bbcode.set('pre', {
					tags: {
						pre: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[pre]{0}[/pre]',
					html: '<pre>{0}</pre>'
				});

				sceditor.formats.bbcode.set('address', {
					tags: {
						address: null
					},
					isInline: false,
					allowedChildren: ['#'],
					format: '[address]{0}[/address]',
					html: '<address>{0}</address>'
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
