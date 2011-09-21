/**
 * @preserve SCEditor v1.2.3
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

/*jshint forin: true, nomen: true, undef: true, white: false  */
/*global XMLSerializer: true, jQuery: true*/

(function ($) {
	'use strict';

	$.sceditor = function (el, options) {
		var base = this;

		/**
		 * The textarea element being replaced
		 * @private
		 */
		var $textarea = $(el);
		var textarea  = el;

		/**
		 * The div which contains the editor and toolbar
		 * @private
		 */
		var editorContainer = null;

		/**
		 * The editors toolbar
		 * @private
		 */
		var $toolbar = null;

		/**
		 * The editors iframe which should be in design mode
		 * @private
		 */
		var $wysiwygEditor = null;
		var wysiwygEditor  = null;

		/**
		 * The editors textarea for viewing source
		 * @private
		 */
		var $textEeditor = null;

		/**
		 * The current dropdown
		 * @private
		 */
		var $dropdown               = null;
		var dropdownIgnoreLastClick = false;

		/**
		 * Array of all the commands key press functions
		 * @private
		 */
		var keyPressFuncs = [];

		/**
		 * Store the last cursor position. Needed for IE because it forgets
		 * @private
		 */
		var lastRange = null;

		/**
		 * Stores a cache of preloaded images
		 * @private
		 */
		var preLoadCache = [];

		/**
		 * Stores the length of the longest emoticon code.
		 * Used to help speed up AYT emoticon converstion
		 * @private
		 */
		var longestEmoticonCode = null;

		/**
		 * Object with all the emoticon codes combined
		 * @private
		 */
		var allEmoticonCache = null;

		var	init,
			closeDropDown,
			createDropDown,
			wysiwygEditorInsertText,
			wysiwygEditorInsertHtml,
			getWysiwygSelectedContainerNode,
			getWysiwygSelection,
			replaceEmoticons,
			handleCommand,
			saveRange,
			handleKeyPress,
			handleMouseDown,
			initEditor,
			initToolBar,
			initKeyPressFuncs,
			initResize,
			documentClickHandler,
			preLoadEmoticons,
			getWysiwygDoc;

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
				execFunction: function (caller) {
					var fonts   = base.options.fonts.split(",");
					var content = $("<span />");
					var clickFunc = function (e) {
						base.execCommand("fontname", $(this).data('sceditor-font'));
						closeDropDown();
						base.focus();
						e.preventDefault();
					};

					for (var i=0; i < fonts.length; i++) {
						content.append(
							$('<a class="sceditor-font-option" href="#"><font face="' + fonts[i] + '">' + fonts[i] + '</font></a>')
								.data('sceditor-font', fonts[i])
								.click(clickFunc));
					}

					createDropDown(caller, "font-picker", content);
				},
				tooltip: "Font Name"
			},
			size: {
				execFunction: function (caller) {
					var content   = $("<span />");
					var clickFunc = function (e) {
						base.execCommand("fontsize", $(this).data('sceditor-fontsize'));
						closeDropDown();
						base.focus();
						e.preventDefault();
					};

					for (var i=1; i<= 7; i++) {
						content.append(
							$('<a class="sceditor-fontsize-option" href="#"><font size="' + i + '">' + i + '</font></a>')
								.data('sceditor-fontsize', i)
								.click(clickFunc));
					}

					createDropDown(caller, "fontsize-picker", content);
				},
				tooltip: "Font Size"
			},
			color: {
				execFunction: function (caller) {
					var genColor     = {r: 255, g: 255, b: 255};
					var content      = $("<span />");
					var colorColumns = base.options.colors?base.options.colors.split("|"):new Array(21);
						// IE is slow at string concation so use an array
					var html         = [];
					var htmlIndex    = 0;

					for (var i=0; i < colorColumns.length; ++i) {
						var colors = (typeof colorColumns[i] != "undefined")?colorColumns[i].split(","):new Array(21);

						html[htmlIndex++] = '<div class="sceditor-color-column">';

						for (var x=0; x < colors.length; ++x) {
							// use pre defined colour if can otherwise use the generated color
							var color = (typeof colors[x] != "undefined")?colors[x]:"#" + genColor.r.toString(16) + genColor.g.toString(16) + genColor.b.toString(16);

							html[htmlIndex++] = '<a href="#" class="sceditor-color-option" style="background-color: '+color+'" data-color="'+color+'"></a>';

							// calculate the next generated color
							if(x%5===0)
								genColor = {r: genColor.r, g: genColor.g-51, b: 255};
							else
								genColor = {r: genColor.r, g: genColor.g, b: genColor.b-51};
						}

						html[htmlIndex++] = '</div>';

						// calculate the next generated color
						if(i%5===0)
							genColor = {r: genColor.r-51, g: 255, b: 255};
						else
							genColor = {r: genColor.r, g: 255, b: 255};
					}

					content.append(html.join(''))
						.find('a')
						.click(function (e) {
							base.execCommand("forecolor", $(this).attr('data-color'));
							closeDropDown();
							base.focus();
							e.preventDefault();
						});

					createDropDown(caller, "color-picker", content);
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
				execFunction: function (caller) {
					var content = $('<form><div><label for="txt">Paste your text inside the following' +
								 'box:</label> <textarea cols="20" rows="7" id="txt"></textarea>' +
								'</div></form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						wysiwygEditorInsertText($(this).parent("form").find("#txt").val());
						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "pastetext", content);
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
				execFunction: function (caller) {
					var content = $('<form>' +
						'<div><label for="rows">Rows:</label><input type="text" id="rows" value="2" /></div>' +
						'<div><label for="cols">Cols:</label><input type="text" id="cols" value="2" /></div>' +
						'</form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						var rows = $(this).parent("form").find("#rows").val() - 0;
						var cols = $(this).parent("form").find("#cols").val() - 0;

						var html = '<table>';
						for (var row=0; row < rows; row++) {
							html += '<tr>';
							for (var col=0; col < cols; col++) {
								if($.browser.msie)
									html += '<td></td>';
								else
									html += '<td><br class="sceditor-ignore" /></td>';
							}
							html += '</tr>';
						}
						html += '</table>';

						wysiwygEditorInsertHtml(html);

						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "inserttable", content);
				},
				tooltip: "Insert a table"
			},


			horizontalrule: {
				execCommand: "inserthorizontalrule",
				tooltip: "Insert a horizontal rule"
			},
			code: {
				execFunction: function (caller) {
					wysiwygEditorInsertHtml('<code>', '<br /></code>');
				},
				tooltip: "Code"
			},
			image: {
				execFunction: function (caller) {
					var content = $('<form><div><label for="link">URL:</label> <input type="text" id="image" value="http://" /></div>' +
							'<div><label for="width">Width (optional):</label> <input type="text" id="width" size="2" /></div>' +
							'<div><label for="height">Height (optional):</label> <input type="text" id="height" size="2" /></div></form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						var $form  = $(this).parent("form");
						var val   = $form.find("#image").val();
						var attrs = '';
						var width, height;

						if((width = $form.find("#width").val()) !== "")
							attrs += ' width="' + width + '"';
						if((height = $form.find("#height").val()) !== "")
							attrs += ' height="' + height + '"';

						if(val !== "" && val !== "http://")
							wysiwygEditorInsertHtml('<img' + attrs + ' src="' + val + '" />');

						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "insertimage", content);
				},
				tooltip: "Insert an image"
			},
			email: {
				execFunction: function (caller) {
					var content = $('<form><div><label for="email">E-mail:</label> <input type="text" id="email" value="" /></div></form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						var val = $(this).parent("form").find("#email").val();

						if(val !== "") {
							// needed for IE to reset the last range
							base.focus();

							if(base.getWysiwygSelectedHtml() == '')
								wysiwygEditorInsertHtml('<a href="' + 'mailto:' + val + '">' + val + '</a>');
							else
								base.execCommand("createlink", 'mailto:' + val);
						}

						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "insertemail", content);
				},
				tooltip: "Insert an email"
			},
			link: {
				execFunction: function (caller) {
					var content = $('<form><div><label for="link">URL:</label> <input type="text" id="link" value="http://" /></div></form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						var val = $(this).parent("form").find("#link").val();

						if(val !== "" && val !== "http://") {
							// needed for IE to reset the last range
							base.focus();
console.log(val);
//http://localhost/Classes/SCEditor-punbb/punbb-1.3.5/viewtopic.php?pid=126#p126

							if(base.getWysiwygSelectedHtml() == '')
								wysiwygEditorInsertHtml('<a href="' + val + '">' + val + '</a>');
							else
								base.execCommand("createlink", val);
						}

						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "insertlink", content);
				},
				tooltip: "Insert a link"
			},
			unlink: {
				execCommand: "unlink",
				tooltip: "Unlink"
			},

			quote: {
				execFunction: function (caller) {
					wysiwygEditorInsertHtml('<blockquote>', '<br /></blockquote>');
				},
				tooltip: "Insert a Quote"
			},

			emoticon: {
				execFunction: function (caller) {
					var content = $('<div />');
					var line    = $('<div />');

					var appendEmoticon = function (code, emoticon) {
						line.append($('<img />', {
								src: emoticon,
								alt: code,
								click: function (e) {
									wysiwygEditorInsertHtml('<img src="' + $(this).attr("src") +
										'" data-sceditor-emoticon="' + $(this).attr('alt') + '" />');

									closeDropDown();
									base.focus();
									e.preventDefault();
								}
							}));

						if(line.children().length > 3) {
							content.append(line);
							line = $('<div />');
						}
					};

					$.each(base.options.emoticons.dropdown, appendEmoticon);

					if(line.children().length > 0)
						content.append(line);

					if(typeof base.options.emoticons.more !== "undefined") {
						var more = $('<a class="sceditor-more">More</a>').click(function () {
							var emoticons = $.extend({}, base.options.emoticons.dropdown, base.options.emoticons.more);
							content       = $('<div />');
							line          = $('<div />');

							$.each(emoticons, appendEmoticon);

							if(line.children().length > 0)
								content.append(line);

							createDropDown(caller, "insertemoticon", content);
						});

						content.append(more);
					}

					createDropDown(caller, "insertemoticon", content);
				},
				keyPress: function (e)
				{
					var	range = null,
						start = -1;

					if(wysiwygEditor.contentWindow && wysiwygEditor.contentWindow.getSelection)
						range = wysiwygEditor.contentWindow.getSelection().getRangeAt(0);

					if(range === null || !range.startContainer)
						return;

					if(allEmoticonCache === null)
						allEmoticonCache = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown, base.options.emoticons.hidden);

					if(longestEmoticonCode === null) {
						longestEmoticonCode = 0;
						$.each(allEmoticonCache, function (key, url) {
							if(key.length > longestEmoticonCode)
								longestEmoticonCode = key.length;
						});
					}

					// can't just use range.startContainer.textContent as it doesn't have the current
					// char included. Must add it into the string.
					var currentString = range.startContainer.textContent.substr(0, range.startOffset) +
								String.fromCharCode(e.which) +
								range.startContainer.textContent.substr(range.startOffset, longestEmoticonCode);

					$.each(allEmoticonCache, function (key, url) {
						if((start = currentString.indexOf(key)) > -1) {
							range = range.cloneRange();
							range.setStart(range.startContainer, start);
							range.setEnd(range.startContainer, start + (key.length - 1));
							range.deleteContents();

							var htmlNode       = getWysiwygDoc().createElement('div');
							htmlNode.innerHTML = '<img src="' + url + '" data-sceditor-emoticon="' + key + '" />';
							htmlNode           = htmlNode.children[0];

							range.insertNode(htmlNode);
							range = range.cloneRange();

							// move the cursor to the end of the insertion
							range.setStartAfter(htmlNode);

							// change current range
							wysiwygEditor.contentWindow.getSelection().removeAllRanges();
							wysiwygEditor.contentWindow.getSelection().addRange(range);


							e.preventDefault();
							e.stopPropagation();
							return false;
						}
					});
				},
				tooltip: "Insert an emoticon"
			},
			youtube: {
				execFunction: function (caller) {
					var content = $('<form><div><label for="link">Video URL:</label> <input type="text" id="link" value="http://" /></div></form>')
						.submit(function () {return false;});

					content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
						var val = $(this).parent("form").find("#link").val();

						if(val !== "" && val !== "http://") {
							// See http://www.abovetopsecret.com/forum/thread270269/pg1
							val = val.replace(/^[^v]+v.(.{11}).*/,"$1"); 
							wysiwygEditorInsertHtml('<iframe width="560" height="315" src="http://www.youtube.com/embed/' + val +
								'" data-youtube-id="' + val + '" frameborder="0" allowfullscreen></iframe>');
						}

						closeDropDown();
						base.focus();
						e.preventDefault();
					}));

					createDropDown(caller, "insertlink", content);
				},
				tooltip: "Insert a YouTube video"
			},
			date: {
				execFunction: function (caller) {
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

					wysiwygEditorInsertHtml('<span>' + year + '-' + month + '-' + day + '</span>');
				},
				tooltip: "Insert current date"
			},
			time: {
				execFunction: function (caller) {
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

					wysiwygEditorInsertHtml('<span>' + hours + ':' + mins + ':' + secs + '</span>');
				},
				tooltip: "Insert current time"
			},


			print: {
				execCommand: "print",
				tooltip: "Print"
			},
			source: {
				execFunction: function (caller) {
					base.toggleTextMode();
				},
				tooltip: "View source"
			}
		};


		/**
		 * Initializer. Creates the editor iframe and textarea
		 * @private
		 */
		init = function () {
			$textarea.data("sceditor", base);
			base.options = $.extend({}, $.sceditor.defaultOptions, options);

			if(base.options.height !== null)
				$textarea.height(base.options.height);
			if(base.options.width !== null)
				$textarea.width(base.options.width);

			editorContainer = $('<div />', {
				"class": "sceditor-container",
				height: $textarea.outerHeight(),
				width: $textarea.outerWidth()
			});
			$textarea.after(editorContainer);

			// create the editor 
			initToolBar();
			initEditor();
			initKeyPressFuncs();

			if(base.options.resizeEnabled)
				initResize();

			$textarea.parents("form").submit(base.updateFormTextareaValue);
			$(document).click(documentClickHandler);

			// load any textarea value into the editor
			var val = $textarea.hide().val();

			// Pass the value though the getTextHandler if it is set so that
			// BBCode, ect. can be converted
			if(base.options.getTextHandler)
				val = base.options.getTextHandler(val);

			base.setWysiwygEditorValue(val);
			preLoadEmoticons();
		};

		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		initEditor = function () {
			$textEeditor = $('<textarea></textarea>').hide();
			$wysiwygEditor = $("<iframe></iframe>", {
				frameborder: 0
			});

			if(window.location.protocol === "https:")
				$wysiwygEditor.attr("src", "javascript:false");

			// add the editor to the HTML and store the editors element
			editorContainer.append($wysiwygEditor).append($textEeditor);
			wysiwygEditor = $wysiwygEditor[0];

			setWidth($textarea.width());
			setHeight($textarea.height());

			// turn on design mode
			getWysiwygDoc().designMode = 'On';
			getWysiwygDoc().open();
			getWysiwygDoc().write(
				'<html><head><link rel="stylesheet" type="text/css" href="' + base.options.style + '" /></head>' +
				'<body></body></html>'
			);
			getWysiwygDoc().close();

			// set the key press event
			$(getWysiwygDoc()).find("body").keypress(handleKeyPress);
			$(getWysiwygDoc()).keypress(handleKeyPress);
			$(getWysiwygDoc()).mousedown(handleMouseDown);
			$(getWysiwygDoc()).bind("beforedeactivate keypress", saveRange);
		};

		/**
		 * Creates the toolbar and appends it to the container
		 * @private
		 */
		initToolBar = function () {
			var buttonClick = function (e) {
				handleCommand($(this), base.commands[$(this).data("sceditor-command")]);
				e.preventDefault();
			};

			$toolbar   = $('<div class="sceditor-toolbar" />');
			var groups = base.options.toolbar.split("|");

			for (var i=0; i < groups.length; i++) {
				var group   = $('<div class="sceditor-group" />');
				var buttons = groups[i].split(",");

				for (var x=0; x < buttons.length; x++) {
					// the button must be a valid command otherwise ignore it
					if(!base.commands.hasOwnProperty(buttons[x]))
						continue;

					var button = $('<a class="sceditor-button sceditor-button-' + buttons[x] + ' " unselectable="on"><div /></a>');

					if(base.commands[buttons[x]].hasOwnProperty("tooltip"))
						button.attr('title', base.commands[buttons[x]].tooltip);

					// add the click handler for the button
					button.data("sceditor-command", buttons[x]);
					button.click(buttonClick);

					group.append(button);
				}

				$toolbar.append(group);
			}

			// append the toolbar to the toolbarContainer option if given
			if(base.options.toolbarContainer === null)
				editorContainer.append($toolbar);
			else
				$(base.options.toolbarContainer).append($toolbar);
		};

		/**
		 * Creates an array of all the key press functions
		 * like emoticons, ect.
		 * @private
		 */
		initKeyPressFuncs = function () {
			$.each(base.commands, function (command, values) {
				if(typeof values.keyPress != "undefined")
					keyPressFuncs.push(values.keyPress);
			});
		};

		var setWidth = function (width) {
			editorContainer.width(width);

			// fix the height and width of the textarea/iframe
			$wysiwygEditor.width(width);
			$wysiwygEditor.width(width + (width - $wysiwygEditor.outerWidth(true)));

			$textEeditor.width(width);
			$textEeditor.width(width + (width - $textEeditor.outerWidth(true)));
		};

		var setHeight = function (height) {
			editorContainer.height(height);

			height = height - (base.options.toolbarContainer === null?$toolbar.outerHeight():0);

			// fix the height and width of the textarea/iframe
			$wysiwygEditor.height(height);
			$wysiwygEditor.height(height + (height - $wysiwygEditor.outerHeight(true)));

			$textEeditor.height(height);
			$textEeditor.height(height + (height - $textEeditor.outerHeight(true)));
		};

		/**
		 * Creates the resizer.
		 * @private
		 */
		initResize = function () {
			var	$grip  = $('<div class="sceditor-grip" />'),
				// cover is used to cover the editor iframe so document still gets mouse move events
				$cover = $('<div class="sceditor-resize-cover" />'),
				startX = 0,
				startY = 0,
				startWidth  = 0,
				startHeight = 0,
				origWidth   = editorContainer.width(),
				origHeight  = editorContainer.height(),
				dragging    = false,
				minHeight, maxHeight, minWidth, maxWidth,
				mouseMoveFunc;

			minHeight = (base.options.resizeMinHeight == null ?
					origHeight / 2 :
					base.options.resizeMinHeight);

			maxHeight = (base.options.resizeMaxHeight == null ?
					origHeight * 2 :
					base.options.resizeMaxHeight);

			minWidth = (base.options.resizeMinWidth == null ?
					origWidth / 2 :
					base.options.resizeMinWidth);

			maxWidth = (base.options.resizeMaxWidth == null ?
					origWidth * 2 :
					base.options.resizeMaxWidth);

			mouseMoveFunc = function (e) {
				var newHeight = startHeight + (e.pageY - startY);
				var newWidth  = startWidth  + (e.pageX - startX);

				if (newWidth >= minWidth && (minWidth < 0 || newWidth <= maxWidth))
					setWidth(newWidth);

				if (newHeight >= minHeight && (maxHeight < 0 || newHeight <= maxHeight))
					setHeight(newHeight);

				e.preventDefault();
			};

			editorContainer.append($grip);
			editorContainer.append($cover.hide());

			$grip.mousedown(function (e) {
				startX       = e.pageX;
				startY       = e.pageY;
				startWidth   = editorContainer.width();
				startHeight  = editorContainer.height();
				dragging     = true;

				$cover.show();
				$(document).bind('mousemove', mouseMoveFunc);
				e.preventDefault();
			});

			$(document).mouseup(function (e) {
				if(!dragging)
					return;

				dragging = false;
				$cover.hide();

				$(document).unbind('mousemove', mouseMoveFunc);
				e.preventDefault();
			});
		};

		/**
		 * Preloads the emoticon images
		 * Idea from: http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript
		 * @private
		 */
		preLoadEmoticons = function () {
			var emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown, base.options.emoticons.hidden);

			$.each(emoticons, function (key, url) {
				var emoticon = document.createElement('img');
				emoticon.src = url;
				preLoadCache.push(emoticon);
			});
		};

		/**
		 * Creates a menu item drop down
		 * @private
		 */
		createDropDown = function (menuItem, dropDownName, content) {
			if($dropdown !== null)
				closeDropDown();

			var menuItemPosition = menuItem.position();
			var editorContainerPosition = editorContainer.position();

			$dropdown = $('<div class="sceditor-dropdown sceditor-' + dropDownName + '" />').css({
				top: editorContainerPosition.top + menuItemPosition.top,
				left: editorContainerPosition.left + menuItemPosition.left
			}).append(content);

			editorContainer.after($dropdown);
			dropdownIgnoreLastClick = true;

			// stop clicks within the dropdown from being handled
			$dropdown.click(function (e) {
				e.stopPropagation();
			});
		};

		/**
		 * Handles any document click and closes the dropdown if open
		 * @private
		 */
		documentClickHandler = function () {
			if(!dropdownIgnoreLastClick)
				closeDropDown();

			dropdownIgnoreLastClick = false;
		};

		/**
		 * Closes the current drop down
		 * @private
		 */
		closeDropDown = function () {
			if($dropdown !== null) {
				$dropdown.remove();
				$dropdown = null;
			}
		};

		/**
		 * Gets the WYSIWYG editors document
		 * @private
		 */
		getWysiwygDoc = function () {
			if (wysiwygEditor.contentDocument)
				return wysiwygEditor.contentDocument;

			if (wysiwygEditor.contentWindow && wysiwygEditor.contentWindow.document)
				return wysiwygEditor.contentWindow.document;

			if (wysiwygEditor.document)
				return wysiwygEditor.document;

			return null;
		};


		/**
		 * Inserts HTML into WYSIWYG editor. If endHtml is defined and some text is selected the
		 * selected text will be put inbetween html and endHtml. If endHtml isn't defined and some
		 * text is selected it will be replaced by the HTML
		 * @private
		 */
		wysiwygEditorInsertHtml = function (html, endHtml) {
			base.focus();

			// don't apply to code elements
			if($(getWysiwygSelectedContainerNode()).is('code') ||
				$(getWysiwygSelectedContainerNode()).parents('code').length !== 0)
				return;

			if(typeof endHtml !== "undefined")
				html = html + base.getWysiwygSelectedHtml() + endHtml;

			if (getWysiwygDoc().getSelection) {
				var range          = getWysiwygSelection();
				var htmlNode       = getWysiwygDoc().createElement('div');
				htmlNode.innerHTML = html;
				htmlNode           = htmlNode.children[0];

				range.deleteContents();
				range.insertNode(htmlNode);
				range = range.cloneRange();

				// move the cursor to the end of the insertion
				if(htmlNode.parentNode !== range.startContainer || !$.browser.opera)
					range.setStartAfter(htmlNode);
				else // this is only needed for opera
				{
					return;
					//range.setStart(htmlNode.parentNode, range.startOffset+1);
					//range.setEnd(htmlNode.parentNode, range.endOffset+1);
				}

				// change current range
				wysiwygEditor.contentWindow.getSelection().removeAllRanges();
				wysiwygEditor.contentWindow.getSelection().addRange(range);
			}
			else if (getWysiwygDoc().selection && getWysiwygDoc().selection.createRange)
				getWysiwygDoc().selection.createRange().pasteHTML(html);
			else
				base.execCommand("insertHtml", html);

			lastRange = null;
		};

		/**
		 * Like wysiwygEditorInsertHtml except it converts any HTML to text
		 * @private
		 */
		wysiwygEditorInsertText = function (text) {
			text = text.replace(/&/g, "&amp;");
			text = text.replace(/</g, "&lt;");
			text = text.replace(/>/g, "&gt;");
			text = text.replace(/ /g, "&nbsp;");
			text = text.replace(/\r\n|\r/g, "\n");
			text = text.replace(/\n/g, "<br />");
			wysiwygEditorInsertHtml(text);
		};

		/**
		 * Gets the current selection range from WYSIWYG editor
		 * @private
		 */
		getWysiwygSelection = function () {
			var range;

			if(wysiwygEditor.contentWindow && wysiwygEditor.contentWindow.getSelection)
				range = wysiwygEditor.contentWindow.getSelection();
			else if(getWysiwygDoc().selection)
				range = getWysiwygDoc().selection;

			if(range.getRangeAt)
				return range.getRangeAt(0);
			else if (range.createRange)
				return range.createRange();

			return null;
		};

		/**
		 * Gets the currently selected HTML from WYSIWYG editor
		 */
		base.getWysiwygSelectedHtml = function () {
			var selection = getWysiwygSelection();

			if(selection === null)
				return '';

			// IE < 9
			if (document.selection && document.selection.createRange) {
				if(typeof selection.htmlText != 'undefined')
					return selection.htmlText;
				else if(selection.length >= 1)
					return selection.item(0).outerHTML;
			}

			// IE9+ and all other browsers
			if (window.XMLSerializer) {
				var html = '';
				$(selection.cloneContents().childNodes).each(function () {
					html += new XMLSerializer().serializeToString(this);
				});
				return html;
			}
		};

		/**
		 * Gets the first node which contains all the selected elements
		 * @private
		 */
		getWysiwygSelectedContainerNode = function () {
			var selection = getWysiwygSelection();

			if(selection === null)
				return null;

			// IE9+ and all other browsers
			if (window.getSelection && typeof selection.commonAncestorContainer !== 'undefined')
				return selection.commonAncestorContainer;

			// IE < 9
			if (document.selection && document.selection.createRange)
				return selection.parentElement();
		};

		/**
		 * Gets the WYSIWYG editors HTML which is between the body tags
		 */
		base.getWysiwygEditorValue = function (filter) {
			var html = $wysiwygEditor.contents().find("body").html();

			if(filter !== false && base.options.getHtmlHandler)
				html = base.options.getHtmlHandler(html, $wysiwygEditor.contents().find("body"));

			return html;
		};

		/**
		 * Gets the text editor value
		 * @param bool filter If to run the returned string through the filter or if to return the raw value. Defaults to filter.
		 */
		base.getTextareaValue = function (filter) {
			var val = $textEeditor.val();

			if(filter !== false && base.options.getTextHandler)
				val = base.options.getTextHandler(val);

			return val;
		};

		/**
		 * Sets the WYSIWYG HTML editor value. Should only be the HTML contained within the body tags
		 * @param bool filter If to run the returned string through the filter or if to return the raw value. Defaults to filter.
		 */
		base.setWysiwygEditorValue = function (value) {
			getWysiwygDoc().body.innerHTML = replaceEmoticons(value);
		};

		/**
		 * Sets the text editor value
		 */
		base.setTextareaValue = function (value) {
			$textEeditor.val(value);
		};

		/**
		 * Updates the forms textarea value
		 */
		base.updateFormTextareaValue = function () {
			if($textEeditor.is(':visible'))
				$textarea.val(base.getTextareaValue(false));
			else
				$textarea.val(base.getWysiwygEditorValue());
		};

		/**
		 * Replaces any emoticon codes in the passed HTML with their emoticon images
		 * @private
		 */
		replaceEmoticons = function (html) {
			var emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown, base.options.emoticons.hidden);

			$.each(emoticons, function (key, url) {
				// escape the key before using it as a regex
				// and append the regex to only find emoticons outside
				// of HTML tags
				var reg  = key.replace(/[\$\?\[\]\.\*\(\)\|]/g, "\\$&")
						.replace("<", "&lt;")
						.replace(">", "&gt;") +
						"(?=([^\\<\\>]*?<(?!/code)|[^\\<\\>]*?$))";

				html = html.replace(new RegExp(reg, 'g'), '<img src="' + url + '" data-sceditor-emoticon="' + key + '" />');
			});

			return html;
		};

		/**
		 * switches between the WYSIWYG and plain text editor modes
		 */
		base.toggleTextMode = function () {
			if($textEeditor.is(':visible'))
				base.setWysiwygEditorValue(base.getTextareaValue());
			else
				base.setTextareaValue(base.getWysiwygEditorValue());

			lastRange = null;
			$textEeditor.toggle();
			$wysiwygEditor.toggle();
		};

		/**
		 * Handles the passed command
		 * @private
		 */
		handleCommand = function (caller, command) {
			// run the commands execFunction if exists
			if(command.hasOwnProperty("execFunction"))
				command.execFunction (caller);
			else
				base.execCommand (command.execCommand, command.hasOwnProperty("execParam") ? command.execParam : null);
		};

		/**
		 * Handles the passed command
		 */
		base.focus = function () {
			wysiwygEditor.contentWindow.focus();

			// Needed for IE < 9
			if(lastRange !== null) {
				if (window.document.createRange)
					window.getSelection().addRange(lastRange);
				else if (window.document.selection)
					lastRange.select();
			}
		};

		/**
		 * Saves the current range. Needed for IE because it forgets
		 * where the cursor was and what was selected
		 * @private
		 */
		saveRange = function () {
			/* this is only needed for IE */
			if(!$.browser.msie)
				return;

			lastRange = getWysiwygSelection();
		};

		/**
		 * Executes a command on the WYSIWYG editor
		 */
		base.execCommand = function (command, param) {
			var executed = false;
			base.focus();

			// don't apply any comannds to code elements
			if($(getWysiwygSelectedContainerNode()).is('code') ||
				$(getWysiwygSelectedContainerNode()).parents('code').length !== 0)
				return;

			if(getWysiwygDoc()) {
				try
				{
					executed = getWysiwygDoc().execCommand(command, false, param);
				}
				catch (e){}
			}

			// show error if execution failed and an error message exists
			if(!executed && typeof base.commands[command] != "undefined" &&
				typeof base.commands[command].errorMessage != "undefined")
				alert(base.commands[command].errorMessage);
		};

		/**
		 * Handles any key press in the WYSIWYG editor
		 * @private
		 */
		handleKeyPress = function (e) {
			closeDropDown();

			// don't apply to code elements
			if($(getWysiwygSelectedContainerNode()).is('code') ||
				$(getWysiwygSelectedContainerNode()).parents('code').length !== 0)
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
			//	wysiwygEditorInsertHtml('<br />');
			//	return false;;
			//}

			var i = keyPressFuncs.length;
			while(i--)
				keyPressFuncs[i](e);
		};

		/**
		 * Handles any mousedown press in the WYSIWYG editor
		 * @private
		 */
		handleMouseDown = function (e) {
			closeDropDown();
		};

		// run the initializer
		init();
	};

	$.sceditor.defaultOptions = {
		// Toolbar buttons order and groups. Should be comma seperated and have a bar | to seperate groups
		toolbar:	"bold,italic,underline,strike,subscript,superscript|left,center,right,justify|" +
				"font,size,color,removeformat|cut,copy,paste,pastetext|bulletlist,orderedlist|" +
				"undo,redo|table|code,quote|horizontalrule,image,email,link,unlink|emoticon,youtube,date,time|" +
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
						":wassat:": "emoticons/wassat.png"
					},
					hidden: {
						":whistling:": "emoticons/whistling.png",
						":love:": "emoticons/wub.png"
					}
				},

		// Width of the editor. Set to null for automatic with
		width: null,

		// Height of the editor including toolbat. Set to null for automatic height
		height: null,

		// If to allow the editor to be resized
		resizeEnabled: true,

		// Min resize to width, set to null for half textarea width or -1 for unlimited
		resizeMinWidth: null,
		// Min resize to height, set to null for half textarea height or -1 for unlimited
		resizeMinHeight: null,
		// Max resize to height, set to null for double textarea height or -1 for unlimited
		resizeMaxHeight: null,
		// Max resize to width, set to null for double textarea width or -1 for unlimited
		resizeMaxWidth: null,

		getHtmlHandler: null,
		getTextHandler: null,

		toolbarContainer: null
	};

	$.fn.sceditor = function (options) {
		return this.each(function () {
			(new $.sceditor(this, options));
		});
	};
})(jQuery);
