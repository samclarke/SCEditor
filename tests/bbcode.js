module("BBCode Parser");

test("White space removal", function() {
	expect(2);
	
	var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
	var sceditorbbcode = textarea.data("sceditorbbcode");

	var code = document.createElement("div");
	var space = document.createElement("div");
	code.innerHTML = "&nbsp; &nbsp; &nbsp;\n<code>Some            White \n      \n     space</code>";
	space.innerHTML = "     <div>   lots   </div>   \n of   junk   \n\n\n\n\n         \n  j";
	
	
	var codeBBocde = sceditorbbcode.getHtmlHandler("", $(code));
	var spaceBBocde = sceditorbbcode.getHtmlHandler("", $(space));
	var codeResult = sceditorbbcode.getTextHandler(codeBBocde);
	var spaceResult = sceditorbbcode.getTextHandler(spaceBBocde);
	

	equal(codeResult, "<code><div>Some &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;White </div><div> &nbsp; &nbsp; &nbsp;</div> &nbsp; &nbsp; space</code>", "Leave non-breaking & code spaces");
	equal(spaceResult, "<div>lots </div> of junk j", "White Space Removal");
});

test("Invalid nesting", function() {
	expect(2);
	
	var textarea = $("#qunit-fixture textarea:first").sceditorBBCodePlugin();
	var sceditorbbcode = textarea.data("sceditorbbcode");

	var test1 = document.createElement("div");
	var test2 = document.createElement("div");
	test1.innerHTML = "<b><i>test</b>test2</i>";
	test2.innerHTML = "<span style='color: #000'>this<code>is</code>a test</span>";
	
	
	var test1BBocde = sceditorbbcode.getHtmlHandler("", $(test1));
	var test2BBocde = sceditorbbcode.getHtmlHandler("", $(test2));
	var test1Result = sceditorbbcode.getTextHandler(test1BBocde);
	var test2Result = sceditorbbcode.getTextHandler(test2BBocde);


	equal(test1Result, "<strong><em>test</em></strong><em>test2</em>", "Leave non-breaking & code spaces");
	equal(test2Result, "<font color=\"#000000\">this<code>is</code>a test</font>", "White Space Removal");
});