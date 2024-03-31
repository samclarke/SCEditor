/**
 * SCEditor Paragraph Formatting Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2024, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Paragraph Formatting Plugin
 * @author Sam Clarke
 */
/*global EmojiMart*/
(function (sceditor) {
	'use strict';

	sceditor.plugins.emojis = function () {
		const base = this;

		/**
		 * Function for the exec and txtExec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		var emojisCmd = function (caller) {
			const editor = this,
				content = document.createElement('div'),
				emojis = editor.opts.emojis || [],
				perLine = Math.sqrt(Object.keys(emojis).length);

			if (!emojis.length) {
				const pickerOptions = { onEmojiSelect: handleSelect };
				const picker = new EmojiMart.Picker(pickerOptions);

				content.appendChild(picker);
			} else {
				var line = document.createElement('div');

				sceditor.utils.each(emojis,
					function (_, emoji) {
						const emojiElem = document.createElement('span');

						emojiElem.className = 'sceditor-option';
						emojiElem.style = 'cursor:pointer';

						emojiElem.appendChild(document.createTextNode(emoji));

						emojiElem.addEventListener('click',
							function (e) {
								editor.closeDropDown(true);

								editor.insert(e.target.innerHTML);

								e.preventDefault();
							});

						if (line.children.length >= perLine) {
							line = document.createElement('div');
						}

						content.appendChild(line);

						line.appendChild(emojiElem);
					});
			}

			editor.createDropDown(caller, 'emojis', content);

			function handleSelect(emoji) {
				editor.insert(emoji.native);

				editor.closeDropDown(true);
			}
		};

		base.init = function () {
			this.commands.emojis = {
				exec: emojisCmd,
				txtExec: emojisCmd,
				tooltip: 'Insert emoji',
				shortcut: 'Ctrl+E'
			};
		};
	};
})(sceditor);
