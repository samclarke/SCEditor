(function (sceditor) {
	'use strict';

	sceditor.plugins.autosave = function () {
		var base = this;
		var editor;
		var storageKey = 'sce-autodraft-' + location.pathname + location.search;
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
						localStorage.removeItem(key);
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
}(sceditor));
