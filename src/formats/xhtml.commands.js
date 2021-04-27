/**
 * SCEditor XHTML Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */

var getEditorCommand = sceditor.command.get;

export default {
	bold: {
		txtExec: ['<strong>', '</strong>']
	},
	italic: {
		txtExec: ['<em>', '</em>']
	},
	underline: {
		txtExec: ['<span style="text-decoration:underline;">', '</span>']
	},
	strike: {
		txtExec: ['<span style="text-decoration:line-through;">', '</span>']
	},
	subscript: {
		txtExec: ['<sub>', '</sub>']
	},
	superscript: {
		txtExec: ['<sup>', '</sup>']
	},
	left: {
		txtExec: ['<div style="text-align:left;">', '</div>']
	},
	center: {
		txtExec: ['<div style="text-align:center;">', '</div>']
	},
	right: {
		txtExec: ['<div style="text-align:right;">', '</div>']
	},
	justify: {
		txtExec: ['<div style="text-align:justify;">', '</div>']
	},
	font: {
		txtExec: function (caller) {
			var editor = this;

			getEditorCommand('font')._dropDown(
				editor,
				caller,
				function (font) {
					editor.insertText('<span style="font-family:' +
						font + ';">', '</span>');
				}
			);
		}
	},
	size: {
		txtExec: function (caller) {
			var editor = this;

			getEditorCommand('size')._dropDown(
				editor,
				caller,
				function (size) {
					editor.insertText('<span style="font-size:' +
						size + ';">', '</span>');
				}
			);
		}
	},
	color: {
		txtExec: function (caller) {
			var editor = this;

			getEditorCommand('color')._dropDown(
				editor,
				caller,
				function (color) {
					editor.insertText('<span style="color:' +
						color + ';">', '</span>');
				}
			);
		}
	},
	bulletlist: {
		txtExec: ['<ul><li>', '</li></ul>']
	},
	orderedlist: {
		txtExec: ['<ol><li>', '</li></ol>']
	},
	table: {
		txtExec: ['<table><tr><td>', '</td></tr></table>']
	},
	horizontalrule: {
		txtExec: ['<hr />']
	},
	code: {
		txtExec: ['<code>', '</code>']
	},
	image: {
		txtExec: function (caller, selected) {
			var	editor  = this;

			getEditorCommand('image')._dropDown(
				editor,
				caller,
				selected,
				function (url, width, height) {
					var attrs  = '';

					if (width) {
						attrs += ' width="' + width + '"';
					}

					if (height) {
						attrs += ' height="' + height + '"';
					}

					editor.insertText(
						'<img' + attrs + ' src="' + url + '" />'
					);
				}
			);
		}
	},
	email: {
		txtExec: function (caller, selected) {
			var	editor  = this;

			getEditorCommand('email')._dropDown(
				editor,
				caller,
				function (url, text) {
					editor.insertText(
						'<a href="mailto:' + url + '">' +
							(text || selected || url) +
						'</a>'
					);
				}
			);
		}
	},
	link: {
		txtExec: function (caller, selected) {
			var	editor  = this;

			getEditorCommand('link')._dropDown(
				editor,
				caller,
				function (url, text) {
					editor.insertText(
						'<a href="' + url + '">' +
							(text || selected || url) +
						'</a>'
					);
				}
			);
		}
	},
	quote: {
		txtExec: ['<blockquote>', '</blockquote>']
	},
	youtube: {
		txtExec: function (caller) {
			var editor = this;

			getEditorCommand('youtube')._dropDown(
				editor,
				caller,
				function (id, time) {
					editor.insertText(
						'<iframe width="560" height="315" ' +
						'src="https://www.youtube.com/embed/{id}?' +
						'wmode=opaque&start=' + time + '" ' +
						'data-youtube-id="' + id + '" ' +
						'frameborder="0" allowfullscreen></iframe>'
					);
				}
			);
		}
	},
	rtl: {
		txtExec: ['<div stlye="direction:rtl;">', '</div>']
	},
	ltr: {
		txtExec: ['<div stlye="direction:ltr;">', '</div>']
	}
};
