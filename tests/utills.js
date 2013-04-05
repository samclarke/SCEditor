function html2dom(html, wrapInJquery)
{
	var ret = document.createElement("div");
	ret.innerHTML = html;
	
	if(wrapInJquery)
		ret = $(ret);
		
	$("#qunit-fixture").append(ret);
	
	return ret;
}

function equalMulti(actual, expectedArr, message) 
{
	var matched = false;
	
	$.each(expectedArr, function(idx, expected) {
		if(actual == expected)
			matched = true;
	});
	
	QUnit.push(matched, actual, expectedArr, message);
}