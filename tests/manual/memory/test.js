var testMemoryLeaks = function (pos) {
	pos = pos || 1;

	$('#testarea').sceditor({
		autofocus: true,
		autofocusEnd: true,
		enablePasteFiltering: true,
		emoticonsRoot: '../../../',
		style: '../../../src/themes/content/default.css'
	});

	$('#testarea').sceditor('instance').destroy();
	$('#progress').width(pos + '%');

	if (pos <= 100) {
		setTimeout(function () {
			testMemoryLeaks(pos + 1);
		});
	}
};

$(function () {
	$('input[type="submit"]').click(function () {
		testMemoryLeaks();

		return false;
	});
});
