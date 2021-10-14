import 'src/plugins/autoyoutube.js';

QUnit.module('plugins/autoyoutube');


QUnit.test('Should not remove newlines from pasted plain text', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		text: 'line 1\n\nline 2\rline 3\r\nline 4'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, 'line 1<br><br>line 2<br>line 3<br>line 4');
});

QUnit.test('Should convert YouTube URLs', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		html: '<p>before https://www.youtube.com/watch?v=dQw4w9WgXcQ after</p>'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, '<p>before ' +
		'<iframe width="560" height="315" frameborder="0" ' +
		'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" ' +
		'data-youtube-id="dQw4w9WgXcQ" allowfullscreen=""></iframe> ' +
		'after</p>');
});

QUnit.test('Should convert YouTube URLs with time', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		html: '<p>before https://www.youtube.com/watch?v=dQw4w9WgXcQ&amp;t=10s after</p>'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, '<p>before https://www.youtube.com/watch?v=dQw4w9WgXcQ&amp;t=10s after</p>');
});

QUnit.test('Should convert short YouTube URLs', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		text: 'line 1\nbefore https://youtu.be/dQw4w9WgXcQ after\nline 2'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, 'line 1<br>before ' +
		'<iframe width="560" height="315" frameborder="0" ' +
		'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" ' +
		'data-youtube-id="dQw4w9WgXcQ" allowfullscreen=""></iframe> ' +
		'after<br>line 2');
});

QUnit.test('Should not convert YouTube URLs in code blocks', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		text: 'line 1\nbefore https://youtu.be/dQw4w9WgXcQ after\nline 2'
	};
	var mockEditor = {
		currentNode: function () {
			var node = document.createElement('div');
			document.createElement('code').appendChild(node);
			return node;
		}
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, undefined);
	assert.strictEqual(data.text, 'line 1\nbefore https://youtu.be/dQw4w9WgXcQ after\nline 2');
});

QUnit.test('Should leave short YouTube URLs with time', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		text: 'line 1\nbefore https://youtu.be/dQw4w9WgXcQ?10 after\nline 2'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html, 'line 1<br>before https://youtu.be/dQw4w9WgXcQ?10 after<br>line 2');
});

QUnit.test('Should clear all styling if only contents is URL', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		html:
			'<div class="some-style">' +
				'<u>' +
					'<b>' +
						'<span style="color:red">' +
							' https://youtu.be/dQw4w9WgXcQ  \n' +
						'</span>' +
					'</b>' +
				'</u>' +
			'</div>'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html,
		'<iframe width="560" height="315" frameborder="0" ' +
			'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" ' +
			'data-youtube-id="dQw4w9WgXcQ" allowfullscreen=""></iframe>'
	);
});

QUnit.test('Should clear styling if only child', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		html:
			'tests<div class="some-style">' +
				'<u>' +
					'<b>' +
						'<span style="color:red">' +
							'https://youtu.be/dQw4w9WgXcQ' +
						'</span>' +
					'</b>' +
				'</u>' +
			'</div>test'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html,
		'tests<div>' +
			'<iframe width="560" height="315" frameborder="0" ' +
				'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" ' +
				'data-youtube-id="dQw4w9WgXcQ" allowfullscreen=""></iframe>' +
		'</div>test'
	);
});

QUnit.test('Should not clear styling if has whitespace', function (assert) {
	var autoYoutube = new sceditor.plugins.autoyoutube();
	var data = {
		html:
			'tests<div class="some-style">' +
				'<u>' +
					'<b>' +
						'<span style="color:red">' +
							' https://youtu.be/dQw4w9WgXcQ ' +
						'</span>' +
					'</b>' +
				'</u>' +
			'</div>test'
	};
	var mockEditor = {
		currentNode: function () { }
	};

	autoYoutube.signalPasteRaw.call(mockEditor, data);

	assert.strictEqual(data.html,
		'tests<div class="some-style">' +
			'<u>' +
				'<b>' +
					'<span style="color:red">' +
						' <iframe width="560" height="315" frameborder="0" ' +
							'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" ' +
							'data-youtube-id="dQw4w9WgXcQ" allowfullscreen=""></iframe> ' +
					'</span>' +
				'</b>' +
			'</u>' +
		'</div>test'
	);
});
