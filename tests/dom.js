module("DOM Class");

test("Traversal", function() {
	expect(4);

	var check = "";
	$.sceditor.dom.traverse(
		html2dom("<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>"),
		function(node) {
			if(node.nodeType === 3)
				check += node.nodeValue;
		}
	);
	equal(
		check,
		"12345",
		"Traverse all"
	);

	check = "";
	$.sceditor.dom.rTraverse(
		html2dom("<code><b>1</b><b>2</b><b>3</b><span><b>4</b><b>5</b></span></code>"),
		function(node) {
			if(node.nodeType === 3)
				check += node.nodeValue;
		}
	);
	equal(
		check,
		"54321",
		"Reverse traverse all"
	);

	check = "";
	$.sceditor.dom.traverse(
		html2dom("<code><span><b></b></span><span><b></b><b></b></span></code>"),
		function(node) {
			check += node.nodeName.toLowerCase() + ':';
		},
		true
	);
	equal(
		check,
		"b:span:b:b:span:code:",
		"Traverse innermost first"
	);


	check = "";
	$.sceditor.dom.traverse(
		html2dom("1<span>ignore</span>2<span>ignore</span>3"),
		function(node) {
			if(node.nodeType === 3)
				check += node.nodeValue;
		},
		false,
		true
	);
	equal(
		check,
		"123",
		"Traverse only siblings first"
	);
});


test("Fix nesting", function() {
	expect(3);

	var node = html2dom("<span>span<div style=\"font-weight: bold;\">div</div>span</span>");
	$.sceditor.dom.fixNesting(node);
	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span>span</span><div style=\"font-weight: bold;\">div</div><span>span</span>",
			"Simple fix"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span>span</span>\r\n<div style=\"font-weight: bold\">div</div><span>span</span>",
			"Simple fix"
		);
	}


	node = html2dom("<span style=\"font-weight: bold;\">span<div>div</div>span</span>");
	$.sceditor.dom.fixNesting(node);
	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span style=\"font-weight: bold;\">span</span><div style=\"font-weight: bold;\">div</div><span style=\"font-weight: bold;\">span</span>",
			"Fix with CSS"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span style=\"font-weight: bold\">span</span>\r\n<div style=\"font-weight: bold\">div</div><span style=\"font-weight: bold\">span</span>",
			"Fix with CSS"
		);
	}

	node = html2dom("<span>span<span>span<div style=\"font-weight: bold;\">div</div>span</span>span</span>");
	$.sceditor.dom.fixNesting(node);
	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span>span<span>span</span></span><div style=\"font-weight: bold;\">div</div><span><span>span</span>span</span>",
			"Deeper fix"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<span>span<span>span</span></span>\r\n<div style=\"font-weight: bold\">div</div><span><span>span</span>span</span>",
			"Deeper fix"
		);
	}
});

test("Remove White Space", function() {
	expect(5);

	var node = html2dom("<span>   </span>");
	$.sceditor.dom.removeWhiteSpace(node);
	equal(
		node.innerHTML.toLowerCase(),
		"<span> </span>",
		"Simple fix"
	);


	node = html2dom("<div>    <span>  \t\t\t\t </span>\t\t\t</div>");
	$.sceditor.dom.removeWhiteSpace(node);

	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div> <span> </span> </div>",
			"Nested fix"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div><span></span></div>",
			"Nested fix"
		);
	}


	node = html2dom("<div>    <span>  \t\tcontent\t\t </span>\t\t\t</div>");
	$.sceditor.dom.removeWhiteSpace(node);

	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div> <span> content </span> </div>",
			"Nested fix with content"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div><span>content </span></div>",
			"Nested fix with content"
		);
	}


	node = html2dom("<div>    <pre>  \t\tcontent\t\t </pre>\t\t\t</div>");
	$.sceditor.dom.removeWhiteSpace(node);

	if(!$.sceditor.ie || $.sceditor.ie > 8)
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div> <pre>  \t\tcontent\t\t </pre> </div>",
			"Nested fix with content in pre tag"
		);
	}
	else
	{
		equal(
			node.innerHTML.toLowerCase(),
			"<div><pre>  \t\tcontent\t\t </pre></div>",
			"Nested fix with content in pre tag"
		);
	}


	node = html2dom("<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>");
	$.sceditor.dom.removeWhiteSpace(node);
	equal(
		node.innerHTML.toLowerCase(),
		"<pre>    <span>  \t\tcontent\t\t </span>\t\t\t</pre>",
		"Nested fix with content with parent pre tag"
	);
});