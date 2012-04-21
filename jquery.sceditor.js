/**
 * SCEditor v1.3.0
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

/*jshint smarttabs: true, scripturl: true, rowser:true, devel:true, jquery:true  */
/*global XMLSerializer: true*/

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
		var $textEditor = null;

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
		 * The editors locale
		 * @private
		 */
		var locale = null;

		/**
		 * Stores a cache of preloaded images
		 * @private
		 */
		var preLoadCache = [];

		var	init,
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
			formSubmitHandler,
			preLoadEmoticons,
			getWysiwygDoc,
			handleWindowResize,
			setHeight,
			setWidth,
			initLocale,
			isTextMode;

		/**
		 * All the commands supported by the editor
		 */
		base.commands = $.sceditor.commands;

		/**
		 * Initializer. Creates the editor iframe and textarea
		 * @private
		 */
		init = function () {
			$textarea.data("sceditor", base);
			base.options = $.extend({}, $.sceditor.defaultOptions, options);

			// Load locale
			if(base.options.locale !== null && base.options.locale !== "en")
				initLocale();
			
			if(base.options.height !== null)
				$textarea.height(base.options.height);
			if(base.options.width !== null)
				$textarea.width(base.options.width);

			// if either width or height are % based, add the resize handler to update the editor
			// when the window is resized
			if((base.options.height !== null && base.options.height.toString().indexOf("%") > -1) ||
				(base.options.width !== null && base.options.width.toString().indexOf("%") > -1))
				$(window).resize(handleWindowResize);

			editorContainer = $('<div class="sceditor-container" />')
				.width($textarea.outerWidth())
				.height($textarea.outerHeight());
			$textarea.after(editorContainer);

			// create the editor 
			initToolBar();
			initEditor();
			initKeyPressFuncs();

			if(base.options.resizeEnabled)
				initResize();

			$(document).click(documentClickHandler);
			$textarea.parents("form")
				.attr('novalidate','novalidate')
				.submit(formSubmitHandler);

			// load any textarea value into the editor
			var val = $textarea.hide().val();

			// Pass the value though the getTextHandler if it is set so that
			// BBCode, ect. can be converted
			if(base.options.getTextHandler)
				val = base.options.getTextHandler(val);

			base.setWysiwygEditorValue(val);
			if(base.options.toolbar.indexOf('emoticon') !== -1)
				preLoadEmoticons();
		};

		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		initEditor = function () {
			var	contentEditable = $('<div contenteditable="true">')[0].contentEditable,
				contentEditableSupported = typeof contentEditable !== 'undefined' && contentEditable !== 'inherit';

			$textEditor = $('<textarea></textarea>').hide();
			$wysiwygEditor = $('<iframe frameborder="0"></iframe>');

			if(window.location.protocol === "https:")
				$wysiwygEditor.attr("src", "javascript:false");

			// add the editor to the HTML and store the editors element
			editorContainer.append($wysiwygEditor).append($textEditor);
			wysiwygEditor = $wysiwygEditor[0];

			setWidth($textarea.width());
			setHeight($textarea.height());

			// turn on design mode if contenteditable not supported
			if(!contentEditableSupported)
				getWysiwygDoc().designMode = 'On';
			
			getWysiwygDoc().open();
			getWysiwygDoc().write(
				'<html><head><!--[if gte IE 9]><style>* {min-height: auto !important}</style><![endif]-->' +
				'<meta http-equiv="Content-Type" content="text/html;charset=' + base.options.charset + '" />' +
				'<link rel="stylesheet" type="text/css" href="' + base.options.style + '" />' +
				'</head><body contenteditable="true"></body></html>'
			);
			getWysiwygDoc().close();
			
			// turn on design mode if contenteditable not supported
			if(!contentEditableSupported)
				getWysiwygDoc().designMode = 'On';

			// set the key press event
			$(getWysiwygDoc()).find("body").keypress(handleKeyPress);
			$(getWysiwygDoc()).keypress(handleKeyPress);
			$(getWysiwygDoc()).mousedown(handleMouseDown);
			$(getWysiwygDoc()).bind("beforedeactivate keyup", saveRange);
			$(getWysiwygDoc()).focus(function() {
				lastRange = null;
			});
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
			var	groups = base.options.toolbar.split("|"),
				group, buttons, accessibilityName, button, i;

			for (i=0; i < groups.length; i++) {
				group   = $('<div class="sceditor-group" />');
				buttons = groups[i].split(",");

				for (var x=0; x < buttons.length; x++) {
					// the button must be a valid command otherwise ignore it
					if(!base.commands.hasOwnProperty(buttons[x]))
						continue;

					accessibilityName = base.commands[buttons[x]].tooltip ? base._(base.commands[buttons[x]].tooltip) : buttons[x];
					
					button = $('<a class="sceditor-button sceditor-button-' + buttons[x] +
						' " unselectable="on"><div unselectable="on">' + accessibilityName + '</div></a>');

					if(base.commands[buttons[x]].hasOwnProperty("tooltip"))
						button.attr('title', base._(base.commands[buttons[x]].tooltip));
						
					if(base.commands[buttons[x]].exec)
						button.data('sceditor-wysiwygmode', true);
					else
						button.addClass('disabled');
						
					if(base.commands[buttons[x]].txtExec)
						button.data('sceditor-txtmode', true);

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
				if(typeof values.keyPress !== "undefined")
					keyPressFuncs.push(values.keyPress);
			});
		};

		setWidth = function (width) {
			editorContainer.width(width);

			// fix the height and width of the textarea/iframe
			$wysiwygEditor.width(width);
			$wysiwygEditor.width(width + (width - $wysiwygEditor.outerWidth(true)));

			$textEditor.width(width);
			$textEditor.width(width + (width - $textEditor.outerWidth(true)));
		};

		setHeight = function (height) {
			editorContainer.height(height);

			height = height - (base.options.toolbarContainer === null?$toolbar.outerHeight():0);

			// fix the height and width of the textarea/iframe
			$wysiwygEditor.height(height);
			$wysiwygEditor.height(height + (height - $wysiwygEditor.outerHeight(true)));

			$textEditor.height(height);
			$textEditor.height(height + (height - $textEditor.outerHeight(true)));
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
				var	newHeight = startHeight + (e.pageY - startY),
					newWidth  = startWidth  + (e.pageX - startX);

				if (newWidth >= minWidth && (maxWidth < 0 || newWidth <= maxWidth))
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
		
		formSubmitHandler = function(e) {
			base.updateTextareaValue();
			
			$(this).removeAttr('novalidate');
			
			if(this.checkValidity && !this.checkValidity())
				e.preventDefault();
			
			$(this).attr('novalidate','novalidate');
		};
		
		/**
		 * Destroys the editor, removing all elements and
		 * event handlers.
		 */
		base.destory = function () {
			$(document).unbind('click', documentClickHandler);
			$textarea.removeAttr('novalidate').unbind('submit', formSubmitHandler);
			$(window).unbind('resize', handleWindowResize);
			
			editorContainer.remove();
			editorContainer = null;
			
			$textarea.removeData("sceditor").show();
		};

		/**
		 * Preloads the emoticon images
		 * Idea from: http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript
		 * @private
		 */
		preLoadEmoticons = function () {
			var	emoticons = $.extend({}, base.options.emoticons.more, base.options.emoticons.dropdown, base.options.emoticons.hidden),
				emoticon;

			$.each(emoticons, function (key, url) {
				emoticon	= document.createElement('img');
				emoticon.src	= url;
				preLoadCache.push(emoticon);
			});
		};

		/**
		 * Creates a menu item drop down
		 * @param HTMLElement	menuItem	The button to align the drop down with
		 * @param string	dropDownName	Used for styling the dropown, will be a class sceditor-dropDownName
		 * @param string	content			The HTML content of the dropdown
		 * @param bool		ieUnselectable	If to add the unselectable attribute to all the contents elements. Stops
		 *									IE from deselecting the text in the editor
		 */
		base.createDropDown = function (menuItem, dropDownName, content, ieUnselectable) {
			base.closeDropDown();
			
			// IE needs unselectable attr to stop it from unselecting the text in the editor.
			// The editor can cope if IE does unselect the text it's just not nice.
			if(ieUnselectable !== false) {
				content = $(content);
				content.find(':not(input,textarea)').filter(function() { return this.nodeType===1; }).attr('unselectable', 'on');
			}

			//var menuItemPosition = menuItem.position();
			//var editorContainerPosition = editorContainer.position();

			$dropdown = $('<div class="sceditor-dropdown sceditor-' + dropDownName + '" />').css({
				top: menuItem.offset().top,
				left: menuItem.offset().left
			}).append(content);

			//editorContainer.after($dropdown);
			$dropdown.appendTo($('body'));
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
		documentClickHandler = function (e) {
			// ignore right clicks
			if(!dropdownIgnoreLastClick && e.which !== 3)
				base.closeDropDown();

			dropdownIgnoreLastClick = false;
		};

		/**
		 * Closes the current drop down
		 * 
		 * @param bool focus If to focus the editor on close
		 */
		base.closeDropDown = function (focus) {
			if($dropdown !== null) {
				$dropdown.remove();
				$dropdown = null;
			}
			
			if(focus === true)
				base.focus();
		};

		/**
		 * Gets the WYSIWYG editors document
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
		 * 
		 * The HTML can have only one root node, if it has more than one only the first will be used.
		 * e.g. with: <b>test</b><i>test2</i> only <b>test</b> will be inserted. To fix this you could
		 * do: <span><b>test</b><i>test2</i></span>
		 * 
		 * @param string html		The HTML to insert
		 * @param string endHtml	If specified instead of the inserted HTML replacing the selected text the selected text
		 *                          will be placed between html and endHtml. If there is no selected text html and endHtml will
		 *                          be concated together.
		 */
		base.wysiwygEditorInsertHtml = function (html, endHtml, overrideCodeBlocking) {
			base.focus();
			
			// don't apply to code elements
			if(!overrideCodeBlocking && ($(getWysiwygSelectedContainerNode()).is('code') ||
				$(getWysiwygSelectedContainerNode()).parents('code').length !== 0))
				return;

			if(typeof endHtml !== "undefined" && endHtml !== null)
				html = html + base.getWysiwygSelectedHtml() + endHtml;

			if (getWysiwygDoc().getSelection) {
				var range          = getWysiwygSelection();
				var htmlNode       = getWysiwygDoc().createElement('div');
				htmlNode.innerHTML = html;
				
				// A better way of inserting the HTML would be to use documentFragments 
				// however you then need to find the last inserted node to setStartAfter
				htmlNode           = htmlNode.children[0];

				range.deleteContents();
				range.insertNode(htmlNode);
				range = range.cloneRange();

				// move the cursor to the end of the insertion
				if(htmlNode.parentNode !== range.startContainer || !$.browser.opera)
					range.setStartAfter(htmlNode);
				// this is only needed for opera
				else {
					return;
					//range.setStart(htmlNode.parentNode, range.startOffset+1);
					//range.setEnd(htmlNode.parentNode, range.endOffset+1);
				}

				// change current range
				wysiwygEditor.contentWindow.getSelection().removeAllRanges();
				wysiwygEditor.contentWindow.getSelection().addRange(range);
			}
			else if (getWysiwygDoc().selection && getWysiwygDoc().selection.createRange) {
				getWysiwygDoc().selection.createRange().pasteHTML(html);
				
				saveRange();
				base.focus();
			}
			else
				base.execCommand("insertHtml", html);

			lastRange = null;
		};

		/**
		 * Like wysiwygEditorInsertHtml except it converts any HTML to text
		 * @private
		 */
		base.wysiwygEditorInsertText = function (text) {
			text = text.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/ /g, "&nbsp;")
					.replace(/\r\n|\r/g, "\n")
					.replace(/\n/g, "<br />");
			
			base.wysiwygEditorInsertHtml('<span>' + text + '</span>');
		};

		/**
		 * Gets the current selection range from WYSIWYG editor
		 * @private
		 */
		getWysiwygSelection = function () {
			var range;

			if(wysiwygEditor.contentWindow && wysiwygEditor.contentWindow.getSelection)
				range = wysiwygEditor.contentWindow.getSelection();
			else if(document.selection)
				range = getWysiwygDoc().selection;
			
			// If no ranges are selected, add one. Needed if any HTML
			// is to be inserted before a range is created
			if(range.getRangeAt && range.rangeCount <= 0)
				range.addRange(getWysiwygDoc().createRange());

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
				if(selection.text === '')
					return '';

				if(typeof selection.htmlText !== 'undefined')
					return selection.htmlText;
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
			var	$body = $wysiwygEditor.contents().find("body"),
				html;
			
			// fix any invalid nesting
			$.sceditor.dom.fixNesting($body.get(0));
			html = $body.html();
			
			if(filter !== false && base.options.getHtmlHandler)
				html = base.options.getHtmlHandler(html, $body);

			return html;
		};

		/**
		 * Gets the text editor value
		 * @param bool filter If to run the returned string through the filter or if to return the raw value. Defaults to filter.
		 */
		base.getTextareaValue = function (filter) {
			var val = $textEditor.val();

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
			$textEditor.val(value);
		};

		/**
		 * Updates the forms textarea value
		 */
		base.updateTextareaValue = function () {
			if(isTextMode())
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
				var	reg = base.regexEscape(key) + "(?=([^\\<\\>]*?<(?!/code)|[^\\<\\>]*?$))",
					group = '';
				
				// Make sure the emoticon is surrounded by whitespace or is at the start/end of a string or html tag
				if(base.options.emoticonsCompat)
				{
					reg = "((>|^|\\s){1})" + reg + "(?=(\\s|$|<){1})";
					group = '$1';
				}

				html = html.replace(
					new RegExp(reg, 'gm'),
					group + '<img src="' + url + '" data-sceditor-emoticon="' + key + '" alt="' + key + '" />'
				);
			});

			return html;
		};
		
		/**
		 * Escapes a string so it's safe to use in regex
		 * @param string str The strong to escape
		 * @return string
		 */
		base.regexEscape = function (str) {
			return str.replace(/[\$\?\[\]\.\*\(\)\|]/g, "\\$&")
				.replace("<", "&lt;")
				.replace(">", "&gt;");
		};
		
		isTextMode = function () {
			return $textEditor.is(':visible');
		};

		/**
		 * Switches between the WYSIWYG and plain text modes
		 */
		base.toggleTextMode = function () {
			if(isTextMode())
				base.setWysiwygEditorValue(base.getTextareaValue());
			else
				base.setTextareaValue(base.getWysiwygEditorValue());
			
			// enable all the buttons
			$toolbar.find('.sceditor-button').removeClass('disabled');

			lastRange = null;
			$textEditor.toggle();
			$wysiwygEditor.toggle();
			
			// diable any buttons that are not allowed for this mode
			$toolbar.find('.sceditor-button').each(function () {
				var button = $(this);
				
				if(isTextMode() && !button.data('sceditor-txtmode'))
					button.addClass('disabled');
				else if (!isTextMode() && !button.data('sceditor-wysiwygmode'))
					button.addClass('disabled');
			});
		};

		/**
		 * Handles the passed command
		 * @private
		 */
		handleCommand = function (caller, command) {
			// check if in text mode and handle text commands
			if(isTextMode())
			{
				if(command.hasOwnProperty("txtExec"))
					command.txtExec.call(base, caller);
				
				return;
			}
			
			if(!command.hasOwnProperty("exec"))
				return;
			
			if($.isFunction(command.exec))
				command.exec.call(base, caller);
			else
				base.execCommand (command.exec, command.hasOwnProperty("execParam") ? command.execParam : null);
		};

		/**
		 * Fucuses the editors input area
		 */
		base.focus = function () {
			wysiwygEditor.contentWindow.focus();
			
			// Needed for IE < 9
			if(lastRange !== null) {
				if (window.document.createRange)
					window.getSelection().addRange(lastRange);
				else if (window.document.selection)
					lastRange.select();
				
				// remove the stored range after being set.
				// If the editor loses focus it should be
				// saved again.
				lastRange = null;
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
		 * 
		 * @param string|function command
		 * @param mixed param
		 */
		base.execCommand = function (command, param) {
			var executed = false;
			base.focus();

			// don't apply any comannds to code elements
			if($(getWysiwygSelectedContainerNode()).is('code') ||
				$(getWysiwygSelectedContainerNode()).parents('code').length !== 0)
				return;

			if(getWysiwygDoc())
			{
				try
				{
					executed = getWysiwygDoc().execCommand(command, false, param);
				}
				catch (e){}
			}

			// show error if execution failed and an error message exists
			if(!executed && typeof base.commands[command] !== "undefined" &&
				typeof base.commands[command].errorMessage !== "undefined")
				alert(base._(base.commands[command].errorMessage));
		};
		
		/**
		 * Handles any key press in the WYSIWYG editor
		 * 
		 * @private
		 */
		handleKeyPress = function (e) {
			base.closeDropDown();
			
			var	selectedContainer = getWysiwygSelectedContainerNode(),
				$selectedContainer = $(selectedContainer);

			// "Fix" (ok it's a hack) for blocklevel elements being duplicated in some browsers when
			// enter is pressed instead of inserting a newline
			if(e.which === 13)
			{
				if($selectedContainer.is('code, blockquote') || $selectedContainer.parents('code, blockquote').length !== 0)
				{
					lastRange = null;
					base.wysiwygEditorInsertHtml('<br />', null, true);
					return false;
				}
			}

			// make sure there is always a newline after code or quote tags
			var d = getWysiwygDoc();
			$.sceditor.dom.rTraverse(d.body, function(node) {
				if((node.nodeType === 3 && node.nodeValue !== "") ||
					node.nodeName.toLowerCase() === 'br') {
					// this is the last text or br node, if its in a code or quote tag
					// then add a newline after it
					if($(node).parents('code, blockquote').length > 0)
						$(d.body).append(d.createElement('br'));

					return false;
				}
			}, true);

			// don't apply to code elements
			if($selectedContainer.is('code') || $selectedContainer.parents('code').length !== 0)
				return;
			
			var i = keyPressFuncs.length;
			while(i--)
				keyPressFuncs[i].call(base, e, wysiwygEditor, $textEditor);
		};

		/**
		 * Handles any mousedown press in the WYSIWYG editor
		 * @private
		 */
		handleMouseDown = function (e) {
			base.closeDropDown();
			lastRange = null;
		};

		/**
		 * Handles the window resize event. Needed to resize then editor
		 * when the window size changes in fluid deisgns.
		 */
		handleWindowResize = function () {
			if(base.options.height !== null && base.options.height.toString().indexOf("%") > -1)
				setHeight(editorContainer.parent().height() *
					(parseFloat(base.options.height) / 100));

			if(base.options.width !== null && base.options.width.toString().indexOf("%") > -1)
				setWidth(editorContainer.parent().width() *
					(parseFloat(base.options.width) / 100));
		};
		
		/**
		 * Translates the string into the locale language.
		 * 
		 * Replaces any {0}, {1}, {2}, ect. with the params provided.

		 * @public
		 * @return string
		 */
		base._ = function() {
			var args = arguments;
			
			if(locale !== null && locale[args[0]])
				args[0] = locale[args[0]];
			
			return args[0].replace(/\{(\d+)\}/g, function(str, p1) {
				return typeof args[p1-0+1] !== 'undefined'? 
						args[p1-0+1] :
						'{' + p1 + '}';
			});
		};
		
		/**
		 * Init the locale variable with the specified locale if possible
		 * @private
		 * @return void
		 */
		initLocale = function () {
			if($.sceditor.locale[base.options.locale])
				locale = $.sceditor.locale[base.options.locale];
			else
			{
				var lang = base.options.locale.split("-");
				
				if($.sceditor.locale[lang[0]])
					locale = $.sceditor.locale[lang[0]];
			}
			
			if(locale !== null && locale.dateFormat)
				base.options.dateFormat = locale.dateFormat;
		};

		// run the initializer
		init();
	};

	$.sceditor.locale = {};

	$.sceditor.commands = {
		// START_COMMAND: Bold
		bold: {
			exec: "bold",
			tooltip: "Bold"
		},
		// END_COMMAND
		// START_COMMAND: Italic
		italic: {
			exec: "italic",
			tooltip: "Italic"
		},
		// END_COMMAND
		// START_COMMAND: Underline
		underline: {
			exec: "underline",
			tooltip: "Underline"
		},
		// END_COMMAND
		// START_COMMAND: Strikethrough
		strike: {
			exec: "strikethrough",
			tooltip: "Strikethrough"
		},
		// END_COMMAND
		// START_COMMAND: Subscript
		subscript: {
			exec: "subscript",
			tooltip: "Subscript"
		},
		// END_COMMAND
		// START_COMMAND: Superscript
		superscript: {
			exec: "superscript",
			tooltip: "Superscript"
		},
		// END_COMMAND

		// START_COMMAND: Left
		left: {
			exec: "justifyleft",
			tooltip: "Align left"
		},
		// END_COMMAND
		// START_COMMAND: Centre
		center: {
			exec: "justifycenter",
			tooltip: "Center"
		},
		// END_COMMAND
		// START_COMMAND: Right
		right: {
			exec: "justifyright",
			tooltip: "Align right"
		},
		// END_COMMAND
		// START_COMMAND: Justify
		justify: {
			exec: "justifyfull",
			tooltip: "Justify"
		},
		// END_COMMAND

		// START_COMMAND: Font
		font: {
			exec: function (caller) {
				var	editor  = this,
					fonts   = editor.options.fonts.split(","),
					content = $("<div />"),
					clickFunc = function (e) {
						editor.execCommand("fontname", $(this).data('sceditor-font'));
						editor.closeDropDown(true);
						e.preventDefault();
					};

				for (var i=0; i < fonts.length; i++) {
					content.append(
						$('<a class="sceditor-font-option" href="#"><font face="' + fonts[i] + '">' + fonts[i] + '</font></a>')
							.data('sceditor-font', fonts[i])
							.click(clickFunc));
				}

				editor.createDropDown(caller, "font-picker", content);
			},
			tooltip: "Font Name"
		},
		// END_COMMAND
		// START_COMMAND: Size
		size: {
			exec: function (caller) {
				var	editor    = this,
					content   = $("<div />"),
					clickFunc = function (e) {
					editor.execCommand("fontsize", $(this).data('sceditor-fontsize'));
					editor.closeDropDown(true);
					e.preventDefault();
				};

				for (var i=1; i<= 7; i++) {
					content.append(
						$('<a class="sceditor-fontsize-option" href="#"><font size="' + i + '">' + i + '</font></a>')
							.data('sceditor-fontsize', i)
							.click(clickFunc));
				}

				editor.createDropDown(caller, "fontsize-picker", content);
			},
			tooltip: "Font Size"
		},
		// END_COMMAND
		// START_COMMAND: Colour
		color: {
			exec: function (caller) {
				var	editor			= this,
					genColor		= {r: 255, g: 255, b: 255},
					content			= $("<div />"),
					colorColumns	= this.options.colors?this.options.colors.split("|"):new Array(21),
					// IE is slow at string concation so use an array
					html			= [],
					htmlIndex		= 0;

				for (var i=0; i < colorColumns.length; ++i) {
					var colors = (typeof colorColumns[i] !== "undefined")?colorColumns[i].split(","):new Array(21);

					html[htmlIndex++] = '<div class="sceditor-color-column">';

					for (var x=0; x < colors.length; ++x) {
						// use pre defined colour if can otherwise use the generated color
						var color = (typeof colors[x] !== "undefined")?colors[x]:"#" + genColor.r.toString(16) + genColor.g.toString(16) + genColor.b.toString(16);

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
						editor.execCommand("forecolor", $(this).attr('data-color'));
						editor.closeDropDown(true);
						e.preventDefault();
					});

				editor.createDropDown(caller, "color-picker", content);
			},
			tooltip: "Font Color"
		},
		// END_COMMAND
		// START_COMMAND: Remove Format
		removeformat: {
			exec: "removeformat",
			tooltip: "Remove Formatting"
		},
		// END_COMMAND

		// START_COMMAND: Cut
		cut: {
			exec: "cut",
			tooltip: "Cut",
			errorMessage: "Your browser does not allow the cut command. Please use the keyboard shortcut Ctrl/Cmd-X"
		},
		// END_COMMAND
		// START_COMMAND: Copy
		copy: {
			exec: "copy",
			tooltip: "Copy",
			errorMessage: "Your browser does not allow the copy command. Please use the keyboard shortcut Ctrl/Cmd-C"
		},
		// END_COMMAND
		// START_COMMAND: Paste
		paste: {
			exec: "paste",
			tooltip: "Paste",
			errorMessage: "Your browser does not allow the paste command. Please use the keyboard shortcut Ctrl/Cmd-V"
		},
		// END_COMMAND
		// START_COMMAND: Paste Text
		pastetext: {
			exec: function (caller) {
				var	editor = this,
					content = $(this._('<form><div><label for="txt">{0}</label> <textarea cols="20" rows="7" id="txt">' +
						'</textarea></div></form>',
						this._("Paste your text inside the following box:")
					))
					.submit(function () {return false;});

				content.append($(this._('<div><input type="button" class="button" value="{0}" /></div>',
					this._("Insert")
				)).click(function (e) {
					editor.wysiwygEditorInsertText($(this).parent("form").find("#txt").val());
					editor.closeDropDown(true);
					e.preventDefault();
				}));

				editor.createDropDown(caller, "pastetext", content);
			},
			tooltip: "Paste Text"
		},
		// END_COMMAND
		// START_COMMAND: Bullet List
		bulletlist: {
			exec: "insertunorderedlist",
			tooltip: "Bullet list"
		},
		// END_COMMAND
		// START_COMMAND: Ordered List
		orderedlist: {
			exec: "insertorderedlist",
			tooltip: "Numbered list"
		},
		// END_COMMAND

		// START_COMMAND: Table
		table: {
			exec: function (caller) {
				var	editor  = this,
					content = $(this._(
						'<form><div><label for="rows">{0}</label><input type="text" id="rows" value="2" /></div>' +
							'<div><label for="cols">{1}</label><input type="text" id="cols" value="2" /></div></form>',
						this._("Rows:"),
						this._("Cols:")
					))
					.submit(function () {return false;});

				content.append($(this._('<div><input type="button" class="button" value="{0}" /></div>',
					this._("Insert")
				)).click(function (e) {
					var rows = $(this).parent("form").find("#rows").val() - 0,
						cols = $(this).parent("form").find("#cols").val() - 0,
						html = '<table>';

					if(rows < 1 || cols < 1)
						return;
					
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

					editor.wysiwygEditorInsertHtml(html);

					editor.closeDropDown(true);
					e.preventDefault();
				}));

				editor.createDropDown(caller, "inserttable", content);
			},
			tooltip: "Insert a table"
		},
		// END_COMMAND

		// START_COMMAND: Horizontal Rule
		horizontalrule: {
			exec: "inserthorizontalrule",
			tooltip: "Insert a horizontal rule"
		},
		// END_COMMAND

		// START_COMMAND: Code
		code: {
			exec: function () {
				this.wysiwygEditorInsertHtml('<code>', '<br /></code>');
			},
			tooltip: "Code"
		},
		// END_COMMAND

		// START_COMMAND: Image
		image: {
			exec: function (caller) {
				var	editor  = this,
					content = $(this._('<form><div><label for="link">{0}</label> <input type="text" id="image" value="http://" /></div>' +
						'<div><label for="width">{1}</label> <input type="text" id="width" size="2" /></div>' +
						'<div><label for="height">{2}</label> <input type="text" id="height" size="2" /></div></form>',
							this._("URL:"),
							this._("Width (optional):"),
							this._("Height (optional):")
						))
					.submit(function () {return false;});

				content.append($(this._('<div><input type="button" class="button" value="Insert" /></div>',
						this._("Insert")
					)).click(function (e) {
					var $form	= $(this).parent("form"),
						val		= $form.find("#image").val(),
						attrs	= '',
						width,
						height;

					if((width = $form.find("#width").val()))
						attrs += ' width="' + width + '"';
					if((height = $form.find("#height").val()))
						attrs += ' height="' + height + '"';

					if(val && val !== "http://")
						editor.wysiwygEditorInsertHtml('<img' + attrs + ' src="' + val + '" />');

					editor.closeDropDown(true);
					e.preventDefault();
				}));

				editor.createDropDown(caller, "insertimage", content);
			},
			tooltip: "Insert an image"
		},
		// END_COMMAND

		// START_COMMAND: E-mail
		email: {
			exec: function (caller) {
				var	editor  = this,
					content = $(this._('<form><div><label for="email">{0}</label> <input type="text" id="email" value="" /></div></form>',
						this._("E-mail:")
					))
					.submit(function () {return false;});

				content.append($('<div><input type="button" class="button" value="Insert" /></div>').click(function (e) {
					var val = $(this).parent("form").find("#email").val();

					if(val)
					{
						// needed for IE to reset the last range
						editor.focus();

						if(!editor.getWysiwygSelectedHtml())
							editor.wysiwygEditorInsertHtml('<a href="' + 'mailto:' + val + '">' + val + '</a>');
						else
							editor.execCommand("createlink", 'mailto:' + val);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				}));

				editor.createDropDown(caller, "insertemail", content);
			},
			tooltip: "Insert an email"
		},
		// END_COMMAND

		// START_COMMAND: Link
		link: {
			exec: function (caller) {
				var	editor  = this,
					content = $(this._('<form><div><label for="link">{0}</label> <input type="text" id="link" value="http://" /></div>' +
							'<div><label for="des">{1}</label> <input type="text" id="des" value="" /></div></form>',
						this._("URL:"),
						this._("Description (optional):")
					))
					.submit(function () {return false;});

				content.append($(
					this._('<div><input type="button" class="button" value="{0}" /></div>',
						this._("Insert")
					)).click(function (e) {
					var val = $(this).parent("form").find("#link").val(),
						description = $(this).parent("form").find("#des").val();

					if(val !== "" && val !== "http://") {
						// needed for IE to reset the last range
						editor.focus();

						if(!editor.getWysiwygSelectedHtml() || description)
						{
							if(!description)
								description = val;
							
							editor.wysiwygEditorInsertHtml('<a href="' + val + '">' + description + '</a>');
						}
						else
							editor.execCommand("createlink", val);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				}));

				editor.createDropDown(caller, "insertlink", content);
			},
			tooltip: "Insert a link"
		},
		// END_COMMAND

		// START_COMMAND: Unlink
		unlink: {
			exec: "unlink",
			tooltip: "Unlink"
		},
		// END_COMMAND


		// START_COMMAND: Quote
		quote: {
			exec: function (caller, html, author) {
				var	before	= '<blockquote>',
					end	= '</blockquote>';

				// if there is HTML passed set end to null so any selected
				// text is replaced
				if(html)
				{
					author = (author ? '<cite>' + author + '</cite>' : '');
					
					before = before + author + html + end + '<br />';
					end = null;
				}
				// if not add a newline to the end of the inserted quote
				else if(this.getWysiwygSelectedHtml() === "")
					end = '<br />' + end;
				
				this.wysiwygEditorInsertHtml(before, end);
			},
			tooltip: "Insert a Quote"
		},
		// END_COMMAND

		// START_COMMAND: Emoticons
		emoticon: {
			exec: function (caller) {
				var	appendEmoticon,
					editor  = this,
					content = $('<div />'),
					line    = $('<div />');

				appendEmoticon = function (code, emoticon) {
					line.append($('<img />')
							.attr({
								src: emoticon,
								alt: code
							})
							.click(function (e) {
								var	start = '', end = '';
								
								if(editor.options.emoticonsCompat)
								{
									start = '<span> ';
									end   = ' </span>';
								}
								
								editor.wysiwygEditorInsertHtml(start + '<img src="' + $(this).attr("src") +
									'" data-sceditor-emoticon="' + $(this).attr('alt') + '" />' + end);

								editor.closeDropDown(true);
								e.preventDefault();
							})
						);

					if(line.children().length > 3) {
						content.append(line);
						line = $('<div />');
					}
				};

				$.each(editor.options.emoticons.dropdown, appendEmoticon);

				if(line.children().length > 0)
					content.append(line);

				if(typeof editor.options.emoticons.more !== "undefined") {
					var more = $(this._('<a class="sceditor-more">{0}</a>', this._("More"))).click(function () {
						var	emoticons	= $.extend({}, editor.options.emoticons.dropdown, editor.options.emoticons.more);
							content		= $('<div />');
							line		= $('<div />');

						$.each(emoticons, appendEmoticon);

						if(line.children().length > 0)
							content.append(line);

						editor.createDropDown(caller, "insertemoticon", content);
					});

					content.append(more);
				}

				editor.createDropDown(caller, "insertemoticon", content);
			},
			keyPress: function (e, wysiwygEditor)
			{
				var	range  = null,
					start  = -1,
					editor = this;

				if(wysiwygEditor.contentWindow && wysiwygEditor.contentWindow.getSelection)
					range = wysiwygEditor.contentWindow.getSelection().getRangeAt(0);

				if(range == null || !range.startContainer)
					return;

				// store all the emoticons in an object to speed up AYT emoticon converstion
				if(!editor.allEmoticonCache)
					editor.allEmoticonCache = $.extend({}, editor.options.emoticons.more, editor.options.emoticons.dropdown, editor.options.emoticons.hidden);

				// store the length of the longest emoticon key
				if(!editor.longestEmoticonCode) {
					editor.longestEmoticonCode = 0;
					$.each(editor.allEmoticonCache, function (key, url) {
						if(key.length > editor.longestEmoticonCode)
							editor.longestEmoticonCode = key.length;
					});
					
					// if need to check that the emoticon has whitespace around it,
					// need to add 1 to either end
					if(editor.options.emoticonsCompat)
						editor.longestEmoticonCode += 1;
				}

				// can't just use range.startContainer.textContent as it doesn't have the current
				// char included. Must add it into the string.
				var	buttonChar    = String.fromCharCode(e.which),
					buttonIsSpace = editor.options.emoticonsCompat ? /\s/.test(buttonChar) : false,
					left          = range.startContainer.textContent.substr(0, range.startOffset),
					right         = range.startContainer.textContent.substr(range.startOffset, editor.longestEmoticonCode),
					currentString = left + buttonChar + right;

				$.each(editor.allEmoticonCache, function (key, url) {
					if((start = currentString.indexOf(key, range.startOffset - key.length)) > -1) {

						if(editor.options.emoticonsCompat)
						{
							var reg = new RegExp("(\\s{1})" + editor.regexEscape(key) + "(?=\\s{1})", 'gm');

							if(buttonIsSpace && (buttonChar + right).indexOf(key) > -1)
								return;
								
							if(!reg.test(currentString))
								return;
						}

						range = range.cloneRange();
						range.setStart(range.startContainer, start);
						// if the button is a space, then need to remove the full key, if it's not then
						// part of the key is the button press which will be stoppped from being entered
						range.setEnd(range.startContainer, start + key.length - (buttonIsSpace ? 0 : 1));
						range.deleteContents();

						var htmlNode       = wysiwygEditor.contentDocument.createElement('div');
						htmlNode.innerHTML = '<img src="' + url + '" data-sceditor-emoticon="' + key + '" alt="' + key + '" />';
						htmlNode           = htmlNode.children[0];

						range.insertNode(htmlNode);
						range = range.cloneRange();

						// move the cursor to the end of the insertion
						range.setStartAfter(htmlNode);

						// change current range
						wysiwygEditor.contentWindow.getSelection().removeAllRanges();
						wysiwygEditor.contentWindow.getSelection().addRange(range);

						if(!buttonIsSpace)
						{
							e.preventDefault();
							e.stopPropagation();
						}
						
						// found emoticon so exit loop
						return false;
					}
				});
			},
			tooltip: "Insert an emoticon"
		},
		// END_COMMAND

		// START_COMMAND: YouTube
		youtube: {
			exec: function (caller) {
				var editor  = this;
				var content = $(
					this._('<form><div><label for="link">{0}</label> <input type="text" id="link" value="http://" /></div></form>',
						this._("Video URL:")
					))
					.submit(function () {return false;});

				content.append(
					$(this._('<div><input type="button" class="button" value="{0}" /></div>',
						this._("Insert")
					))
					.click(function (e) {
						var val = $(this).parent("form").find("#link").val();
	
						if(val !== "" && val !== "http://") {
							// See http://www.abovetopsecret.com/forum/thread270269/pg1
							val = val.replace(/^[^v]+v.(.{11}).*/,"$1"); 
							editor.wysiwygEditorInsertHtml('<iframe width="560" height="315" src="http://www.youtube.com/embed/' + val +
								'?wmode=opaque" data-youtube-id="' + val + '" frameborder="0" allowfullscreen></iframe>');
						}
	
						editor.closeDropDown(true);
						e.preventDefault();
					}));

				editor.createDropDown(caller, "insertlink", content);
			},
			tooltip: "Insert a YouTube video"
		},
		// END_COMMAND

		// START_COMMAND: Date
		date: {
			exec: function () {
				var	now   = new Date(),
					year  = now.getYear(),
					month = now.getMonth()+1,
					day   = now.getDate();

				if(year < 2000)
					year = 1900 + year;
				if(month < 10)
					month = "0" + month;
				if(day < 10)
					day = "0" + day;

				this.wysiwygEditorInsertHtml('<span>' +
					this.options.dateFormat.replace(/year/i, year).replace(/month/i, month).replace(/day/i, day) + 
					'</span>');
			},
			tooltip: "Insert current date"
		},
		// END_COMMAND

		// START_COMMAND: Time
		time: {
			exec: function () {
				var	now   = new Date(),
					hours = now.getHours(),
					mins  = now.getMinutes(),
					secs  = now.getSeconds();

				if(hours < 10)
					hours = "0" + hours;
				if(mins < 10)
					mins = "0" + mins;
				if(secs < 10)
					secs = "0" + secs;

				this.wysiwygEditorInsertHtml('<span>' + hours + ':' + mins + ':' + secs + '</span>');
			},
			tooltip: "Insert current time"
		},
		// END_COMMAND


		// START_COMMAND: Print
		print: {
			exec: "print",
			tooltip: "Print"
		},
		// END_COMMAND

		// START_COMMAND: Source
		source: {
			exec: function () {
				this.toggleTextMode();
			},
			txtExec: function () {
				this.toggleTextMode();
			},
			tooltip: "View source"
		},
		// END_COMMAND
		
		// this is here so that commands above can be removed
		// without having to remove the , after the last one.
		// Needed for IE.
		ignore: {}
	};
	
	/**
	 * Dom helper class
	 */
	$.sceditor.dom = {
		/**
		 * Loop all child nodes of the passed node
		 * 
		 * The function should accept 1 parameter being the node.
		 * If the function returns false the loop will be exited.
		 * 
		 * @param HTMLElement	node
		 * @param function		func			Function that is called for every node, should accept 1 param for the node
		 * @param bool			innermostFirst	If the innermost node should be passed to the function before it's parents
		 * @param bool			siblingsOnly	If to only traverse the nodes siblings
		 * @param bool			reverse			If to traverse the nodes in reverse
		 */
		traverse: function(node, func, innermostFirst, siblingsOnly, reverse) {
			if(node)
			{
				node = reverse ? node.lastChild : node.firstChild;
				
				while(node != null)
				{
					if(!innermostFirst && func(node) === false)
						return false;
					
					// traverse all children
					if(!siblingsOnly && this.traverse(node, func, innermostFirst, siblingsOnly, reverse) === false)
						return false;
					
					if(innermostFirst && func(node) === false)
						return false;
					
					// move to next child
					node = reverse ? node.previousSibling : node.nextSibling;
				}
			}
		},
		
		rTraverse: function(node, func, innermostFirst, siblingsOnly) {
			this.traverse(node, func, innermostFirst, siblingsOnly, true);
		},
		
		/**
		 * Checks if an element is inline
		 * 
		 * @param bool includeInlineBlock If passed inline-block will count as an inline element instead of block
		 * @return bool
		 */
		isInline: function(elm, includeInlineBlock) {
			if(elm == null || elm.nodeType !== 1)
				return true;
			
			var d = (window.getComputedStyle ? window.getComputedStyle(elm) : elm.currentStyle).display;

			if(includeInlineBlock)
				return d !== "block"; 
			
			return d === "inline"; 
		},
		
		/**
		 * Gets the next node. If the node has no siblings
		 * it gets the parents next sibling, and so on untill
		 * another element is found. If none are found
		 * it returns null.
		 * 
		 * @param HTMLElement node
		 * @return HTMLElement
		 */
		/*getNext: function(node) {
			if(!node)
				return null;
			
			var n = node.nextSibling;
			if(n)
				return n;
			
			return getNext(node.parentNode);
		},*/
		
		copyCSS: function(from, to) {
			to.style.cssText = from.style.cssText;
		},
		
		/**
		 * Fixes block level elements in inline elements.
		 * 
		 * @param HTMLElement The node to fix
		 */
		fixNesting: function(node) {
			var	base = this,
				getLastInlineParent = function(node) {
					while(base.isInline(node.parentNode))
						node = node.parentNode;
					
					return node;
				};
			
			base.traverse(node, function(node) {
				// if node is an element, and is blocklevel and the parent isn't block level
				// then it needs fixing
				if(node.nodeType === 1 && !base.isInline(node) && base.isInline(node.parentNode))
				{
					var	parent	= getLastInlineParent(node),
						rParent	= parent.parentNode,
						before	= base.extractContents(parent, node),
						middle	= node;
					
					// copy current styling so when moved out of the parent
					// it still has the same styling
					base.copyCSS(middle, middle);
					
					rParent.insertBefore(before, parent);
					rParent.insertBefore(middle, parent);
				}
			});
		},
		
		/**
		 * Finds the common parent of two nodes
		 * 
		 * @param HTMLElement node1
		 * @param HTMLElement node2
		 * @return HTMLElement
		 */
		findCommonAncestor: function(node1, node2) {
			// not as fast as making two arrays of parents and comparing
			// but is a lot smaller and as it's currently only used with
			// fixing invalid nesting it doesn't need to be very fast
			return $(node1).parents().has($(node2)).first();
		},
		
		/**
		 * Removes unused whitespace from the root and it's children
		 * 
		 * @param HTMLElement root
		 * @return void
		 */
		removeWhiteSpace: function(root) {
			// 00A0 is non-breaking space which should not be striped
			var regex = /[^\S|\u00A0]+/g;

			this.traverse(root, function(node) {
				if(node.nodeType === 3 && $(node).parents('code, pre').length === 0)
				{
					if(!/\S|\u00A0/.test(node.nodeValue))
						node.nodeValue = " ";
					else if(regex.test(node.nodeValue))
						node.nodeValue = node.nodeValue.replace(regex, " ");
				}
			});
		},
		
		/**
		 * Extracts all the nodes between the start and end nodes
		 * 
		 * @param HTMLElement startNode The node to start extracting at
		 * @param HTMLElement endNode The node to stop extracting at
		 * @return DocumentFragment
		 */
		extractContents: function(startNode, endNode) {
			var	base		= this,
				$commonAncestor	= base.findCommonAncestor(startNode, endNode),
				commonAncestor	= $commonAncestor===null?null:$commonAncestor.get(0),
				startReached	= false,
				endReached	= false;

			return (function extract(root) {
				var df = startNode.ownerDocument.createDocumentFragment();
				
				base.traverse(root, function(node) {
					// if end has been reached exit loop
					if(endReached || (node === endNode && startReached))
					{
						endReached = true;
						return false;
					}

					if(node === startNode)
						startReached = true;

					var c, n;
					if(startReached)
					{
						// if the start has been reached and this elm contains
						// the end node then clone it
						if(jQuery.contains(node, endNode) && node.nodeType === 1)
						{
							c = extract(node);
							n = node.cloneNode(false);

							n.appendChild(c);
							df.appendChild(n);
						}
						// otherwise just move it
						else
							df.appendChild(node);
					}
					// if this node contains the start node then add it
					else if(jQuery.contains(node, startNode) && node.nodeType === 1)
					{
						c = extract(node);
						n = node.cloneNode(false);

						n.appendChild(c);
						df.appendChild(n);
					}
				});

				return df;
			}(commonAncestor));
		}
	};
	
	/**
	 * Checks if a command with the specified name exists
	 * 
	 * @param string name
	 * @return bool
	 */
	$.sceditor.commandExists = function(name) {
		return typeof $.sceditor.commands[name] !== "undefined";
	};
	
	/**
	 * Adds/updates a command.
	 * 
	 * @param string			name		The commands name
	 * @param string|function	exec		The commands exec function or string for the native execCommand
	 * @param string			tooltip		The commands tooltip text
	 * @param function			keypress	Function that gets called every time a key is pressed
	 * @return bool
	 */
	$.sceditor.setCommand = function(name, exec, tooltip, keypress) {
		if(!name || !exec)
			return false;
		
		if(!$.sceditor.commandExists(name))
			$.sceditor.commands[name] = {};

		$.sceditor.commands[name].exec = exec;

		if(tooltip)
			$.sceditor.commands[name].tooltip = tooltip;

		if(keypress)
			$.sceditor.commands[name].keyPress = keypress;

		return true;
	};
	
	$.sceditor.defaultOptions = {
		// Toolbar buttons order and groups. Should be comma seperated and have a bar | to seperate groups
		toolbar:	"bold,italic,underline,strike,subscript,superscript|left,center,right,justify|" +
				"font,size,color,removeformat|cut,copy,paste,pastetext|bulletlist,orderedlist|" +
				"table|code,quote|horizontalrule,image,email,link,unlink|emoticon,youtube,date,time|" +
				"print,source",

		// Stylesheet to include in the WYSIWYG editor. Will style the WYSIWYG elements
		style: "jquery.sceditor.default.css",

		// Comma seperated list of fonts for the font selector
		fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Georgia,Impact,Sans-serif,Serif,Times New Roman,Trebuchet MS,Verdana",

		// Colors should be comma seperated and have a bar | to signal a new column. If null the colors will be auto generated.
		colors: null,
		
		locale: "en",
		
		charset: "utf-8",

		// compatibility mode for if you have emoticons such as :/ This mode requires
		// emoticons to be surrounded by whitespace or end of line chars. This mode
		// has limited As You Type emoticon converstion support (end of line chars)
		// are not accepted as whitespace so only emoticons surrounded by whitespace
		// will work
		emoticonsCompat: false,
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
		
		// date format. year, month and day will be replaced with the users current year, month and day.
		dateFormat: "year-month-day",

		toolbarContainer: null
	};

	$.fn.sceditor = function (options) {
		return this.each(function () {
			(new $.sceditor(this, options));
		});
	};
})(jQuery);
