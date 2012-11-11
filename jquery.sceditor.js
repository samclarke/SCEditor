/**
 * SCEditor
 * http://www.samclarke.com/2011/07/sceditor/
 *
 * Copyright (C) 2011-2012, Sam Clarke (samclarke.com)
 *
 * SCEditor is dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 *
 * @fileoverview SCEditor - A lightweight WYSIWYG BBCode and HTML editor
 * @author Sam Clarke
 * @version 1.4.0
 * @requires jQuery
 */

// ==ClosureCompiler==
// @output_file_name jquery.sceditor.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*jshint smarttabs: true, scripturl: true, jquery: true, devel:true, eqnull:true, curly: false */
/*global XMLSerializer: true*/

;(function ($, window, document) {
	'use strict';

	var _templates = {
		html:		'<!DOCTYPE html>' +
				'<html>' +
					'<head>' +
						'<!--[if IE]><style>* {min-height: auto !important}</style><![endif]-->' +
						'<meta http-equiv="Content-Type" content="text/html;charset={charset}" />' +
						'<link rel="stylesheet" type="text/css" href="{style}" />' +
					'</head>' +
					'<body contenteditable="true"></body>' +
				'</html>',

		toolbarButton:	'<a class="sceditor-button sceditor-button-{name}" data-sceditor-command="{name}" unselectable="on"><div unselectable="on">{dispName}</div></a>',

		emoticon:	'<img src="{url}" data-sceditor-emoticon="{key}" alt="{key}" />',

		fontOpt:	'<a class="sceditor-font-option" href="#" data-font="{font}"><font face="{font}">{font}</font></a>',

		sizeOpt:	'<a class="sceditor-fontsize-option" data-size="{size}" href="#"><font size="{size}">{size}</font></a>',

		pastetext:	'<div><label for="txt">{label}</label> ' +
				'<textarea cols="20" rows="7" id="txt"></textarea></div>' +
				'<div><input type="button" class="button" value="{insert}" /></div>',

		table:		'<div><label for="rows">{rows}</label><input type="text" id="rows" value="2" /></div>' +
				'<div><label for="cols">{cols}</label><input type="text" id="cols" value="2" /></div>' +
				'<div><input type="button" class="button" value="{insert}" /></div>',

		image:		'<div><label for="link">{url}</label> <input type="text" id="image" value="http://" /></div>' +
				'<div><label for="width">{width}</label> <input type="text" id="width" size="2" /></div>' +
				'<div><label for="height">{height}</label> <input type="text" id="height" size="2" /></div>' +
				'<div><input type="button" class="button" value="{insert}" /></div>',

		email:		'<div><label for="email">{label}</label> <input type="text" id="email" /></div>' +
				'<div><input type="button" class="button" value="{insert}" /></div>',

		link:		'<div><label for="link">{url}</label> <input type="text" id="link" value="http://" /></div>' +
				'<div><label for="des">{desc}</label> <input type="text" id="des" /></div>' +
				'<div><input type="button" class="button" value="{ins}" /></div>',

		youtubeMenu:	'<div><label for="link">{label}</label> <input type="text" id="link" value="http://" /></div><div><input type="button" class="button" value="{insert}" /></div>',

		youtube:	'<iframe width="560" height="315" src="http://www.youtube.com/embed/{id}?wmode=opaque" data-youtube-id="{id}" frameborder="0" allowfullscreen></iframe>'
	};

	/**
	 * <p>Replaces any params in a template with the passed params.</p>
	 *
	 * <p>If createHTML is passed it will use jQuery to create the HTML. The
	 * same as doing: $(editor.tmpl("html", {params...}));</p>
	 *
	 * @param {string} templateName
	 * @param {Object} params
	 * @param {Boolean} createHTML
	 * @private
	 */
	var _tmpl = function(name, params, createHTML) {
		var template = _templates[name];

		$.each(params, function(name, val) {
			template = template.replace(new RegExp('\\{' + name + '\\}', 'g'), val);
		});

		if(createHTML)
			template = $(template);

		return template;
	};

	/**
	 * SCEditor - A lightweight WYSIWYG editor
	 *
	 * @param {Element} el The textarea to be converted
	 * @return {Object} options
	 * @class sceditor
	 * @name jQuery.sceditor
	 */
	$.sceditor = function (el, options) {
		/**
		 * Alias of this
		 * @private
		 */
		var base = this;

		/**
		 * The textarea element being replaced
		 * @private
		 */
		var original  = el.get ? el.get(0) : el;
		var $original = $(original);

		/**
		 * The div which contains the editor and toolbar
		 * @private
		 */
		var $editorContainer;

		/**
		 * The editors toolbar
		 * @private
		 */
		var $toolbar;

		/**
		 * The editors iframe which should be in design mode
		 * @private
		 */
		var $wysiwygEditor;
		var wysiwygEditor;

		/**
		 * The editors textarea for viewing source
		 * @private
		 */
		var $sourceEditor;
		var sourceEditor;

		/**
		 * The current dropdown
		 * @private
		 */
		var $dropdown;

		/**
		 * Array of all the commands key press functions
		 * @private
		 */
		var keyPressFuncs = [];

		/**
		 * Store the last cursor position. Needed for IE because it forgets
		 * @private
		 */
		var lastRange;

		/**
		 * The editors locale
		 * @private
		 */
		var locale;

		/**
		 * Stores a cache of preloaded images
		 * @private
		 */
		var preLoadCache = [];

		/**
		 * The editors rangeHelper instance
		 * @type {$.sceditor.rangeHelper}
		 * @private
		 */
		var rangeHelper;

		var $blurElm;

		var	init,
			replaceEmoticons,
			handleCommand,
			saveRange,
			handlePasteEvt,
			handlePasteData,
			handleKeyPress,
			handleFormReset,
			handleMouseDown,
			initEditor,
			initToolBar,
			initKeyPressFuncs,
			initResize,
			documentClickHandler,
			formSubmitHandler,
			initEmoticons,
			getWysiwygDoc,
			handleWindowResize,
			initLocale,
			updateToolBar,
			sourceEditorSelectedText,
			autofocus;

		/**
		 * All the commands supported by the editor
		 */
	    options = options || {};
		base.commands = $.extend({}, (options.commands || $.sceditor.commands));

		/**
		 * Initializer. Creates the editor iframe and textarea
		 * @private
		 * @name sceditor.init
		 */
		init = function () {
			$original.data("sceditor", base);
			base.opts = $.extend({}, $.sceditor.defaultOptions, options);

			// Load locale
			if(base.opts.locale && base.opts.locale !== "en")
				initLocale();

			// if either width or height are % based, add the resize handler to update the editor
			// when the window is resized
			var h = base.opts.height, w = base.opts.width;
			if((h && (h + "").indexOf("%") > -1) || (w && (w + "").indexOf("%") > -1))
				$(window).resize(handleWindowResize);

			$editorContainer = $('<div class="sceditor-container" />').insertAfter($original);

			// create the editor
			initToolBar();
			initEditor();
			initKeyPressFuncs();

			if(base.opts.resizeEnabled)
				initResize();

			if(base.opts.id)
				$editorContainer.attr('id', base.opts.id);

			$(document).click(documentClickHandler);
			$(original.form)
				.attr('novalidate','novalidate')
				.bind("reset", handleFormReset)
				.submit(formSubmitHandler);

			// load any textarea value into the editor
			base.val($original.hide().val());

			if(base.opts.autofocus)
				autofocus();

			// force into source mode if is a browser that can't handle
			// full editing
			if(!$.sceditor.isWysiwygSupported)
				base.toggleSourceMode();

			if(base.opts.toolbar.indexOf('emoticon') !== -1)
				initEmoticons();

			// Can't use load event as it gets fired before CSS is loaded
			// in some browsers
			if(base.opts.autoExpand)
				var interval = setInterval(function() {
					if (!document.readyState || document.readyState === "complete") {
						base.expandToContent();
						clearInterval(interval);
					}
				}, 10);
		};

		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		initEditor = function () {
			var $doc, $body;

			$sourceEditor  = $('<textarea></textarea>').hide();
			$wysiwygEditor = $('<iframe frameborder="0"></iframe>');

			if(window.location.protocol === "https:")
				$wysiwygEditor.attr("src", "javascript:false");

			// add the editor to the HTML and store the editors element
			$editorContainer.append($wysiwygEditor).append($sourceEditor);
			wysiwygEditor = $wysiwygEditor[0];
			sourceEditor  = $sourceEditor[0];

			base.width(base.opts.width || $original.width());
			base.height(base.opts.height || $original.height());

			getWysiwygDoc().open();
			getWysiwygDoc().write(_tmpl("html", {
				charset: base.opts.charset,
				style: base.opts.style
			}));
			getWysiwygDoc().close();

			base.readOnly(!!base.opts.readOnly);

			$doc  = $(getWysiwygDoc());
			$body = $doc.find("body");

			// Add IE version class to the HTML element so can apply
			// conditional styling without CSS hacks
			if($.sceditor.ie)
				$doc.find("html").addClass('ie' + $.sceditor.ie);

			// iframe overflow fix
			if(/iPhone|iPod|iPad| wosbrowser\//i.test(navigator.userAgent) || $.sceditor.ie)
				$body.height('100%');

			// set the key press event
			$body.keypress(handleKeyPress);
			$doc.keypress(handleKeyPress)
				.mousedown(handleMouseDown)
				.bind("beforedeactivate keyup", saveRange)
				.focus(function() {
					lastRange = null;
				});

			// auto-update original textbox on blur if option set to true
			if(base.opts.autoUpdate){
				$body.bind("blur", base.updateOriginal);
				$doc.bind("blur", base.updateOriginal);
			}

			if(base.opts.rtl)
			{
				$body.attr('dir', 'rtl');
				$sourceEditor.attr('dir', 'rtl');
			}

			if(base.opts.enablePasteFiltering)
				$body.bind("paste", handlePasteEvt);

			if(base.opts.autoExpand)
				$doc.bind("keyup", base.expandToContent);

			rangeHelper = new $.sceditor.rangeHelper(wysiwygEditor.contentWindow);
		};

		/**
		 * Creates the toolbar and appends it to the container
		 * @private
		 */
		initToolBar = function () {
			var	$group, $button, buttons, i, x, buttonClick,
				groups = base.opts.toolbar.split("|");

			buttonClick = function () {
				var $this = $(this);
				if(!$this.hasClass('disabled'))
					handleCommand($this, base.commands[$this.data("sceditor-command")]);

				return false;
			};

			$toolbar = $('<div class="sceditor-toolbar" />');
			for (i=0; i < groups.length; i++) {
				$group   = $('<div class="sceditor-group" />');
				buttons = groups[i].split(",");

				for (x=0; x < buttons.length; x++) {
					// the button must be a valid command otherwise ignore it
					if(!base.commands[buttons[x]])
						continue;

					$button = _tmpl("toolbarButton", {
							name: buttons[x],
							dispName: base.commands[buttons[x]].tooltip || buttons[x]
						}, true)
						.click(buttonClick)
						.data('sceditor-txtmode', !!base.commands[buttons[x]].txtExec)
						.data('sceditor-wysiwygmode', !!base.commands[buttons[x]].exec);

					if(base.commands[buttons[x]].tooltip)
						$button.attr('title', base._(base.commands[buttons[x]].tooltip));

					if(!base.commands[buttons[x]].exec)
						$button.addClass('disabled');

					$group.append($button);
				}
				$toolbar.append($group);
			}

			// append the toolbar to the toolbarContainer option if given
			if(base.opts.toolbarContainer)
				$(base.opts.toolbarContainer).append($toolbar);
			else
				$editorContainer.append($toolbar);
		};

		/**
		 * Autofocus the editor
		 * @private
		 */
		autofocus = function() {
			var	rng,
				doc  = wysiwygEditor.contentWindow.document,
				body = doc.body;

			if(!doc.createRange)
				return base.focus();

			if(!body.firstChild)
				return;

			rng = doc.createRange();
			rng.setStart(body.firstChild, 0);
			rng.setEnd(body.firstChild, 0);

			rangeHelper.selectRange(rng);
			body.focus();
		};

		/**
		 * Gets the readOnly property of the editor
		 *
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name readOnly
		 * @return {boolean}
		 */
		/**
		 * Sets the readOnly property of the editor
		 *
		 * @param {boolean} readOnly
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name readOnly^2
		 * @return {this}
		 */
		base.readOnly = function(readOnly) {
			if(typeof readOnly !== 'boolean')
				return $sourceEditor.attr('readonly') === 'readonly';

			getWysiwygDoc().body.contentEditable = !readOnly;

			if(!readOnly)
				$sourceEditor.removeAttr('readonly');
			else
				$sourceEditor.attr('readonly', 'readonly');

			updateToolBar(readOnly);

			return this;
		};

		/**
		 * Updates the toolbar to disable/enable the appropriate buttons
		 * @private
		 */
		updateToolBar = function(disable) {
			var inSourceMode = base.inSourceMode();

			$toolbar.find('.sceditor-button').removeClass('disabled').each(function () {
				var button = $(this);

				if(disable === true || (inSourceMode && !button.data('sceditor-txtmode')))
					button.addClass('disabled');
				else if (!inSourceMode && !button.data('sceditor-wysiwygmode'))
					button.addClass('disabled');
			});
		};

		/**
		 * Creates an array of all the key press functions
		 * like emoticons, ect.
		 * @private
		 */
		initKeyPressFuncs = function () {
			$.each(base.commands, function (command, values) {
				if(values.keyPress)
					keyPressFuncs.push(values.keyPress);
			});
		};

		/**
		 * Gets the width of the editor in pixels
		 *
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name width
		 * @return {int}
		 */
		/**
		 * Sets the width of the editor
		 *
		 * @param {int} width Width in pixels
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name width^2
		 * @return {this}
		 */
		base.width = function (width) {
			if(!width)
				return $editorContainer.width();

			if(base.width() !== width)
			{
				$editorContainer.width(width);

				// fix the height and width of the textarea/iframe
				$wysiwygEditor.width(width);
				$wysiwygEditor.width(width + (width - $wysiwygEditor.outerWidth(true)));

				$sourceEditor.width(width);
				$sourceEditor.width(width + (width - $sourceEditor.outerWidth(true)));
			}

			return this;
		};

		/**
		 * Gets the height of the editor in px
		 *
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name height
		 * @return {int}
		 */
		/**
		 * Sets the height of the editor
		 *
		 * @param {int} height Height in px
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name height^2
		 * @return {this}
		 */
		base.height = function (height) {
			if(!height)
				return $editorContainer.height();

			if(base.height() !== height)
			{
				$editorContainer.height(height);

				height -= !base.opts.toolbarContainer ? $toolbar.outerHeight(true) : 0;

				// fix the height and width of the textarea/iframe
				$wysiwygEditor.height(height);
				$wysiwygEditor.height(height + (height - $wysiwygEditor.outerHeight(true)));

				$sourceEditor.height(height);
				$sourceEditor.height(height + (height - $sourceEditor.outerHeight(true)));
			}

			return this;
		};

		/**
		 * Expands the editor to the size of it's content
		 *
		 * @since 1.3.5
		 * @param {Boolean} [ignoreMaxHeight=false]
		 * @function
		 * @name expandToContent
		 * @memberOf jQuery.sceditor.prototype
		 * @see #resizeToContent
		 */
		base.expandToContent = function(ignoreMaxHeight) {
			var	doc           = getWysiwygDoc(),
				currentHeight = $editorContainer.height(),
				height        = doc.body.scrollHeight || doc.documentElement.scrollHeight,
				padding       = (currentHeight - $wysiwygEditor.height()),
				maxHeight     = base.opts.resizeMaxHeight || ((base.opts.height || $original.height()) * 2);

			height += padding;

			if(ignoreMaxHeight !== true && height > maxHeight)
				height = maxHeight;

			if(height > currentHeight)
				base.height(height);
		};

		/**
		 * Creates the resizer.
		 * @private
		 */
		initResize = function () {
			var	minHeight, maxHeight, minWidth, maxWidth, mouseMoveFunc,
				$grip       = $('<div class="sceditor-grip" />'),
				// cover is used to cover the editor iframe so document still gets mouse move events
				$cover      = $('<div class="sceditor-resize-cover" />'),
				startX      = 0,
				startY      = 0,
				startWidth  = 0,
				startHeight = 0,
				origWidth   = $editorContainer.width(),
				origHeight  = $editorContainer.height(),
				dragging    = false;

			minHeight = base.opts.resizeMinHeight || origHeight / 1.5;
			maxHeight = base.opts.resizeMaxHeight || origHeight * 2.5;
			minWidth  = base.opts.resizeMinWidth  || origWidth  / 1.25;
			maxWidth  = base.opts.resizeMaxWidth  || origWidth  * 1.25;

			mouseMoveFunc = function (e) {
				var	newHeight = startHeight + (e.pageY - startY),
					newWidth  = startWidth  + (e.pageX - startX);

				if(maxWidth > 0 && newWidth > maxWidth)
					newWidth = maxWidth;

				if(maxHeight > 0 && newHeight > maxHeight)
					newHeight = maxHeight;

				if (base.opts.resizeWidth && newWidth >= minWidth && (maxWidth < 0 || newWidth <= maxWidth))
					base.width(newWidth);

				if (base.opts.resizeHeight && newHeight >= minHeight && (maxHeight < 0 || newHeight <= maxHeight))
					base.height(newHeight);

				e.preventDefault();
			};

			$editorContainer.append($grip);
			$editorContainer.append($cover.hide());

			$grip.mousedown(function (e) {
				startX      = e.pageX;
				startY      = e.pageY;
				startWidth  = $editorContainer.width();
				startHeight = $editorContainer.height();
				dragging    = true;

				$editorContainer.addClass('resizing');
				$cover.show();
				$(document).bind('mousemove', mouseMoveFunc);
				e.preventDefault();
			});

			$(document).mouseup(function (e) {
				if(!dragging)
					return;

				dragging = false;
				$cover.hide();

				$editorContainer.removeClass('resizing');
				$(document).unbind('mousemove', mouseMoveFunc);
				e.preventDefault();
			});
		};

		/**
		 * Handles the forms submit event
		 * @private
		 */
		formSubmitHandler = function(e) {
			base.updateOriginal();
			$(this).removeAttr('novalidate');

			if(this.checkValidity && !this.checkValidity())
				e.preventDefault();

			$(this).attr('novalidate','novalidate');
			base.blur();
		};

		/**
		 * Destroys the editor, removing all elements and
		 * event handlers.
		 *
		 * @function
		 * @name destroy
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.destroy = function () {
			$(document).unbind('click', documentClickHandler);
			$(window).unbind('resize', handleWindowResize);

			$(original.form).removeAttr('novalidate')
				.unbind('submit', formSubmitHandler)
				.unbind("reset", handleFormReset);

			$(getWysiwygDoc()).find('*').remove();
			$(getWysiwygDoc()).unbind("keypress mousedown beforedeactivate keyup focus paste keypress");

			$editorContainer.find('*').remove();
			$editorContainer.remove();

			$original.removeData("sceditor").removeData("sceditorbbcode").show();
		};

		/**
		 * Preloads the emoticon images
		 * Idea from: http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript
		 * @private
		 */
		initEmoticons = function () {
			// prefix emoticon root to emoticon urls
			if(base.opts.emoticonsRoot && base.opts.emoticons)
			{
				$.each(base.opts.emoticons, function (idx, emoticons) {
					$.each(emoticons, function (key, url) {
						base.opts.emoticons[idx][key] = base.opts.emoticonsRoot + url;
					});
				});
			}

			var	emoticons = $.extend({}, base.opts.emoticons.more, base.opts.emoticons.dropdown, base.opts.emoticons.hidden),
				emoticon;

			$.each(emoticons, function (key, url) {
				emoticon     = document.createElement('img');
				emoticon.src = url;
				preLoadCache.push(emoticon);
			});
		};

		/**
		 * Creates a menu item drop down
		 *
		 * @param HTMLElement	menuItem	The button to align the drop down with
		 * @param string	dropDownName	Used for styling the dropown, will be a class sceditor-dropDownName
		 * @param string	content			The HTML content of the dropdown
		 * @param bool		ieUnselectable	If to add the unselectable attribute to all the contents elements. Stops IE from deselecting the text in the editor
		 * @function
		 * @name createDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.createDropDown = function (menuItem, dropDownName, content, ieUnselectable) {
			base.closeDropDown();

			// IE needs unselectable attr to stop it from unselecting the text in the editor.
			// The editor can cope if IE does unselect the text it's just not nice.
			if(ieUnselectable !== false) {
				$(content).find(':not(input,textarea)')
					.filter(function() {
						return this.nodeType===1;
					})
					.attr('unselectable', 'on');
			}

			var css = {
				top: menuItem.offset().top,
				left: menuItem.offset().left,
				marginTop: menuItem.outerHeight()
			};

			$.extend(css, base.opts.dropDownCss);

			$dropdown = $('<div class="sceditor-dropdown sceditor-' + dropDownName + '" />')
				.css(css)
				.append(content)
				.appendTo($('body'))
				.click(function (e) {
					// stop clicks within the dropdown from being handled
					e.stopPropagation();
				});
		};

		/**
		 * Handles any document click and closes the dropdown if open
		 * @private
		 */
		documentClickHandler = function (e) {
			// ignore right clicks
			if(e.which !== 3)
				base.closeDropDown();
		};

		handlePasteEvt = function(e) {
			var	html,
				elm             = getWysiwygDoc().body,
				checkCount      = 0,
				pastearea       = elm.ownerDocument.createElement('div'),
				prePasteContent = elm.ownerDocument.createDocumentFragment();

			rangeHelper.saveRange();
			document.body.appendChild(pastearea);

			if (e && e.clipboardData && e.clipboardData.getData)
			{
				if ((html = e.clipboardData.getData('text/html')) || (html = e.clipboardData.getData('text/plain')))
				{
					pastearea.innerHTML = html;

					handlePasteData(elm, pastearea);

					e.stopPropagation();
					e.preventDefault();
					return false;
				}
			}

			while(elm.firstChild)
				prePasteContent.appendChild(elm.firstChild);

			function handlePaste(elm, pastearea) {
				if (elm.childNodes.length > 0)
				{
					while(elm.firstChild)
						pastearea.appendChild(elm.firstChild);

					while(prePasteContent.firstChild)
						elm.appendChild(prePasteContent.firstChild);

					handlePasteData(elm, pastearea);
				}
				else
				{
					// Allow max 25 checks before giving up.
					// Needed inscase empty input is pasted or
					// something goes wrong.
					if(checkCount > 25)
					{
						while(prePasteContent.firstChild)
							elm.appendChild(prePasteContent.firstChild);

						rangeHelper.restoreRange();
						return;
					}

					++checkCount;
					setTimeout(function () {
						handlePaste(elm, pastearea);
					}, 20);
				}
			}
			handlePaste(elm, pastearea);

			base.focus();

			return true;
		};

		/**
		 * @param {Element} elm
		 * @param {Element} pastearea
		 * @private
		 */
		handlePasteData = function(elm, pastearea) {
			// fix any invalid nesting
			$.sceditor.dom.fixNesting(pastearea);

			var pasteddata = pastearea.innerHTML;

			if(base.opts.getHtmlHandler)
				pasteddata = base.opts.getHtmlHandler(pasteddata, $(pastearea));

			pastearea.parentNode.removeChild(pastearea);

			if(base.opts.getTextHandler)
				pasteddata = base.opts.getTextHandler(pasteddata, true);

			rangeHelper.restoreRange();
			rangeHelper.insertHTML(pasteddata);
		};

		/**
		 * Closes the current drop down
		 *
		 * @param bool focus If to focus the editor on close
		 * @function
		 * @name closeDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.closeDropDown = function (focus) {
			if($dropdown) {
				$dropdown.remove();
				$dropdown = null;
			}

			if(focus === true)
				base.focus();
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
		 * <p>Inserts HTML into WYSIWYG editor.</p>
		 *
		 * <p>If endHtml is specified instead of the inserted HTML replacing the selected
		 * text the selected text will be placed between html and endHtml. If there is
		 * no selected text html and endHtml will be concated together.</p>
		 *
		 * @param {string} html
		 * @param {string} [endHtml=null]
		 * @param {boolean} [overrideCodeBlocking=false]
		 * @function
		 * @name wysiwygEditorInsertHtml
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.wysiwygEditorInsertHtml = function (html, endHtml, overrideCodeBlocking) {
			base.focus();

			// don't apply to code elements
			if(!overrideCodeBlocking && ($(rangeHelper.parentNode()).is('code') ||
				$(rangeHelper.parentNode()).parents('code').length !== 0))
				return;

			rangeHelper.insertHTML(html, endHtml);
		};

		/**
		 * Like wysiwygEditorInsertHtml except it will convert any HTML into text
		 * before inserting it.
		 *
		 * @param {String} text
		 * @param {String} [endText=null]
		 * @function
		 * @name wysiwygEditorInsertText
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.wysiwygEditorInsertText = function (text, endText) {
			var escape = function(str) {
				if(!str)
					return str;

				return str.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/ /g, "&nbsp;")
					.replace(/\r\n|\r/g, "\n")
					.replace(/\n/g, "<br />");
			};

			base.wysiwygEditorInsertHtml(escape(text), escape(endText));
		};

		/**
		 * <p>Inserts text into either WYSIWYG or sourceEditor depending on which
		 * mode the editor is in.</p>
		 *
		 * <p>If endText is specified any selected text will be placed between
		 * text and endText. If no text is selected text and endText will
		 * just be concated together.</p>
		 *
		 * @param {String} text
		 * @param {String} [endText=null]
		 * @since 1.3.5
		 * @function
		 * @name insertText
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.insertText = function (text, endText) {
			if(base.inSourceMode())
				base.sourceEditorInsertText(text, endText);
			else
				base.wysiwygEditorInsertText(text, endText);

			return this;
		};

		/**
		 * Like wysiwygEditorInsertHtml but inserts text into the text
		 * (source mode) editor instead
		 *
		 * @param {String} text
		 * @param {String} [endText=null]
		 * @since 1.4.0
		 * @function
		 * @name sourceEditorInsertText
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.sourceEditorInsertText = function (text, endText) {
			var range, start, end, txtLen, scrollTop;

			scrollTop = sourceEditor.scrollTop;
			sourceEditor.focus();

			if(typeof sourceEditor.selectionStart !== "undefined")
			{
				start  = sourceEditor.selectionStart;
				end    = sourceEditor.selectionEnd;
				txtLen = text.length;

				if(endText)
					text += sourceEditor.value.substring(start, end) + endText;

				sourceEditor.value = sourceEditor.value.substring(0, start) + text + sourceEditor.value.substring(end, sourceEditor.value.length);

				if(endText)
					sourceEditor.selectionStart = (start + text.length) - endText.length;
				else
					sourceEditor.selectionStart = start + text.length;

				sourceEditor.selectionEnd = sourceEditor.selectionStart;
			}
			else if(typeof document.selection.createRange !== "undefined")
			{
				range = document.selection.createRange();

				if(endText)
					text += range.text + endText;

				range.text = text;

				if(endText)
					range.moveEnd('character', 0-endText.length);

				range.moveStart('character', range.End - range.Start);
				range.select();
			}
			else
				sourceEditor.value += text + endText;

			sourceEditor.scrollTop = scrollTop;
			sourceEditor.focus();
		};

		/**
		 * Gets the current rangeHelper instance
		 *
		 * @return jQuery.sceditor.rangeHelper
		 * @function
		 * @name getRangeHelper
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getRangeHelper = function () {
			return rangeHelper;
		};

		/**
		 * <p>Gets the value of the editor.</p>
		 *
		 * <p>If the editor is in WYSIWYG mode it will return the filtered
		 * HTML from it (converted to BBCode if using the BBCode plugin).
		 * It it's in Source Mode it will return the unfiltered contents
		 * of the source editor (if using the BBCode plugin this will be
		 * BBCode again).</p>
		 *
		 * @since 1.3.5
		 * @return {string}
		 * @function
		 * @name val
		 * @memberOf jQuery.sceditor.prototype
		 */
		/**
		 * Sets the value of the editor
		 *
		 * @param {String} val
		 * @param {Boolean} [filter]
		 * @return {this}
		 * @since 1.3.5
		 * @function
		 * @name val^2
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.val = function (val, filter) {
			if(typeof val === "string")
			{
				if(base.inSourceMode())
					base.setSourceEditorValue(val);
				else
				{
					if(filter !== false && base.opts.getTextHandler)
						val = base.opts.getTextHandler(val);

					base.setWysiwygEditorValue(val);
				}

				return this;
			}

			return base.inSourceMode() ?
				base.getSourceEditorValue(false) :
				base.getWysiwygEditorValue();
		};

		/**
		 * <p>Inserts HTML/BBCode into the editor</p>
		 *
		 * <p>If end is supplied any slected text will be placed between
		 * start and end. If there is no selected text start and end
		 * will be concated together.</p>
		 *
		 * @param {String} start
		 * @param {String} [end=null]
		 * @param {Boolean} [filter=true]
		 * @param {Boolean} [convertEmoticons=true]
		 * @return {this}
		 * @since 1.3.5
		 * @function
		 * @name insert
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.insert = function (start, end, filter, convertEmoticons) {
			if(base.inSourceMode())
				base.sourceEditorInsertText(start, end);
			else
			{
				if(end)
				{
					var	html = base.getRangeHelper().selectedHtml(),
						frag = $('<div>').appendTo($('body')).hide().html(html);

					if(filter !== false && base.opts.getHtmlHandler)
					{
						html = base.opts.getHtmlHandler(html, frag);
						frag.remove();
					}

					start += html + end;
				}

				if(filter !== false && base.opts.getTextHandler)
					start = base.opts.getTextHandler(start, true);

				if(convertEmoticons !== false)
					start = replaceEmoticons(start);

				base.wysiwygEditorInsertHtml(start);
			}

			return this;
		};

		/**
		 * Gets the WYSIWYG editors HTML which is between the body tags
		 *
		 * @param {bool} [filter=true]
		 * @return {string}
		 * @function
		 * @name getWysiwygEditorValue
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getWysiwygEditorValue = function (filter) {
			var	$body = $wysiwygEditor.contents().find("body"),
				html;

			// save the range before the DOM gets messed with
			rangeHelper.saveRange();

			// fix any invalid nesting
			$.sceditor.dom.fixNesting($body.get(0));
			html = $body.html();

			if(filter !== false && base.opts.getHtmlHandler)
				html = base.opts.getHtmlHandler(html, $body);

			// restore the range.
			rangeHelper.restoreRange();
			// remove the last stored range for IE as it no longer applies
			lastRange = null;

			return html;
		};

		/**
		 * Gets the text editor value
		 *
		 * @param {bool} [filter=true]
		 * @return {string}
		 * @function
		 * @since 1.4.0
		 * @name getSourceEditorValue
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getSourceEditorValue = function (filter) {
			var val = $sourceEditor.val();

			if(filter !== false && base.opts.getTextHandler)
				val = base.opts.getTextHandler(val);

			return val;
		};

		/**
		 * Sets the WYSIWYG HTML editor value. Should only be the HTML
		 * contained within the body tags
		 *
		 * @param {string} value
		 * @function
		 * @name setWysiwygEditorValue
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.setWysiwygEditorValue = function (value) {
			if(!value)
				value = '<p>' + ($.sceditor.ie ? '' : '<br />') + '</p>';

			getWysiwygDoc().body.innerHTML = replaceEmoticons(value);
		};

		/**
		 * Sets the text editor value
		 *
		 * @param {string} value
		 * @function
		 * @name setSourceEditorValue
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.setSourceEditorValue = function (value) {
			$sourceEditor.val(value);
		};

		/**
		 * Updates the textarea that the editor is replacing
		 * with the value currently inside the editor.
		 *
		 * @function
		 * @name updateOriginal
		 * @since 1.4.0
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.updateOriginal = function () {
			$original.val(base.val());
		};

		/**
		 * Replaces any emoticon codes in the passed HTML with their emoticon images
		 * @private
		 */
		replaceEmoticons = function (html) {
			if(base.opts.toolbar.indexOf('emoticon') === -1)
				return html;

			var emoticons = $.extend({}, base.opts.emoticons.more, base.opts.emoticons.dropdown, base.opts.emoticons.hidden);

			$.each(emoticons, function (key, url) {
				// escape the key before using it as a regex
				// and append the regex to only find emoticons outside
				// of HTML tags
				var	reg   = $.sceditor.regexEscape(key) + "(?=([^\\<\\>]*?<(?!/code)|[^\\<\\>]*?$))",
					group = '';

				// Make sure the emoticon is surrounded by whitespace or is at the start/end of a string or html tag
				if(base.opts.emoticonsCompat)
				{
					reg   = "((>|^|\\s|\xA0|\u2002|\u2003|\u2009|&nbsp;))" + reg + "(?=(\\s|$|<|\xA0|\u2002|\u2003|\u2009|&nbsp;))";
					group = '$1';
				}

				html = html.replace(
					new RegExp(reg, 'gm'),
					group + _tmpl('emoticon', {key: key, url: url})
				);
			});

			return html;
		};

		/**
		 * If the editor is in source code mode
		 *
		 * @return {bool}
		 * @function
		 * @name inSourceMode
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.inSourceMode = function () {
			return $editorContainer.hasClass('sourceMode');
		};

		/**
		 * Gets if the editor is in sourceMode
		 *
		 * @return boolean
		 * @function
		 * @name sourceMode
		 * @memberOf jQuery.sceditor.prototype
		 */
		/**
		 * Sets if the editor is in sourceMode
		 *
		 * @param {bool} enable
		 * @return {this}
		 * @function
		 * @name sourceMode^2
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.sourceMode = function (enable) {
			if(typeof enable !== 'boolean')
				return base.inSourceMode();

			if((base.inSourceMode() && !enable) || (!base.inSourceMode() && enable))
				base.toggleSourceMode();

			return this;
		};

		/**
		 * Switches between the WYSIWYG and source modes
		 *
		 * @function
		 * @name toggleSourceMode
		 * @since 1.4.0
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.toggleSourceMode = function () {
			// don't allow switching to WYSIWYG if doesn't support it
			if(!$.sceditor.isWysiwygSupported && base.inSourceMode())
				return;

			if(base.inSourceMode())
				base.setWysiwygEditorValue(base.getSourceEditorValue());
			else
				base.setSourceEditorValue(base.getWysiwygEditorValue());

			lastRange = null;
			$sourceEditor.toggle();
			$wysiwygEditor.toggle();

			if(!base.inSourceMode())
				$editorContainer.removeClass('wysiwygMode').addClass('sourceMode');
			else
				$editorContainer.removeClass('sourceMode').addClass('wysiwygMode');

			updateToolBar();
		};

		sourceEditorSelectedText = function () {
			sourceEditor.focus();

			if(sourceEditor.selectionStart != null)
				return sourceEditor.value.substring(sourceEditor.selectionStart, sourceEditor.selectionEnd);
			else if(document.selection.createRange)
				return document.selection.createRange().text;
		};

		/**
		 * Handles the passed command
		 * @private
		 */
		handleCommand = function (caller, command) {
			// check if in text mode and handle text commands
			if(base.inSourceMode())
			{
				if(command.txtExec)
				{
					if($.isArray(command.txtExec))
						base.sourceEditorInsertText.apply(base, command.txtExec);
					else
						command.txtExec.call(base, caller, sourceEditorSelectedText());
				}

				return;
			}

			if(!command.exec)
				return;

			if($.isFunction(command.exec))
				command.exec.call(base, caller);
			else
				base.execCommand(command.exec, command.hasOwnProperty("execParam") ? command.execParam : null);
		};

		/**
		 * Fucuses the editors input area
		 *
		 * @return {this}
		 * @function
		 * @name focus
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.focus = function () {
			if(!base.inSourceMode())
			{
				wysiwygEditor.contentWindow.focus();

				// Needed for IE < 9
				if(lastRange)
				{
					rangeHelper.selectRange(lastRange);

					// remove the stored range after being set.
					// If the editor loses focus it should be
					// saved again.
					lastRange = null;
				}
			}
			else
				sourceEditor.focus();

			return this;
		};

		/**
		 * Blurs the editors input area
		 *
		 * @return {this}
		 * @function
		 * @name blur
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.3.6
		 */
		base.blur = function () {
			// Must use an element that isn't display:hidden or visibility:hidden for iOS
			// so create a special blur element to use
			if(!$blurElm)
				$blurElm = $('<input style="width:0; height:0; opacity:0; filter: alpha(opacity=0)" type="text" />').appendTo($editorContainer);

			$blurElm.removeAttr("disabled")
				.focus()
				.blur()
				.attr("disabled", "disabled");

			return this;
		};

		/**
		 * Saves the current range. Needed for IE because it forgets
		 * where the cursor was and what was selected
		 * @private
		 */
		saveRange = function () {
			/* this is only needed for IE */
			if(!$.sceditor.ie)
				return;

			lastRange = rangeHelper.selectedRange();
		};

		/**
		 * Executes a command on the WYSIWYG editor
		 *
		 * @param {String} command
		 * @param {String|Boolean} [param]
		 * @function
		 * @name execCommand
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.execCommand = function (command, param) {
			var	executed    = false,
				$parentNode = $(rangeHelper.parentNode());

			base.focus();

			// don't apply any comannds to code elements
			if($parentNode.is('code') || $parentNode.parents('code').length !== 0)
				return;

			if(getWysiwygDoc())
			{
				try
				{
					executed = getWysiwygDoc().execCommand(command, false, param);
				}
				catch (e) {}
			}

			// show error if execution failed and an error message exists
			if(!executed && base.commands[command] && base.commands[command].errorMessage)
				alert(base._(base.commands[command].errorMessage));
		};

		/**
		 * Handles any key press in the WYSIWYG editor
		 *
		 * @private
		 */
		handleKeyPress = function(e) {
			base.closeDropDown();

			var $parentNode = $(rangeHelper.parentNode());

			// "Fix" (ok it's a cludge) for blocklevel elements being duplicated in some browsers when
			// enter is pressed instead of inserting a newline
			if(e.which === 13)
			{
				if($parentNode.is('code,blockquote,pre') || $parentNode.parents('code,blockquote,pre').length !== 0)
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
			if($parentNode.is('code') || $parentNode.parents('code').length !== 0)
				return;

			var i = keyPressFuncs.length;
			while(i--)
				keyPressFuncs[i].call(base, e, wysiwygEditor, $sourceEditor);
		};

		/**
		 * Handles any mousedown press in the WYSIWYG editor
		 * @private
		 */
		handleFormReset = function() {
			base.val($original.val());
		};

		/**
		 * Handles any mousedown press in the WYSIWYG editor
		 * @private
		 */
		handleMouseDown = function() {
			base.closeDropDown();
			lastRange = null;
		};

		/**
		 * Handles the window resize event. Needed to resize then editor
		 * when the window size changes in fluid designs.
		 * @ignore
		 */
		handleWindowResize = function() {
			if(base.opts.height && base.opts.height.toString().indexOf("%") > -1)
				base.height($editorContainer.parent().height() *
					(parseFloat(base.opts.height) / 100));

			if(base.opts.width && base.opts.width.toString().indexOf("%") > -1)
				base.width($editorContainer.parent().width() *
					(parseFloat(base.opts.width) / 100));
		};

		/**
		 * Translates the string into the locale language.
		 *
		 * Replaces any {0}, {1}, {2}, ect. with the params provided.
		 *
		 * @param {string} str
		 * @param {...String} args
		 * @return {string}
		 * @function
		 * @name _
		 * @memberOf jQuery.sceditor.prototype
		 */
		base._ = function() {
			var args = arguments;

			if(locale && locale[args[0]])
				args[0] = locale[args[0]];

			return args[0].replace(/\{(\d+)\}/g, function(str, p1) {
				return typeof args[p1-0+1] !== "undefined" ?
					args[p1-0+1] :
					'{' + p1 + '}';
			});
		};

		/**
		 * Init the locale variable with the specified locale if possible
		 * @private
		 * @return void
		 */
		initLocale = function() {
			if($.sceditor.locale[base.opts.locale])
				locale = $.sceditor.locale[base.opts.locale];
			else
			{
				var lang = base.opts.locale.split("-");

				if($.sceditor.locale[lang[0]])
					locale = $.sceditor.locale[lang[0]];
			}

			if(locale && locale.dateFormat)
				base.opts.dateFormat = locale.dateFormat;
		};

		// run the initializer
		init();
	};

	/**
	 * <p>Detects which version of IE is being used if any.</p>
	 *
	 * <p>Will be the IE version number or undefined if not IE.</p>
	 *
	 * Source: https://gist.github.com/527683
	 * @type {int}
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.ie = (function(){
		var	undef,
			v   = 3,
			div = document.createElement('div'),
			all = div.getElementsByTagName('i');

		do {
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->';
		} while (all[0]);

		return v > 4 ? v : undef;
	}());

	/**
	 * If the browser supports WYSIWYG editing (e.g. older mobile browsers).
	 *
	 * @type {bool}
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.isWysiwygSupported = (function() {
		var	contentEditable          = $('<div contenteditable="true">')[0].contentEditable,
			contentEditableSupported = typeof contentEditable !== 'undefined' && contentEditable !== 'inherit',
			userAgent                = navigator.userAgent,
			match;

		if(!contentEditableSupported)
			return false;

		// I think blackberry supports it or will at least
		// give a valid value for the contentEditable detection above
		// so it's' not included here.


		// The latest WebOS dose support contentEditable.
		// But I still till need to check if all supported
		// versions of WebOS support contentEditable


		// I hate having to use UA sniffing but as some mobile browsers say they support
		// contentediable/design mode when it isn't usable (i.e. you can't enter text, ect.).
		// This is the only way I can think of to detect them. It's also how every other editor
		// I've seen detects them
		var isUnsupported = /Opera Mobi|Opera Mini/i.test(userAgent);

		if(/Android/i.test(userAgent))
		{
			isUnsupported = true;

			if(/Safari/.test(userAgent))
			{
				// android browser 534+ supports content editable
				match = /Safari\/(\d+)/.exec(userAgent);
				isUnsupported = (!match || !match[1] ? true : match[1] < 534);
			}
		}

		// Amazon Silk doesn't but as it uses webkit like android
		// it might in a later version if it uses version >= 534
		if(/ Silk\//i.test(userAgent))
		{
			match = /AppleWebKit\/(\d+)/.exec(userAgent);
			isUnsupported = (!match || !match[1] ? true : match[1] < 534);
		}

		// iOS 5+ supports content editable
		if(/iPhone|iPod|iPad/i.test(userAgent))
			isUnsupported = !/OS [5-9](_\d)+ like Mac OS X/i.test(userAgent);

		// FireFox dose support WYSIWYG on mobiles so override
		// any previous value if using FF
		if(/fennec/i.test(userAgent))
			isUnsupported = false;

		return !isUnsupported;
	}());

	/**
	 * Escapes a string so it's safe to use in regex
	 *
	 * @param {string} str
	 * @return {string}
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.regexEscape = function (str) {
		return str.replace(/[\$\?\[\]\.\*\(\)\|\\]/g, "\\$&")
			.replace("<", "&lt;")
			.replace(">", "&gt;");
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
			_dropDown: function(editor, caller, callback) {
				var	fonts   = editor.opts.fonts.split(","),
					content = $("<div />"),
					/** @private */
					clickFunc = function () {
						callback($(this).data('font'));
						editor.closeDropDown(true);
						return false;
					};

				for (var i=0; i < fonts.length; i++)
					content.append(_tmpl('fontOpt', {font: fonts[i]}, true).click(clickFunc));

				editor.createDropDown(caller, "font-picker", content);
			},
			exec: function (caller) {
				var editor = this;

				$.sceditor.command.get('font')._dropDown(
					editor,
					caller,
					function(fontName) {
						editor.execCommand("fontname", fontName);
					}
				);
			},
			tooltip: "Font Name"
		},
		// END_COMMAND
		// START_COMMAND: Size
		size: {
			_dropDown: function(editor, caller, callback) {
				var	content   = $("<div />"),
					/** @private */
					clickFunc = function (e) {
						callback($(this).data('size'));
						editor.closeDropDown(true);
						e.preventDefault();
					};

				for (var i=1; i<= 7; i++)
					content.append(_tmpl('sizeOpt', {size: i}, true).click(clickFunc));

				editor.createDropDown(caller, "fontsize-picker", content);
			},
			exec: function (caller) {
				var editor = this;

				$.sceditor.command.get('size')._dropDown(
					editor,
					caller,
					function(fontSize) {
						editor.execCommand("fontsize", fontSize);
					}
				);
			},
			tooltip: "Font Size"
		},
		// END_COMMAND
		// START_COMMAND: Colour
		color: {
			_dropDown: function(editor, caller, callback) {
				var	genColor     = {r: 255, g: 255, b: 255},
					content      = $("<div />"),
					colorColumns = editor.opts.colors?editor.opts.colors.split("|"):new Array(21),
					// IE is slow at string concation so use an array
					html         = [],
					htmlIndex    = 0;

				for (var i=0; i < colorColumns.length; ++i) {
					var colors = colorColumns[i]?colorColumns[i].split(","):new Array(21);

					html[htmlIndex++] = '<div class="sceditor-color-column">';

					for (var x=0; x < colors.length; ++x) {
						// use pre defined colour if can otherwise use the generated color
						var color = colors[x]?colors[x]:"#" + genColor.r.toString(16) + genColor.g.toString(16) + genColor.b.toString(16);

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
						callback($(this).attr('data-color'));
						editor.closeDropDown(true);
						e.preventDefault();
					});

				editor.createDropDown(caller, "color-picker", content);
			},
			exec: function (caller) {
				var editor = this;

				$.sceditor.command.get('color')._dropDown(
					editor,
					caller,
					function(color) {
						editor.execCommand("forecolor", color);
					}
				);
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
				var	val,
					editor  = this,
					content = _tmpl("pastetext", {
						label: editor._("Paste your text inside the following box:"),
						insert: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					val = content.find("#txt").val();

					if(val)
						editor.wysiwygEditorInsertText(val);

					editor.closeDropDown(true);
					e.preventDefault();
				});

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
					content = _tmpl("table", {
						rows: editor._("Rows:"),
						cols: editor._("Cols:"),
						insert: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					var	rows = content.find("#rows").val() - 0,
						cols = content.find("#cols").val() - 0,
						html = '<table>';

					if(rows < 1 || cols < 1)
						return;

					for (var row=0; row < rows; row++) {
						html += '<tr>';

						for (var col=0; col < cols; col++)
							html += '<td>' + ($.sceditor.ie ? '' : '<br class="sceditor-ignore" />') + '</td>';

						html += '</tr>';
					}

					html += '</table>';

					editor.wysiwygEditorInsertHtml(html);
					editor.closeDropDown(true);
					e.preventDefault();
				});

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
					content = _tmpl("image", {
						url: editor._("URL:"),
						width: editor._("Width (optional):"),
						height: editor._("Height (optional):"),
						insert: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					var	val    = content.find("#image").val(),
						width  = content.find("#width").val(),
						height = content.find("#height").val(),
						attrs  = '';

					if(width)
						attrs += ' width="' + width + '"';
					if(height)
						attrs += ' height="' + height + '"';

					if(val && val !== "http://")
						editor.wysiwygEditorInsertHtml('<img' + attrs + ' src="' + val + '" />');

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, "insertimage", content);
			},
			tooltip: "Insert an image"
		},
		// END_COMMAND

		// START_COMMAND: E-mail
		email: {
			exec: function (caller) {
				var	editor  = this,
					content = _tmpl("email", {
						label: editor._("E-mail:"),
						insert: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					var val = content.find("#email").val();

					if(val)
					{
						// needed for IE to reset the last range
						editor.focus();

						if(!editor.getRangeHelper().selectedHtml())
							editor.wysiwygEditorInsertHtml('<a href="' + 'mailto:' + val + '">' + val + '</a>');
						else
							editor.execCommand("createlink", 'mailto:' + val);
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, "insertemail", content);
			},
			tooltip: "Insert an email"
		},
		// END_COMMAND

		// START_COMMAND: Link
		link: {
			exec: function (caller) {
				var	editor  = this,
					content = _tmpl("link", {
						url: editor._("URL:"),
						desc: editor._("Description (optional):"),
						ins: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					var	val         = content.find("#link").val(),
						description = content.find("#des").val();

					if(val && val !== "http://") {
						// needed for IE to reset the last range
						editor.focus();

						if(!editor.getRangeHelper().selectedHtml() || description)
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
				});

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
				var	before = '<blockquote>',
					end    = '</blockquote>';

				// if there is HTML passed set end to null so any selected
				// text is replaced
				if(html)
				{
					author = (author ? '<cite>' + author + '</cite>' : '');
					before = before + author + html + end + '<br />';
					end    = null;
				}
				// if not add a newline to the end of the inserted quote
				else if(this.getRangeHelper().selectedHtml() === "")
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
					end     = (editor.opts.emoticonsCompat ? ' ' : ''),
					content = $('<div />'),
					line    = $('<div />');

				appendEmoticon = function (code, emoticon) {
					line.append($('<img />')
							.attr({
								src: emoticon,
								alt: code
							})
							.click(function (e) {
								editor.insert($(this).attr('alt') + end);
								editor.closeDropDown(true);
								e.preventDefault();
							})
						);

					if(line.children().length > 3) {
						content.append(line);
						line = $('<div />');
					}
				};

				$.each(editor.opts.emoticons.dropdown, appendEmoticon);

				if(line.children().length > 0)
					content.append(line);

				if(editor.opts.emoticons.more) {
					var more = $(
						this._('<a class="sceditor-more">{0}</a>', this._("More"))
					).click(function () {
						var	emoticons = $.extend({}, editor.opts.emoticons.dropdown, editor.opts.emoticons.more);
							content   = $('<div />');

						$.each(emoticons, appendEmoticon);

						if(line.children().length > 0)
							content.append(line);

						editor.createDropDown(caller, "insertemoticon", content);
						return false;
					});

					content.append(more);
				}

				editor.createDropDown(caller, "insertemoticon", content);
			},
			txtExec: function(caller) {
				$.sceditor.command.get('emoticon').exec.call(this, caller);
			},
			keyPress: function (e)
			{
				// make sure emoticons command is in the toolbar before running
				if(this.opts.toolbar.indexOf('emoticon') === -1)
					return;

				var	editor  = this,
					pos     = 0,
					curChar = String.fromCharCode(e.which);

				if(!editor.EmoticonsCache) {
					editor.EmoticonsCache = [];

					$.each($.extend({}, editor.opts.emoticons.more, editor.opts.emoticons.dropdown, editor.opts.emoticons.hidden), function(key, url) {
						editor.EmoticonsCache[pos++] = [
							key,
							_tmpl("emoticon", {key: key, url: url})
						];
					});

					editor.EmoticonsCache.sort(function(a, b){
						return a[0].length - b[0].length;
					});
				}

				if(!editor.longestEmoticonCode)
					editor.longestEmoticonCode = editor.EmoticonsCache[editor.EmoticonsCache.length - 1][0].length;

				if(editor.getRangeHelper().raplaceKeyword(editor.EmoticonsCache, true, true, editor.longestEmoticonCode, editor.opts.emoticonsCompat, curChar))
				{
					if(/^\s$/.test(curChar) && editor.opts.emoticonsCompat)
						return true;

					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			},
			tooltip: "Insert an emoticon"
		},
		// END_COMMAND

		// START_COMMAND: YouTube
		youtube: {
			_dropDown: function (editor, caller, handleIdFunc) {
				var	matches,
					content = _tmpl("youtubeMenu", {
						label: editor._("Video URL:"),
						insert: editor._("Insert")
					}, true);

				content.find('.button').click(function (e) {
					var val = content.find("#link").val().replace("http://", "");

					if (val !== "") {
						matches = val.match(/(?:v=|v\/|embed\/|youtu.be\/)(.{11})/);

						if (matches)
							val = matches[1];

						if (/^[a-zA-Z0-9_\-]{11}$/.test(val))
							handleIdFunc(val);
						else
							alert('Invalid YouTube video');
					}

					editor.closeDropDown(true);
					e.preventDefault();
				});

				editor.createDropDown(caller, "insertlink", content);
			},
			exec: function (caller) {
				var editor = this;

				$.sceditor.command.get('youtube')._dropDown(
					editor,
					caller,
					function(id) {
						editor.wysiwygEditorInsertHtml(_tmpl("youtube", { id: id }));
					}
				);
			},
			tooltip: "Insert a YouTube video"
		},
		// END_COMMAND

		// START_COMMAND: Date
		date: {
			_date: function (editor) {
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

				return editor.opts.dateFormat.replace(/year/i, year).replace(/month/i, month).replace(/day/i, day);
			},
			exec: function () {
				this.insertText($.sceditor.command.get('date')._date(this));
			},
			txtExec: function () {
				this.insertText($.sceditor.command.get('date')._date(this));
			},
			tooltip: "Insert current date"
		},
		// END_COMMAND

		// START_COMMAND: Time
		time: {
			_time: function () {
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

				return hours + ':' + mins + ':' + secs;
			},
			exec: function () {
				this.insertText($.sceditor.command.get('time')._time());
			},
			txtExec: function () {
				this.insertText($.sceditor.command.get('time')._time());
			},
			tooltip: "Insert current time"
		},
		// END_COMMAND


		// START_COMMAND: Ltr
		ltr: {
			exec: function() {
				var	editor = this,
					elm    = editor.getRangeHelper().getFirstBlockParent(),
					$elm   = $(elm);

				editor.focus();

				if(!elm || $elm.is('body'))
				{
					editor.execCommand("formatBlock", "p");

					elm  = editor.getRangeHelper().getFirstBlockParent();
					$elm = $(elm);

					if(!elm || $elm.is('body'))
						return;
				}

				if($elm.css('direction') === 'ltr')
					$(elm).css('direction', '');
				else
					$(elm).attr('direction', 'ltr');
			},
			tooltip: "Left-to-Right"
		},
		// END_COMMAND

		// START_COMMAND: Rtl
		rtl: {
			exec: function() {
				var	editor = this,
					elm    = editor.getRangeHelper().getFirstBlockParent(),
					$elm   = $(elm);

				editor.focus();

				if(!elm || $elm.is('body'))
				{
					editor.execCommand("formatBlock", "p");

					elm  = editor.getRangeHelper().getFirstBlockParent();
					$elm = $(elm);

					if(!elm || $elm.is('body'))
						return;
				}

				if($elm.css('direction') === 'rtl')
					$(elm).css('direction', '');
				else
					$(elm).css('direction', 'rtl');
			},
			tooltip: "Right-to-Left"
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
				this.toggleSourceMode();
				this.blur();
			},
			txtExec: function () {
				this.toggleSourceMode();
				this.blur();
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
	 * Range helper class
	 * @class rangeHelper
	 * @name jQuery.sceditor.rangeHelper
	 */
	$.sceditor.rangeHelper = function(w, d) {
		var	win, doc, init, _createMarker, _getOuterText, _selectOuterText,
			isW3C        = true,
			startMarker  = "sceditor-start-marker",
			endMarker    = "sceditor-end-marker",
			characterStr = 'character', // Used to improve minification
			base         = this;

		/**
		 * @constructor
		 * @param Window window
		 * @param Document document
		 * @private
		 */
		init = function (window, document) {
			doc   = document || window.contentDocument || window.document;
			win   = window;
			isW3C = !!window.getSelection;
		}(w, d);

		/**
		 * <p>Inserts HTML into the current range replacing any selected
		 * text.</p>
		 *
		 * <p>If endHTML is specified the selected contents will be put between
		 * html and endHTML. If there is nothing selected html and endHTML are
		 * just concated together.</p>
		 *
		 * @param {string} html
		 * @param {string} endHTML
		 * @function
		 * @name insertHTML
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.insertHTML = function(html, endHTML) {
			var node, div;

			if(endHTML)
				html += base.selectedHtml() + endHTML;

			if(isW3C)
			{
				div           = doc.createElement('div');
				node          = doc.createDocumentFragment();
				div.innerHTML = html;

				while(div.firstChild)
					node.appendChild(div.firstChild);

				base.insertNode(node);
			}
			else
				base.selectedRange().pasteHTML(html);
		};

		/**
		 * <p>The same as insertHTML except with DOM nodes instead</p>
		 *
		 * <p><strong>Warning:</strong> the nodes must belong to the
		 * document they are being inserted into. Some browsers
		 * will throw exceptions if they don't.</p>
		 *
		 * @param {Node} node
		 * @param {Node} endNode
		 *
		 * @function
		 * @name insertNode
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.insertNode = function(node, endNode) {
			if(isW3C)
			{
				var	selection, selectAfter,
					toInsert = doc.createDocumentFragment(),
					range    = base.selectedRange();

				toInsert.appendChild(node);

				if(endNode)
				{
					toInsert.appendChild(range.extractContents());
					toInsert.appendChild(endNode);
				}

				selectAfter = toInsert.lastChild;
				range.deleteContents();
				range.insertNode(toInsert);

				selection = doc.createRange();
				selection.setStartAfter(selectAfter);
				base.selectRange(selection);
			}
			else
				base.insertHTML(node.outerHTML, endNode?endNode.outerHTML:null);
		};

		/**
		 * <p>Clones the selected Range</p>
		 *
		 * <p>IE <= 8 will return a TextRange, all other browsers
		 * will return a Range object.</p>
		 *
		 * @return {Range|TextRange}
		 * @function
		 * @name cloneSelected
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.cloneSelected = function() {
			if(!isW3C)
				return base.selectedRange().duplicate();

			return base.selectedRange().cloneRange();
		};

		/**
		 * <p>Gets the selected Range</p>
		 *
		 * <p>IE <= 8 will return a TextRange, all other browsers
		 * will return a Range object.</p>
		 *
		 * @return {Range|TextRange}
		 * @function
		 * @name selectedRange
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.selectedRange = function() {
			var sel, r;

			if(win.getSelection)
				sel = win.getSelection();
			else
				sel = doc.selection;

			// When creating a new range, set the start to the body
			// element to avoid errors in FF.
			if(sel.getRangeAt && sel.rangeCount <= 0)
			{
				r = doc.createRange();
				r.setStart(doc.body, 0);
				sel.addRange(r);
			}

			if(!isW3C)
				return sel.createRange();

			return sel.getRangeAt(0);
		};

		/**
		 * Gets the currently selected HTML
		 *
		 * @return {string}
		 * @function
		 * @name selectedHtml
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.selectedHtml = function() {
			var range = base.selectedRange();

			if(!range)
				return '';

			// IE9+ and all other browsers
			if (window.XMLSerializer)
				return new XMLSerializer().serializeToString(range.cloneContents());

			// IE < 9
			if(!isW3C)
			{
				if(range.text !== '' && range.htmlText)
					return range.htmlText;
			}

			return '';
		};

		/**
		 * Gets the parent node of the selected contents in the range
		 *
		 * @return {HTMLElement}
		 * @function
		 * @name parentNode
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.parentNode = function() {
			var range = base.selectedRange();

			return isW3C ?
				range.commonAncestorContainer :
				range.parentElement();
		};

		/**
		 * Gets the first block level parent of the selected
		 * contents of the range.
		 *
		 * @return {HTMLElement}
		 * @function
		 * @name getFirstBlockParent
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.getFirstBlockParent = function() {
			var func = function(node) {
				if(!$.sceditor.dom.isInline(node))
					return node;

				var p = node.parentNode;

				return p ? func(p) : null;
			};

			return func(base.parentNode());
		};

		/**
		 * Inserts a node at either the start or end of the current selection
		 *
		 * @param {Bool} start
		 * @param {Node} node
		 * @function
		 * @name insertNodeAt
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.insertNodeAt = function(start, node) {
			var range = base.cloneSelected();

			range.collapse(start);

			if(range.insertNode)
				range.insertNode(node);
			else
				range.pasteHTML(node.outerHTML);
		};

		/**
		 * Creates a marker node
		 *
		 * @param {String} id
		 * @return {Node}
		 * @private
		 */
		_createMarker = function(id) {
			base.removeMarker(id);

			var marker              = doc.createElement("span");
			marker.id               = id;
			marker.style.lineHeight = "0";
			marker.style.display    = "none";
			marker.className        = "sceditor-selection";

			return marker;
		};

		/**
		 * Inserts start/end markers for the current selection
		 * which can be used by restoreRange to re-select the
		 * range.
		 *
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 * @function
		 * @name insertMarkers
		 */
		base.insertMarkers = function() {
			base.insertNodeAt(true, _createMarker(startMarker));
			base.insertNodeAt(false, _createMarker(endMarker));
		};

		/**
		 * Gets the marker with the specified ID
		 *
		 * @param {String} id
		 * @return {Node}
		 * @function
		 * @name getMarker
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.getMarker = function(id) {
			return doc.getElementById(id);
		};

		/**
		 * Removes the marker with the specified ID
		 *
		 * @param {String} id
		 * @function
		 * @name removeMarker
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.removeMarker = function(id) {
			var marker = base.getMarker(id);

			if(marker)
				marker.parentNode.removeChild(marker);
		};

		/**
		 * Removes the start/end markers
		 *
		 * @function
		 * @name removeMarkers
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.removeMarkers = function() {
			base.removeMarker(startMarker);
			base.removeMarker(endMarker);
		};

		/**
		 * Saves the current range location. Alias of insertMarkers()
		 *
		 * @function
		 * @name saveRage
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.saveRange = function() {
			base.insertMarkers();
		};

		/**
		 * Select the specified range
		 *
		 * @param {Range|TextRange} range
		 * @function
		 * @name selectRange
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.selectRange = function(range) {
			if(!isW3C)
				range.select();
			else
			{
				win.getSelection().removeAllRanges();
				win.getSelection().addRange(range);
			}
		};

		/**
		 * Restores the last range saved by saveRange() or insertMarkers()
		 *
		 * @function
		 * @name restoreRange
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.restoreRange = function() {
			var	marker,
				range = base.selectedRange(),
				start = base.getMarker(startMarker),
				end   = base.getMarker(endMarker);

			if(!start || !end)
				return false;

			if(!isW3C)
			{
				range  = doc.body.createTextRange();
				marker = doc.body.createTextRange();

				marker.moveToElementText(start);
				range.setEndPoint('StartToStart', marker);
				range.moveStart(characterStr, 0);

				marker.moveToElementText(end);
				range.setEndPoint('EndToStart', marker);
				range.moveEnd(characterStr, 0);

				base.selectRange(range);
			}
			else
			{
				range = doc.createRange();

				range.setStartBefore(start);
				range.setEndAfter(end);

				base.selectRange(range);
			}

			base.removeMarkers();
		};

		/**
		 * Selects the text left and right of the current selection
		 * @param int left
		 * @param int right
		 * @private
		 */
		_selectOuterText = function(left, right) {
			var range = base.cloneSelected();

			range.collapse(false);

			if(!isW3C)
			{
				range.moveStart(characterStr, 0-left);
				range.moveEnd(characterStr, right);
			}
			else
			{
				range.setStart(range.startContainer, range.startOffset-left);
				range.setEnd(range.endContainer, range.endOffset+right);
			}

			base.selectRange(range);
		};

		/**
		 * Gets the text left or right of the current selection
		 * @param bool before
		 * @param int length
		 * @private
		 */
		_getOuterText = function(before, length) {
			var	ret   = "",
				range = base.cloneSelected();

			range.collapse(false);

			if(before)
			{
				if(!isW3C)
				{
					range.moveStart(characterStr, 0-length);
					ret = range.text;
				}
				else
				{
					ret = range.startContainer.textContent.substr(0, range.startOffset);
					ret = ret.substr(Math.max(0, ret.length - length));
				}
			}
			else
			{
				if(!isW3C)
				{
					range.moveEnd(characterStr, length);
					ret = range.text;
				}
				else
					ret = range.startContainer.textContent.substr(range.startOffset, length);
			}

			return ret;
		};

		/**
		 * Replaces keys with values based on the current range
		 *
		 * @param {Array} rep
		 * @param {Bool} includePrev If to include text before or just text after
		 * @param {Bool} repSorted If the keys array is pre sorted
		 * @param {Int} longestKey Length of the longest key
		 * @param {Bool} requireWhiteSpace If the key must be surrounded by whitespace
		 * @function
		 * @name raplaceKeyword
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.raplaceKeyword = function(rep, includeAfter, repSorted, longestKey, requireWhiteSpace, curChar) {
			if(!repSorted)
				rep.sort(function(a, b){
					return a.length - b.length;
				});

			var	before, after, str, i, start, left, pat, lookStart,
				maxKeyLen = longestKey || rep[rep.length-1][0].length;

			before = after = str = "";

			if(requireWhiteSpace)
			{
				// forcing spaces around doesn't work with textRanges as they will select text
				// on the other side of an image causing space-img-key to be returned as
				// space-key which would be valid when it's not.
				if(!isW3C)
					return false;

				++maxKeyLen;
			}

			before = _getOuterText(true, maxKeyLen);

			if(includeAfter)
				after = _getOuterText(false, maxKeyLen);

			str = before + (curChar!=null?curChar:"") + after;
			i   = rep.length;
			while(i--)
			{
				pat       = new RegExp("(?:[\\s\xA0\u2002\u2003\u2009])" + $.sceditor.regexEscape(rep[i][0]) + "(?=[\\s\xA0\u2002\u2003\u2009])");
				lookStart = before.length - 1 - rep[i][0].length;

				if(requireWhiteSpace)
					--lookStart;

				lookStart = Math.max(0, lookStart);

				if((!requireWhiteSpace && (start = str.indexOf(rep[i][0], lookStart)) > -1) ||
					(requireWhiteSpace && (start = str.substr(lookStart).search(pat)) > -1))
				{
					if(requireWhiteSpace)
						start += lookStart + 1;

					// make sure the substr is between before and after not entierly in one
					// or the other
					if(start > before.length || start+rep[i][0].length + (requireWhiteSpace?1:0) < before.length)
						continue;

					left = before.length - start;
					_selectOuterText(left, rep[i][0].length-left-(curChar!=null&&/^\S/.test(curChar)?1:0));
					base.insertHTML(rep[i][1]);
					return true;
				}
			}

			return false;
		};
	};

	/**
	 * Static DOM helper class
	 * @class dom
	 * @name jQuery.sceditor.dom
	 */
	$.sceditor.dom =
	/** @lends jQuery.sceditor.dom */
	{
		/**
		 * Loop all child nodes of the passed node
		 *
		 * The function should accept 1 parameter being the node.
		 * If the function returns false the loop will be exited.
		 *
		 * @param {HTMLElement}	node
		 * @param {function}	func		Function that is called for every node, should accept 1 param for the node
		 * @param {bool}	innermostFirst	If the innermost node should be passed to the function before it's parents
		 * @param {bool}	siblingsOnly	If to only traverse the nodes siblings
		 * @param {bool}	reverse		If to traverse the nodes in reverse
		 */
		traverse: function(node, func, innermostFirst, siblingsOnly, reverse) {
			if(node)
			{
				node = reverse ? node.lastChild : node.firstChild;

				while(node != null)
				{
					var next = reverse ? node.previousSibling : node.nextSibling;

					if(!innermostFirst && func(node) === false)
						return false;

					// traverse all children
					if(!siblingsOnly && this.traverse(node, func, innermostFirst, siblingsOnly, reverse) === false)
						return false;

					if(innermostFirst && func(node) === false)
						return false;

					// move to next child
					node = next;
				}
			}
		},

		/**
		 * Like traverse but loops in reverse
		 * @see traverse
		 */
		rTraverse: function(node, func, innermostFirst, siblingsOnly) {
			this.traverse(node, func, innermostFirst, siblingsOnly, true);
		},

		/**
		 * List of block level elements separated by bars (|)
		 * @type {string}
		 */
		blockLevelList: "|body|hr|p|div|h1|h2|h3|h4|h5|h6|address|pre|form|table|tbody|thead|tfoot|th|tr|td|li|ol|ul|blockquote|center|",

		/**
		 * Checks if an element is inline
		 *
		 * @return {bool}
		 */
		isInline: function(elm, includeCodeAsBlock) {
			if(!elm || elm.nodeType !== 1)
				return true;

			elm = elm.tagName.toLowerCase();

			if(elm === 'code')
				return !includeCodeAsBlock;

			return $.sceditor.dom.blockLevelList.indexOf("|" + elm + "|") < 0;
		},

		/**
		 * <p>Copys the CSS from 1 node to another.</p>
		 *
		 * <p>Only copies CSS defined on the element e.g. style attr.</p>
		 *
		 * @param {HTMLElement} from
		 * @param {HTMLElement} to
		 */
		copyCSS: function(from, to) {
			to.style.cssText = from.style.cssText;
		},

		/**
		 * Fixes block level elements inside in inline elements.
		 *
		 * @param {HTMLElement} node
		 */
		fixNesting: function(node) {
			var	base = this,
				getLastInlineParent = function(node) {
					while(base.isInline(node.parentNode, true))
						node = node.parentNode;

					return node;
				};

			base.traverse(node, function(node) {
				// if node is an element, and it is blocklevel and the parent isn't block level
				// then it needs fixing
				if(node.nodeType === 1 && !base.isInline(node, true) && base.isInline(node.parentNode, true))
				{
					var	parent  = getLastInlineParent(node),
						rParent = parent.parentNode,
						before  = base.extractContents(parent, node),
						middle  = node;

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
		 * @param {HTMLElement} node1
		 * @param {HTMLElement} node2
		 * @return {HTMLElement}
		 */
		findCommonAncestor: function(node1, node2) {
			// not as fast as making two arrays of parents and comparing
			// but is a lot smaller and as it's currently only used with
			// fixing invalid nesting it doesn't need to be very fast
			return $(node1).parents().has($(node2)).first();
		},

		/**
		 * Removes unused whitespace from the root and all it's children
		 *
		 * @param HTMLElement root
		 * @return void
		 */
		removeWhiteSpace: function(root) {
			// 00A0 is non-breaking space which should not be striped
			var regex = /[^\S|\u00A0]+/g;

			this.traverse(root, function(node) {
				if(node.nodeType === 3 && $(node).parents('code, pre').length === 0 && node.nodeValue)
				{
					// new lines in text nodes are always ignored in normal handling
					node.nodeValue = node.nodeValue.replace(/[\r\n]/, "");

					//remove empty nodes
					if(!node.nodeValue.length)
					{
						node.parentNode.removeChild(node);
						return;
					}

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
		 * @param {HTMLElement} startNode	The node to start extracting at
		 * @param {HTMLElement} endNode		The node to stop extracting at
		 * @return {DocumentFragment}
		 */
		extractContents: function(startNode, endNode) {
			var	base            = this,
				$commonAncestor = base.findCommonAncestor(startNode, endNode),
				commonAncestor  = !$commonAncestor?null:$commonAncestor.get(0),
				startReached    = false,
				endReached      = false;

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
				}, false);

				return df;
			}(commonAncestor));
		}
	};

	/**
	 * Static command helper class
	 * @class command
	 * @name jQuery.sceditor.command
	 */
	$.sceditor.command =
	/** @lends jQuery.sceditor.command */
	{
		/**
		 * Gets a command
		 *
		 * @param {String} name
		 * @return {Object|null}
		 * @since v1.3.5
		 */
		get: function(name) {
			return $.sceditor.commands[name] || null;
		},

		/**
		 * <p>Adds a command to the editor or updates an exisiting
		 * command if a command with the specified name already exists.</p>
		 *
		 * <p>Once a command is add it can be included in the toolbar by
		 * adding it's name to the toolbar option in the constructor. It
		 * can also be executed manually by calling {@link jQuery.sceditor.execCommand}</p>
		 *
		 * @example
		 * $.sceditor.command.set("hello",
		 * {
		 *     exec: function() {
		 *         alert("Hello World!");
		 *     }
		 * });
		 *
		 * @param {String} name
		 * @param {Object} cmd
		 * @return {this|false} Returns false if name or cmd is false
		 * @since v1.3.5
		 */
		set: function(name, cmd) {
			if(!name || !cmd)
				return false;

			// merge any existing command properties
			cmd = $.extend($.sceditor.commands[name] || {}, cmd);

			cmd.remove = function() { $.sceditor.command.remove(name); };

			$.sceditor.commands[name] = cmd;
			return this;
		},

		/**
		 * Removes a command
		 *
		 * @param {String} name
		 * @return {this}
		 * @since v1.3.5
		 */
		remove: function(name) {
			if($.sceditor.commands[name])
				delete $.sceditor.commands[name];

			return this;
		}
	};

	/**
	 * Default options for SCEditor
	 * @type {Object}
	 */
	$.sceditor.defaultOptions = {
		/**
		 * Toolbar buttons order and groups. Should be comma separated and have a bar | to separate groups
		 * @type {String}
		 */
		toolbar:	"bold,italic,underline,strike,subscript,superscript|left,center,right,justify|" +
				"font,size,color,removeformat|cut,copy,paste,pastetext|bulletlist,orderedlist|" +
				"table|code,quote|horizontalrule,image,email,link,unlink|emoticon,youtube,date,time|" +
				"ltr,rtl|print,source",

		/**
		 * Stylesheet to include in the WYSIWYG editor. Will style the WYSIWYG elements
		 * @type {String}
		 */
		style: "jquery.sceditor.default.css",

		/**
		 * Comma separated list of fonts for the font selector
		 * @type {String}
		 */
		fonts: "Arial,Arial Black,Comic Sans MS,Courier New,Georgia,Impact,Sans-serif,Serif,Times New Roman,Trebuchet MS,Verdana",

		/**
		 * Colors should be comma separated and have a bar | to signal a new column.
		 *
		 * If null the colors will be auto generated.
		 * @type {string}
		 */
		colors: null,

		/**
		 * The locale to use.
		 * @type {String}
		 */
		locale: "en",

		/**
		 * The Charset to use
		 * @type {String}
		 */
		charset: "utf-8",

		/**
		 * Compatibility mode for emoticons.
		 *
		 * Helps if you have emoticons such as :/ which would put an emoticon inside http://
		 *
		 * This mode requires emoticons to be surrounded by whitespace or end of line chars.
		 * This mode has limited As You Type emoticon conversion support. It will not replace
		 * AYT for end of line chars, only emoticons surrounded by whitespace. They will still
		 * be replaced correctly when loaded just not AYT.
		 * @type {Boolean}
		 */
		emoticonsCompat: false,

		/**
		 * Emoticon root URL
		 * @type {String}
		 */
		emoticonsRoot: '',
		emoticons: {
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

		/**
		 * Width of the editor. Set to null for automatic with
		 * @type {int}
		 */
		width: null,

		/**
		 * Height of the editor including toolbar. Set to null for automatic height
		 * @type {int}
		 */
		height: null,

		/**
		 * If to allow the editor to be resized
		 * @type {Boolean}
		 */
		resizeEnabled: true,

		/**
		 * Min resize to width, set to null for half textarea width or -1 for unlimited
		 * @type {int}
		 */
		resizeMinWidth: null,
		/**
		 * Min resize to height, set to null for half textarea height or -1 for unlimited
		 * @type {int}
		 */
		resizeMinHeight: null,
		/**
		 * Max resize to height, set to null for double textarea height or -1 for unlimited
		 * @type {int}
		 */
		resizeMaxHeight: null,
		/**
		 * Max resize to width, set to null for double textarea width or -1 for unlimited
		 * @type {int}
		 */
		resizeMaxWidth: null,
		/**
		 * If resizing by height is enabled
		 * @type {Boolean}
		 */
		resizeHeight: true,
		/**
		 * If resizing by width is enabled
		 * @type {Boolean}
		 */
		resizeWidth: true,

		getHtmlHandler: null,
		getTextHandler: null,

		/**
		 * Date format, will be overridden if locale specifies one.
		 *
		 * The words year, month and day will be replaced with the users current year, month and day.
		 * @type {String}
		 */
		dateFormat: "year-month-day",

		/**
		 * Element to inset the toobar into.
		 * @type {HTMLElement}
		 */
		toolbarContainer: null,

		/**
		 * If to enable paste filtering. This is currently experimental, please report any issues.
		 * @type {Boolean}
		 */
		enablePasteFiltering: false,

		/**
		 * If the editor is read only.
		 * @type {Boolean}
		 */
		readOnly: false,

		/**
		 * If to set the editor to right-to-left mode.
		 * @type {Boolean}
		 */
		rtl: false,

		/**
		 * If to auto focus the editor on page load
		 * @type {Boolean}
		 */
		autofocus: false,

		/**
		 * If to auto expand the editor to fix the content
		 * @type {Boolean}
		 */
		autoExpand: false,

		/**
		 * If to auto update original textbox on blur
		 * @type {Boolean}
		 */
		autoUpdate: false,

		/**
		 * If to run the source editor when there is no WYSIWYG support. Only really applies to mobile OS's.
		 * @type {Boolean}
		 */
		runWithoutWysiwygSupport: false,

		/**
		 * Optional ID to give the editor.
		 * @type {String}
		 */
		id: null,

		/**
		 * BBCode parser options, only applies if using the editor in BBCode mode.
		 *
		 * See $.sceditor.BBCodeParser.defaults for list of valid options
		 * @type {Object}
		 */
		parserOptions: { },

		/**
		 * CSS that will be added to the to dropdown menu (eg. z-index)
		 * @type {Object}
		 */
		dropDownCss: { }
	};

	$.fn.sceditor = function (options) {
		var	$this,
			ret = [];

		if((!options || !options.runWithoutWysiwygSupport) && !$.sceditor.isWysiwygSupported)
			return;

		this.each(function () {
			$this = this.jquery ? this : $(this);

			// Don't allow the editor to be initilised on it's own source editor
			if($this.parents('.sceditor-container').length > 0)
				return;
			
			if(options && options == "state"){
				return  !$this.data('sceditor');
			}  

			// If options set to state then return current state. True for initilised and false otherwise
			if(options && options == "state")
			{
				ret.push(!!$this.data('sceditor'));
				return;
			}

			if(!$this.data('sceditor'))
				(new $.sceditor(this, options || {}));

			ret.push($this.data('sceditor'));
		});

		return ret.length === 1 ? ret[0] : $(ret);
	};
})(jQuery, window, document);

