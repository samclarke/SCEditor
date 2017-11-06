$(function () {
	patchConsole();

	runner.setup(function () {
		var that = this;


		$('#testarea').sceditor({
			width: '100%',
			autofocus: true,
			toolbar: 'bold,italic,underline',
			autofocusEnd: true,
			enablePasteFiltering: true,
			emoticonsRoot: '../../../',
			style: '../../../src/themes/content/default.css'
		});


		that.count  = 0;
		that.editor = $('#testarea').sceditor('instance');
		that.clearCount = function () {
			that.count = 0;

			$('#count').text(that.count);
		};


		that.editor.bind('valuechanged', function () {
			$('#count').text(++that.count);
		});


		$('#counter .passed').click(function () {
			runner._done(true);
		});

		$('#counter .failed').click(function () {
			runner._done(false);
		});


		runner.run();
	});
});

runner.test({
	title: 'WYSIWYG text',
	instructions: 'Enter some text without pressing space or back space, ' +
		'after 1.5 seconds the counter increment.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG text followed by space',
	instructions: 'Enter some text then press space, the counter should ' +
		'increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG space followed by text',
	instructions: 'Press space one or more times then enter some text, ' +
		'the counter should increment immediately after the first piece ' +
		'of text is entered.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG text followed by backspace',
	instructions: 'Enter some text then press backspace, the counter ' +
		'should increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG backspace followed by text',
	instructions: 'Press backspace one or more times then enter some text, ' +
		'the counter should increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG cut',
	instructions: 'Cut some text, the counter should increment ' +
		'after 1.5 seconds.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'WYSIWYG paste',
	instructions: 'Paste some text, the counter should increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode text',
	instructions: 'Enter some text without pressing space or back space, ' +
		'after 1.5 seconds the counter increment.',
	setup: function () {
		this.editor.sourceMode(true);
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode text followed by space',
	instructions: 'Enter some text then press space, the counter should ' +
		'increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode space followed by text',
	instructions: 'Press space one or more times then enter some text, ' +
		'the counter should increment immediately after the first piece ' +
		'of text is entered.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode text followed by backspace',
	instructions: 'Enter some text then press backspace, the counter ' +
		'should increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode backspace followed by text',
	instructions: 'Press backspace one or more times then enter some text, ' +
		'the counter should increment immediately.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode cut',
	instructions: 'Cut some text, the counter should increment ' +
		'after 1.5 seconds.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });

runner.test({
	title: 'SourceMode paste',
	instructions: 'Paste some text, the counter should increment ' +
		'after 1.5 seconds.',
	setup: function () {
		this.editor.focus();
	},
	teardown: function () {
		this.clearCount();
	}
}, function () { });
