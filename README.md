# SCEditor v1.3.7
Copyright (C) 2011-2012, [Sam Clarke](http://www.samclarke.com).

For more information visit: http://www.samclarke.com/2011/07/sceditor/

If you find any bugs please let me know by either reporting them on GitHub,
leaving a comment at: http://www.samclarke.com/2011/07/sceditor/
or contacting me via: http://www.samclarke.com/contact or GitHub


## Usage

Include the JQuery and SCEditor JavaScript
	<link rel="stylesheet" href="minified/jquery.sceditor.min.css" type="text/css" media="all" />
	<script type="text/javascript" src="minified/jquery.sceditor.min.js"></script>

Then to change all textareas to WYSIWYG editors, simply do:

	$(document).ready(function() {
		$("textarea").sceditor();
	});

or for a BBCode WYSIWYG editor do:

	$(document).ready(function() {
		$("textarea").sceditorBBCodePlugin();
	});



## Options

**toolbar** *string*
A comma separated list of commands. To separate into groups, use the bar character (|) instead of a comma. E.g. "bold,italic,underline|source"

**locale** *string*
The locale to use, e.g. en-GB, en-US, no-NB, ect. The language file for the specified locale must be included before the editor is used and after the editors main JS file. E.g.

	<script src="../minified/jquery.sceditor.min.js"></script>
	<script src="../languages/nl.js"></script>

	// setup the editor here

**charset** *string*
The charset to use. Defaults to utf-8.

**style** *string*
The stylesheet used to style the HTML content of the WYSIWYG document, normally it should be jquery.sceditor.default.css. This dose not style the editor, the editor is styled by a separate stylesheet which is normally jquery.sceditor.css.

**fonts** *string*
Comma separated list of fonts. There is no way to check if the fonts are installed on the users PC, so the fonts on the list should be kept to the few fonts that are included on most PC's and Macs. The default list should be adequate for most uses.

**colors** *string*
Comma separated list of HEX colours. Use the bar character (|) to signify a new column. If set to null a list of colours will automatically be generated

**emoticonsCompat** *boolean*
If compatibility is enabled it will require emoticons to be surrounded by whitespace or EOL characters meaning if you have :/ it will not be replaced
in http://. This mode currently has limited As You Type emoticon conversion support.

**emoticonsRoot** *string*
If specified, this string will be prepended to all emoticon URLs. The default emoticons are in the "emoticons" directory so specifying the root as
"http://example.com/" would produce "http://example.com/emoticons/smile.png"

**emoticons** *map*
Map in the following format:

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
			":aliasforalien:": "emoticons/alien.png",
			":aliasforblink:": "emoticons/blink.png"
		}
	},

**readOnly** *bool*
Boolean value indicating if the editor is in read only mode or not. Can be changed later on with the readOnly method.

**autofocus** *bool*
Boolean value indicating if to auto focus the editor after initialisation.

**width** *int|string*
Should either be an int which will set the width of the editor in px, or a percentage string (e.g. “100%”). If set to null the width will be set to that of the textarea it is replacing.

**height** *int|string*
Should either be an int which will set the height of the editor in px, or a percentage string (e.g. “100%”). If set to null the height will be set to that of the textarea it is replacing.

**resizeEnabled** *bool*
If to allow the editor to be drag resized by the user. Defaults to true.

**resizeMinWidth** *int*
Minimum width in px that the editor can be resized to. Set to null for half textarea width or -1 for no minimum.

**resizeMinHeight** *int*
Minimum height in px that the editor can be resized to. Set to null for half textarea height or -1 for no minimum.

**resizeMaxHeight** *int*
Maximum height in px that the editor can be resized to. Set to null for double textarea height or -1 for no maximum.

**resizeMaxWidth** *int*
Maximum width in px that the editor can be resized to. Set to null for double textarea width or -1 for no maximum.

**getHtmlHandler** *function*
This is called to filter the HTML before being shown in View Source or set as the textareas value. The function should take two arguments, the first being a string containing the HTML the second being the DOM body node.

**getTextHandler** *function*
This function will be called when switching from View Source mode back to WYSIWYG mode, or when loading the value from the textarea. The function should 1 argument, a string containing the content from the textarea.

**dateFormat** *string*
Date format to use, specified with the strings year, month & day e.g. "year-month-day".
The year, month and day strings will be replaced with the users current year, month and day.

**enablePasteFiltering** *boolean*
If to enable paste filtering. **This feature is still experimental.**

**id** *string*
String to set the ID attribute of the editor container to. Useful if you want different styles for multiple instances of SEditor.

**rtl** *boolean*
If true, the entire editor will be set to RTL mode.



## License

SCEditor is dual licensed under the [MIT](http://www.opensource.org/licenses/mit-license.php) and [GPL](http://www.gnu.org/licenses/gpl.html) licenses.

If you use SCEditor a link back or a donation would be appreciated, but not required.


## Contribute

Any contributions and/or pull requests would be welcome.

Themes, translations, bug reports, bug fixes and donations would be greatly appreciated.


## Donate

If you would like to make a donation you can via
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=AVJSF5NEETYYG)
or via [Flattr](http://flattr.com/thing/400345/SCEditor)


## Credits

**Nomicons: The Full Monty Emoticons by:**

Oscar Gruno, aka Nominell v. 2.0 -> oscargruno@mac.com
Andy Fedosjeenko, aka Nightwolf -> bobo@animevanguard.com

**Icons by:**

Mark James (http://www.famfamfam.com/lab/icons/silk/)
Licensed under the [Creative Commons CC-BY license](http://creativecommons.org/licenses/by/3.0/).
