function html2dom(html, wrapInJquery)
{
	var ret = document.createElement("div");
	ret.innerHTML = html;
	
	if(wrapInJquery)
		ret = $(ret);
		
	$("#qunit-fixture").append(ret);
	
	return ret;
}
