import * as dom from './dom.js';
import * as escape from './escape.js';
import _tmpl from './templates.js';

/**
 * Fixes a bug in FF where it sometimes wraps
 * new lines in their own list item.
 * See issue #359
 */
function fixFirefoxListBug(editor) {
	// Only apply to Firefox as will break other browsers.
	if ('mozHidden' in document) {
		let node = editor.getBody();
		let next;

		while (node) {
			next = node;

			if (next.firstChild) {
				next = next.firstChild;
			} else {

				while (next && !next.nextSibling) {
					next = next.parentNode;
				}

				if (next) {
					next = next.nextSibling;
				}
			}

			if (node.nodeType === 3 && /[\n\r\t]+/.test(node.nodeValue)) {
				// Only remove if newlines are collapsed
				if (!/^pre/.test(dom.css(node.parentNode, 'whiteSpace'))) {
					dom.remove(node);
				}
			}

			node = next;
		}
	}
}


/**
 * Map of all the commands for SCEditor
 * @type {Object}
 * @name commands
 * @memberOf jQuery.sceditor
 */
var defaultCmds = {

	// START_COMMAND: albums
	albums: {
		exec: function(caller) {
			const content = dom.createElement('div');
			const editor = this;

			dom.appendChild(content,
				_tmpl('albums',
					{
						root: editor.opts.root
					},
					true));

			editor.createDropDown(caller, 'albums', content);

			const pageSize = 5;
			const pageNumber = 0;

			// eslint-disable-next-line no-undef
			getAlbumImagesData(pageSize, pageNumber, false);
		},
		tooltip: 'User Albums'
	},
	// END_COMMAND

	// START_COMMAND: Attachments
	attachments: {
		exec: function(caller) {
			const content = dom.createElement('div');
			const editor = this;

			dom.appendChild(content,
				_tmpl('attachments',
					{
						root: editor.opts.root
					},
					true));

			editor.createDropDown(caller, 'attachments', content);

			const pageSize = 5;
			const pageNumber = 0;

			// eslint-disable-next-line no-undef
			getPaginationData(pageSize, pageNumber, false);
		},
		tooltip: 'User Attachments'
	},
	// END_COMMAND

	// START_COMMAND: Bold
	bold: {
		exec: 'bold',
		tooltip: 'Bold',
		shortcut: 'Ctrl+B'
	},
	// END_COMMAND
	// START_COMMAND: Italic
	italic: {
		exec: 'italic',
		tooltip: 'Italic',
		shortcut: 'Ctrl+I'
	},
	// END_COMMAND
	// START_COMMAND: Underline
	underline: {
		exec: 'underline',
		tooltip: 'Underline',
		shortcut: 'Ctrl+U'
	},
	// END_COMMAND
	// START_COMMAND: Strikethrough
	strike: {
		exec: 'strikethrough',
		tooltip: 'Strikethrough'
	},
	// END_COMMAND
	// START_COMMAND: Mark
	mark: {
		exec: function() {
			this.wysiwygEditorInsertHtml(
				'<mark>',
				'</mark>'
			);
		},
		tooltip: 'Highlight',
		shortcut: 'Ctrl+H'
	},
	// END_COMMAND

	// START_COMMAND: Left
	left: {
		state: function(node) {
			if (node && node.nodeType === 3) {
				node = node.parentNode;
			}

			if (node) {
				const isLtr = dom.css(node, 'direction') === 'ltr';
				const align = dom.css(node, 'textAlign');

				// Can be -moz-left
				return /left/.test(align) ||
					align === (isLtr ? 'start' : 'end');
			}
		},
		exec: 'justifyleft',
		tooltip: 'Align left'
	},
	// END_COMMAND
	// START_COMMAND: Centre
	center: {
		exec: 'justifycenter',
		tooltip: 'Center'
	},
	// END_COMMAND
	// START_COMMAND: Right
	right: {
		state: function(node) {
			if (node && node.nodeType === 3) {
				node = node.parentNode;
			}

			if (node) {
				const isLtr = dom.css(node, 'direction') === 'ltr';
				const align = dom.css(node, 'textAlign');

				// Can be -moz-right
				return /right/.test(align) ||
					align === (isLtr ? 'end' : 'start');
			}
		},
		exec: 'justifyright',
		tooltip: 'Align right'
	},
	// END_COMMAND
	// START_COMMAND: Justify
	justify: {
		exec: 'justifyfull',
		tooltip: 'Justify'
	},
	// END_COMMAND

	// START_COMMAND: Font
	font: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.on(content,
				'click',
				'a',
				function(e) {
					callback(dom.data(this, 'font'));
					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.opts.fonts.split(',').forEach(function(font) {
				dom.appendChild(content,
					_tmpl('fontOpt',
						{
							font: font
						},
						true));
			});

			editor.createDropDown(caller, 'font-picker', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.font._dropDown(editor,
				caller,
				function(fontName) {
					editor.execCommand('fontname', fontName);
				});
		},
		tooltip: 'Font Name'
	},
	// END_COMMAND
	// START_COMMAND: Size
	size: {
		_dropDown: function(editor, caller, callback) {
			const content = dom.createElement('div');

			dom.on(content,
				'click',
				'a',
				function(e) {
					callback(dom.data(this, 'size'));
					editor.closeDropDown(true);
					e.preventDefault();
				});

			for (let i = 1; i <= 7; i++) {
				dom.appendChild(content,
					_tmpl('sizeOpt',
						{
							size: i
						},
						true));
			}

			editor.createDropDown(caller, 'fontsize-picker', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.size._dropDown(editor,
				caller,
				function(fontSize) {
					editor.execCommand('fontsize', fontSize);
				});
		},
		tooltip: 'Font Size'
	},
	// END_COMMAND
	// START_COMMAND: Colour
	color: {
		_dropDown: function(editor, caller, callback) {
			const content = dom.createElement('div');
			var html = '';
			const cmd = defaultCmds.color;

			if (!cmd._htmlCache) {
				editor.opts.colors.split('|').forEach(function(column) {
					html += '<div class="sceditor-color-column">';

					column.split(',').forEach(function(color) {
						html +=
							`<a href="#" class="sceditor-color-option" style="background-color: ${color}" data-color="${
								color}"></a>`;
					});

					html += '</div>';
				});

				cmd._htmlCache = html;
			}

			dom.appendChild(content, dom.parseHTML(cmd._htmlCache));

			dom.on(content,
				'click',
				'a',
				function(e) {
					callback(dom.data(this, 'color'));
					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'color-picker', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.color._dropDown(editor,
				caller,
				function(color) {
					editor.execCommand('forecolor', color);
				});
		},
		tooltip: 'Font Color'
	},
	// END_COMMAND
	// START_COMMAND: Remove Format
	removeformat: {
		exec: 'removeformat',
		tooltip: 'Remove Formatting'
	},
	// END_COMMAND

	// START_COMMAND: Cut
	cut: {
		exec: 'cut',
		tooltip: 'Cut',
		errorMessage: 'Your browser does not allow the cut command. ' +
			'Please use the keyboard shortcut Ctrl/Cmd-X'
	},
	// END_COMMAND
	// START_COMMAND: Copy
	copy: {
		exec: 'copy',
		tooltip: 'Copy',
		errorMessage: 'Your browser does not allow the copy command. ' +
			'Please use the keyboard shortcut Ctrl/Cmd-C'
	},
	// END_COMMAND
	// START_COMMAND: Paste
	paste: {
		exec: 'paste',
		tooltip: 'Paste',
		errorMessage: 'Your browser does not allow the paste command. ' +
			'Please use the keyboard shortcut Ctrl/Cmd-V'
	},
	// END_COMMAND
	// START_COMMAND: Paste Text
	pastetext: {
		exec: function(caller) {
			var val,
				content = dom.createElement('div'),
				editor = this;

			dom.appendChild(content,
				_tmpl('pastetext',
					{
						label: editor._(
							'Paste your text inside the following box:'
						),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					val = dom.find(content, '#txt')[0].value;

					if (val) {
						editor.wysiwygEditorInsertText(val);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'pastetext', content);
		},
		tooltip: 'Paste Text'
	},
	// END_COMMAND
	// START_COMMAND: Bullet List
	bulletlist: {
		exec: function() {
			fixFirefoxListBug(this);
			this.execCommand('insertunorderedlist');
		},
		tooltip: 'Bullet list'
	},
	// END_COMMAND
	// START_COMMAND: Ordered List
	orderedlist: {
		exec: function() {
			fixFirefoxListBug(this);
			this.execCommand('insertorderedlist');
		},
		tooltip: 'Numbered list'
	},
	// END_COMMAND
	// START_COMMAND: Indent
	indent: {
		state: function(parent, firstBlock) {
			// Only works with lists, for now
			var range, startParent, endParent;

			if (dom.is(firstBlock, 'li')) {
				return 0;
			}

			if (dom.is(firstBlock, 'ul,ol,menu')) {
				// if the whole list is selected, then this must be
				// invalidated because the browser will place a
				// <blockquote> there
				range = this.getRangeHelper().selectedRange();

				startParent = range.startContainer.parentNode;
				endParent = range.endContainer.parentNode;

				// TODO: could use nodeType for this?
				// Maybe just check the firstBlock contains both the start
				//and end containers

				// Select the tag, not the textNode
				// (that's why the parentNode)
				if (startParent !==
					startParent.parentNode.firstElementChild ||
					// work around a bug in FF
					(dom.is(endParent, 'li') &&
						endParent !==
						endParent.parentNode.lastElementChild)) {
					return 0;
				}
			}

			return -1;
		},
		exec: function() {
			const editor = this;
			const block = editor.getRangeHelper().getFirstBlockParent();

			editor.focus();

			// An indent system is quite complicated as there are loads
			// of complications and issues around how to indent text
			// As default, let's just stay with indenting the lists,
			// at least, for now.
			if (dom.closest(block, 'ul,ol,menu')) {
				editor.execCommand('indent');
			}
		},
		tooltip: 'Add indent'
	},
	// END_COMMAND
	// START_COMMAND: Outdent
	outdent: {
		state: function(parents, firstBlock) {
			return dom.closest(firstBlock, 'ul,ol,menu') ? 0 : -1;
		},
		exec: function() {
			const block = this.getRangeHelper().getFirstBlockParent();
			if (dom.closest(block, 'ul,ol,menu')) {
				this.execCommand('outdent');
			}
		},
		tooltip: 'Remove one indent'
	},
	// END_COMMAND

	// START_COMMAND: Table
	table: {
		exec: function(caller) {
			var editor = this,
				content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('table',
					{
						rows: editor._('Rows:'),
						cols: editor._('Cols:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					var rows = Number(dom.find(content, '#rows')[0].value),
						cols = Number(dom.find(content, '#cols')[0].value),
						html = '<table class="table">';

					if (rows > 0 && cols > 0) {
						html += Array(rows + 1).join(
							'<tr>' +
							Array(cols + 1).join(
								'<td class="border"><br /></td>'
							) +
							'</tr>'
						);

						html += '</table>';

						editor.wysiwygEditorInsertHtml(html);
						editor.closeDropDown(true);
						e.preventDefault();
					}
				});

			editor.createDropDown(caller, 'inserttable', content);
		},
		tooltip: 'Insert a table'
	},
	// END_COMMAND

	// START_COMMAND: Code
	code: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.on(content,
				'click',
				'a',
				function(e) {
					callback(dom.data(this, 'language'));
					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.opts.codeLanguages.forEach(function(language) {
				dom.appendChild(content,
					_tmpl('codeOpt',
						{
							language: language.Value,
							languageName: language.Text
						},
						true));
			});

			editor.createDropDown(caller, 'codeLanguage-picker', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.code._dropDown(editor,
				caller,
				function(codeLanguageName) {

					editor.wysiwygEditorInsertHtml(
						`<pre class="border border-danger rounded m-2 p-2"><code class="language-${codeLanguageName}">`,
						'</code></pre>'
					);
				});
		},
		tooltip: 'Code'
	},
	// END_COMMAND


	// START_COMMAND: Code
	extensions: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.on(content,
				'click',
				'a',
				function(e) {
					callback(dom.data(this, 'language'));
					editor.closeDropDown(true);
					e.preventDefault();
				});

			fetch(editor.opts.extensionsUrl,
				{
					method: 'GET'
				}).then(res => res.json()).then(data => {
				data.forEach(function(extension) {
					if (!extension.useToolbar) {
						dom.appendChild(content,
							_tmpl('extensionOpt',
								{
									extension: extension.name
								},
								true));
					}
				});
			});

			editor.createDropDown(caller, 'extensions-picker', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.extensions._dropDown(editor,
				caller,
				function(extension) {

					editor.wysiwygEditorInsertText(
						`[${extension}]`,
						`[/${extension}]`
					);
				});


		},
		tooltip: 'More BBCode'
	},
	// END_COMMAND

	// START_COMMAND: Image
	image: {
		_dropDown: function(editor, caller, cb) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('image',
					{
						url: editor._('URL:'),
						desc: editor._('Description (optional):'),
						insert: editor._('Insert')
					},
					true));


			var linkInput = dom.find(content, '#link')[0];

			function insertUrl(e) {
				const desc = dom.find(content, '#des')[0].value;
				if (linkInput.value) {
					cb(linkInput.value, desc);
				}

				editor.closeDropDown(true);
				e.preventDefault();
			}

			dom.on(content, 'click', '.button', insertUrl);
			dom.on(content,
				'keypress',
				function(e) {
					// 13 = enter key
					if (e.which === 13 && linkInput.value) {
						insertUrl(e);
					}
				},
				dom.EVENT_CAPTURE);

			editor.createDropDown(caller, 'insertimage', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.image._dropDown(
				editor,
				caller,
				function(url, text) {
					var attrs = '';

					if (text) {
						attrs += ` alt="${escape.entities(text)}"`;
					}

					attrs += ` src="${escape.entities(url)}"`;

					editor.wysiwygEditorInsertHtml(
						`<img${attrs} class="img-user-posted img-thumbnail" />`
					);
				}
			);
		},
		tooltip: 'Insert an image'
	},
	// END_COMMAND

	// START_COMMAND: E-mail
	email: {
		_dropDown: function(editor, caller, cb) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('email',
					{
						label: editor._('E-mail:'),
						desc: editor._('Description (optional):'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const email = dom.find(content, '#email')[0].value;

					if (email) {
						cb(email, dom.find(content, '#des')[0].value);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertemail', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.email._dropDown(
				editor,
				caller,
				function(email, text) {
					if (!editor.getRangeHelper().selectedHtml() || text) {
						editor.wysiwygEditorInsertHtml(
							`<a href="mailto:${escape.entities(email)}">${escape.entities((text || email))}</a>`
						);
					} else {
						editor.execCommand('createlink', `mailto:${email}`);
					}
				}
			);
		},
		tooltip: 'Insert an email'
	},
	// END_COMMAND

	// START_COMMAND: Link
	link: {
		_dropDown: function(editor, caller, cb) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('link',
					{
						url: editor._('URL:'),
						desc: editor._('Description (optional):'),
						ins: editor._('Insert')
					},
					true));

			var linkInput = dom.find(content, '#link')[0];

			function insertUrl(e) {
				if (linkInput.value) {
					cb(linkInput.value, dom.find(content, '#des')[0].value);
				}

				editor.closeDropDown(true);
				e.preventDefault();
			}

			dom.on(content, 'click', '.button', insertUrl);
			dom.on(content,
				'keypress',
				function(e) {
					// 13 = enter key
					if (e.which === 13 && linkInput.value) {
						insertUrl(e);
					}
				},
				dom.EVENT_CAPTURE);

			editor.createDropDown(caller, 'insertlink', content);
		},
		exec: function(caller) {
			var editor = this;

			defaultCmds.link._dropDown(editor,
				caller,
				function(url, text) {
					if (text || !editor.getRangeHelper().selectedHtml()) {
						editor.wysiwygEditorInsertHtml(
							`<a href="${escape.entities(url)}">${escape.entities(text || url)}</a>`
						);
					} else {
						editor.execCommand('createlink', url);
					}
				});
		},
		tooltip: 'Insert a link'
	},
	// END_COMMAND

	// START_COMMAND: Unlink
	unlink: {
		state: function() {
			return dom.closest(this.currentNode(), 'a') ? 0 : -1;
		},
		exec: function() {
			const anchor = dom.closest(this.currentNode(), 'a');

			if (anchor) {
				while (anchor.firstChild) {
					dom.insertBefore(anchor.firstChild, anchor);
				}

				dom.remove(anchor);
			}
		},
		tooltip: 'Unlink'
	},
	// END_COMMAND


	// START_COMMAND: Quote
	quote: {
		exec: function(caller, html, author) {
			var before =
				'<div class="border rounded mx-3 mb-3 p-3 border-secondary shadow-sm"><span contenteditable="false"><i class="fa fa-quote-left text-primary fs-4 me-2"></i></span>';
			var end = '</div>';

			// if there is HTML passed set end to null so any selected
			// text is replaced
			if (html) {
				author = (author
					? `<cite class="card-text text-end d-block text-body-secondary small">${
						escape.entities(author)}</cite>`
					: '');
				before = before + html + author + end;
				end = null;
				// if not add a newline to the end of the inserted quote
			} else if (this.getRangeHelper().selectedHtml() === '') {
				// end = `<br />${end}`;
			}

			this.wysiwygEditorInsertHtml(before, end);
		},
		tooltip: 'Insert a Quote'
	},
	// END_COMMAND

	// START_COMMAND: media
	media: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('mediaMenu',
					{
						label: editor._('Media URL:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const url = dom.find(content, '#link')[0].value;

					if (!url.startsWith('http')) {
						alert('Not a valid URL!');
						return;
					}

					callback(url);

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertmedia', content);
		},
		exec: function(btn) {
			var editor = this;

			defaultCmds.media._dropDown(editor,
				btn,
				function(url) {
					editor.wysiwygEditorInsertHtml(`[media]${url}[/media]`);
				});
		},
		tooltip: 'Insert an embed media like a YouTube video, facebook post or twitter status.'
	},
	// END_COMMAND

	// START_COMMAND: vimeo
	vimeo: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('youtubeMenu',
					{
						label: editor._('Video URL:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const url = dom.find(content, '#link')[0].value;

					if (url !== '') {
						const matches = url.match(/vimeo\..*\/(\d+)(?:$|\/)/);

						callback(url, matches[1]);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertlink', content);
		},
		exec: function(btn) {
			var editor = this;

			defaultCmds.vimeo._dropDown(editor,
				btn,
				function(url, id) {
					editor.wysiwygEditorInsertHtml(_tmpl('vimeo',
						{
							url: url,
							vimeoId: id
						}));
				});
		},
		tooltip: 'Insert a Vimeo video'
	},
	// END_COMMAND

	// START_COMMAND: instagram
	instagram: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('instagramMenu',
					{
						label: editor._('Instagram Post URL:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const url = dom.find(content, '#link')[0].value;
					var id = '';

					if (url !== '') {
						const matches = url.match(/\/(p|tv|reel)\/(.*?)\//);

						if (matches) {
							id = matches[2];
							callback(url, id);
						}
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertlink', content);
		},
		exec: function(btn) {
			var editor = this;

			defaultCmds.instagram._dropDown(editor,
				btn,
				function(url, id) {
					editor.wysiwygEditorInsertHtml(_tmpl('instagram',
						{
							url: url,
							id: id
						}));
				});
		},
		tooltip: 'Insert an Instagram Post'
	},
	// END_COMMAND

	// START_COMMAND: facebook
	facebook: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('facebookMenu',
					{
						label: editor._('Facebook post URL:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const url = dom.find(content, '#link')[0].value;

					callback(url);

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertlink', content);
		},
		exec: function(btn) {
			var editor = this;

			defaultCmds.facebook._dropDown(editor,
				btn,
				function(url) {
					editor.wysiwygEditorInsertHtml(_tmpl('facebook',
						{
							url: url
						}));
				});
		},
		tooltip: 'Insert an Facebook Post'
	},
	// END_COMMAND

	// START_COMMAND: youtube
	youtube: {
		_dropDown: function(editor, caller, callback) {
			var content = dom.createElement('div');

			dom.appendChild(content,
				_tmpl('youtubeMenu',
					{
						label: editor._('Video URL:'),
						insert: editor._('Insert')
					},
					true));

			dom.on(content,
				'click',
				'.button',
				function(e) {
					const url = dom.find(content, '#link')[0].value;
					const idMatch = url.match(/(?:v=|v\/|embed\/|youtu.be\/)?([a-zA-Z0-9_-]{11})/);


					if (idMatch && /^[a-zA-Z0-9_\-]{11}$/.test(idMatch[1])) {
						callback(url, idMatch[1]);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

			editor.createDropDown(caller, 'insertlink', content);
		},
		exec: function(btn) {
			var editor = this;

			defaultCmds.youtube._dropDown(editor,
				btn,
				function(url, id) {
					editor.wysiwygEditorInsertHtml(_tmpl('youtube',
						{
							url: url,
							id: id
						}));
				});
		},
		tooltip: 'Insert a YouTube video'
	},
	// END_COMMAND

	// START_COMMAND: Date
	date: {
		_date: function(editor) {
			const now = new Date();
			var year = now.getYear(),
				month = now.getMonth() + 1,
				day = now.getDate();

			if (year < 2000) {
				year = 1900 + year;
			}

			if (month < 10) {
				month = `0${month}`;
			}

			if (day < 10) {
				day = `0${day}`;
			}

			return editor.opts.dateFormat
				.replace(/year/i, year)
				.replace(/month/i, month)
				.replace(/day/i, day);
		},
		exec: function() {
			this.insertText(defaultCmds.date._date(this));
		},
		txtExec: function() {
			this.insertText(defaultCmds.date._date(this));
		},
		tooltip: 'Insert current date'
	},
	// END_COMMAND

	// START_COMMAND: Time
	time: {
		_time: function() {
			const now = new Date();
			var hours = now.getHours(),
				mins = now.getMinutes(),
				secs = now.getSeconds();

			if (hours < 10) {
				hours = `0${hours}`;
			}

			if (mins < 10) {
				mins = `0${mins}`;
			}

			if (secs < 10) {
				secs = `0${secs}`;
			}

			return hours + ':' + mins + ':' + secs;
		},
		exec: function() {
			this.insertText(defaultCmds.time._time());
		},
		txtExec: function() {
			this.insertText(defaultCmds.time._time());
		},
		tooltip: 'Insert current time'
	},
	// END_COMMAND

	// START_COMMAND: Undo
	undo: {
		exec: 'undo',
		tooltip: 'Undo',
		shortcut: 'Ctrl+Z'
	},
	// END_COMMAND

	// START_COMMAND: Redo
	redo: {
		exec: 'redo',
		tooltip: 'Redo',
		shortcut: 'Ctrl+Y'
	},
	// END_COMMAND

	// START_COMMAND: Maximize
	maximize: {
		state: function() {
			return this.maximize();
		},
		exec: function() {
			this.maximize(!this.maximize());
			this.focus();
		},
		txtExec: function() {
			this.maximize(!this.maximize());
			this.focus();
		},
		tooltip: 'Maximize',
		shortcut: 'Ctrl+Shift+M'
	},
	// END_COMMAND

	// START_COMMAND: Source
	source: {
		state: function() {
			return this.sourceMode();
		},
		exec: function() {
			this.toggleSourceMode();
			this.focus();
		},
		txtExec: function() {
			this.toggleSourceMode();
			this.focus();
		},
		tooltip: 'View source',
		shortcut: 'Ctrl+Shift+S'
	},
	// END_COMMAND
	// START_COMMAND: Reply
	reply: {
		exec: function() {
			if (document.getElementById('QuickReplyDialog') !== null) {
				document.querySelector('[data-bs-save*="modal"]').click();
			} else if (document.querySelector('[formaction*="PostReply"]') !== null) {
				document.querySelector('[formaction*="PostReply"]').click();
			} else if (document.querySelector('[id*="QuickReply"]') !== null) {
				document.querySelector('[id*="QuickReply"]').click();
			} else if (document.querySelector('[id*="PostReply"]') !== null) {
				window.location.href = document.querySelector('[id*="PostReply"]').href;
			}
		},
		tooltip: 'Post Reply',
		shortcut: 'Ctrl+Enter'
	},
	// END_COMMAND


	// this is here so that commands above can be removed
	// without having to remove the , after the last one.
	// Needed for IE.
	ignore: {}
};

export default defaultCmds;
