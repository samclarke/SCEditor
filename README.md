# [SCEditor](http://www.sceditor.com/)

[![Build Status](https://github.com/samclarke/SCEditor/workflows/Node.js%20CI/badge.svg)](https://travis-ci.org/samclarke/SCEditor)
[![SemVer](http://img.shields.io/:semver-✓-brightgreen.svg)](http://semver.org)
[![License](http://img.shields.io/npm/l/sceditor.svg)](https://github.com/samclarke/SCEditor/blob/master/LICENSE.md)

A lightweight WYSIWYG BBCode and XHTML editor.

This is a modernized version of SCEditor to remove the broken dependencies of the old grunt build system. I have rewritten the theme system to use modern CSS instead of less and updated to esbuild vs grunt to remove many issues with deprecated modules.
 
For more information visit [sceditor.com](http://www.sceditor.com/)


## Usage

Include the SCEditor JavaScript:

```html
<link rel="stylesheet" href="minified/themes/default.min.css" />
<script src="minified/sceditor.min.js"></script>
<script src="minified/formats/bbcode.js"></script>
<script src="minified/formats/xhtml.js"></script>
```

Then to convert a textarea into SCEditor, simply do:

```js
var textarea = document.getElementById('id-of-textarea');

sceditor.create(textarea, {
	format: 'xhtml',
	style: 'minified/themes/content/default.min.css'
});
```

or for a BBCode WYSIWYG editor do:

```js
var textarea = document.getElementById('id-of-textarea');

sceditor.create(textarea, {
	format: 'bbcode',
	style: 'minified/themes/content/default.min.css'
});
```

Finally, to get the contents of the editor:

```js
var textarea = document.getElementById("id-of-textarea");

sceditor.instance(textarea).val();
```


## Options

For a full list of options, see the [options documentation](http://www.sceditor.com/documentation/options/).



## Building from source

SCEditor uses a minimal build system powered by Node.js, esbuild.

Install dependencies:

```bash
npm install
npm run build
```

That's it! You can now build and test SCEditor with the following commands:

## Contribute

Any contributions and/or pull requests would be welcome.

Themes, translations, bug reports, bug fixes and donations are greatly appreciated.



## Donate

If you would like to make a donation you can via
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=AVJSF5NEETYYG)
or via [Flattr](http://flattr.com/thing/400345/SCEditor)



## License

SCEditor is licensed under the [MIT](/LICENSE.md) license:


Copyright (C) 2011 - 2017 Sam Clarke and contributors – sceditor.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



## Credits

**Nomicons: The Full Monty Emoticons by:**
Oscar Gruno, aka Nominell v. 2.0 -> oscargruno@mac.com
Andy Fedosjeenko, aka Nightwolf -> bobo@animevanguard.com

**Icons by:**
Mark James (http://www.famfamfam.com/lab/icons/silk/)
Licensed under the [Creative Commons CC-BY license](http://creativecommons.org/licenses/by/3.0/).
