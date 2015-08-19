var testMemoryLeaks = function (pos) {
	pos = pos || 1;

	$('#testarea').sceditor({
		autofocus: true,
		autofocusEnd: true,
		enablePasteFiltering: true,
		emoticonsRoot: '../../../',
		style: '../../../src/jquery.sceditor.default.css'
	});

	$('#testarea').sceditor('instance').destroy();
	$('#progress').width(pos + '%');

	if (pos <= 100) {
		setTimeout(function () {
			testMemoryLeaks(pos + 1);
		});
	}
};

define('jquery', [], function () {
	return jQuery;
});

require.config({
	baseUrl: '../../../src'
});

require([
	'jquery.sceditor'
], function () {
	$('input[type="submit"]').click(function () {
		testMemoryLeaks();

		return false;
	});
});
