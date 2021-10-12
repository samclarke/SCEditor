/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor percentage fontsize plugin for BBCode format
 * This plugin allow usage of the percent indication in font size bbcode tag
 * in a format used in phpBB system:
 * [size=50]text[/font]
 * means the text will be shown with font 50% of the current size
 * [size=200]text[/font]
 * means the text will be shown with font 200% of the current size
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	var dom = sceditor.dom;

	sceditor.plugins['percentage-fontsize'] = function () {
		var base = this;

		/**
		 * Default sizes
		 * @type {Object}
		 * @private
		 */
		var sizes = [50, 75, 100, 150, 200];

		/**
		 * Private functions
		 * @private
		 */
		var	commandHandler;

		base.init = function () {
			var opts = this.opts;
			var pOpts = opts.percentageFontsize;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			if (pOpts) {
				if (pOpts.sizes) {
					sizes = pOpts.sizes;
				}
			}

			// The plugin will override current fontsize implementation
			sceditor.command.set('size', {
				exec: commandHandler,
				txtExec: commandHandler,
				tooltip: 'Font Size'
			});

			sceditor.formats.bbcode.set('size', {
				tags: {
					font: {
						size: null
					}
				},
				styles: {
					'font-size': null
				},
				format: function (element, content) {
					var	fontSize = dom.attr(element, 'size');
					var size;

					if (!fontSize) {
						fontSize = element.style.fontSize;
					}

					// remove "%" from the option
					size = fontSize.replace('%', '');

					return '[size=' + size + ']' + content + '[/size]';
				},
				html: '<font style="font-size:{defaultattr}%">{!0}</font>'
			});
		};

		/**
		 * Function for the txtExec and exec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		commandHandler = function (caller) {
			var	editor = this;
			var content = document.createElement('div');

			sceditor.utils.each(sizes, function (index, size) {
				var link = document.createElement('a');
				var font = document.createElement('font');
				link.className = 'sceditor-fontsize-option';
				link.setAttribute('data-size', size);
				font.textContent = size + '%';
				font.style.fontSize = size + '%';
				link.appendChild(font);
				link.addEventListener('click', function (e) {
					var size = dom.attr(this, 'data-size');

					editor.closeDropDown(true);

					if (editor.sourceMode()) {
						editor.insert('[size=' + size + ']', '[/size]');
					} else {
						editor.wysiwygEditorInsertHtml(
							'<font style="font-size: ' + size + '%;">',
							'</font>');
					}

					e.preventDefault();
				});

				content.appendChild(link);
			});

			editor.createDropDown(caller, 'fontsize-picker', content);
		};
	};
})(sceditor);
