import defaultOptions from 'src/lib/defaultOptions.js';
import 'src/formats/bbcode.js';

QUnit.module('plugins/bbcode - Matching');

sceditor.formats.bbcode.set(
	'thisoldbbcode', {
		tags: {
			abbr: {
				title: ['test'],
				test: null
			}
		},
		matchAttrs: 'all',
		format: function (element, content) {
			return '[abbr=' + element.getAttribute('title') + ']' + content + '[/abbr]';
		},
		html: '<abbr title="{defaultattr}">{0}</abbr>'
	}
);
sceditor.formats.bbcode.set(
	'springchicken', {
		tags: {
			bird: {
				type: ['duck'],
				test: null
			}
		},
		matchAttrs: 'any',
		format: function (element, content) {
			return '[bird=' + element.getAttribute('type') + ']' + content + '[/bird]';
		},
		html: '<bird type="{defaultattr}">{0}</bird>'
	}
);
sceditor.formats.bbcode.set(
	'insertnamehere', {
		tags: {
			species: {
				classification: ['mammal'],
				test: null
			}
		},
		format: function (element, content) {
			return '[species=' + element.getAttribute('classification') + ']' + content + '[/species]';
		},
		html: '<species classification="{defaultattr}">{0}</species>'
	}
);
sceditor.formats.bbcode.set('margin', {
	tags: {
		'p': null
	},
	styles: {
		'margin': null
	},
	format: function (element, content) {
		return '[margin=' + element.style.margin + ']' +
			content + '[/margin]';
	},
	html: '<p style="margin:{defaultattr}">{0}</p>'
});
var
	mockEditor = {
		opts: defaultOptions
	},
	format = new sceditor.formats.bbcode;
format.init.call(mockEditor);

QUnit.test('match all attrs', assert => {
	assert.equal(
		mockEditor.toBBCode(
			'<abbr title="attrs.defaultattr" test="value">content</abbr>'
		),
		'content'
	);
	assert.equal(
		mockEditor.toBBCode('<abbr title="test" test="value">content</abbr>'),
		'[abbr=test]content[/abbr]'
	);
});
QUnit.test('match any attr', assert => {
	assert.equal(
		mockEditor.toBBCode(
			'<bird type="attrs.defaultattr" test="value">content</bird>'
		),
		'[bird=attrs.defaultattr]content[/bird]'
	);
	assert.equal(
		mockEditor.toBBCode('<bird type="duck" test="value">content</bird>'),
		'[bird=duck]content[/bird]'
	);
});
QUnit.test('match not specified', assert => {
	assert.equal(
		mockEditor.toBBCode(
			'<species classification="attrs.defaultattr" test="value">content</species>'
		),
		'[species=attrs.defaultattr]content[/species]'
	);
	assert.equal(
		mockEditor.toBBCode('<species classification="mammal" test="value">content</species>'),
		'[species=mammal]content[/species]'
	);
});
QUnit.test('unexpected double match', assert => {
	assert.equal(
		mockEditor.toBBCode('<p style="margin: 1em;">content</p>'),
		'[margin=1em][margin=1em]content[/margin][/margin]'
	);
});

// Remember to clean up!
sceditor.formats.bbcode.remove('thisoldbbcode');
sceditor.formats.bbcode.remove('springchicken');
sceditor.formats.bbcode.remove('insertnamehere');
sceditor.formats.bbcode.remove('margin');
