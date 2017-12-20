/**
 * SCEditor AutoSave Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */
(function (sceditor) {
	'use strict';

	var defaultKey = 'sce-autodraft-' + location.pathname + location.search;

	function clear(key) {
		localStorage.removeItem(key || defaultKey);
	}

	sceditor.plugins.autosave = function () {
		var base = this;
		var editor;
		var storageKey = defaultKey;
		// 86400000 = 24 hrs (24 * 60 * 60 * 1000)
		var expires = 86400000;
		var saveHandler = function (value) {
			localStorage.setItem(storageKey, JSON.stringify(value));
		};
		var loadHandler = function () {
			return JSON.parse(localStorage.getItem(storageKey));
		};

		function gc() {
			for (var i = 0; i < localStorage.length; i++) {
				var key = localStorage.key(i);

				if (/^sce\-autodraft\-/.test(key)) {
					var item = JSON.parse(localStorage.getItem(storageKey));
					if (item && item.time < Date.now() - expires) {
						clear(key);
					}
				}
			}
		}

		base.init = function () {
			editor = this;
			var opts = editor.opts && editor.opts.autosave || {};

			saveHandler = opts.save || saveHandler;
			loadHandler = opts.load || loadHandler;
			storageKey = opts.storageKey || storageKey;
			expires = opts.expires || expires;

			gc();
		};

		base.signalReady = function () {
			// Add submit event listener to clear autosave
			var parent = editor.getContentAreaContainer();
			while (parent) {
				if (/form/i.test(parent.nodeName)) {
					parent.addEventListener(
						'submit', clear.bind(null, storageKey), true
					);
					break;
				}

				parent = parent.parentNode;
			}

			var state = loadHandler();
			if (state) {
				editor.sourceMode(state.sourceMode);
				editor.val(state.value, false);
				editor.focus();

				if (state.sourceMode) {
					editor.sourceEditorCaret(state.caret);
				} else {
					editor.getRangeHelper().restoreRange();
				}
			}

			saveHandler({
				caret: this.sourceEditorCaret(),
				sourceMode: this.sourceMode(),
				value: editor.val(null, false),
				time: Date.now()
			});
		};

		base.signalValuechangedEvent = function (e) {
			saveHandler({
				caret: this.sourceEditorCaret(),
				sourceMode: this.sourceMode(),
				value: e.detail.rawValue,
				time: Date.now()
			});
		};
	};

	sceditor.plugins.autosave.clear = clear;
}(sceditor));
