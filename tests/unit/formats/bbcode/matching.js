import defaultOptions from 'src/lib/defaultOptions.js';
import 'src/formats/bbcode.js';

QUnit.module('plugins/bbcode - Matching');

QUnit.test('Should match only if all attributes match when strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				title: ['test'],
				test: null
			}
		},
		strictMatch: true,
		format: 'match'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'',
		'Non-matching title'
	);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'',
		'Missing title'
	);

	assert.equal(
		mockEditor.toBBCode('<div title="test" test="value"></div>'),
		'match',
		'All attributes match'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should match if any attributes match when not strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				title: ['test'],
				test: null
			}
		},
		strictMatch: false,
		format: 'match'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'match',
		'Non-matching title'
	);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'match',
		'Missing title'
	);

	assert.equal(
		mockEditor.toBBCode('<div title="test" test="value"></div>'),
		'match',
		'All attributes match'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should default to matching if any attributes match', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				title: ['test'],
				test: null
			}
		},
		strictMatch: false,
		format: 'match'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'match',
		'Non-matching title'
	);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="not test" test="value"></div>'
		),
		'match',
		'Missing title'
	);

	assert.equal(
		mockEditor.toBBCode('<div title="test" test="value"></div>'),
		'match',
		'All attributes match'
	);

	sceditor.formats.bbcode.remove('test');
});


QUnit.test('Should match twice if tag and styles match', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				title: null
			}
		},
		styles: {
			'padding': null
		},
		format: 'match{0}'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test" style="padding:1em"></div>'
		),
		'matchmatch'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should only match if all styles match when strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		styles: {
			'padding': null,
			'margin': null
		},
		format: 'passed',
		strictMatch: true
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div style="padding:1em;margin:1em;"></div>'),
		'passed'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="margin:1em;"></div>'),
		''
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should match if any styles match when not strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		styles: {
			'padding': null,
			'margin': null
		},
		format: 'passed',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div style="padding:1em;margin:1em;"></div>'),
		'passed'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="margin:1em;"></div>'),
		'passed'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="padding:1em;"></div>'),
		'passed'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should default to matching if any styles match', function (assert) {
	sceditor.formats.bbcode.set('test', {
		styles: {
			'padding': null,
			'margin': null
		},
		format: 'passed',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div style="padding:1em;margin:1em;"></div>'),
		'passed'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="margin:1em;"></div>'),
		'passed'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="padding:1em;"></div>'),
		'passed'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should support matching wildcard tags', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			'*': null
		},
		format: 'x{0}',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div><span></span></div>'),
		'xx'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should wildcard matching styles or attributes', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			'*': {
				title: null,
				style: {
					padding: null
				}
			}
		},
		format: 'x{0}',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test"><span style="padding:1em;"</span></div>'
		),
		'xx'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should only match when styles and attributes match if strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			'*': {
				title: null,
				style: {
					padding: null
				}
			}
		},
		format: 'match',
		strictMatch: true
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test"><span style="padding:1em;"</span></div>'
		),
		'',
		'Missing attribute or style'
	);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test" style="padding:1em;"></div>'
		),
		'match',
		'Has attributes and styles'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should match when any style or attribute matches if not strict matching', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			'*': {
				title: null,
				style: {
					padding: null
				}
			}
		},
		format: 'match{0}'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test"><span style="padding:1em;"</span></div>'
		),
		'matchmatch',
		'Missing attribute or style'
	);

	assert.equal(
		mockEditor.toBBCode(
			'<div title="test" style="padding:1em;"></div>'
		),
		'match',
		'Has attributes and styles'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should support style attribute', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				style: { fontWeight: 'bold' }
			}
		},
		format: 'matched',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div style="font-weight: bold"></div>'),
		'matched'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should match null style only if style attribute is specified', function (assert) {
	sceditor.formats.bbcode.set('test', {
		tags: {
			div: {
				style: null
			}
		},
		format: 'matched',
		strictMatch: false
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode('<div></div>'),
		'',
		'No style attribute'
	);

	assert.equal(
		mockEditor.toBBCode('<div style="padding: 1em"></div>'),
		'matched',
		'Has style attribute'
	);

	sceditor.formats.bbcode.remove('test');
});

QUnit.test('Should match styles first', function (assert) {
	// This is for backwards compatibility purposes only
	sceditor.formats.bbcode.set('style', {
		styles: {
			padding: null
		},
		format: 'style'
	});
	sceditor.formats.bbcode.set('tag', {
		tags: {
			div: null
		},
		format: 'tag({0})'
	});

	var mockEditor = {
		opts: defaultOptions
	};
	(new sceditor.formats.bbcode()).init.call(mockEditor);

	assert.equal(
		mockEditor.toBBCode(
			'<div style="padding:1em"></div>'
		),
		'tag(style)'
	);

	sceditor.formats.bbcode.remove('style');
	sceditor.formats.bbcode.remove('tag');
});
