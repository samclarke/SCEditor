/**
 * SCEditor Plain Text Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2016, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */
(function (sceditor) {
	'use strict';

	var extend = sceditor.utils.extend;

	/**
	 * Options:
	 *
	 * pastetext.addButton - If to replace the plaintext button with a toggle
	 *                       button that enables and disables plain text mode.
	 *
	 * pastetext.enabled - If the plain text button should be enabled at start
	 *                     up. Only applies if addButton is enabled.
	 */
	sceditor.plugins.plaintext = function () {
		var plainTextEnabled = true;

		this.init = function () {
			var commands = this.commands;
			var opts = this.opts;

			if (opts && opts.plaintext && opts.plaintext.addButton) {
				plainTextEnabled = opts.plaintext.enabled;

				commands.pastetext = extend(commands.pastetext || {}, {
					state: function () {
						return plainTextEnabled ? 1 : 0;
					},
					exec: function () {
						plainTextEnabled = !plainTextEnabled;
					}
				});
			}
		};

		this.signalPasteRaw = function (data) {
			if (plainTextEnabled) {
				if (data.html && !data.text) {
					var div = document.createElement('div');
					div.innerHTML = data.html;
					data.text = div.innerText;
				}

				data.html = null;
			}
		};
	};
}(sceditor));
