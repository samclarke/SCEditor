/**
 * @preserve SCEditor v1.2
 * http://www.samclarke.com/2011/07/sceditor/ 
 *
 * Copyright (C) 2011, Sam Clarke (samclarke.com)
 *
 * SCEditor is dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */

// ==ClosureCompiler==
// @output_file_name jquery.sceditor.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

(function ($)
{
	$.sceditor = function (el, options)
	{
		var base = this;

		/**
		 * The textarea element being replaced
		 * @private
		 */
		base.$textarea = $(el);
		base.textarea  = el;

		/**
		 * The div which contains the editor and toolbar
		 * @private
		 */
		base.editorContainer = null;

		/**
		 * The editors toolbar
		 * @private
		 */
		base.$toolbar = null;

		/**
		 * The editors iframe which should be in design mode
		 * @private
		 */
		base.$wysiwygEditor = null;
		base.wysiwygEditor  = null;

		/**
		 * The editors textarea for viewing source
		 * @private
		 */
		base.$textEeditor = null;

		/**
		 * The current dropdown
		 * @private
		 */
		base.$dropdown               = null;
		base.dropdownIgnoreLastClick = false;

		/**
		 * Array of all the commands key press functions
		 * @private
		 */
		base.keyPressFuncs = [];
		
		/**
		 * Store the last cursor position. Needed for IE because it forgets
		 * @private
		 */
		base.lastRange = null;

		/**
		 * Stores a cache of preloaded images
		 * @private
		 */
		base.preLoadCache = [];

		/**
		 * All the commands supported by the editor
		 */
		base.commands = {
			bold: {
				execCommand: "bold",
				tooltip: "Bold"
			},
			italic: {
				execCommand: "italic",
				tooltip: "Italic"
			},
			underline: {
				execCommand: "underline",
				tooltip: "Underline"
			},
			strike: {
				execCommand: "strikethrough",
				tooltip: "Strikethrough"
			},
			subscript: {
				execCommand: "subscript",
				tooltip: "Subscript"
			},
			superscript: {
				execCommand: "superscript",
				tooltip: "Superscript"
			},


			left: {
				execCommand: "justifyleft",
				tooltip: "Align left"
			},
			center: {
				execCommand: "justifycenter",
				tooltip: "Center"
			},
			right: {
				execCommand: "justifyright",
				tooltip: "Align right"
			},
			justify: {
				execCommand: "justifyfull",
				tooltip: "Justify"
			},


			font: {
				execFunction: function(caller)
				{
					var fonts   = base.options.fonts.split(",");
					var content = $("<span />");

					for(var i=0; i < fonts.length; i++)
					{
						content.append(
							$('<a class="sceditor-font-option"><font face="' + fonts[i] + '">' + fonts[i] + '</font></a>')
								.data('sceditor-font', fonts[i])
								.click(function(e)
								{
									base.execCommand("fontname", $(this).data('sceditor-font'));
									base.closeDropDown();
									base.focus();
									e.preventDefault();
								}));
					}

					base.createDropDown(caller, "font-picker", content);
				},
				tooltip: "Font Name"
			},
			size: {
				execFunction: function(caller)
				{
					var content = $("<span />");
					for(var i=1; i<= 7; i++)
					{
						content.append(
							$('<a class="sceditor-fontsize-option"><font size="' + i + '">' + i + '</font></a>')
								.data('sceditor-fontsize', i)
								.click(function(e)
								{
									base.execCommand("fontsize", $(this).data('sceditor-fontsize'));
									base.closeDropDown();
									base.focus();
									e.preventDefault();
								}));
					}

					base.createDropDown(caller, "fontsize-picker", content);
				},
				tooltip: "Font Size"
			},
			color: {
				execFunction: function(caller)
				{
					var genColor     = {r: 255, g: 255, b: 255};
					var content      = $("<span />");
					var colorColumns = base.options.colors?base.options.colors.split("|"):new Array(21);

					for(var i=0; i < colorColumns.length; i++)
					{
						var line   = $('<div class="sceditor-color-column" />');
						var colors = (typeof colorColumns[i] != "undefined")?colorColumns[i].split(","):new Array(21);

						for(var x=0; x < colors.length; x++)
						{
							// use pre defined colour if can otherwise use the generated color
							var color = (typeof colors[x] != "undefined")?colors[x]:"#" + genColor.r.toString(16) + genColor.g.toString(16) + genColor.b.toString(16);

							line.append(
								$(document.createElement("a"))
									.css({background: color})
									.addClass("sceditor-color-option")
									.data("sceditor-color", color)
									.click(function(e)
									{
										base.execCommand("forecolor", $(this).data('sceditor-color'));
										base.closeDropDown();
										base.focus();
										e.preventDefault();
									}));

							// calculate the next generated color
							if(x%5==0)
								genColor = {r: genColor.r, g: genColor.g-51, b: 255};
							else
								genColor = {r: genColor.r, g: genColor.g, b: genColor.b-51};
						}

						content.append(line);

						// calculate the next generated color
						if(i%5==0)
							genColor = {r: genColor.r-51, g: 255, b: 255};
						else
							genColor = {r: genColor.r, g: 255, b: 255};
					}

					base.createDropDown(caller, "color-picker", content);
				},
				tooltip: "Font Color"
			},
			removeformat: {
				execCommand: "removeformat",
				tooltip: "Remove Formatting"
			},


			cut: {
				execCommand: "cut",
				tooltip: "Cut",
				errorMessage: "Your browser dose not allow the cut command. Please use the keyboard shortcut Ctrl/Cmd-X"
			},
			copy: {
				execCommand: "copy",
				tooltip: "Copy",
				errorMessage: "Your browser dose not allow the copy command. Please use the keyboard shortcut Ctrl/Cmd-C"
			},
			paste: {
				execCommand: "paste",
				tooltip: "Paste",
				errorMessage: "Your browser dose not allow the paste command. Please use the keyboard shortcut Ctrl/Cmd-V"
			},
			pastetext: {
				execFunction: function(caller)
				{
					var content = $('<form><div><label for="txt">Paste your text inside the following\
								 box:</label> <textarea cols="20" rows="7" id="txt"></textarea>\
								</div></form>')
						.submit(function() {return false;});

					content.append($('<div><input type="button" value="Insert" /></div>').click(function(e)
					{
						base.wysiwygEditorInsertText($(this).parent("form").find("#txt").val());
						base.closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					base.createDropDown(caller, "pastetext", content);
				},
				tooltip: "Paste Text"
			},


			bulletlist: {
				execCommand: "insertunorderedlist",
				tooltip: "Bullet list"
			},
			orderedlist: {
				execCommand: "insertorderedlist",
				tooltip: "Numbered list"
			},


			undo: {
				execCommand: "undo",
				tooltip: "Undo"
			},
			redo: {
				execCommand: "redo",
				tooltip: "Redo"
			},


			table: {
				execFunction: function(caller)
				{
					var content = $('<form>\
						<div><label for="rows">Rows:</label><input type="text" id="rows" value="2" /></div>\
						<div><label for="cols">Cols:</label><input type="text" id="cols" value="2" /></div>\
						</form>')
						.submit(function() {return false;});

					content.append($('<div><input type="button" value="Insert" /></div>').click(function(e)
					{
						var rows = $(this).parent("form").find("#rows").val() - 0;
						var cols = $(this).parent("form").find("#cols").val() - 0;

						var html = '<table>';
						for(var row=0; row < rows; row++)
						{
							html += '<tr>';
							for(var col=0; col < cols; col++)
							{
								if($.browser.msie)
									html += '<td></td>';
								else
									html += '<td><br class="sceditor-ignore" /></td>';
							}
							html += '</tr>';
						}
						html += '</table>';

						base.wysiwygEditorInsertHtml(html);

						base.closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					base.createDropDown(caller, "inserttable", content);
				},
				tooltip: "Insert a table"
			},


			horizontalrule: {
				execCommand: "inserthorizontalrule",
				tooltip: "Insert a horizontal rule"
			},
			code: {
				execFunction: function(caller)
				{
					base.wysiwygEditorInsertHtml('<code>', '<br /></code>');
				},
				tooltip: "Code"
			},
			image: {
				execFunction: function(caller)
				{
					var content = $('<form><div><label for="link">URL:</label> <input type="text" id="image" value="http://" /></div></form>')
						.submit(function() {return false;});

					content.append($('<div><input type="button" value="Insert" /></div>').click(function(e)
					{
						var val = $(this).parent("form").find("#image").val();

						if(val != "" && val != "http://")
							base.wysiwygEditorInsertHtml('<img src="' + val + '" />');
							// IE8 selects the image if use insertimage so using wysiwygEditorInsertHtml
							// to fix.
							//base.execCommand("insertimage", val);

						base.closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					base.createDropDown(caller, "insertimage", content);
				},
				tooltip: "Insert an image"
			},
			email: {
				execFunction: function(caller)
				{
					var content = $('<form><div><label for="email">E-mail:</label> <input type="text" id="email" value="" /></div></form>')
						.submit(function() {return false;});

					content.append($('<div><input type="button" value="Insert" /></div>').click(function(e)
					{
						var val = $(this).parent("form").find("#email").val();

						if(val != "")
						{
							// needed for IE to reset the last range
							base.focus();

							if(base.getWysiwygSelection().type == "None"
								|| base.getWysiwygSelection().type == "Caret")
								base.wysiwygEditorInsertHtml('<a href="' + 'mailto:' + val + '">' + val + '</a>');
							else
								base.execCommand("createlink", 'mailto:' + val);
						}

						base.closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					base.createDropDown(caller, "insertemail", content);
				},
				tooltip: "Insert an email"
			},
			link: {
				execFunction: function(caller)
				{
					var content = $('<form><div><label for="link">URL:</label> <input type="text" id="link" value="http://" /></div></form>')
						.submit(function() {return false;});

					content.append($('<div><input type="button" value="Insert" /></div>').click(function(e)
					{
						var val = $(this).parent("form").find("#link").val();

						if(val != "" && val != "http://")
						{
							// needed for IE to reset the last range
							base.focus();

							if(base.getWysiwygSelection().type == "None"
								|| base.getWysiwygSelection().type == "Caret")
								base.wysiwygEditorInsertHtml('<a href="' + val + '">' + val + '</a>');
							else
								base.execCommand("createlink", val);
						}

						base.closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					base.createDropDown(caller, "insertlink", content);
				},
				tooltip: "Insert a link"
			},
			unlink: {
				execCommand: "unlink",
				tooltip: "Unlink"
			},

			quote: {
				execFunction: function(caller)
				{
					base.wysiwygEditorInsertHtml('<blockquote>', '<br /></blockquote>');
				},
				tooltip: "Insert a Quote"
			},

			emoticon: {
				execFunction: function(caller) {
					var content = $('<div />');
					var line    = $('<div />');
					var more    = $('<div />');

					$.each(base.options.emoticons.dropdown, function(code, emoticon) {
						line.append($('<img src="' + emoticon + '" />')
							.data('sceditor-emoticon', code)
							.click(function(e) {
								$(this).data('sceditor-emoticon');
								base.wysiwygEditorInsertHtml('<img src="' + $(this).attr("src") + '" data-sceditor-emoticon="' + $(this).data('sceditor-emoticon') + '" />');

								base.closeDropDown();
								base.focus();
								e.preventDefault();
							}));

						if(line.children().length > 3)
						{
							content.append(line);
							line = $('<div />');
						}
					});

					if(line.children().length > 0)
						content.append(line);

					if(typeof base.options.emoticons.more != "undefined")
					{
						var more = $('<a class="sceditor-more">More</a>')
							.click(function () {
								var emoticons = $.extend({}, base.options.emoticons.dropdown, base.options.emoticons.more);
								content       = $('<div />');

								$.each(emoticons, function(code, emoticon) {
									line.append($('<img src="' + emoticon + '" />')
									.data('sceditor-emoticon', code)
									.click(function(e) {
										$(this).data('sceditor-emoticon');
										base.wysiwygEditorInsertHtml('<img src="' + $(this).attr("src") + '" data-sceditor-emoticon="' + $(this).data('sceditor-emoticon') + '" />');

										base.closeDropDown();
										base.focus();
										e.preventDefault();
									}));

									if(line.children().length > 4)
									{
										content.append(line);
										line = $('<div />');
									}
								});

								if(line.children().length > 0)
									content.append(line);

								base.createDropDown(caller, "insertemoticon", content);
							});

						content.append(more);
					}

					base.createDropDown(caller, "insertemoticon", content);
				},
				keyPress: function(e)
				{
					var range = null;

					if(base.wysiwygEditor.contentWindow
						&& base.wysiwygEditor.contentWindow.getSelection)
						range = base.wysiwygEditor.contentWindow.getSelection().getRangeAt(0);

					if(range == null)
						return;

					var emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown);
					$.each(emoticons, function(key, url)
					{
						var chars = "";
						if(range.startContainer)
						{
							var len   = key.length - 1;
							var start = (range.startOffset>len?range.startOffset-len:0);
							var end   = (range.startOffset>len?len:range.startOffset);

							chars = range.startContainer.textContent.substr(start, end);
						}

						chars += String.fromCharCode(e.which);
						if(chars == key)
						{
							range.setStart(range.startContainer, start);
							range.deleteContents();

							base.wysiwygEditorInsertHtml('<img src="' + url + '" data-sceditor-emoticon="' + key + '" />');

							e.preventDefault();
							e.stopPropagation();
							return false;
						}
					});
				},
				tooltip: "Insert an emoticon"
			},
			date: {
				execFunction: function(caller) {
					var now   = new Date();
					var year  = now.getYear();
					var month = now.getMonth();
					var day   = now.getDate();

					if(year < 2000)
						year = 1900 + year;
					if(month < 10)
						month = "0" + month;
					if(day < 10)
						day = "0" + day;

					base.wysiwygEditorInsertHtml('<span>' + year + '-' + month + '-' + day + '</span>');
				},
				tooltip: "Insert current date"
			},
			time: {
				execFunction: function(caller) {
					var now   = new Date();
					var hours = now.getHours();
					var mins  = now.getMinutes();
					var secs  = now.getSeconds();

					if(hours < 10)
						hours = "0" + hours;
					if(mins < 10)
						mins = "0" + mins;
					if(secs < 10)
						secs = "0" + secs;

					base.wysiwygEditorInsertHtml('<span>' + hours + ':' + mins + ':' + secs + '</span>');
				},
				tooltip: "Insert current time"
			},


			print: {
				execCommand: "print",
				tooltip: "Print"
			},
			source: {
				execFunction: function(caller)
				{
					base.toggleTextMode();
				},
				tooltip: "View source"
			}
		};


		/**
		 * Initializer. Creates the editor iframe and textarea
		 */
		base.init = function()
		{
			base.$textarea.data("sceditor", base);
			base.options = $.extend({}, $.sceditor.defaultOptions, options);

			if(base.options.height != null)
				base.$textarea.height(base.options.height);
			if(base.options.width != null)
				base.$textarea.width(base.options.width);

			base.editorContainer = $('<div class="sceditor-container" />')
						.height(base.$textarea.outerHeight())
						.width(base.$textarea.outerWidth());
			base.$textarea.after(base.editorContainer);

			// create the editor 
			base.initToolBar();
			base.initEditor();
			base.initKeyPressFuncs();

			base.$textarea.parents("form").submit(function() {
				if(base.$textEeditor.is(':visible'))
					base.toggleTextMode();

				base.$textarea.val(base.getWysiwygEditorValue());
			});

			$(document).click(base.documentClickHandler);

			// lead any textarea value into the editor
			var val = base.$textarea.hide().val();

			// Pass the value though the getTextHandler if it is set so that
			// BBCode, ect. can be converted
			if(base.options.getTextHandler)
				val = base.options.getTextHandler(val);

			base.setWysiwygEditorValue(val);
			base.preLoadEmoticons();
		};

		/**
		 * Creates the editor iframe and textarea
		 */
		base.initEditor = function()
		{
			var height, width;
			var editorHeight = base.$textarea.height() - (base.options.toolbarContainer === null?base.$toolbar.outerHeight():0);
			var editorWidth = base.$textarea.width();

			base.$textEeditor   = $('<textarea></textarea>')
						.hide()
						.height(editorHeight)
						.width(editorWidth);

			base.$wysiwygEditor = $(window.location.protocol !== "https:"
						? "<iframe></iframe>"
						: '<iframe src="javascript:false"></iframe>')
						.attr("frameborder", 0)
						.height(editorHeight)
						.width(editorWidth);

			// add the editor to the HTML and store the editors element
			base.editorContainer.append(base.$wysiwygEditor).append(base.$textEeditor);
			base.wysiwygEditor = base.$wysiwygEditor[0];

			// fix the height and width of the textarea/iframe
			height = base.$wysiwygEditor.height();
			width = base.$wysiwygEditor.width();
			base.$wysiwygEditor.height(height + ((height - base.$wysiwygEditor.outerHeight(true))/2));
			base.$wysiwygEditor.width(width + ((width - base.$wysiwygEditor.outerWidth(true))/2));

			height = base.$textEeditor.height();
			width = base.$textEeditor.width();
			base.$textEeditor.height(height + ((height - base.$textEeditor.outerHeight(true))/2));
			base.$textEeditor.width(width + ((width - base.$textEeditor.outerWidth(true))/2));

			// turn on design mode
			base.getWysiwygDoc().designMode = 'On';

			base.getWysiwygDoc().open();
			base.getWysiwygDoc().write(
				// add doctype?
				'<html><head><link rel="stylesheet" type="text/css" href="' + base.options.style + '" /></head>' +
				'<body></body></html>'
			);
			base.getWysiwygDoc().close();

			// set the key press event
			$(base.getWysiwygDoc()).find("body").keypress(base.handleKeyPress);
			$(base.getWysiwygDoc()).keypress(base.handleKeyPress);
			$(base.getWysiwygDoc()).mousedown(base.handleMouseDown);
			$(base.getWysiwygDoc()).bind("beforedeactivate keypress", base.saveRange);
		};

		/**
		 * Creates the toolbar and appends it to the container
		 */
		base.initToolBar = function()
		{
			base.$toolbar = $('<div class="sceditor-toolbar" />');
			var groups    = base.options.toolbar.split("|");
			for(var i=0; i < groups.length; i++)
			{
				var group   = $('<div class="sceditor-group" />');
				var buttons = groups[i].split(",");
				for(var x=0; x < buttons.length; x++)
				{
					// the button must be a valid command otherwise ignore it
					if(!base.commands.hasOwnProperty(buttons[x]))
						continue;

					var button = $('<a class="sceditor-button sceditor-button-' + buttons[x] + ' "><div /></a>');

					if(base.commands[buttons[x]].hasOwnProperty("tooltip"))
						button.attr('title', base.commands[buttons[x]].tooltip);

					// add the click handler for the button
					button.data("sceditor-command", buttons[x]);
					button.click(function(e) {
						base.handleCommand($(this), base.commands[$(this).data("sceditor-command")]);
						e.preventDefault();
					});

					group.append(button);
				}

				base.$toolbar.append(group);
			}

			// append the toolbar to the toolbarContainer option if given
			if(base.options.toolbarContainer === null)
				base.editorContainer.append(base.$toolbar);
			else
				$(base.options.toolbarContainer).append(base.$toolbar);
		};

		/**
		 * Creates an array of all the key press functions
		 * like emoticons, ect.
		 */
		base.initKeyPressFuncs = function()
		{
			$.each(base.commands, function(command, values)
			{
				if(typeof values.keyPress != "undefined")
					base.keyPressFuncs.push(values.keyPress);
			});
		};

		/**
		 * Preloads the emoticon images
		 * Idea from: http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript
		 */
		base.preLoadEmoticons = function()
		{
			var emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown);

			$.each(emoticons, function(key, url)
			{
				var emoticon = document.createElement('img');
	     			emoticon.src = url;
				base.preLoadCache.push(emoticon);
			});
		};

		/**
		 * Creates a menu item drop down
		 */
		base.createDropDown = function(menuItem, dropDownName, content)
		{
			if(base.$dropdown != null)
				base.closeDropDown();

			var menuItemPosition = menuItem.position();

			base.$dropdown = $('<div class="sceditor-dropdown sceditor-' + dropDownName + '" />')
						.css({top: menuItemPosition.top, left: menuItemPosition.left})
						.append(content);

			base.editorContainer.after(base.$dropdown);
			base.dropdownIgnoreLastClick = true;

			// stop clicks within the dropdown from being handled
			base.$dropdown.click(function(e) {
				e.stopPropagation();
			});
		};

		/**
		 * Handles any document click and closes the dropdown if open
		 */
		base.documentClickHandler = function()
		{
			if(!base.dropdownIgnoreLastClick)
				base.closeDropDown();

			base.dropdownIgnoreLastClick = false;
		}

		/**
		 * Closes the current drop down
		 */
		base.closeDropDown = function()
		{
			if(base.$dropdown != null)
			{
				base.$dropdown.remove();
				base.$dropdown = null;
			}
		}

		/**
		 * Gets the WYSIWYG editors document
		 */
		base.getWysiwygDoc = function()
		{
			if (base.wysiwygEditor.contentDocument)
				return base.wysiwygEditor.contentDocument;

			if (base.wysiwygEditor.contentWindow && base.wysiwygEditor.contentWindow.document)
				return base.wysiwygEditor.contentWindow.document;

			if (base.wysiwygEditor.document)
				return base.wysiwygEditor.document;

			return null;
		};


		/**
		 * Inserts HTML into WYSIWYG editor. If endHtml is defined and some text is selected the
		 * selected text will be put inbetween html and endHtml. If endHtml isn't defined and some
		 * text is selected it will be replaced by the HTML
		 */
		base.wysiwygEditorInsertHtml = function(html, endHtml)
		{
			// don't apply to code elements
			if($(base.getWysiwygSelectedContainerNode()).is('code')
				|| $(base.getWysiwygSelectedContainerNode()).parents('code').length !== 0)
				return;

			base.focus();
			if(typeof endHtml != "undefined")
				html = html + base.getWysiwygSelectedHtml() + endHtml;

			if (base.getWysiwygDoc().getSelection)
			{
				var range          = base.getWysiwygSelection();
				var htmlNode       = base.getWysiwygDoc().createElement('div');
				htmlNode.innerHTML = html;
				htmlNode           = htmlNode.children[0];

				range.deleteContents();
				range.insertNode(htmlNode);
				range = range.cloneRange();

				// move the cursor to the end of the insertion
				range.setStartAfter(htmlNode);

				// change current range
				base.wysiwygEditor.contentWindow.getSelection().removeAllRanges();
				base.wysiwygEditor.contentWindow.getSelection().addRange(range);
			}
			else if (base.getWysiwygDoc().selection && base.getWysiwygDoc().selection.createRange)
				base.getWysiwygDoc().selection.createRange().pasteHTML(html);
			else
				base.execCommand("insertHtml", html);

			base.lastRange = null;
		};

		/**
		 * Like wysiwygEditorInsertHtml except it converts any HTML to text
		 */
		base.wysiwygEditorInsertText = function(text)
		{
			text = text.replace(/&/g, "&amp;");
			text = text.replace(/</g, "&lt;");
			text = text.replace(/>/g, "&gt;");
			text = text.replace(/ /g, "&nbsp;");
			text = text.replace(/\r\n|\r/g, "\n");
			text = text.replace(/\n/g, "<br />");
			base.wysiwygEditorInsertHtml(text);
		};

		/**
		 * Gets the current selection range from WYSIWYG editor
		 */
		base.getWysiwygSelection = function()
		{
			var range;

			if(base.wysiwygEditor.contentWindow
				&& base.wysiwygEditor.contentWindow.getSelection)
					range = base.wysiwygEditor.contentWindow.getSelection();
			else if(base.getWysiwygDoc().selection)
				range = base.getWysiwygDoc().selection;

			if(range.getRangeAt)
				return range.getRangeAt(0);
			else if (range.createRange)
				return range.createRange();

			return null;
		};

		/**
		 * Gets the currently selected HTML from WYSIWYG editor
		 */
		base.getWysiwygSelectedHtml = function()
		{
			var selection = base.getWysiwygSelection();

			if(selection === null)
				return '';

			// IE < 9
			if (document.selection && document.selection.createRange)
			{
				if(typeof selection.htmlText != 'undefined')
					return selection.htmlText;
				else if(selection.length >= 1)
					return selection.item(0).outerHTML;
			}

			// IE9+ and all other browsers
			if (window.getSelection && window.XMLSerializer)
			{
				//return new XMLSerializer().serializeToString(selection.cloneContents());
				var html = '';
				$(selection.cloneContents().childNodes).each(function()
				{
					html += new XMLSerializer().serializeToString(this);
				});
				return html;
			}
		};

		/**
		 * Gets the first node which contains all the selected elements
		 */
		base.getWysiwygSelectedContainerNode = function()
		{
			var selection = base.getWysiwygSelection();

			if(selection === null)
				return null;

			// IE < 9
			if (document.selection && document.selection.createRange)
				return selection.parentElement;

			// IE9+ and all other browsers
			if (window.getSelection && window.XMLSerializer)
				return selection.commonAncestorContainer;
		};

		/**
		 * Gets the WYSIWYG editors HTML which is between the body tags
		 */
		base.getWysiwygEditorValue = function()
		{
			var html = base.$wysiwygEditor.contents().find("body").html();

			if(base.options.getHtmlHandler)
				html = base.options.getHtmlHandler(html, base.$wysiwygEditor.contents().find("body"));

			return html;
		};

		/**
		 * Gets the text editor value
		 */
		base.getTextareaValue = function()
		{
			var val = base.$textEeditor.val();

			if(base.options.getTextHandler)
				val = base.options.getTextHandler(val);

			return val;
		};

		/**
		 * Sets the WYSIWYG HTML editor value. Should only be the HTML contained within the body tags
		 */
		base.setWysiwygEditorValue = function(value)
		{
			// convert any emoticons
			value = base.replaceEmoticons(value);

			base.getWysiwygDoc().body.innerHTML = value;
		};

		/**
		 * Sets the text editor value
		 */
		base.setTextareaValue = function(value)
		{
			base.$textEeditor.val(value);
		};

		/**
		 * Replaces any emoticon codes in the passed HTML with their emoticon images
		 */
		base.replaceEmoticons = function(html)
		{
			var emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown);

			$.each(emoticons, function(key, url) {
				// escape the key before using it as a regex
				// and append the regex to only find emoticons outside
				// of HTML tags
				var reg  = key.replace(/[\$\?\[\]\.\*\(\)\|]/g, "\\$&")
						.replace("<", "&lt;")
						.replace(">", "&gt;")
						+ "(?=([^\<\>]*?<|[^\<\>]*?$))";

				html = html.replace(new RegExp(reg, 'g'), '<img src="' + url + '" data-sceditor-emoticon="' + key + '" />');
			});

			return html;
		};

		/**
		 * switches between the WYSIWYG and plain text editor modes
		 */
		base.toggleTextMode = function()
		{
			if(base.$textEeditor.is(':visible'))
				base.setWysiwygEditorValue(base.getTextareaValue());
			else
				base.setTextareaValue(base.getWysiwygEditorValue());

			base.lastRange = null;
			base.$textEeditor.toggle();
			base.$wysiwygEditor.toggle();
		};

		/**
		 * Handles the passed command
		 */
		base.handleCommand = function(caller, command)
		{
			// run the commands execFunction if exists
			if(command.hasOwnProperty("execFunction"))
				command.execFunction(caller);
			else
				base.execCommand(command.execCommand, command.hasOwnProperty("execParam")?command.execParam:null);
		};

		/**
		 * Handles the passed command
		 */
		base.focus = function()
		{
			base.wysiwygEditor.contentWindow.focus();

			if(base.lastRange != null)
			{
				if (window.document.createRange)
					window.getSelection().addRange(base.lastRange);
				else if (window.document.selection)
					base.lastRange.select();
			}
		};

		/**
		 * Saves the current range. Needed for IE because it forgets
		 * where the cursor was and what was selected
		 */
		base.saveRange = function()
		{
			/* this is only needed for IE */
			if(!$.browser.msie)
				return;

			base.lastRange = base.getWysiwygSelection();
		};

		/**
		 * Executes a command on the WYSIWYG editor
		 */
		base.execCommand = function(command, param)
		{
			// don't apply any comannds to code elements
			if($(base.getWysiwygSelectedContainerNode()).is('code')
				|| $(base.getWysiwygSelectedContainerNode()).parents('code').length !== 0
				|| $(base.getWysiwygSelectedContainerNode()).find('code').length !== 0)
				return;

			var executed = false;

			base.focus();
			if(base.getWysiwygDoc())
			{
	    			try
				{
					executed = base.getWysiwygDoc().execCommand(command, false, param);
				}
				catch (e){alert("Error: " + e );}
			}

			if(!executed && typeof base.commands[command] != "undefined"
				&& typeof base.commands[command].errorMessage != "undefined")
				alert(base.commands[command].errorMessage);
		};

		/**
		 * Handles any key press in the WYSIWYG editor
		 */
		base.handleKeyPress = function(e)
		{
			base.closeDropDown();

			// don't apply to code elements
			if($(base.getWysiwygSelectedContainerNode()).is('code')
				|| $(base.getWysiwygSelectedContainerNode()).parents('code').length !== 0)
				return;

			// doing the below breaks lists sadly. Users of webkit
			// will just have to learn to hold shift when pressing
			// return to get a line break.
			// Return key. Needed for webkit as it doesn't insert
			// a br when pressed. It instead starts a new block
			// element of the previous type which is bad for the
			// quote and code tags.
			//if(e.which == 13 && $.browser.webkit)
			//{
			//	base.wysiwygEditorInsertHtml('<br />');
			//	return false;;
			//}

			$.each(base.keyPressFuncs, function(index, func)
			{
				func(e);
			});
		};

		base.handleMouseDown = function(e)
		{
			base.closeDropDown();
		};

		// run the initializer
		base.init();
	};

	$.sceditor.defaultOptions = {
		// Toolbar buttons order and groups. Should be comma seperated and have a bar | to seperate groups
		toolbar:	"bold,italic,underline,strike,subscript,superscript|left,center,right,justify|" +
				"font,size,color,removeformat|cut,copy,paste,pastetext|bulletlist,orderedlist|" +
				"undo,redo|table|code,quote|horizontalrule,image,email,link,unlink|emoticon,date,time|" +
				"print,source",

		// Stylesheet to include in the WYSIWYG editor. Will style the WYSIWYG elements
		style: "jquery.sceditor.default.css",

		// Comma seperated list of fonts for the font selector
		fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Georgia,Impact,Sans-serif,Serif,Times New Roman,Trebuchet MS,Verdana",

		// Colors should be comma seperated and have a bar | to signal a new column. If null the colors will be auto generated.
		colors: null,

		emoticons:	{
					dropdown: {
						":)": "emoticons/smile.png",
						":angel:": "emoticons/angel.png",
						":angry:": "emoticons/angry.png",
						"8-)": "emoticons/cool.png",
						":'(": "emoticons/cwy.png",
						":ermm:": "emoticons/ermm.png",
						":D": "emoticons/grin.png",
						"<3": "emoticons/heart.png",
						":(": "emoticons/sad.png",
						":O": "emoticons/shocked.png",
						":P": "emoticons/tongue.png",
						";)": "emoticons/wink.png"
					},
					more: {
						":alien:": "emoticons/alien.png",
						":blink:": "emoticons/blink.png",
						":blush:": "emoticons/blush.png",
						":cheerful:": "emoticons/cheerful.png",
						":devil:": "emoticons/devil.png",
						":dizzy:": "emoticons/dizzy.png",
						":getlost:": "emoticons/getlost.png",
						":happy:": "emoticons/happy.png",
						":kissing:": "emoticons/kissing.png",
						":ninja:": "emoticons/ninja.png",
						":pinch:": "emoticons/pinch.png",
						":pouty:": "emoticons/pouty.png",
						":sick:": "emoticons/sick.png",
						":sideways:": "emoticons/sideways.png",
						":silly:": "emoticons/silly.png",
						":sleeping:": "emoticons/sleeping.png",
						":unsure:": "emoticons/unsure.png",
						":woot:": "emoticons/w00t.png",
						":wassat:": "emoticons/wassat.png",
						":whistling:": "emoticons/whistling.png",
						":love:": "emoticons/wub.png"
					}
				},

		// Width of the editor. Set to null for automatic with
		width: null,

		// Height of the editor including toolbat. Set to null for automatic height
		height: null,

		getHtmlHandler: null,
		getTextHandler: null,

		toolbarContainer: null
	};

	$.fn.sceditor = function(options)
	{
		return this.each(function()
		{
			(new $.sceditor(this, options));
		});
	};

})(jQuery);
