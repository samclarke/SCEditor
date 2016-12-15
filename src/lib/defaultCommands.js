define(function (require) {
	'use strict';

	var $      = require('jquery');
	var IE_VER = require('./browser').ie;
	var _tmpl  = require('./templates');

	// In IE < 11 a BR at the end of a block level element
	// causes a line break. In all other browsers it's collapsed.
	var IE_BR_FIX = IE_VER && IE_VER < 11;

	/**
	 * Fixes a bug in FF where it sometimes wraps
	 * new lines in their own list item.
	 * See issue #359
	 */
	function fixFirefoxListBug(editor) {
		// Only apply to firefox as will break other browsers.
		if ('mozHidden' in document) {
			var node = editor.getBody()[0];
			var next;

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
					if (!/^pre/.test($(node.parentNode).css('white-space'))) {
						$(node).remove();
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
	var defaultCommnds = {
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
		// START_COMMAND: Subscript
		subscript: {
			exec: 'subscript',
			tooltip: 'Subscript'
		},
		// END_COMMAND
		// START_COMMAND: Superscript
		superscript: {
			exec: 'superscript',
			tooltip: 'Superscript'
		},
		// END_COMMAND

		// START_COMMAND: Left
		left: {
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
			_dropDown: function (editor, caller, callback) {
				var	fontIdx = 0,
					fonts   = editor.opts.fonts.split(','),
					content = $('<div />'),
					/** @private */
					clickFunc = function () {
						callback($(this).data('font'));
						editor.closeDropDown(true);
						return false;
					};

				for (; fontIdx < fonts.length; fontIdx++) {
					content.append(
						_tmpl('fontOpt', {
							font: fonts[fontIdx]
						}, true).click(clickFunc)
					);
				}

				editor.createDropDown(caller, 'font-picker', content);
			},
			exec: function (caller) {
				var editor = this;

				defaultCommnds.font._dropDown(
					editor,
					caller,
					function (fontName) {
						editor.execCommand('fontname', fontName);
					}
				);
			},
			tooltip: 'Font Name'
		},
		// END_COMMAND
		// START_COMMAND: Size
		size: {
			_dropDown: function (editor, caller, callback) {
				var	content   = $('<div />'),
					/** @private */
					clickFunc = function (e) {
						callback($(this).data('size'));
						editor.closeDropDown(true);
						e.preventDefault();
					};

				for (var i = 1; i <= 7; i++) {
					content.append(_tmpl('sizeOpt', {
						size: i
					}, true).click(clickFunc));
				}

				editor.createDropDown(caller, 'fontsize-picker', content);
			},
			exec: function (caller) {
				var editor = this;

				defaultCommnds.size._dropDown(
					editor,
					caller,
					function (fontSize) {
						editor.execCommand('fontsize', fontSize);
					}
				);
			},
			tooltip: 'Font Size'
		},
		// END_COMMAND
		// START_COMMAND: Colour
		color: {
			_dropDown: function (editor, caller, callback) {
				var	content = $('<div />'),
					html    = '',
					cmd     = defaultCommnds.color;

				if (!cmd._htmlCache) {
					editor.opts.colors.split('|').forEach(function (column) {
						html += '<div class="sceditor-color-column">';

						column.split(',').forEach(function (color) {
							html +=
								'<a href="#" class="sceditor-color-option"' +
								' style="background-color: ' + color + '"' +
								' data-color="' + color + '"></a>';
						});

						html += '</div>';
					});

					cmd._htmlCache = html;
				}

				content.html(cmd._htmlCache)
					.find('a')
					.click(function (e) {
						callback($(this).attr('data-color'));
						editor.closeDropDown(true);
						e.preventDefault();
					});

				editor.createDropDown(caller, 'color-picker', content);
			},
			exec: function (caller) {
				var editor = this;

				defaultCommnds.color._dropDown(
					editor,
					caller,
					function (color) {
						editor.execCommand('forecolor', color);
					}
				);
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
			exec: function (caller) {
				var	val, content,
					editor  = this;

				content = _tmpl('pastetext', {
					label: editor._(
						'Paste your text inside the following box:'
					),
					insert: editor._('Insert')
				}, true);

				content.find('.button').click(function (e) {
					val = content.find('#txt').val();

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
			exec: function () {
				fixFirefoxListBug(this);
				this.execCommand('insertunorderedlist');
			},
			tooltip: 'Bullet list'
		},
		// END_COMMAND
		// START_COMMAND: Ordered List
		orderedlist: {
			exec: function () {
				fixFirefoxListBug(this);
				this.execCommand('insertorderedlist');
			},
			tooltip: 'Numbered list'
		},
		// END_COMMAND
		// START_COMMAND: Indent
		indent: {
			state: function (parents, firstBlock) {
				// Only works with lists, for now
				// This is a nested list, so it will always work
				var	range, startParent, endParent,
					$firstBlock = $(firstBlock),
					parentLists = $firstBlock.parents('ul,ol,menu'),
					parentList  = parentLists.first();

				// in case it's a list with only a single <li>
				if (parentLists.length > 1 ||
					parentList.children().length > 1) {
					return 0;
				}

				if ($firstBlock.is('ul,ol,menu')) {
					// if the whole list is selected, then this must be
					// invalidated because the browser will place a
					// <blockquote> there
					range = this.getRangeHelper().selectedRange();

					if (window.Range && range instanceof Range) {
						startParent = range.startContainer.parentNode;
						endParent   = range.endContainer.parentNode;

// TODO: could use nodeType for this?
// Maybe just check the firstBlock contains both the start and end containers
						// Select the tag, not the textNode
						// (that's why the parentNode)
						if (startParent !==
							startParent.parentNode.firstElementChild ||
							// work around a bug in FF
							($(endParent).is('li') && endParent !==
								endParent.parentNode.lastElementChild)) {
							return 0;
						}
					// it's IE... As it is impossible to know well when to
					// accept, better safe than sorry
					} else {
						return $firstBlock.is('li,ul,ol,menu') ? 0 : -1;
					}
				}

				return -1;
			},
			exec: function () {
				var editor = this,
					$elm   = $(editor.getRangeHelper().getFirstBlockParent());

				editor.focus();

				// An indent system is quite complicated as there are loads
				// of complications and issues around how to indent text
				// As default, let's just stay with indenting the lists,
				// at least, for now.
				if ($elm.parents('ul,ol,menu')) {
					editor.execCommand('indent');
				}
			},
			tooltip: 'Add indent'
		},
		// END_COMMAND
		// START_COMMAND: Outdent
		outdent: {
			state: function (parents, firstBlock) {
				return $(firstBlock).is('ul,ol,menu') ||
					$(firstBlock).parents('ul,ol,menu').length > 0 ? 0 : -1;
			},
			exec: function () {
				var	editor = this,
					$elm   = $(editor.getRangeHelper().getFirstBlockParent());

				if ($elm.parents('ul,ol,menu')) {
					editor.execCommand('outdent');
				}
			},
			tooltip: 'Remove one indent'
		},
		// END_COMMAND

		// START_COMMAND: Table
		table: {
			forceNewLineAfter: ['table'],
			exec: function (caller) {
				var	editor  = this,
					content = _tmpl('table', {
						rows: editor._('Rows:'),
						cols: editor._('Cols:'),
						insert: editor._('Insert')
					}, true);

				content.find('.button').click(function (e) {
					var	row, col,
						rows = content.find('#rows').val() - 0,
						cols = content.find('#cols').val() - 0,
						html = '<table>';

					if (rows < 1 || cols < 1) {
						return;
					}

					for (row = 0; row < rows; row++) {
						html += '<tr>';

						for (col = 0; col < cols; col++) {
							html += '<td>' +
									(IE_BR_FIX ? '' : '<br />') +
								'</td>';
						}

						html += '</tr>';
					}

					html += '</table>';

					editor.wysiwygEditorInsertHtml(html);
					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, 'inserttable', content);
			},
			tooltip: 'Insert a table'
		},
		// END_COMMAND

		// START_COMMAND: Horizontal Rule
		horizontalrule: {
			exec: 'inserthorizontalrule',
			tooltip: 'Insert a horizontal rule'
		},
		// END_COMMAND

		// START_COMMAND: Code
		code: {
			forceNewLineAfter: ['code'],
			exec: function () {
				this.wysiwygEditorInsertHtml(
					'<code>',
					(IE_BR_FIX ? '' : '<br />') + '</code>'
				);
			},
			tooltip: 'Code'
		},
		// END_COMMAND

		// START_COMMAND: Image
		image: {
			exec: function (caller) {
				var	editor  = this,
					content = _tmpl('image', {
						url: editor._('URL:'),
						width: editor._('Width (optional):'),
						height: editor._('Height (optional):'),
						insert: editor._('Insert')
					}, true);

				content.find('.button').click(function (e) {
					var	val    = content.find('#image').val(),
						width  = content.find('#width').val(),
						height = content.find('#height').val(),
						attrs  = '';

					if (width) {
						attrs += ' width="' + width + '"';
					}

					if (height) {
						attrs += ' height="' + height + '"';
					}

					if (val) {
						editor.wysiwygEditorInsertHtml(
							'<img' + attrs + ' src="' + val + '" />'
						);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, 'insertimage', content);
			},
			tooltip: 'Insert an image'
		},
		// END_COMMAND

		// START_COMMAND: E-mail
		email: {
			exec: function (caller) {
				var	editor  = this,
					content = _tmpl('email', {
						label: editor._('E-mail:'),
						desc: editor._('Description (optional):'),
						insert: editor._('Insert')
					}, true);

				content.find('.button').click(function (e) {
					var val         = content.find('#email').val(),
						description = content.find('#des').val();

					if (val) {
						// needed for IE to reset the last range
						editor.focus();

						if (!editor.getRangeHelper().selectedHtml() ||
							description) {
							description = description || val;

							editor.wysiwygEditorInsertHtml(
								'<a href="' + 'mailto:' + val + '">' +
									description +
								'</a>'
							);
						} else {
							editor.execCommand('createlink', 'mailto:' + val);
						}
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, 'insertemail', content);
			},
			tooltip: 'Insert an email'
		},
		// END_COMMAND

		// START_COMMAND: Link
		link: {
			exec: function (caller) {
				var url, text;
				var editor  = this;
				var content = _tmpl('link', {
					url: editor._('URL:'),
					desc: editor._('Description (optional):'),
					ins: editor._('Insert')
				}, true);
				var $link = content.find('#link');
				var $description = content.find('#des');

				function insertUrl(e) {
					url  = $link.val();
					text = $description.val();

					if (url) {
						// needed for IE to restore the last range
						editor.focus();

						// If there is no selected text then must set the URL as
						// the text. Most browsers do this automatically, sadly
						// IE doesn't.
						if (!editor.getRangeHelper().selectedHtml() || text) {
							text = text || url;

							editor.wysiwygEditorInsertHtml(
								'<a href="' + url + '">' + text + '</a>'
							);
						} else {
							editor.execCommand('createlink', url);
						}
					}

					editor.closeDropDown(true);
					e.preventDefault();
				}

				content.find('.button').click(insertUrl);

				$link.add($description).keypress(function (e) {
					// 13 = enter key
					if (e.which === 13 && $link.val()) {
						insertUrl(e);
					}
				});

				editor.createDropDown(caller, 'insertlink', content);
			},
			tooltip: 'Insert a link'
		},
		// END_COMMAND

		// START_COMMAND: Unlink
		unlink: {
			state: function () {
				var $current = $(this.currentNode());
				return $current.is('a') ||
					$current.parents('a').length > 0 ? 0 : -1;
			},
			exec: function () {
				var	$current = $(this.currentNode()),
					$anchor  = $current.is('a') ? $current :
						$current.parents('a').first();

				if ($anchor.length) {
					$anchor.replaceWith($anchor.contents());
				}
			},
			tooltip: 'Unlink'
		},
		// END_COMMAND


		// START_COMMAND: Quote
		quote: {
			forceNewLineAfter: ['blockquote'],
			exec: function (caller, html, author) {
				var	before = '<blockquote>',
					end    = '</blockquote>';

				// if there is HTML passed set end to null so any selected
				// text is replaced
				if (html) {
					author = (author ? '<cite>' + author + '</cite>' : '');
					before = before + author + html + end;
					end    = null;
				// if not add a newline to the end of the inserted quote
				} else if (this.getRangeHelper().selectedHtml() === '') {
					end = (IE_BR_FIX ? '' : '<br />') + end;
				}

				this.wysiwygEditorInsertHtml(before, end);
			},
			tooltip: 'Insert a Quote'
		},
		// END_COMMAND

		// START_COMMAND: Emoticons
		emoticon: {
			exec: function (caller) {
				var editor = this;

				var createContent = function (includeMore) {
					var	$moreLink,
						emoticonsCompat = editor.opts.emoticonsCompat,
						rangeHelper     = editor.getRangeHelper(),
						startSpace      = emoticonsCompat &&
							rangeHelper.getOuterText(true, 1) !== ' ' ?
							' ' : '',
						endSpace        = emoticonsCompat &&
							rangeHelper.getOuterText(false, 1) !== ' ' ?
							' ' : '',
						$content        = $('<div />'),
						$line           = $('<div />').appendTo($content),
						perLine         = 0,
						emoticons       = $.extend(
							{},
							editor.opts.emoticons.dropdown,
							includeMore ? editor.opts.emoticons.more : {}
						);

					$.each(emoticons, function () {
						perLine++;
					});
					perLine = Math.sqrt(perLine);

					$.each(emoticons, function (code, emoticon) {
						$line.append(
							$('<img />').attr({
								src: emoticon.url || emoticon,
								alt: code,
								title: emoticon.tooltip || code
							}).click(function () {
								editor.insert(startSpace + $(this).attr('alt') +
									endSpace, null, false).closeDropDown(true);

								return false;
							})
						);

						if ($line.children().length >= perLine) {
							$line = $('<div />').appendTo($content);
						}
					});

					if (!includeMore && editor.opts.emoticons.more) {
						$moreLink = $(
							'<a class="sceditor-more">' +
								editor._('More') + '</a>'
						).click(function () {
							editor.createDropDown(
								caller,
								'more-emoticons',
								createContent(true)
							);

							return false;
						});

						$content.append($moreLink);
					}

					return $content;
				};

				editor.createDropDown(
					caller,
					'emoticons',
					createContent(false)
				);
			},
			txtExec: function (caller) {
				defaultCommnds.emoticon.exec.call(this, caller);
			},
			tooltip: 'Insert an emoticon'
		},
		// END_COMMAND

		// START_COMMAND: YouTube
		youtube: {
			_dropDown: function (editor, caller, handleIdFunc) {
				var	matches,
					content = _tmpl('youtubeMenu', {
						label: editor._('Video URL:'),
						insert: editor._('Insert')
					}, true);

				content.find('.button').click(function (e) {
					var val = content
						.find('#link')
						.val();

					if (val) {
						matches = val.match(
							/(?:v=|v\/|embed\/|youtu.be\/)(.{11})/
						);

						if (matches) {
							val = matches[1];
						}

						if (/^[a-zA-Z0-9_\-]{11}$/.test(val)) {
							handleIdFunc(val);
						} else {
							/*global alert:false*/
							alert('Invalid YouTube video');
						}
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, 'insertlink', content);
			},
			exec: function (caller) {
				var editor = this;

				defaultCommnds.youtube._dropDown(
					editor,
					caller,
					function (id) {
						editor.wysiwygEditorInsertHtml(_tmpl('youtube', {
							id: id
						}));
					}
				);
			},
			tooltip: 'Insert a YouTube video'
		},
		// END_COMMAND

		// START_COMMAND: Date
		date: {
			_date: function (editor) {
				var	now   = new Date(),
					year  = now.getYear(),
					month = now.getMonth() + 1,
					day   = now.getDate();

				if (year < 2000) {
					year = 1900 + year;
				}

				if (month < 10) {
					month = '0' + month;
				}

				if (day < 10) {
					day = '0' + day;
				}

				return editor.opts.dateFormat
					.replace(/year/i, year)
					.replace(/month/i, month)
					.replace(/day/i, day);
			},
			exec: function () {
				this.insertText(defaultCommnds.date._date(this));
			},
			txtExec: function () {
				this.insertText(defaultCommnds.date._date(this));
			},
			tooltip: 'Insert current date'
		},
		// END_COMMAND

		// START_COMMAND: Time
		time: {
			_time: function () {
				var	now   = new Date(),
					hours = now.getHours(),
					mins  = now.getMinutes(),
					secs  = now.getSeconds();

				if (hours < 10) {
					hours = '0' + hours;
				}

				if (mins < 10) {
					mins = '0' + mins;
				}

				if (secs < 10) {
					secs = '0' + secs;
				}

				return hours + ':' + mins + ':' + secs;
			},
			exec: function () {
				this.insertText(defaultCommnds.time._time());
			},
			txtExec: function () {
				this.insertText(defaultCommnds.time._time());
			},
			tooltip: 'Insert current time'
		},
		// END_COMMAND


		// START_COMMAND: Ltr
		ltr: {
			state: function (parents, firstBlock) {
				return firstBlock && firstBlock.style.direction === 'ltr';
			},
			exec: function () {
				var	editor = this,
					elm    = editor.getRangeHelper().getFirstBlockParent(),
					$elm   = $(elm);

				editor.focus();

				if (!elm || $elm.is('body')) {
					editor.execCommand('formatBlock', 'p');

					elm  = editor.getRangeHelper().getFirstBlockParent();
					$elm = $(elm);

					if (!elm || $elm.is('body')) {
						return;
					}
				}

				if ($elm.css('direction') === 'ltr') {
					$elm.css('direction', '');
				} else {
					$elm.css('direction', 'ltr');
				}
			},
			tooltip: 'Left-to-Right'
		},
		// END_COMMAND

		// START_COMMAND: Rtl
		rtl: {
			state: function (parents, firstBlock) {
				return firstBlock && firstBlock.style.direction === 'rtl';
			},
			exec: function () {
				var	editor = this,
					elm    = editor.getRangeHelper().getFirstBlockParent(),
					$elm   = $(elm);

				editor.focus();

				if (!elm || $elm.is('body')) {
					editor.execCommand('formatBlock', 'p');

					elm  = editor.getRangeHelper().getFirstBlockParent();
					$elm = $(elm);

					if (!elm || $elm.is('body')) {
						return;
					}
				}

				if ($elm.css('direction') === 'rtl') {
					$elm.css('direction', '');
				} else {
					$elm.css('direction', 'rtl');
				}
			},
			tooltip: 'Right-to-Left'
		},
		// END_COMMAND


		// START_COMMAND: Print
		print: {
			exec: 'print',
			tooltip: 'Print'
		},
		// END_COMMAND

		// START_COMMAND: Maximize
		maximize: {
			state: function () {
				return this.maximize();
			},
			exec: function () {
				this.maximize(!this.maximize());
			},
			txtExec: function () {
				this.maximize(!this.maximize());
			},
			tooltip: 'Maximize',
			shortcut: 'Ctrl+Shift+M'
		},
		// END_COMMAND

		// START_COMMAND: Source
		source: {
			state: function () {
				return this.sourceMode();
			},
			exec: function () {
				this.toggleSourceMode();
			},
			txtExec: function () {
				this.toggleSourceMode();
			},
			tooltip: 'View source',
			shortcut: 'Ctrl+Shift+S'
		},
		// END_COMMAND

		// this is here so that commands above can be removed
		// without having to remove the , after the last one.
		// Needed for IE.
		ignore: {}
	};

	return defaultCommnds;
});
