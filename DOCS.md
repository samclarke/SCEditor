SCEditor Documentation
=============

Contents
------------------------------------------

* [Setup](#setup)
* [Options](#options)
* [Commands/BBCodes](#cmdsbbcodes)
	* [Adding a custom Button/Command](#addingcommand)
	* [Adding a custom BBCode](#addingbbcode)
* [Theming](#themeing)
	* [HTML Structure](#htmlstructure)
	* [CSS Structure](#cssstructure)
* [Class and Function Documentation](#classfuncdocs)
* [Code Style](#codestyle)
	* [General](#general)
	* [Naming](#naming)
	* [Variables](#variables)
	* [Braces](#braces)
	* [Comments](#comments)
	* [Equality](#equality)
* [Browser Compatibility](#browsercompat)
* [Changelog](#changelog)
* [Support](#support)
	* [Reporting bugs](#reportingbugs)
	* [Questions/Support](#questionssupport)
* [Licensing](#licensing)

Setup<a id="setup"></a>
------------------------------------------

To set up the editor, first include the minified JS, CSS and, if needed, the language file.

{% highlight html %}
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script><!-- Include jQuery -->

<link rel="stylesheet" href="minified/jquery.sceditor.min.css" type="text/css" media="all" />
<script type="text/javascript" src="minified/jquery.sceditor.min.js"></script>
<script type="text/javascript" src="languages/nl.js"></script><!-- optional -->
{% endhighlight %}

Then, to setup the editor on all textareas, simply do:

{% highlight html %}
<script>
	$(document).ready(function() {
		$("textarea").sceditor({/* options here */});
	});
</script>
{% endhighlight %}

or for the BBCode editor do:

{% highlight html %}
<script>
	$(document).ready(function() {
		$("textarea").sceditor({
			plugins: 'bbcode'
			/* other options here */
		});
	});
</script>
{% endhighlight %}

You can change "textarea" to any [jQuery selector](http://api.jquery.com/category/selectors/) (jQuery borrows from CSS selectors, most of which will work) to convert only specific textareas .

To only convert a textarea with a specific ID you can do "#id-of-textarea" or to convert all textareas with the specified class you can do ".class-name-here";


Options<a id="options"></a>
------------------------------------------

Options should be passed in the editor's constructor.

{% highlight html %}
<script>
	$(document).ready(function() {
		$("textarea").sceditorBBCodePlugin({
			// option 1
			toolbar: "bold,italic,underline|source",
			// option 2
			locale: "no-NB"
		});
	});
</script>
{% endhighlight %}


**toolbar** *String* Defaults to all the built in buttons/commands  
A comma separated list of commands. To separate into groups, use the bar character (|) instead of a comma.
e.g.: "bold,italic,underline|source"


**style** *String* Defaults to "jquery.sceditor.default.css"  
URL of the WYSIWYG editors stylesheet. This is the style sheet that will style all the HTML inside the WYSIWYG editor.


**fonts** *String* Defaults to "Arial,Arial Black,Comic Sans MS,Courier New,Georgia,Impact,Sans-serif,Serif,Times New Roman,Trebuchet MS,Verdana"  
Should be a comma separated list of fonts for the font selector.


**colors** *String* Defaults to null  
Colors should be comma separated list of hex colours with bar (|) characters to signal a new column. If set to null the colours will be auto generated.


**locale** *String* Defaults to "en"  
The locale to use, e.g.: en, en-US, fr, ect. The language file for the locale *must* be included before the editor is used and after the editors main JS file. e.g.

{% highlight html %}
<script src="../minified/jquery.sceditor.min.js"></script>
<script src="../languages/nl.js"></script>
<!-- setup the editor here -->
{% endhighlight %}

**charset** *String* Defaults to "utf-8"  
The charset to set the WYSIWYG editor to.


**emoticonsCompat** *Bool* Defaults to false  
If compatibility is enabled it will require emoticons to be surrounded by whitespace or EOL characters meaning if you have :/ it will not be replaced in http://.

This mode currently has limited As You Type emoticon conversion support. EOL (end of line chars) are not recognised as whitespace with AYT conversion so only emoticons surrounded by whitespace will be converted. This dose not affect non-AYT conversion which will still work as normal.


**emoticonsRoot** *String* Defaults to empty string  
Root URL of emoticons, will be pre-pended to all emoticon URLs.


**emoticons** *Object*  
Map in the following format:

{% highlight javascript %}
emoticons:
{
	// emoticons to be included in the dropdown
	dropdown: {
		":)": "emoticons/smile.png",
		":angel:": "emoticons/angel.png"
	},
	// emoticons to be included in the more section
	more: {
		":alien:": "emoticons/alien.png",
		":blink:": "emoticons/blink.png"
	},
	// emoticons that are not shwon in the dropdown but will be converted ATY
	hidden: {
		":aliasforalien:": "emoticons/alien.png",				":aliasforblink:": "emoticons/blink.png"
	}
}
{% endhighlight %}


**width** *String or int* Defaults to null  
Width of the editor. Can be either an int px value or a %. If set to null the width will be set to that of the textarea it is replacing.


**height** *String or int* Defaults to null  
Height of the editor. Can be either an int px value or a %. If set to null the height will be set to that of the textarea it is replacing.


**resizeEnabled** *Bool* Defaults to true  
If to allow the editor to be resized. If set to true, a small grip will be added to the bottom right-hand corner of the editor which allows it to be resized.


**resizeMinWidth** *int* Defaults to null  
Minimum width that the editor can be resized to. Set to null for half textarea width or -1 for unlimited.


**resizeMinHeight** *int* Defaults to null  
Minimum height that the editor can be resized. Set to null for half textarea height or -1 for unlimited


**resizeMaxHeight** *int* Defaults to null  
Maximum height the editor can be resized to. Set to null for double textarea height or -1 for unlimited


**resizeMaxWidth** *int* Defaults to null  
Maximum width the editor can be resized to. Set to null for double textarea width or -1 for unlimited


**resizeHeight** *Bool* Defaults to true  
If resizing by height is enabled


**resizeWidth** *Bool* Defaults to true  
If resizing by width is enabled


**getHtmlHandler** *function*  
This is called to filter the HTML before being shown in View Source or set as the textareas value. The function should take two arguments, the first being a string containing the HTML and the second being the WYSIWYG editors DOM body node.


**getTextHandler** *function*  
This function will be called when switching from View Source mode back to WYSIWYG mode, or when loading the value from the textarea. The function should 1 argument, a string containing the content from the textarea and return HTML.


**dateFormat** *String* Defaults to "year-month-day"  
Date format, will be overridden if locale specifies one. The words year, month and day will be replaced with the users current year, month and day.


**toolbarContainer** *HTMLElement* Defaults to null  
HTML node to insert the toolbar into.


**enablePasteFiltering** *Bool* Defaults to false  
If to enable paste filtering. This is **currently experimental**, please report any issues.


**disablePasting** *Bool* Defaults to false  
If to completely disable user pasting into the editor.


**readOnly** *Bool* Defaults to false  
If the editor is read only.


**rtl** *Bool* Defaults to false  
If to set the editor to right-to-left mode.


**autofocus** *Bool* Defaults to false  
If to auto focus the editor on page load.


**autoExpand** *Bool* Defaults to false  
If to auto expand the editor to fit the content


**autoUpdate** *Bool* Defaults to false  
If to auto update original textbox on blur


**runWithoutWysiwygSupport** *Bool* Defaults to false  
If to run the source editor when there is no browser WYSIWYG support. Only really applies to mobile OS's as all modern desktop browsers support WYSIWYG.


**id** *String* Defaults to null  
ID to assign the editor.


**plugins** *String* Defaults to empty string  
A commas seperated list of plugins.


**parserOptions** *Object* Defaults to an empty object  
BBCode parser options, only applies if using the editor in BBCode mode.

See $.sceditor.BBCodeParser.defaults for list of valid options


**dropDownCss** *Object* Defaults to an empty object  
Extra CSS to add to the dropdown menu (e.g. z-index).


Commands/BBCodes<a id="cmdsbbcodes"></a>
------------------------------------------

### Adding a custom Button/Command<a id="addingcommand"></a>

To add a command to the editor use the `$.sceditor.command.set()` function. This function will update any existing command with the same name.

$.sceditor.command.set() takes two arguments, name and cmd.

* **name** *String* The name of the command, used to include it in the toolbar. Must be lower-case!
* **cmd** *Object* The command object.


#### Structure of a command object:

{% highlight javascript %}
{
	exec: undefined,
	errorMessage: undefined,
	txtExec: undefined,
	keyPress: undefined,
	tooltip: undefined,
	forceNewLineAfter: undefined
}
{% endhighlight %}


#### Command object properties:

**exec** *String or function*  
Executed when the command is click in WYSIWYG mode.

Should be either a string which will be passed to the browsers execCommand function.

Or a function which takes 1 argument caller. The functions `this` will be set to the editor.

* **caller** *HTMLElement* Should be either the HTML button element or null.

e.g.:

{% highlight javascript %}
function () {
	this.insertText($.sceditor.command.get('time')._time());
}
{% endhighlight %}


**errorMessage** *String*  
Error message to show if the exec string fails.


**txtExec** *String or array*  
Should be either an array containing 1 or 2 strings or a function.

If it is an array and has two strings then any selected content will be surrounded with both strings and the cursor placed before the last string. If it has only 1 string then any selected content will be replaced and the cursor placed after the inserted string.

If it's a function it should take 1 argument caller. The functions `this` will be set to the editor.

* **caller** *HTMLElement* Should be either the HTML button element or null.

e.g.:

{% highlight javascript %}
txtExec: function () {
	this.insertText($.sceditor.command.get('time')._time());
}
{% endhighlight %}


**keyPress** *Function*  
Function that will be called each time a key is pressed when in WYSIWYG mode.


**tooltip** *String*  
Tooltip to show when the mouse hovers over the commands button.


**forceNewLineAfter** *Array*  
Array containing any tags to force a new line after. If certian tags like &lt;code> and &lt;blockquote> are the last child of the editor, you can't enter any text after them. To solve this you can add them to this array which will cause a new line to be force after them allowing text to be entered.


### Adding a custom BBCode<a id="addingbbcode"></a>

To add a BBCode use the `$.sceditorBBCodePlugin.bbcode.set()` function. This function will update any existing BBCode with the same name.

$.sceditorBBCodePlugin.bbcode.set() takes two arguments, name and bbcode.

* **name** *String* Should be the name of the BBCode e.g. for `[b]` it would be "b". *Must* be lower-case!
* **bbcode** *Object* The BBCode object.


#### Structure of a BBCode object:

{% highlight javascript %}
{
	styles: {
		"stylename": null,
		"another-style-name": ["value1", "value2"]
	}
	tags: {
		"tag": null,
		"another-tag": {
			"attribute1": null,
			"attribute2": ["value1", "value2"]
		}
	}
	isSelfClosing: false,
	isInline: true,
	isHtmlInline: undefined,
	allowedChildren: null,
	allowsEmpty: false,
	excludeClosing: false,
	skipLastLineBreak: false,
	quoteType: $.sceditor.BBCodeParser.QuoteType.auto,

	breakBefore: false,
	breakStart: false,
	breakEnd: false,
	breakAfter: false,

	format: 'string|function',
	html: 'string|function'
}
{% endhighlight %}

#### BBCode object properties

**styles** *object* Defaults to null  
The **format** function or string will be used for all matching tags with the specified style.

To match all occurrences of a style do:

{% highlight javascript %}
	"style-name": null
{% endhighlight %}

To match all occurrences of a style do with a specific value do:

{% highlight javascript %}
	"style-name": ["value1", "value2"]
{% endhighlight %}


**tags** *object* Defaults to null  
The **format** function or string will be used for all matching tags.

To match all occurrences of a tag do:

{% highlight javascript %}
	"tag-name": null
{% endhighlight %}

for all occurrences of a tag with a specific attribute:

{% highlight javascript %}
	"tag-name": {
		"attribute-name": null
	}
{% endhighlight %}

for all occurrences of a tag with a specific attribute with a specific value:

{% highlight javascript %}
	"tag-name": {
		"attribute-name": ["value1", "value2"]
	}
{% endhighlight %}


**isSelfClosing** *Bool* Defaults to false  
If this tag is a self closing tag (has no closing tag like `[hr]`).


**isInline** *Bool* Defaults to true  
If this BBCode is inline or block level.


**isHtmlInline** *Bool or undefined* Defaults to undefined  
If this BBCodes HTML is inline or not. Only needs to be set if it differs from the BBCode (isInline). If undefined it is ignored and isInline is used.


**allowedChildren** *Array or null* Defaults to null (all children)  
If null/undefined then all children will be allowed. If it's an array only the tags specified will be allowed. To allow plain text use `#` as the tag.

To only allow plain text it would be:  
`allowedChildren: [#]`

to only allow list items it would be:  
`allowedChildren: ['*', 'li']`


**allowsEmpty** *Bool* Defaults to false  
If this tag is allowed to be empty (have no children or content).


**excludeClosing** *Bool* Defaults to false  
If to not add a closing tag. Mostly so that [*] can be used without [/*].


**skipLastLineBreak** *Bool*  
All block level tags have an extra &lt;br /> added to the end of them in all browsers except IE. If this is set to true the extra line break will not be added.


**quoteType** *$.sceditor.BBCodeParser.QuoteType* Defaults to auto
The quote type for attributes. Valid valus are:

$.sceditor.BBCodeParser.QuoteType.auto,  
Quote the attributes value when it has a space or equals sign in it  
$.sceditor.BBCodeParser.QuoteType.never,  
Never quote the attributes value  
$.sceditor.BBCodeParser.QuoteType.always  
Always quote the attributes value 

or a function which takes 1 argument (the attributes value) and returns the value with the right quotes.


**breakBefore** *Bool* Defaults to false  
If to always insert a new line before the tag.


**breakStart** *Bool* Defaults to false  
If to always insert a new line after the start tag. This does not apply to self closing tags.


**breakEnd** *Bool* Defaults to false  
If to always insert a new line before the end tag. This does not apply to self closing tags.


**breakAfter** *Bool* Defaults to false  
If to always insert a new line after the end tag.


**format** *String or function*  
Should be either a string like `"[b]{0}[/b]"` where {0} will be replaced with the BBCode tags content.  
*Note:* If it's a self closing tag if should exclude the end tag, e.g. `"[*]{0}"`

Or a function which returns the formatted BBCode string. It should take two parameters, `element` and `content`.

* **element** *HTMLElement* The DOM HTMLElement object to be converted
* **content** *String* A string containing the BBCodes content

e.g.:

{% highlight javascript %}
function(element, content) {
	if(!element.attr('data-youtube-id'))
		return content;

	return '[youtube]' + element.attr('data-youtube-id') + '[/youtube]';
}
{% endhighlight %}


**html** *String or function*  
Should be either a string like `"<div style="direction: ltr">{0}</div>"` where {0} will be replaced with the HTML tags content.

Or a function taking 3 arguments (token, attrs, content) and returning the HTML string.

* **token** *Object* TokenizeToken object
* **attrs** *Object* Map of attributes. The default attribute `[tag=default]` will be set to `defaultAttr`
* **content** *String* The HTML content of this tag

e.g.:

{% highlight javascript %}
html: function(token, attrs, content) {
	if(typeof attrs.defaultAttr !== "undefined")
		content = '<cite>' + attrs.defaultAttr + '</cite>' + content;

	return '<blockquote>' + content + '</blockquote>';
}
{% endhighlight %}


Theming<a id="themeing"></a>
------------------------------------------

### HTML Structure<a id="htmlstructure"></a>

{% highlight html %}
<div class="sceditor-container">
	<div class="sceditor-toolbar">
		<div class="sceditor-group">
			<a class="sceditor-button sceditor-button-[name]"
					data-sceditor-command="[name]"
					unselectable="on"
					title="[name]">
				<div unselectable="on">[tooltip or name]</div>
			</a>
		</div>
	</div>
	<iframe></iframe>
	<textarea></textarea>
	<div class="sceditor-grip"></div>
	<div class="sceditor-resize-cover"></div>
	<input> <!-- this is hidden and only used so that blur() can work -->
</div>
{% endhighlight %}

To style the contents of the iframe, you must edit the stylesheet that is set with the `style:` option in the editors constructor.


### CSS Structure<a id="cssstructure"></a>

* **div.sceditor-container**
  The container for the whole editor.
  If the editor is in source mode the class **.sourceMode** will be added and the class **.wysiwygMode** will be added when in WYSIWYG mode.
	* **div.sceditor-toolbar**
	  The container for the toolbar
	* **div.sceditor-group**
	  A toolbar group
		* **a.sceditor-button**
		  A toolbar button.
		  The class **.disabled** will be added if the command is not supported in the current mode.
		* **a.sceditor-button-[name]**
		  Same as the previous class but [name] is replaced with the buttons command name, e.g. .sceditor-button-bold, .sceditor-button-italic, ect.
		* **div**
		  Div containing the buttons accessibility text and normally has the background image is set to the button's icon too
	* **iframe**
	  Iframe used for the WYSIWYG editor. This has no class, it must be selected with the HTML element
	* **textarea**
	  Textarea used for the source mode editor. This has no class, it must be selected with the HTML element
	* **div.sceditor-grip**
	  Grip used to resize the editor
	* **div.sceditor-resize-cover**
	  Div which covers the editor during resizing
	* **div.sceditor-dropdown**
	  Div containing the dropdown


Class and Function Documentation<a id="classfuncdocs"></a>
------------------------------------------

See [docs/index.html](docs/index.html) located in the root SCEditor directory for documentation on classes and functions.


Code Style<a id="codestyle"></a>
------------------------------------------

This is mostly here so I can attempt to keep the code styling consistent throughout SCEditor.

### General<a id="general"></a>

* Always use semicolons
* Avoid eval()
* Always use tabs for indentation
* Make sure code passes JSHint checking


### Naming<a id="naming"></a>

Naming should be camelCase except for classes which should be PascalCase.

All jQuery object variables should start with a $ for easy identification.


### Variables<a id="variables"></a>

Unassigned variables should always come first on one line (unless the line gets too long in which case it can be split). Assigned variables should always be on their own line.

If declaring a single assigned variable or only unassigned variables there should only be a single space after `var`.

If declaring multiple assigned variables or mixing assigned with unassigned variables then a tab should be inserted after the `var` keyword to allow all the variables to line up.
Spaces should also be used to make the equal's signs (`=`) line up:

{% highlight javascript %}
var unassigned, anotherUnassigned,
    assigned      = "value",
    assignedAgain = 1;
{% endhighlight %}


### Braces<a id="braces"></a>

Apart from function and object definitions, braces should be on their own lines:

{% highlight javascript %}
// function definition
function theFunc() {
	// Rest should have braces on their own lines
	while(true)
	{
		setupInfiniteLoop();
		doInfiniteLoop();
	}

	if(condition)
	{
		do();
		something();
	}
};
{% endhighlight %}

Braces can be omitted if not needed:

{% highlight javascript %}
while(i--)
	if(arr[i].type === type && arr[i].name === name)
		return true;
{% endhighlight %}


### Comments<a id="comments"></a>

Commenting functions and classes use `/** ... */` with the appropriate JSDoc tags.

For inline comments use `//`.


### Equality<a id="equality"></a>

Use strict equality checks (`===`) instead of  `==` wherever possible.


Browser Compatibility<a id="browsercompat"></a>
------------------------------------------

SCEditor should work in *at least*

Desktop browsers:

* IE 6+
* FF 3.5
* Chrome/Chromium
* Opera 9.5+
* Safari 4+
* Midora 0.4+
* Epiphany

Mobile browsers:

* Android browser 534+
* iOS 5+
* Firefox
* Chrome

Older versions of mobile browsers can support source mode editing but by default the editor is completely disabled for them.


Changelog<a id="changelog"></a>
---------------------

See the CHANELOG.txt file located in the SCEditor directory.


Support<a id="support"></a>
------------------------------------------


### Reporting bugs<a id="reportingbugs"></a>

If you've found a bug, have an idea for a new feature or any other issues please use the [issues page on GitHub](https://github.com/samclarke/SCEditor/issues/new) to report them.

You can also contact me directly via my website.

### Questions/Support<a id="questionssupport"></a>

If you have any questions or comments about SCEditor, you can add a question to the [GitHub issues page](https://github.com/samclarke/SCEditor/issues/new) or contact me directly [via my website](http://www.samclarke.com/contact).



Licensing<a id="licensing"></a>
------------------------------------------

SCEditor is licensed under the MIT license.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.