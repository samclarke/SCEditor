import defaultOptions from 'src/lib/defaultOptions.js';
import 'src/formats/bbcode.js';

QUnit.module('plugins/bbcode - Nesting');

sceditor.formats.bbcode.set(
	'thisblockstyle', {
		styles: {
			border: null
		},
		isInline: false,
		format: '[block]{0}[/block]',
		html: '<block>{0}</block>'
	}
);
sceditor.formats.bbcode.set(
	'thisinlinestyle', {
		styles: {
			opacity: null
		},
		format: '[inline]{0}[/inline]',
		html: '<inline>{0}</inline>'
	}
);
sceditor.formats.bbcode.set(
	'thisblockbbcode', {
		tags: {
			block: {
				test: null
			}
		},
		isInline: false,
		format: '[block]{0}[/block]',
		html: '<block>{0}</block>'
	}
);
sceditor.formats.bbcode.set(
	'thisinlinebbcode', {
		tags: {
			block: {
				testing: null
			}
		},
		format: '[inline]{0}[/inline]',
		html: '<inline>{0}</inline>'
	}
);

var
	mockEditor = {
		opts: defaultOptions
	},
	format = new sceditor.formats.bbcode;
format.init.call(mockEditor);

QUnit.test('inline bbcodes must be inside block ones', assert => {
	assert.equal(
		mockEditor.toBBCode('<theme style=opacity:1;border:none;"></theme>'),
		'[block][inline][/inline][/block]'
	);
	assert.equal(
		mockEditor.toBBCode('<block test="yhm" testing="lol"></block>'),
		'[block][inline][/inline][/block]'
	);
});

sceditor.formats.bbcode.remove('thisblockstyle');
sceditor.formats.bbcode.remove('thisinlinestyle');
sceditor.formats.bbcode.remove('thisblockbbcode');
sceditor.formats.bbcode.remove('thisinlinebbcode');
