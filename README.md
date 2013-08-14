# [SCEditor](http://www.sceditor.com/) v1.4.5

[![Build Status](https://travis-ci.org/samclarke/SCEditor.png?branch=master)](https://travis-ci.org/samclarke/SCEditor)

A lightweight WYSIWYG BBCode and XHTML editor.

For more information visit [sceditor.com](http://www.sceditor.com/)


## Usage

Include the JQuery and SCEditor JavaScript

	<link rel="stylesheet" href="minified/jquery.sceditor.min.css" type="text/css" media="all" />
	<script type="text/javascript" src="minified/jquery.sceditor.bbcode.min.js"></script>

Then to change all textareas to WYSIWYG editors, simply do:

	$(function() {
		$("textarea").sceditor({
			plugins: 'xhtml',
			style: 'minified/jquery.sceditor.default.min.css'
		});
	});

or for a BBCode WYSIWYG editor do:

	$(function() {
		$("textarea").sceditor({
			plugins: 'bbcode',
			style: 'minified/jquery.sceditor.default.min.css'
		});
	});



## Options

See the documentation [options page](http://www.sceditor.com/documentation/options/) for a full list of options.



## License

SCEditor is licensed under the [MIT](http://www.opensource.org/licenses/mit-license.php) license.

If you use SCEditor a link back or a donation would be appreciated, but not required.



## Contribute

Any contributions and/or pull requests would be welcome.

Themes, translations, bug reports, bug fixes and donations are greatly appreciated.



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
