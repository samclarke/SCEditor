# SCEditor v1.2.9
Copyright (C) 2011-2012, [Sam Clarke](http://www.samclarke.com).

For more information visit: http://www.samclarke.com/2011/07/sceditor/

If you find any bugs please let me know by either reporting them on GitHub,
leaving a comment at: http://www.samclarke.com/2011/07/sceditor/
or contacting me via: http://www.samclarke.com/contact or GitHub


# Usage

Include the JQuery and SCEditor JavaScript
	<link rel="stylesheet" href="minified/jquery.sceditor.min.css" type="text/css" media="all" />
	<script type="text/javascript" src="minified/jquery.sceditor.min.js"></script>
	
Then to change all textareas to WYSIWYG editors, simpley do:

	$(document).ready(function() {
		$("textarea").sceditor();
	});

or for a BBCode WYSIWYG editor do:

	$(document).ready(function() {
		$("textarea").sceditorBBCodePlugin();
	});



# Options

**toolbar** *string*
Comma seperated list of commans. Groups should be split by a bar (|) charecter

**locale** *string*
The locale to use, e.g. en-GB, en-US, no, nl, ect. The language file must be included after the main JS but before the editor is initilised.

**charset** *string*
The charset to use. Defaults to utf-8.

**style** *string*
Stylesheet to style the WYSIWYG document

**fonts** *string*
Comma seperated list of fonts

**colors** *string*
Comma seperated list of HEX colours. Use the bar charecter (|) to signify a new colum. If set to null a list of colours will be automatically generated

**emoticonsCompat** *boolean*
If compatibility is enabled it will require emoticons ro be surrounded by whitespace or EOL characters meaning if you have :/ it will not be replaced
in http://. This mode currently has limited As You Type emoticon converstion support. Will hopefully be fixed soon.

**emoticons** *map*
Map in the following format:

	emoticons:
	{
		dropdown:
		{
			":)": "emoticons/smile.png",
			":angel:": "emoticons/angel.png"
		},
		more: {
			":alien:": "emoticons/alien.png",
			":blink:": "emoticons/blink.png"
		},
		hidden: {
			":aliasforalien:": "emoticons/alien.png",
			":aliasforblink:": "emoticons/blink.png"
		}
	},

**width** *int|string*
Width of the editor in px or percentage string. If set to null the width will be set to that of the textarea it is replacing.

**height** *int|string*
Height of the editor in px or percentage string. If set to null the height will be set to that of the textarea it is replacing.

**resizeEnabled** *bool*
If to allow the editor to be resized. Defaults to true

**resizeMinWidth** *int*
Min resize to width in px. Set to null for half textarea width or -1 for unlimited.

**resizeMinHeight** *int*
Min resize to height in px. Set to null for half textarea height or -1 for unlimited.

**resizeMaxHeight** *int*
Max resize to height in px. Set to null for double textarea height or -1 for unlimited.

**resizeMaxWidth** *int*
Max resize to width in px. Set to null for double textarea width or -1 for unlimited.

**getHtmlHandler** *function*

**getTextHandler** *function*

**dateFormat** *string*
Date format to use, specified with the strings year, month & day e.g. "year-month-day".
The year, month and day will be replaced with the users current year, month and day.


# License

SCEditor is dual licensed under the [MIT](http://www.opensource.org/licenses/mit-license.php) and [GPL](http://www.gnu.org/licenses/gpl.html) licenses.

If you use SCEditor a link back or a donation would be appreciated, but not required.


# Donate

If you would like to make a donation you can via
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=AVJSF5NEETYYG)
or via [Flattr](http://flattr.com/thing/400345/SCEditor)


# Credits

**Nomicons: The Full Monty Emoticons by:**
Oscar Gruno, aka Nominell v. 2.0 -> oscargruno@mac.com
Andy Fedosjeenko, aka Nightwolf -> bobo@animevanguard.com

**Icons by:**
Mark James (http://www.famfamfam.com/lab/icons/silk/)
Licensed under the [Creative Commons CC-BY license](http://creativecommons.org/licenses/by/3.0/).
