define([
	'jquery.sceditor'
], function () {
	'use strict';

	var textarea;
	var $sceditor;

	module('jquery.sceditor', {
		setup: function () {
			$.sceditor.defaultOptions.emoticonsRoot = '../../';

			var fixture = document.getElementById('qunit-fixture');

			textarea = document.createElement('textarea');
			fixture.appendChild(textarea);

			$(textarea).sceditor();
			$sceditor = $(textarea).data('sceditor');
		},
		teardown: function () {
			$.sceditor.defaultOptions.emoticonsRoot = '';
		}
	});


	test('sceditor(\'instance\')', function (assert) {
		assert.ok($(textarea).sceditor('instance') === $sceditor);
	});
});
