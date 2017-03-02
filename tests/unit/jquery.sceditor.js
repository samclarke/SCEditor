import 'src/jquery.sceditor.js';

var textarea;
var sceditor;

QUnit.module('jquery.sceditor', {
	beforeEach: function () {
		$.sceditor.defaultOptions.emoticonsRoot = '../../';

		var fixture = document.getElementById('qunit-fixture');

		textarea = document.createElement('textarea');
		fixture.appendChild(textarea);

		$(textarea).sceditor();
		sceditor = textarea._sceditor;
	},
	afterEach: function () {
		$.sceditor.defaultOptions.emoticonsRoot = '';
	}
});

QUnit.test('sceditor(\'instance\')', function (assert) {
	assert.ok($(textarea).sceditor('instance') === sceditor);
});
