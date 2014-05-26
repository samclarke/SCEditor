$(function () {
	patchConsole();

	runner.setup(function () {
		$('#testarea').sceditor({
			width: '100%',
			autofocus: true,
			toolbar: 'bold,italic,underline',
			autofocusEnd: true,
			enablePasteFiltering: true,
			emoticonsRoot: '../../../',
			style: '../../../src/jquery.sceditor.default.css'
		});

		this.editor = $('#testarea').sceditor('instance');

		runner.run();
	});
});

runner.test({
	title: 'WYSIWYG Keydown',
	instructions: 'Press any key in the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('keydown', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keydown', this.handler);
});

runner.test({
	title: 'WYSIWYG Keypress',
	instructions: 'Press any key in the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('keypress', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keypress', this.handler);
});

runner.test({
	title: 'WYSIWYG Keyup',
	instructions: 'Press any key in the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('keyup', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keyup', this.handler);
});

runner.test({
	title: 'WYSIWYG shortcut',
	instructions: 'Press ctrl+j in the WYSIWYG editor.',
	teardown: function () {
		this.editor.removeShortcut('ctrl+j');
	}
}, function (done) {
	var handler = function () {
		done(true);

		return false;
	};

	this.editor.addShortcut('ctrl+j', handler);
});

runner.test({
	title: 'WYSIWYG function shortcut',
	instructions: 'Press ctrl+shift+f3 in the WYSIWYG editor.',
	teardown: function () {
		this.editor.removeShortcut('ctrl+shift+f3');
	}
}, function (done) {
	var handler = function () {
		done(true);

		return false;
	};

	this.editor.addShortcut('ctrl+shift+f3', handler);
});

runner.test({
	title: 'WYSIWYG selectionchanged',
	instructions: 'Select the text "jumps over" and nothing else.',
	setup: function () {
		this.editor.val(
			'<p>The quick brown fox jumps over the lazy dog.</p>'
		);
	},
	teardown: function () {
		this.editor.val('');
		this.editor.unbind('selectionchanged', this.handler);
	}
}, function (done) {
	var editor = this.editor;

	this.handler = function () {
		var selectedText;
		var range = editor.getRangeHelper().selectedRange();

		if (range && typeof range.text !== 'undefined') {
			selectedText = range.text;
		} else if (range) {
			selectedText = range.toString();
		}

		console.info('Selected text: "' + selectedText + '"');

		if (!/^ ?jumps over ?$/.test(selectedText)) {
			return;
		}

		done(true);
	};

	editor.bind('selectionchanged', this.handler);
});

runner.test({
	title: 'WYSIWYG contextmenu',
	instructions: 'Right click inside the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('contextmenu', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);

		return false;
	};

	this.editor.focus();
	this.editor.bind('contextmenu', this.handler);
});

runner.test({
	title: 'WYSIWYG nodechanged',
	instructions: 'Follow the instructions inside the WYSIWYG editor.',
	setup: function () {
		this.editor.val(
			'<p style="background: #ecf0f1">Click anywhere here.</p>' +
			'<p style="background: #84C692">Then click here.</p>'
		);
	},
	teardown: function () {
		this.editor.unbind('nodechanged', this.handler);
		this.editor.val('');
	}
}, function (done) {
	var editor     = this.editor;
	var body       = editor.getBody().get(0);
	var firstNode  = body.firstChild;
	var lastNode   = body.lastChild;
	var foundFirst = false;

	this.handler = function () {
		var currentNode = editor.currentNode();

		if (!foundFirst) {
			if (currentNode === firstNode ||
				currentNode.parentNode === firstNode) {
				foundFirst = true;

				console.info('First node clicked.');
			}

			return;
		}

		if (currentNode !== lastNode &&
				currentNode.parentNode !== lastNode) {
			return;
		}

		console.info('Second node clicked.');
		done(true);
	};

	editor.blur();
	editor.bind('nodechanged', this.handler);
});

runner.test({
	title: 'WYSIWYG blur',
	instructions: 'Click outside of the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('blur', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.focus();
	this.editor.bind('blur', this.handler);
});

runner.test({
	title: 'WYSIWYG focus',
	instructions: 'Click inside the WYSIWYG editor.',
	teardown: function () {
		this.editor.unbind('focus', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.blur();
	this.editor.bind('focus', this.handler);
});





runner.test({
	title: 'Source editor Keydown',
	instructions: 'Press any key in the source editor.',
	setup: function () {
		this.editor.sourceMode(true);
		this.editor.val('');
		this.editor.focus();
	},
	teardown: function () {
		this.editor.unbind('keydown', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keydown', this.handler);
});

runner.test({
	title: 'Source editor Keypress',
	instructions: 'Press any key in the source editor.',
	teardown: function () {
		this.editor.unbind('keypress', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keypress', this.handler);
});

runner.test({
	title: 'Source editor Keyup',
	instructions: 'Press any key in the source editor.',
	teardown: function () {
		this.editor.unbind('keyup', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.bind('keyup', this.handler);
});

runner.test({
	title: 'Source editor shortcut',
	instructions: 'Press ctrl+j in the source editor.',
	teardown: function () {
		this.editor.removeShortcut('ctrl+j');
	}
}, function (done) {
	var handler = function () {
		done(true);

		return false;
	};

	this.editor.addShortcut('ctrl+j', handler);
});

runner.test({
	title: 'Source editor contextmenu',
	instructions: 'Right click inside the source editor.',
	teardown: function () {
		this.editor.unbind('contextmenu', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);

		return false;
	};

	this.editor.focus();
	this.editor.bind('contextmenu', this.handler);
});

runner.test({
	title: 'Source editor blur',
	instructions: 'Click outside of the source editor.',
	teardown: function () {
		this.editor.unbind('blur', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.focus();
	this.editor.bind('blur', this.handler);
});

runner.test({
	title: 'Source editor focus',
	instructions: 'Click inside the source editor.',
	teardown: function () {
		this.editor.unbind('focus', this.handler);
	}
}, function (done) {
	this.handler = function () {
		done(true);
	};

	this.editor.blur();
	this.editor.bind('focus', this.handler);
});
