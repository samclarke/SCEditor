/*! SCEditor | (C) 2011-2013, Sam Clarke | sceditor.com/license */
/**
 * SCEditor
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor - A lightweight WYSIWYG BBCode and HTML editor
 * @author Sam Clarke
 * @version 1.4.2
 * @requires jQuery
 */

// ==ClosureCompiler==
// @output_file_name jquery.sceditor.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*jshint smarttabs: true, scripturl: true, jquery: true, devel:true, eqnull:true, curly: false */
/*global Range: true*/

;(function ($, window, document) {
	'use strict';

	/**
	 * HTML templates used by the editor and default commands
	 * @type {Object}
	 * @private
	 */
	var _templates = {
		html:		'<!DOCTYPE html>' +
				'<html>' +
					'<head>' +
						'<style>.ie * {min-height: auto !important}</style>' +
						'<meta http-equiv="Content-Type" content="text/html;charset={charset}" />' +
						'<link rel="stylesheet" type="text/css" href="{style}" />' +
					'</head>' +
					'<body contenteditable="true"></body>' +
				'</html>',

		toolbarButton:	'<a class="sceditor-button sceditor-button-{name}" data-sceditor-command="{name}" unselectable="on"><div unselectable="on">{dispName}</div></a>',

		emoticon:	'<img src="{url}" data-sceditor-emoticon="{key}" alt="{key}" title="{tooltip}" />',

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
		 * @type {Array}
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
		 * @type {Array}
		 */
		var preLoadCache = [];

		/**
		 * The editors rangeHelper instance
		 * @type {jQuery.sceditor.rangeHelper}
		 * @private
		 */
		var rangeHelper;

		/**
		 * Tags which require the new line fix
		 * @type {Array}
		 * @private
		 */
		var requireNewLineFix = [];

		/**
		 * An array of button state handlers
		 * @type {Array}
		 * @private
		 */
		var btnStateHandlers = [];

		/**
		 * Element which gets focused to blur the editor.
		 *
		 * This will be null until blur() is called.
		 * @type {HTMLElement}
		 * @private
		 */
		var $blurElm;

		/**
		 * Plugin manager instance
		 * @type {jQuery.sceditor.PluginManager}
		 * @private
		 */
		var pluginManager;

		/**
		 * The current node containing the selection/caret
		 * @type {Node}
		 * @private
		 */
		var currentNode;

		/**
		 * The current node selection/caret
		 * @type {Object}
		 * @private
		 */
		var currentSelection;

		/**
		 * Used to make sure only 1 selection changed check is called every 100ms.
		 * Helps improve performance as it is checked a lot.
		 * @type {Boolean}
		 * @private
		 */
		var isSelectionCheckPending;

		/**
		 * If content is required (equivalent to the HTML5 required attribute)
		 * @type {Boolean}
		 * @private
		 */
		var isRequired;

		/**
		 * Private functions
		 * @private
		 */
		var	init,
			replaceEmoticons,
			handleCommand,
			saveRange,
			initEditor,
			initPlugins,
			initLocale,
			initToolBar,
			initOptions,
			initEvents,
			initCommands,
			initResize,
			initEmoticons,
			getWysiwygDoc,
			handlePasteEvt,
			handlePasteData,
			handleKeyPress,
			handleFormReset,
			handleMouseDown,
			handleEvent,
			handleDocumentClick,
			handleWindowResize,
			updateToolBar,
			updateActiveButtons,
			sourceEditorSelectedText,
			appendNewLine,
			checkSelectionChanged,
			checkNodeChanged,
			autofocus,
			emoticonsKeyPress;

		/**
		 * All the commands supported by the editor
		 * @name commands
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.commands = $.extend(true, {}, (options.commands || $.sceditor.commands));

		/**
		 * Options for this editor instance
		 * @name opts
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.opts = options = $.extend({}, $.sceditor.defaultOptions, options);


		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		init = function () {
			$original.data("sceditor", base);

			// Clone any objects in options
			$.each(options, function(key, val) {
				if($.isPlainObject(val))
					options[key] = $.extend(true, {}, val);
			});

			// Load locale
			if(options.locale && options.locale !== "en")
				initLocale();

			$editorContainer = $('<div class="sceditor-container" />')
				.insertAfter($original)
				.css('z-index', options.zIndex);

			// Add IE version to the container to allow IE specific CSS
			// fixes without using CSS hacks or conditional comments
			if($.sceditor.ie)
				$editorContainer.addClass('ie ie' + $.sceditor.ie);

			isRequired = !!$original.attr('required');
			$original.removeAttr('required');

			// create the editor
			initPlugins();
			initEmoticons();

			initToolBar();
			initEditor();
			initCommands();
			initOptions();
			initEvents();

			// force into source mode if is a browser that can't handle
			// full editing
			if(!$.sceditor.isWysiwygSupported)
				base.toggleSourceMode();

			var loaded = function() {
				$(window).unbind('load', loaded);

				if(options.autofocus)
					autofocus();

				if(options.autoExpand)
					base.expandToContent();

				// Page width might have changed after CSS is loaded so
				// call handleWindowResize to update any % based dimensions
				handleWindowResize();
			};
			$(window).load(loaded);
			if(document.readyState && document.readyState === 'complete')
				loaded();

			updateActiveButtons();
			pluginManager.call('ready');
		};

		initPlugins = function() {
			var plugins   = options.plugins;
			plugins       = plugins ? plugins.toString().split(',') : [];
			pluginManager = new $.sceditor.PluginManager(base);

			$.each(plugins, function(idx, plugin) {
				pluginManager.register($.trim(plugin));
			});
		};

		/**
		 * Init the locale variable with the specified locale if possible
		 * @private
		 * @return void
		 */
		initLocale = function() {
			var lang;

			if($.sceditor.locale[options.locale])
				locale = $.sceditor.locale[options.locale];
			else
			{
				lang = options.locale.split("-");

				if($.sceditor.locale[lang[0]])
					locale = $.sceditor.locale[lang[0]];
			}

			if(locale && locale.dateFormat)
				options.dateFormat = locale.dateFormat;
		};

		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		initEditor = function () {
			var $body, doc, $doc, tabIndex;

			$sourceEditor  = $('<textarea></textarea>').hide();
			$wysiwygEditor = $('<iframe frameborder="0"></iframe>');

			if(window.location.protocol === "https:")
				$wysiwygEditor.attr("src", "javascript:false");

			// add the editor to the HTML and store the editors element
			$editorContainer.append($wysiwygEditor).append($sourceEditor);
			wysiwygEditor = $wysiwygEditor[0];
			sourceEditor  = $sourceEditor[0];

			base.width(options.width || $original.width());
			base.height(options.height || $original.height());

			doc  = getWysiwygDoc();
			$doc = $(doc);

			doc.open();
			doc.write(_tmpl("html", { charset: options.charset, style: options.style }));
			doc.close();

			base.readOnly(!!options.readOnly);

			$body = $doc.find("body");

			// Add IE version class to the HTML element so can apply
			// conditional styling without CSS hacks
			if($.sceditor.ie)
				$doc.find("html").addClass("ie ie" + $.sceditor.ie);

			// iframe overflow fix for iOS, also fixes an IE issue with the
			// editor not getting focus when clicking inside
			if(/iPhone|iPod|iPad| wosbrowser\//i.test(navigator.userAgent) || $.sceditor.ie)
			{
				$body.height("100%");

				if(!$.sceditor.ie)
					$body.bind('touchend', base.focus);
			}

			rangeHelper = new $.sceditor.rangeHelper(wysiwygEditor.contentWindow);

			// load any textarea value into the editor
			base.val($original.hide().val());

			tabIndex = $original.attr("tabindex");
			$sourceEditor.attr('tabindex', tabIndex);
			$wysiwygEditor.attr('tabindex', tabIndex);
		};

		/**
		 * Initialises options
		 * @private
		 */
		initOptions = function() {
			var	$doc  = $(getWysiwygDoc()),
				$body = $doc.find("body");

			// auto-update original textbox on blur if option set to true
			if(options.autoUpdate)
			{
				$body.bind("blur", base.updateOriginal);
				$sourceEditor.bind("blur", base.updateOriginal);
			}

			if(options.rtl === null)
				options.rtl = $sourceEditor.css('direction') === 'rtl';

			base.rtl(!!options.rtl);

			if(options.autoExpand)
				$doc.bind("keyup", base.expandToContent);

			if(options.resizeEnabled)
				initResize();

			$editorContainer.attr('id', options.id);
			base.emoticons(options.emoticonsEnabled);
		};

		/**
		 * Initialises events
		 * @private
		 */
		initEvents = function() {
			var $doc = $(getWysiwygDoc());

			$(document).click(handleDocumentClick);

			$(original.form)
				.bind("reset", handleFormReset)
				.submit(base.updateOriginal);

			$(window).bind('resize orientationChanged', handleWindowResize);

			$doc.find("body")
				.keypress(handleKeyPress)
				.keyup(appendNewLine)
				.bind("paste", handlePasteEvt)
				.bind($.sceditor.ie ? "selectionchange" : "keyup focus blur contextmenu mouseup touchend click", checkSelectionChanged)
				.bind("keydown keyup keypress focus blur contextmenu", handleEvent);

			$sourceEditor.bind("keydown keyup keypress focus blur contextmenu", handleEvent);

			$doc
				.keypress(handleKeyPress)
				.mousedown(handleMouseDown)
				.bind($.sceditor.ie ? "selectionchange" : "focus blur contextmenu mouseup click", checkSelectionChanged)
				.bind("beforedeactivate keyup", saveRange)
				.keyup(appendNewLine)
				.focus(function() {
					lastRange = null;
				});

			$editorContainer
				.bind('selectionchanged', updateActiveButtons)
				.bind('selectionchanged', checkNodeChanged)
				.bind('selectionchanged', handleEvent)
				.bind('nodechanged', handleEvent);
		};

		/**
		 * Creates the toolbar and appends it to the container
		 * @private
		 */
		initToolBar = function () {
			var	$group, $button,
				groups = options.toolbar.split("|");

			$toolbar = $('<div class="sceditor-toolbar" unselectable="on" />');
			$.each(groups, function(idx, group) {
				$group  = $('<div class="sceditor-group" />');

				$.each(group.split(","), function(idx, button) {
					// the button must be a valid command otherwise ignore it
					if(!base.commands[button])
						return;

					$button = _tmpl("toolbarButton", {
							name: button,
							dispName: base.commands[button].tooltip || button
						}, true);

					$button.data('sceditor-txtmode', !!base.commands[button].txtExec);
					$button.data('sceditor-wysiwygmode', !!base.commands[button].exec);
					$button.click(function () {
						var $this = $(this);

						if(!$this.hasClass('disabled'))
							handleCommand($this, base.commands[button]);

						updateActiveButtons();
						return false;
					});

					if(base.commands[button].tooltip)
						$button.attr('title', base._(base.commands[button].tooltip));

					if(!base.commands[button].exec)
						$button.addClass('disabled');

					$group.append($button);
				});

				$toolbar.append($group);
			});

			// append the toolbar to the toolbarContainer option if given
			if(options.toolbarContainer)
				$(options.toolbarContainer).append($toolbar);
			else
				$editorContainer.append($toolbar);
		};

		/**
		 * Creates an array of all the key press functions
		 * like emoticons, ect.
		 * @private
		 */
		initCommands = function () {
			$.each(base.commands, function (name, cmd) {
				if(cmd.keyPress)
					keyPressFuncs.push(cmd.keyPress);

				if(cmd.forceNewLineAfter && $.isArray(cmd.forceNewLineAfter))
					requireNewLineFix = $.merge(requireNewLineFix, cmd.forceNewLineAfter);

				if(cmd.state)
					btnStateHandlers.push({ name: name, state: cmd.state });
				// exec string commands can be passed to queryCommandState
				else if(typeof cmd.exec === "string")
					btnStateHandlers.push({ name: name, state: cmd.exec });
			});
		};

		/**
		 * Creates the resizer.
		 * @private
		 */
		initResize = function () {
			var	minHeight, maxHeight, minWidth, maxWidth, mouseMoveFunc, mouseUpFunc,
				$grip       = $('<div class="sceditor-grip" />'),
				// cover is used to cover the editor iframe so document still gets mouse move events
				$cover      = $('<div class="sceditor-resize-cover" />'),
				startX      = 0,
				startY      = 0,
				startWidth  = 0,
				startHeight = 0,
				origWidth   = $editorContainer.width(),
				origHeight  = $editorContainer.height(),
				dragging    = false,
				rtl         = base.rtl();

			minHeight = options.resizeMinHeight || origHeight / 1.5;
			maxHeight = options.resizeMaxHeight || origHeight * 2.5;
			minWidth  = options.resizeMinWidth  || origWidth  / 1.25;
			maxWidth  = options.resizeMaxWidth  || origWidth  * 1.25;

			mouseMoveFunc = function (e) {
				// iOS must use window.event
				if(e.type === 'touchmove')
					e = window.event;

				var	newHeight = startHeight + (e.pageY - startY),
					newWidth  = rtl ? startWidth - (e.pageX - startX) : startWidth + (e.pageX - startX);

				if(maxWidth > 0 && newWidth > maxWidth)
					newWidth = maxWidth;

				if(maxHeight > 0 && newHeight > maxHeight)
					newHeight = maxHeight;

				if(options.resizeWidth && newWidth >= minWidth && (maxWidth < 0 || newWidth <= maxWidth))
					base.width(newWidth);

				if(options.resizeHeight && newHeight >= minHeight && (maxHeight < 0 || newHeight <= maxHeight))
				{
					base.height(newHeight);

					// The resize cover will not fill the container in IE6 unless a height is specified.
					if($.sceditor.ie < 7)
						$editorContainer.height(newHeight);
				}

				e.preventDefault();
			};

			mouseUpFunc = function (e) {
				if(!dragging)
					return;

				dragging = false;

				$cover.hide();
				$editorContainer.removeClass('resizing').height('auto');
				$(document).unbind('touchmove mousemove', mouseMoveFunc);
				$(document).unbind('touchend mouseup', mouseUpFunc);

				e.preventDefault();
			};

			$editorContainer.append($grip);
			$editorContainer.append($cover.hide());

			$grip.bind('touchstart mousedown', function (e) {
				// iOS must use window.event
				if(e.type === 'touchstart')
					e = window.event;

				startX      = e.pageX;
				startY      = e.pageY;
				startWidth  = $editorContainer.width();
				startHeight = $editorContainer.height();
				dragging    = true;

				$editorContainer.addClass('resizing');
				$cover.show();
				$(document).bind('touchmove mousemove', mouseMoveFunc);
				$(document).bind('touchend mouseup', mouseUpFunc);

				// The resize cover will not fill the container in IE6 unless a height is specified.
				if($.sceditor.ie < 7)
					$editorContainer.height(startHeight);

				e.preventDefault();
			});
		};

		/**
		 * Prefixes and preloads the emoticon images
		 * @private
		 */
		initEmoticons = function () {
			var	emoticon,
				emoticons = options.emoticons,
				root      = options.emoticonsRoot;

			if(!$.isPlainObject(emoticons))
				return;

			$.each(emoticons, function (idx, val) {
				$.each(val, function (key, url) {
					// Prefix emoticon root to emoticon urls
					if(root)
					{
						url = {
							url: root + (url.url || url),
							tooltip: url.tooltip || key
						};

						emoticons[idx][key] = url;
					}

					// Preload the emoticon
					// Idea from: http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript
					emoticon     = document.createElement('img');
					emoticon.src = url.url || url;
					preLoadCache.push(emoticon);
				});
			});
		};

		/**
		 * Autofocus the editor
		 * @private
		 */
		autofocus = function() {
			var	rng, elm, txtPos,
				doc      = getWysiwygDoc(),
				body     = doc.body,
				focusEnd = !!options.autofocusEnd;

			if(base.sourceMode())
			{
				txtPos = sourceEditor.value.length;

				if(sourceEditor.setSelectionRange)
					sourceEditor.setSelectionRange(txtPos, txtPos);
				else if (sourceEditor.createTextRange)
				{
					rng = sourceEditor.createTextRange();
					rng.moveEnd('character', txtPos);
					rng.moveStart('character', txtPos);
					rangeHelper.selectRange(rng);
				}
			}
			else // WYSIWYG mode
			{
				if(focusEnd)
					$(body).append((elm = doc.createElement('div')));
				else
					elm = body.firstChild;

				if(doc.createRange)
				{

					rng = doc.createRange();
					rng.setStart(elm, 0);
					rng.setEnd(elm, 0);
				}
				else
				{
					rng = body.createTextRange();
					rng.moveToElementText(elm);
					rng.collapse(false);
				}
				rangeHelper.selectRange(rng);

				if(focusEnd)
				{
					$(doc).scrollTop(body.scrollHeight);
					$(body).scrollTop(body.scrollHeight);
				}
			}

			base.focus();
		};

		/**
		 * Gets if the editor is read only
		 *
		 * @since 1.3.5
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name readOnly
		 * @return {Boolean}
		 */
		/**
		 * Sets if the editor is read only
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
		 * Gets if the editor is in RTL mode
		 *
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name rtl
		 * @return {Boolean}
		 */
		/**
		 * Sets if the editor is in RTL mode
		 *
		 * @param {boolean} rtl
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name rtl^2
		 * @return {this}
		 */
		base.rtl = function(rtl) {
			var dir = rtl ? 'rtl' : 'ltr';

			if(typeof rtl !== 'boolean')
				return $sourceEditor.attr('dir') === 'rtl';

			$(getWysiwygDoc().body).attr('dir', dir);
			$sourceEditor.attr('dir', dir);

			$editorContainer
				.removeClass('rtl')
				.removeClass('ltr')
				.addClass(dir);

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
		/**
		 * Sets the width of the editor
		 *
		 * The saveWidth specifies if to save the width. The stored width can be
		 * used for things like restoring from maximized state.
		 *
		 * @param {int}		height			Width in pixels
		 * @param {boolean}	[saveWidth=true]	If to store the width
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name width^3
		 * @return {this}
		 */
		base.width = function (width, saveWidth) {
			if(!width && width !== 0)
				return $editorContainer.width();

			base.dimensions(width, null, saveWidth);

			return this;
		};

		/**
		 * Returns an object with the properties width and height
		 * which are the width and height of the editor in px.
		 *
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name dimensions
		 * @return {object}
		 */
		/**
		 * <p>Sets the width and/or height of the editor.</p>
		 *
		 * <p>If width or height is not numeric it is ignored.</p>
		 *
		 * @param {int}	width	Width in px
		 * @param {int}	height	Height in px
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name dimensions^2
		 * @return {this}
		 */
		/**
		 * <p>Sets the width and/or height of the editor.</p>
		 *
		 * <p>If width or height is not numeric it is ignored.</p>
		 *
		 * <p>The save argument specifies if to save the new sizes.
		 * The saved sizes can be used for things like restoring from
		 * maximized state. This should normally be left as true.</p>
		 *
		 * @param {int}		width		Width in px
		 * @param {int}		height		Height in px
		 * @param {boolean}	[save=true]	If to store the new sizes
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name dimensions^3
		 * @return {this}
		 */
		base.dimensions = function(width, height, save) {
			var	toolbarHeight,
				updateheight = false;

			// set undefined width/height to boolean false
			width  = (!width && width !== 0) ? false : width;
			height = (!height && height !== 0) ? false : height;

			if(width === false && height === false)
				return { width: base.width(), height: base.height() };

			if(typeof $wysiwygEditor.data('outerWidthOffset') === "undefined")
				base.updateStyleCache();

			if(width !== false && width !== base.width())
			{
				if(save !== false)
					options.width = width;

				width = $editorContainer.width(width).width();
				wysiwygEditor.style.width = width - $wysiwygEditor.data('outerWidthOffset') + 'px';
				sourceEditor.style.width  = width - $sourceEditor.data('outerWidthOffset') + 'px';

				// If the toolbar height has changed then wysiwyg and source editor heights will need to be updated
				toolbarHeight = !options.toolbarContainer ? $toolbar.outerHeight(true) : 0;
				updateheight  = toolbarHeight !== (!options.toolbarContainer ? $toolbar.outerHeight(true) : 0);
			}

			if(height !== false && height !== base.height())
			{
				if(save !== false)
					options.height = height;

				// Convert % based heights to px
				if(height && height.toString().indexOf('%'))
				{
					height = $editorContainer.height(height).height();
					$editorContainer.height('auto');
				}

				height -= !options.toolbarContainer ? $toolbar.outerHeight(true) : 0;
				updateheight = true;
			}

			if(updateheight)
			{
				wysiwygEditor.style.height = Math.max(height - $wysiwygEditor.data('outerHeightOffset'),0) + 'px';
				sourceEditor.style.height  = Math.max(height - $sourceEditor.data('outerHeightOffset'),0) + 'px';
			}

			return this;
		};

		/**
		 * Updates the CSS styles cache. Shouldn't be needed unless changing the editors theme.
		 *
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name updateStyleCache
		 * @return {int}
		 */
		base.updateStyleCache = function() {
			// caching these improves FF resize performance
			$wysiwygEditor.data('outerWidthOffset', $wysiwygEditor.outerWidth(true) - $wysiwygEditor.width());
			$sourceEditor.data('outerWidthOffset', $sourceEditor.outerWidth(true) - $sourceEditor.width());

			$wysiwygEditor.data('outerHeightOffset', $wysiwygEditor.outerHeight(true) - $wysiwygEditor.height());
			$sourceEditor.data('outerHeightOffset', $sourceEditor.outerHeight(true) - $sourceEditor.height());
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
		/**
		 * Sets the height of the editor
		 *
		 * The saveHeight specifies if to save the height. The stored height can be
		 * used for things like restoring from maximized state.
		 *
		 * @param {int} height Height in px
		 * @param {boolean} [saveHeight=true] If to store the height
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name height^3
		 * @return {this}
		 */
		base.height = function (height, saveHeight) {
			if(!height && height !== 0)
				return $editorContainer.height();

			base.dimensions(null, height, saveHeight);

			return this;
		};

		/**
		 * Gets if the editor is maximised or not
		 *
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name maximize
		 * @return {boolean}
		 */
		/**
		 * Sets if the editor is maximised or not
		 *
		 * @param {boolean} maximize If to maximise the editor
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name maximize^2
		 * @return {this}
		 */
		base.maximize = function(maximize) {
			if(typeof maximize === 'undefined')
				return $editorContainer.is('.sceditor-maximize');

			maximize = !!maximize;

			// IE 6 fix
			if($.sceditor.ie < 7)
				$('html, body').toggleClass('sceditor-maximize', maximize);

			$editorContainer.toggleClass('sceditor-maximize', maximize);
			base.width(maximize ? '100%' : options.width, false);
			base.height(maximize ? '100%' : options.height, false);

			return this;
		};

		/**
		 * Expands the editors height to the height of it's content
		 *
		 * Unless ignoreMaxHeight is set to true it will not expand
		 * higher than the maxHeight option.
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
				maxHeight     = options.resizeMaxHeight || ((options.height || $original.height()) * 2);

			height += padding;

			if(ignoreMaxHeight !== true && height > maxHeight)
				height = maxHeight;

			if(height > currentHeight)
				base.height(height);
		};

		/**
		 * Destroys the editor, removing all elements and
		 * event handlers.
		 *
		 * Leaves only the original textarea.
		 *
		 * @function
		 * @name destroy
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.destroy = function () {
			pluginManager.destroy();

			rangeHelper   = null;
			lastRange     = null;
			pluginManager = null;

			$(document).unbind('click', handleDocumentClick);
			$(window).unbind('resize orientationChanged', handleWindowResize);

			$(original.form)
				.unbind('reset', handleFormReset)
				.unbind('submit', base.updateOriginal);

			$(getWysiwygDoc().body).unbind();
			$(getWysiwygDoc()).unbind().find('*').remove();

			$sourceEditor.unbind().remove();
			$editorContainer.unbind().find('*').unbind().remove();
			$editorContainer.remove();

			$original
				.removeData('sceditor')
				.removeData('sceditorbbcode')
				.show();

			if(isRequired)
				$original.attr('required', 'required');
		};

		/**
		 * Creates a menu item drop down
		 *
		 * @param {HTMLElement}	menuItem		The button to align the drop down with
		 * @param {string}	dropDownName		Used for styling the dropown, will be a class sceditor-dropDownName
		 * @param {HTMLElement}	content			The HTML content of the dropdown
		 * @param {bool}	[ieUnselectable=true]	If to add the unselectable attribute to all the contents elements. Stops IE from deselecting the text in the editor
		 * @function
		 * @name createDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.createDropDown = function (menuItem, dropDownName, content, ieUnselectable) {
			// first click for create second click for close
			var onlyclose = $dropdown && $dropdown.is('.sceditor-' + dropDownName);

			base.closeDropDown();

			if(onlyclose) return;

			// IE needs unselectable attr to stop it from unselecting the text in the editor.
			// The editor can cope if IE does unselect the text it's just not nice.
			if(ieUnselectable !== false)
			{
				$(content)
					.find(':not(input,textarea)')
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

			$.extend(css, options.dropDownCss);

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
		handleDocumentClick = function (e) {
			// ignore right clicks
			if(e.which !== 3)
				base.closeDropDown();
		};

		/**
		 * Handles the WYSIWYG editors paste event
		 * @private
		 */
		handlePasteEvt = function(e) {
			var	html,
				elm             = getWysiwygDoc().body,
				checkCount      = 0,
				pastearea       = elm.ownerDocument.createElement('div'),
				prePasteContent = elm.ownerDocument.createDocumentFragment();

			if(options.disablePasting)
				return false;

			if(!options.enablePasteFiltering)
				return;

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
		 * Gets the pasted data, filters it and then inserts it.
		 * @param {Element} elm
		 * @param {Element} pastearea
		 * @private
		 */
		handlePasteData = function(elm, pastearea) {
			// fix any invalid nesting
			$.sceditor.dom.fixNesting(pastearea);

			var pasteddata = pastearea.innerHTML;

			if(pluginManager.hasHandler("toSource"))
				pasteddata = pluginManager.callOnlyFirst("toSource", pasteddata, $(pastearea));

			pastearea.parentNode.removeChild(pastearea);

			if(pluginManager.hasHandler("toWysiwyg"))
				pasteddata = pluginManager.callOnlyFirst("toWysiwyg", pasteddata, true);

			rangeHelper.restoreRange();
			rangeHelper.insertHTML(replaceEmoticons(pasteddata));
		};

		/**
		 * Closes any currently open drop down
		 *
		 * @param {bool} [focus=false] If to focus the editor after closing the drop down
		 * @function
		 * @name closeDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.closeDropDown = function (focus) {
			if($dropdown) {
				$dropdown.unbind().remove();
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
		 * <p>If endHtml is specified, any selected text will be placed between html
		 * and endHtml. If there is no selected text html and endHtml will just be
		 * concated together.</p>
		 *
		 * @param {string} html
		 * @param {string} [endHtml=null]
		 * @param {boolean} [overrideCodeBlocking=false] If to insert the html into code tags, by default code tags only support text.
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
// TODO: This code tag should be configurable
			rangeHelper.insertHTML(html, endHtml);

			appendNewLine();
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
			base.wysiwygEditorInsertHtml($.sceditor.escapeEntities(text), $.sceditor.escapeEntities(endText));
		};

		/**
		 * <p>Inserts text into the WYSIWYG or source editor depending on which
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
		 * <p>Like wysiwygEditorInsertHtml but inserts text into the
		 * source mode editor instead.</p>
		 *
		 * <p>If endText is specified any selected text will be placed between
		 * text and endText. If no text is selected text and endText will
		 * just be concated together.</p>
		 *
		 * <p>The cursor will be placed after the text param. If endText is
		 * specified the cursor will be placed before endText, so passing:<br />
		 *
		 * '[b]', '[/b]'</p>
		 *
		 * <p>Would cause the cursor to be placed:<br />
		 *
		 * [b]Selected text|[/b]</p>
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

				sourceEditor.selectionStart = (start + text.length) - (endText ? endText.length : 0);
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
		 * Gets the current instance of the rangeHelper class
		 * for the editor.
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
		 * <p>Sets the value of the editor.</p>
		 *
		 * <p>If filter set true the val will be passed through the filter
		 * function. If using the BBCode plugin it will pass the val to
		 * the BBCode filter to convert any BBCode into HTML.</p>
		 *
		 * @param {String} val
		 * @param {Boolean} [filter=true]
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
					if(filter !== false && pluginManager.hasHandler("toWysiwyg"))
						val = pluginManager.callOnlyFirst("toWysiwyg", val);

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
		 * <p>If the filter param is set to true, the HTML/BBCode will be
		 * passed through any plugin filters. If using the BBCode plugin
		 * this will convert any BBCode into HTML.</p>
		 *
		 * @param {String} start
		 * @param {String} [end=null]
		 * @param {Boolean} [filter=true]
		 * @param {Boolean} [convertEmoticons=true] If to convert emoticons
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

					if(filter !== false)
					{
						if(pluginManager.hasHandler("toSource"))
							html = pluginManager.callOnlyFirst("toSource", html, frag);

						frag.remove();
					}

					start += html + end;
				}

				if(pluginManager.hasHandler("toWysiwyg"))
					start = pluginManager.callOnlyFirst("toWysiwyg", start, true);

				if(convertEmoticons !== false)
					start = replaceEmoticons(start);

				base.wysiwygEditorInsertHtml(start);
			}

			return this;
		};

		/**
		 * Gets the WYSIWYG editors HTML value.
		 *
		 * If using a plugin that filters the HTMl like the BBCode plugin
		 * it will return the result of the filtering (BBCode) unless the
		 * filter param is set to false.
		 *
		 * @param {bool} [filter=true]
		 * @return {string}
		 * @function
		 * @name getWysiwygEditorValue
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getWysiwygEditorValue = function (filter) {
			var	html,
				$body = $wysiwygEditor.contents().find("body");

			// Must focus the editor for IE before saving the range
			if($.sceditor.ie)
				base.focus();

			rangeHelper.saveRange();

			$.sceditor.dom.fixNesting($body.get(0));

			// filter the HTML and DOM through any plugins
			html = $body.html();
			if(filter !== false && pluginManager.hasHandler("toSource"))
				html = pluginManager.callOnlyFirst("toSource", html, $body);

			// remove the last stored range for IE as it no longer applies
			rangeHelper.restoreRange();
			lastRange = null;

			return html;
		};

		/**
		 * Gets the text editor value
		 *
		 * If using a plugin that filters the text like the BBCode plugin
		 * it will return the result of the filtering which is BBCode to
		 * HTML so it will return HTML. If filter is set to false it will
		 * just return the contents of the source editor (BBCode).
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

			if(filter !== false && pluginManager.hasHandler("toWysiwyg"))
				val = pluginManager.callOnlyFirst("toWysiwyg", val);

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

			appendNewLine();
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
			if(!options.emoticonsEnabled)
				return html;

			var emoticons = $.extend({}, options.emoticons.more, options.emoticons.dropdown, options.emoticons.hidden);

			$.each(emoticons, function (key, url) {
				// escape the key before using it as a regex
				// and append the regex to only find emoticons outside
				// of HTML tags
				var	reg   = $.sceditor.regexEscape(key) + "(?=([^\\<\\>]*?<(?!/code)|[^\\<\\>]*?$))",
					group = '';

				// Make sure the emoticon is surrounded by whitespace or is at the start/end of a string or html tag
				if(options.emoticonsCompat)
				{
					reg   = "((>|^|\\s|\xA0|\u2002|\u2003|\u2009|&nbsp;))" + reg + "(?=(\\s|$|<|\xA0|\u2002|\u2003|\u2009|&nbsp;))";
					group = '$1';
				}

				html = html.replace(
					new RegExp(reg, 'gm'),
					group + _tmpl('emoticon', {
						key: key,
						url: url.url || url,
						tooltip: url.tooltip || key
					})
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
			updateActiveButtons();
		};

		/**
		 * Gets the selected text of the source editor
		 * @return {String}
		 * @private
		 */
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
		 * Saves the current range. Needed for IE because it forgets
		 * where the cursor was and what was selected
		 * @private
		 */
		saveRange = function () {
			/* this is only needed for IE */
			if($.sceditor.ie)
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
		 * Checks if the current selection has changed and tirggers
		 * the selectionchanged event if it has
		 * @private
		 */
		checkSelectionChanged = function() {
			if(isSelectionCheckPending)
				return;

			isSelectionCheckPending = true;

			setTimeout(function() {
				if(!rangeHelper.compare(currentSelection))
				{
					currentSelection = rangeHelper.cloneSelected();
					$editorContainer.trigger($.Event('selectionchanged'));
				}

				isSelectionCheckPending = false;
			}, 100);
		};

		/**
		 * Checks if the current node has changed and tirggers
		 * the nodechanged event if it has
		 * @private
		 */
		checkNodeChanged = function() {
			// check if node has chnaged
			var node = rangeHelper.parentNode();

			if(currentNode !== node)
			{
				$editorContainer.trigger($.Event('nodechanged', { oldNode: currentNode, newNode: node }));
				currentNode = node;
			}
		};

		/**
		 * <p>Gets the current node that contains the selection/caret in WYSIWYG mode.</p>
		 *
		 * <p>Will be null in sourceMode or if there is no selection.</p>
		 * @return {Node}
		 * @function
		 * @name currentNode
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.currentNode = function() {
			return currentNode;
		};

		/**
		 * Updates if buttons are active or not
		 * @private
		 */
		updateActiveButtons = function(e) {
			var	state, stateHandler, firstBlock, $button, parent,
				doc          = getWysiwygDoc(),
				i            = btnStateHandlers.length,
				inSourceMode = base.sourceMode();

			if(!base.sourceMode() && !base.readOnly())
			{
				parent     = e ? e.newNode : rangeHelper.parentNode();
				firstBlock = rangeHelper.getFirstBlockParent(parent);

				while(i--)
				{
					state        = 0;
					stateHandler = btnStateHandlers[i];
					$button      = $toolbar.find('.sceditor-button-' + stateHandler.name);

					if(inSourceMode && !$button.data('sceditor-txtmode'))
						$button.addClass('disabled');
					else if (!inSourceMode && !$button.data('sceditor-wysiwygmode'))
						$button.addClass('disabled');
					else
					{
						if(typeof stateHandler.state === 'string')
						{
							try
							{
								state = doc.queryCommandEnabled(stateHandler.state) ? 0 : -1;

								if(state > -1)
									state = doc.queryCommandState(stateHandler.state) ? 1 : 0;
							}
							catch (e) {}
						}
						else
							state = stateHandler.state.call(base, parent, firstBlock);

						if(state < 0)
							$button.addClass('disabled');
						else
							$button.removeClass('disabled');

						if(state > 0)
							$button.addClass('active');
						else
							$button.removeClass('active');
					}
				}
			}
			else
				$toolbar.find('.sceditor-button').removeClass('active');
		};

		/**
		 * Handles any key press in the WYSIWYG editor
		 *
		 * @private
		 */
		handleKeyPress = function(e) {
			var	$parentNode,
				i = keyPressFuncs.length;

			base.closeDropDown();

			$parentNode = $(rangeHelper.parentNode());

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

			// don't apply to code elements
			if($parentNode.is('code') || $parentNode.parents('code').length !== 0)
				return;

			while(i--)
				keyPressFuncs[i].call(base, e, wysiwygEditor, $sourceEditor);
		};

		/**
		 * Makes sure that if there is a code or quote tag at the
		 * end of the editor, that there is a new line after it.
		 *
		 * If there wasn't a new line at the end you wouldn't be able
		 * to enter any text after a code/quote tag
		 * @return {void}
		 * @private
		 */
		appendNewLine = function() {
			var	name, inBlock,
				doc = getWysiwygDoc();

			$.sceditor.dom.rTraverse(doc.body, function(node) {
				name = node.nodeName.toLowerCase();

				if($.inArray(name, requireNewLineFix) > -1)
					inBlock = true;

				// find the last non-empty text node or line break.
				if((node.nodeType === 3 && !/^\s*$/.test(node.nodeValue)) ||
					node.nodeName.toLowerCase() === 'br' ||
					($.sceditor.ie && !node.firstChild && !$.sceditor.dom.isInline(node, false)))
				{
					// this is the last text or br node, if its in a code or quote tag
					// then add a newline to the end of the editor
					if(inBlock)
						$(doc.body).append($('<div>' + (!$.sceditor.ie ? '<br />' : '') + '</div>\n'));

					return false;
				}
			});
		};

		/**
		 * Handles form reset event
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
			var	height = options.height,
				width  = options.width;

			if(!base.maximize())
			{
				if(height && height.toString().indexOf("%") > -1)
					base.height(height);

				if(width && width.toString().indexOf("%") > -1)
					base.width(width);
			}
			else
				base.height('100%', false).width('100%', false);
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
		 * Passes events on to any handlers
		 * @private
		 * @return void
		 */
		handleEvent = function(e) {
			var	customEvent,
				clone = $.extend({}, e);

			// Send event to all plugins
			pluginManager.call(clone.type + 'Event', e, base);

			// convert the event into a custom event to send
			delete clone.type;
			customEvent = $.Event((e.target === sourceEditor ? 'scesrc' : 'scewys') + e.type, clone);

			$editorContainer.trigger.apply($editorContainer, [customEvent, base]);

			if(customEvent.isDefaultPrevented())
				e.preventDefault();

			if(customEvent.isImmediatePropagationStopped())
				customEvent.stopImmediatePropagation();

			if(customEvent.isPropagationStopped())
				customEvent.stopPropagation();
		};

		/**
		 * <p>Binds a handler to the specified events</p>
		 *
		 * <p>This function only binds to a limited list of supported events.<br />
		 * The supported events are:
		 * <ul>
		 *   <li>keyup</li>
		 *   <li>keydown</li>
		 *   <li>Keypress</li>
		 *   <li>blur</li>
		 *   <li>focus</li>
		 *   <li>nodechanged<br />
		 *       When the current node containing the selection changes in WYSIWYG mode</li>
		 *   <li>contextmenu</li>
		 * </ul>
		 * </p>
		 *
		 * <p>The events param should be a string containing the event(s)
		 * to bind this handler to. If multiple, they should be seperated
		 * by spaces.</p>
		 *
		 * @param  {String} events
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name bind
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.bind = function(events, handler, excludeWysiwyg, excludeSource) {
			var i  = events.length;
			events = events.split(" ");

			while(i--)
			{
				if($.isFunction(handler))
				{
					// Use custom events to allow passing the instance as the 2nd argument.
					// Also allows unbinding without unbinding the editors own event handlers.
					if(!excludeWysiwyg)
						$editorContainer.bind('scewys' + events[i], handler);

					if(!excludeSource)
						$editorContainer.bind('scesrc' + events[i], handler);
				}
			}

			return this;
		};

		/**
		 * Unbinds an event that was bound using bind().
		 *
		 * @param  {String} events
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude unbinding this handler from the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude unbinding this handler from the source editor
		 * @return {this}
		 * @function
		 * @name unbind
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 * @see bind
		 */
		base.unbind = function(events, handler, excludeWysiwyg, excludeSource) {
			var i  = events.length;
			events = events.split(" ");

			while(i--)
			{
				if($.isFunction(handler))
				{
					if(!excludeWysiwyg)
						$editorContainer.unbind('scewys' + events[i], handler);

					if(!excludeSource)
						$editorContainer.unbind('scesrc' + events[i], handler);
				}
			}

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
		/**
		 * Adds a handler to the editors blur event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name blur^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.blur = function(handler, excludeWysiwyg, excludeSource) {
			if($.isFunction(handler))
				base.bind('blur', handler, excludeWysiwyg, excludeSource);
			else if(!base.sourceMode())
			{
				// Must use an element that isn't display:hidden or visibility:hidden for iOS
				// so create a special blur element to use
				if(!$blurElm)
					$blurElm = $('<input style="width:0;height:0;opacity:0;border:0;padding:0;filter:alpha(opacity=0)" type="text" />').appendTo($editorContainer);

				$blurElm.removeAttr("disabled").show().focus().blur().hide().attr("disabled", "disabled");
			}
			else
				$sourceEditor.blur();

			return this;
		};

		/**
		 * Fucuses the editors input area
		 *
		 * @return {this}
		 * @function
		 * @name focus
		 * @memberOf jQuery.sceditor.prototype
		 */
		/**
		 * Adds an event handler to the focus event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name focus^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.focus = function (handler, excludeWysiwyg, excludeSource) {
			if($.isFunction(handler))
				base.bind('focus', handler, excludeWysiwyg, excludeSource);
			else
			{
				if(!base.inSourceMode())
				{
					wysiwygEditor.contentWindow.focus();
					getWysiwygDoc().body.focus();

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
			}

			return this;
		};

		/**
		 * Adds a handler to the key down event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name keyDown
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyDown = function(handler, excludeWysiwyg, excludeSource) {
			return base.bind('keydown', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * Adds a handler to the key press event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name keyPress
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyPress = function(handler, excludeWysiwyg, excludeSource) {
			return base.bind('keypress', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * Adds a handler to the key up event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler to the source editor
		 * @return {this}
		 * @function
		 * @name keyUp
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyUp = function(handler, excludeWysiwyg, excludeSource) {
			return base.bind('keyup', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * <p>Adds a handler to the node changed event.</p>
		 *
		 * <p>Happends whenever the node containing the selection/caret changes in WYSIWYG mode.</p>
		 *
		 * @param  {Function} handler
		 * @return {this}
		 * @function
		 * @name nodeChanged
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.nodeChanged = function(handler) {
			return base.bind('nodechanged', handler, false, true);
		};

		/**
		 * <p>Adds a handler to the selection changed event</p>
		 *
		 * <p>Happends whenever the selection changes in WYSIWYG mode.</p>
		 *
		 * @param  {Function} handler
		 * @return {this}
		 * @function
		 * @name selectionChanged
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.selectionChanged = function(handler) {
			return base.bind('selectionchanged', handler, false, true);
		};

		/**
		 * Emoticons keypress handler
		 * @private
		 */
		emoticonsKeyPress = function (e) {
			var	pos     = 0,
				curChar = String.fromCharCode(e.which);

			if(!base.emoticonsCache) {
				base.emoticonsCache = [];

				$.each($.extend({}, options.emoticons.more, options.emoticons.dropdown, options.emoticons.hidden), function(key, url) {
					base.emoticonsCache[pos++] = [
						key,
						_tmpl("emoticon", {
							key: key,
							url: url.url || url,
							tooltip: url.tooltip || key
						})
					];
				});

				base.emoticonsCache.sort(function(a, b){
					return a[0].length - b[0].length;
				});
			}

			if(!base.longestEmoticonCode)
				base.longestEmoticonCode = base.emoticonsCache[base.emoticonsCache.length - 1][0].length;

			if(base.getRangeHelper().raplaceKeyword(base.emoticonsCache, true, true, base.longestEmoticonCode, options.emoticonsCompat, curChar))
			{
				if(/^\s$/.test(curChar) && options.emoticonsCompat)
					return true;

				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		};

		/**
		 * Gets if emoticons are currently enabled
		 * @return {boolean}
		 * @function
		 * @name emoticons
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.2
		 */
		/**
		 * Enables/disables emoticons
		 *
		 * @param {boolean} enable
		 * @return {this}
		 * @function
		 * @name emoticons^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.2
		 */
		base.emoticons = function(enable) {
			if(!enable && enable !== false)
				return options.emoticonsEnabled;

			var $body = $(getWysiwygDoc().body);

			options.emoticonsEnabled = enable;

			if(enable)
			{
				$body.keypress(emoticonsKeyPress);

				if(!base.sourceMode())
				{
					rangeHelper.saveRange();

					$body.html(replaceEmoticons($body.html()));

					rangeHelper.restoreRange();
				}
			}
			else
			{
				$body.find('img[data-sceditor-emoticon]').replaceWith(function() {
					return $(this).data('sceditor-emoticon');
				});

				$body.unbind('keypress', emoticonsKeyPress);
			}

			return this;
		};

		// run the initializer
		init();
	};

	/**
	 * <p>Detects the version of IE is being used if any.</p>
	 *
	 * <p>Returns the IE version number or undefined if not IE.</p>
	 *
	 * <p>Source: https://gist.github.com/527683 with extra code for IE 10 detection</p>
	 * @function
	 * @name ie
	 * @memberOf jQuery.sceditor
	 * @type {int}
	 */
	$.sceditor.ie = (function(){
		var	undef,
			v   = 3,
			div = document.createElement('div'),
			all = div.getElementsByTagName('i');

		do {
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->';
		} while (all[0]);

		// Detect IE 10 as it doesn't support conditional comments.
		if((document.all && window.atob))
			v = 10;

		return v > 4 ? v : undef;
	}());

	/**
	 * If the browser supports WYSIWYG editing (e.g. older mobile browsers).
	 * @function
	 * @name isWysiwygSupported
	 * @memberOf jQuery.sceditor
	 * @return {Boolean}
	 */
	$.sceditor.isWysiwygSupported = (function() {
		var	match,
			contentEditable          = $('<div contenteditable="true">')[0].contentEditable,
			contentEditableSupported = typeof contentEditable !== 'undefined' && contentEditable !== 'inherit',
			userAgent                = navigator.userAgent;

		if(!contentEditableSupported)
			return false;

		// I think blackberry supports it or will at least
		// give a valid value for the contentEditable detection above
		// so it's' not included here.


		// The latest WebOS does support contentEditable.
		// But I still till need to check if all supported
		// versions of WebOS support contentEditable


		// I hate having to use UA sniffing but some mobile browsers say they support
		// contentediable/design mode when it isn't usable (i.e. you can't enter text, ect.).
		// This is the only way I can think of to detect them which is also how every other
		// editor I've seen deals with this
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

		// FireFox does support WYSIWYG on mobiles so override
		// any previous value if using FF
		if(/fennec/i.test(userAgent))
			isUnsupported = false;

		return !isUnsupported;
	}());

	/**
	 * Escapes a string so it's safe to use in regex
	 *
	 * @param {String} str
	 * @return {String}
	 * @name regexEscape
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.regexEscape = function (str) {
		return str.replace(/[\$\?\[\]\.\*\(\)\|\\]/g, "\\$&")
			.replace("<", "&lt;")
			.replace(">", "&gt;");
	};

	/**
	 * Escapes all HTML entites in a string
	 *
	 * @param {String} str
	 * @return {String}
	 * @name escapeEntities
	 * @memberOf jQuery.sceditor
	 * @since 1.4.1
	 */
	$.sceditor.escapeEntities = function(str) {
		if(!str)
			return str;

		return str.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/ {2}/g, " &nbsp;")
			.replace(/\r\n|\r/g, "\n")
			.replace(/\n/g, "<br />");
	};

	/**
	 * Map containing the loaded SCEditor locales
	 * @type {Object}
	 * @name locale
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.locale = {};

	/**
	 * Map of all the commands for SCEditor
	 * @type {Object}
	 * @name commands
	 * @memberOf jQuery.sceditor
	 */
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
				var	i, x, color, colors,
					genColor     = {r: 255, g: 255, b: 255},
					content      = $("<div />"),
					colorColumns = editor.opts.colors?editor.opts.colors.split("|"):new Array(21),
					// IE is slow at string concation so use an array
					html         = [],
					cmd          = $.sceditor.command.get('color');

				if(!cmd._htmlCache)
				{
					for (i=0; i < colorColumns.length; ++i)
					{
						colors = colorColumns[i]?colorColumns[i].split(","):new Array(21);

						html.push('<div class="sceditor-color-column">');
						for (x=0; x < colors.length; ++x)
						{
							// use pre defined colour if can otherwise use the generated color
							color = colors[x] || "#" + genColor.r.toString(16) + genColor.g.toString(16) + genColor.b.toString(16);

							html.push('<a href="#" class="sceditor-color-option" style="background-color: '+color+'" data-color="'+color+'"></a>');

							// calculate the next generated color
							if(x%5===0)
							{
								genColor.g -= 51;
								genColor.b = 255;
							}
							else
								genColor.b -= 51;
						}
						html.push('</div>');

						// calculate the next generated color
						if(i%5===0)
						{
							genColor.r -= 51;
							genColor.g = 255;
							genColor.b = 255;
						}
						else
						{
							genColor.g = 255;
							genColor.b = 255;
						}
					}

					cmd._htmlCache = html.join('');
				}

				content.append(cmd._htmlCache)
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
							html += '<td>' + ($.sceditor.ie ? '' : '<br />') + '</td>';

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
			forceNewLineAfter: ['code'],
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
			forceNewLineAfter: ['blockquote'],
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
				var editor = this;

				var createContent = function(includeMore) {
					var	endSpace  = (editor.opts.emoticonsCompat ? ' ' : ''),
						$content  = $('<div />'),
						$line     = $('<div />').appendTo($content),
						emoticons = $.extend({}, editor.opts.emoticons.dropdown, includeMore ? editor.opts.emoticons.more : {}),
						perLine   = 0;

					for(var prop in emoticons)
					{
						if(emoticons.hasOwnProperty(prop))
							perLine++;
					}

					perLine = Math.sqrt(perLine);

					$.each(emoticons, function(code, emoticon) {
						$line.append($('<img />')
							.attr({
								src: emoticon.url || emoticon,
								alt: code,
								title: emoticon.tooltip || code
							})
							.click(function() {
								editor.insert($(this).attr('alt') + endSpace).closeDropDown(true);

								return false;
							})
						);

						if($line.children().length >= perLine)
							$line = $('<div />').appendTo($content);
					});

					if(!includeMore)
					{
						$content.append($(
							editor._('<a class="sceditor-more">{0}</a>', editor._("More"))
						).click(function () {
							editor.createDropDown(caller, "more-emoticons", createContent(true));
							return false;
						}));
					}

					return $content;
				};

				editor.createDropDown(caller, "emoticons", createContent(false));
			},
			txtExec: function(caller) {
				$.sceditor.command.get('emoticon').exec.call(this, caller);
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
			state: function(parents, firstBlock) {
				return firstBlock && firstBlock.style.direction === 'ltr';
			},
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
					$elm.css('direction', '');
				else
					$elm.css('direction', 'ltr');
			},
			tooltip: "Left-to-Right"
		},
		// END_COMMAND

		// START_COMMAND: Rtl
		rtl: {
			state: function(parents, firstBlock) {
				return firstBlock && firstBlock.style.direction === 'rtl';
			},
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
					$elm.css('direction', '');
				else
					$elm.css('direction', 'rtl');
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

		// START_COMMAND: Maximize
		maximize: {
			state: function() {
				return this.maximize();
			},
			exec: function () {
				this.maximize(!this.maximize());
			},
			txtExec: function () {
				this.maximize(!this.maximize());
			},
			tooltip: "Maximize"
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
		 * @return False on fail
		 * @function
		 * @name insertHTML
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.insertHTML = function(html, endHTML) {
			var	node, div,
				range = base.selectedRange();

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
			{
				if(!range)
					return false;

				range.pasteHTML(html);
			}
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
		 * @return False on fail
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

				if(!range)
					return false;

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
			var range = base.selectedRange();

			if(range)
				return isW3C ? range.cloneRange() : range.duplicate();
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
			var	range, parent,
				sel = isW3C ? win.getSelection() : doc.selection;

			if(!sel)
				return;

			// When creating a new range, set the start to the body
			// element to avoid errors in FF.
			if(sel.getRangeAt && sel.rangeCount <= 0)
			{
				range = doc.createRange();
				range.setStart(doc.body, 0);
				sel.addRange(range);
			}

			range = isW3C ? sel.getRangeAt(0) : sel.createRange();

			// IE fix to make sure only return selections that are part of the WYSIWYG iframe
			if(range.parentElement && (parent = range.parentElement()))
				if(parent.ownerDocument !== doc)
					return;

			return range;
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
			var	div,
				range = base.selectedRange();

			if(!range)
				return '';

			// IE < 9
			if(!isW3C && range.text !== '' && range.htmlText)
				return range.htmlText;


			// IE9+ and all other browsers
			if(isW3C)
			{
				div = doc.createElement('div');
				div.appendChild(range.cloneContents());

				return div.innerHTML;
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

			if(range)
			{
				if(isW3C)
					return range.commonAncestorContainer;

				if(range.parentElement)
					return range.parentElement();
			}
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
		/**
		 * Gets the first block level parent of the selected
		 * contents of the range.
		 *
		 * @param {Node} n The element to get the first block level parent frmo
		 * @return {HTMLElement}
		 * @function
		 * @name getFirstBlockParent^2
		 * @since 1.4.1
		 * @memberOf jQuery.sceditor.rangeHelper.prototype
		 */
		base.getFirstBlockParent = function(n) {
			var func = function(node) {
				if(!$.sceditor.dom.isInline(node))
					return node;

				var p = node ? node.parentNode : null;

				return p ? func(p) : null;
			};

			return func(n || base.parentNode());
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
			var	currentRange = base.selectedRange(),
				range        = base.cloneSelected();

			if(!range)
				return false;

			range.collapse(start);

			if(range.insertNode)
				range.insertNode(node);
			else
				range.pasteHTML(node.outerHTML);

			// Reselect the current range.
			// Fixes issue with Chrome losing the selection. Issue#82
			base.selectRange(currentRange);
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
			marker.className        = "sceditor-selection sceditor-ignore";

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

			if(!start || !end || !range)
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

			if(!range)
				return false;

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

			if(!range)
				return '';

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

		/**
		 * Compares two ranges.
		 * @param  {Range|TextRange} rangeA
		 * @param  {Range|TextRange} rangeB If undefined it will be set to the current selected range
		 * @return {Boolean}
		 */
		base.compare = function(rangeA, rangeB) {
			if(!rangeB)
				rangeB = base.selectedRange();

			if(!rangeA || !rangeB)
				return !rangeA && !rangeB;

			if(!isW3C)
			{
				return rangeA.compareEndPoints('EndToEnd', rangeB)  === 0 &&
					rangeA.compareEndPoints('StartToStart', rangeB) === 0;
			}

			return rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB)  === 0 &&
				rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB) === 0;
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
			to.style.cssText = from.style.cssText + to.style.cssText;
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
					base.copyCSS(parent, middle);

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
			// fixing invalid nesting so it doesn't need to be very fast
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
			var	nodeValue,
				multiWhitespace = /[^\S|\u00A0]+/g;

			this.traverse(root, function(node) {
				nodeValue = node.nodeValue;
// TODO: have proper white-space checking for pre formatted text instead of checking for code and pre tags.
				if(node.nodeType === 3 && $(node).parents('code, pre').length === 0 && nodeValue)
				{
					if(!node.previousSibling || !$.sceditor.dom.isInline(node.previousSibling))
						nodeValue = nodeValue.replace(/^[\r\n]+/, "");

					if(!node.nextSibling || !$.sceditor.dom.isInline(node.nextSibling))
						nodeValue = nodeValue.replace(/[\r\n]+$/, "");

					nodeValue = nodeValue.replace(/[\r\n]+/, " ");

					//remove empty nodes
					if(!nodeValue.length)
					{
						node.parentNode.removeChild(node);
						return;
					}

					// If entirely whitespace then just set to a single space
					if(!/\S|\u00A0/.test(nodeValue))
						nodeValue = " ";
					// replace multiple spaces inbetween non-white space with a single space
					else if(multiWhitespace.test(nodeValue))
						nodeValue = nodeValue.replace(multiWhitespace, " ");

					node.nodeValue = nodeValue;
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
	 * Object containing SCEditor plugins
	 * @type {Object}
	 * @name plugins
	 * @memberOf jQuery.sceditor
	 */
	$.sceditor.plugins = {};

	/**
	 * Plugin Manager class
	 * @class PluginManager
	 * @name jQuery.sceditor.PluginManager
	 */
	$.sceditor.PluginManager = function(owner) {
		/**
		 * Alias of this
		 * @private
		 * @type {Object}
		 */
		var base = this;

		/**
		 * Array of all currently registered plugins
		 * @type {Array}
		 * @private
		 */
		var plugins = [];

		/**
		 * Editor instance this plugin manager belongs to
		 * @type {jQuery.sceditor}
		 * @private
		 */
		var editorInstance = owner;


		/**
		 * Changes a signals name from "name" into "signalName".
		 * @param  {String} signal
		 * @return {String}
		 * @private
		 */
		var formatSignalName = function(signal) {
			return 'signal' + signal.charAt(0).toUpperCase() + signal.slice(1);
		};

		/**
		 * Calls handlers for a signal
		 * @see call()
		 * @see callOnlyFirst()
		 * @param  {Array}   args
		 * @param  {Boolean} returnAtFirst
		 * @return {Mixed}
		 * @private
		 */
		var callHandlers = function(args, returnAtFirst) {
			args = [].slice.call(args);

			var	i      = plugins.length,
				signal = formatSignalName(args.shift());

			while(i--)
			{
				if(signal in plugins[i])
				{
					if(returnAtFirst)
						return plugins[i][signal].apply(editorInstance, args);

					plugins[i][signal].apply(editorInstance, args);
				}
			}
		};

		/**
		 * Calls all handlers for the passed signal
		 * @param  {String}    signal
		 * @param  {...String} args
		 * @return {Void}
		 * @function
		 * @name call
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.call = function() {
			callHandlers(arguments, false);
		};

		/**
		 * Calls the first handler for a signal, and returns the result
		 * @param  {String}    signal
		 * @param  {...String} args
		 * @return {Mixed} The result of calling the handler
		 * @function
		 * @name callOnlyFirst
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.callOnlyFirst = function() {
			return callHandlers(arguments, true);
		};

		/**
		 * <p>Returns an object which has callNext and hasNext methods.</p>
		 *
		 * <p>callNext takes arguments to pass to the handler and returns the
		 * result of calling the handler</p>
		 *
		 * <p>hasNext checks if there is another handler</p>
		 *
		 * @param {String} signal
		 * @return {Object} Object with hasNext and callNext methods
		 * @function
		 * @name iter
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.iter = function(signal) {
			signal = formatSignalName(signal);

			return (function () {
				var i = plugins.length;

				return {
						callNext: function(args) {
							while(i--)
								if(plugins[i] && signal in plugins[i])
									return plugins[i].apply(editorInstance, args);
						},
						hasNext: function() {
							var j = i;

							while(j--)
								if(plugins[j] && signal in plugins[j])
									return true;

							return false;
						}
					};
			}());
		};

		/**
		 * Checks if a signal has a handler
		 * @param  {String} signal
		 * @return {Boolean}
		 * @function
		 * @name hasHandler
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.hasHandler = function(signal) {
			var i  = plugins.length;
			signal = formatSignalName(signal);

			while(i--)
				if(signal in plugins[i])
					return true;

			return false;
		};

		/**
		 * Checks if the plugin exists in jQuery.sceditor.plugins
		 * @param  {String} plugin
		 * @return {Boolean}
		 * @function
		 * @name exsists
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.exsists = function(plugin) {
			if(plugin in $.sceditor.plugins)
			{
				plugin = $.sceditor.plugins[plugin];

				return typeof plugin === "function" && typeof plugin.prototype === "object";
			}

			return false;
		};

		/**
		 * Checks if the passed plugin is currrently registered.
		 * @param  {String} plugin
		 * @return {Boolean}
		 * @function
		 * @name isRegistered
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.isRegistered = function(plugin) {
			var i = plugins.length;

			if(!base.exsists(plugin))
				return false;

			while(i--)
				if(plugins[i] instanceof $.sceditor.plugins[plugin])
					return true;

			return false;
		};

		/**
		 * Registers a plugin to receive signals
		 * @param  {String} plugin
		 * @return {Boolean}
		 * @function
		 * @name register
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.register = function(plugin) {
			if(!base.exsists(plugin))
				return false;

			plugin = new $.sceditor.plugins[plugin]();
			plugins.push(plugin);

			if('init' in plugin)
				plugin.init.apply(editorInstance);

			return true;
		};

		/**
		 * Deregisters a plugin.
		 * @param  {String} plugin
		 * @return {Boolean}
		 * @function
		 * @name deregister
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.deregister = function(plugin) {
			var	removedPlugin,
				i   = plugins.length,
				ret = false;

			if(!base.isRegistered(plugin))
				return false;

			while(i--)
			{
				if(plugins[i] instanceof $.sceditor.plugins[plugin])
				{
					removedPlugin = plugins.splice(i, 1)[0];
					ret    = true;

					if('destroy' in removedPlugin)
						removedPlugin.destroy.apply(editorInstance);
				}
			}

			return ret;
		};

		/**
		 * <p>Clears all plugins and removes the owner refrence.</p>
		 *
		 * <p>Calling any functions on this object after calling destroy will cause a JS error.</p>
		 * @return {Void}
		 * @function
		 * @name destroy
		 * @memberOf jQuery.sceditor.PluginManager.prototype
		 */
		base.destroy = function() {
			var i = plugins.length;

			while(i--)
				if('destroy' in plugins[i])
					plugins[i].destroy.apply(editorInstance);

			plugins        = null;
			editorInstance = null;
		};
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
	 * @class defaultOptions
	 * @name jQuery.sceditor.defaultOptions
	 */
	$.sceditor.defaultOptions = {
		/** @lends jQuery.sceditor.defaultOptions */
		/**
		 * Toolbar buttons order and groups. Should be comma separated and have a bar | to separate groups
		 * @type {String}
		 */
		toolbar:	"bold,italic,underline,strike,subscript,superscript|left,center,right,justify|" +
				"font,size,color,removeformat|cut,copy,paste,pastetext|bulletlist,orderedlist|" +
				"table|code,quote|horizontalrule,image,email,link,unlink|emoticon,youtube,date,time|" +
				"ltr,rtl|print,maximize,source",

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
		 * If to enable emoticons. Can be changes at runtime using the emoticons() method.
		 * @type {Boolean}
		 * @since 1.4.2
		 */
		emoticonsEnabled: true,

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
		 * If to completely disable pasting into the editor
		 * @type {Boolean}
		 */
		disablePasting: false,

		/**
		 * If the editor is read only.
		 * @type {Boolean}
		 */
		readOnly: false,

		/**
		 * If to set the editor to right-to-left mode.
		 *
		 * If set to null the direction will be automatically detected.
		 * @type {Boolean}
		 */
		rtl: false,

		/**
		 * If to auto focus the editor on page load
		 * @type {Boolean}
		 */
		autofocus: false,

		/**
		 * If to auto focus the editor to the end of the content
		 * @type {Boolean}
		 */
		autofocusEnd: true,

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
		 * Comma seperated list of plugins
		 * @type {String}
		 */
		plugins: '',

		/**
		 * z-index to set the editor container to. Needed for jQuery UI dialog.
		 * @type {Int}
		 */
		zIndex: null,

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

	/**
	 * Creates an instance of sceditor on all textareas
	 * matched by the jQuery selector.
	 *
	 * If options is set to "state" it will return bool value
	 * indicating if the editor has been initilised on the
	 * matched textarea(s). If there is only one textarea
	 * it will return the bool value for that textarea.
	 * If more than one textarea is matched it will
	 * return an array of bool values for each textarea.
	 *
	 * If options is set to "instance" it will return the
	 * current editor instance for the textarea(s). Like the
	 * state option, if only one textarea is matched this will
	 * return just the instace for that textarea. If more than
	 * one textarea is matched it will return an array of
	 * instances each textarea.
	 *
	 * @param  {Object|String} options Should either be an Object of options or the strings "state" or "instance"
	 * @return {this|Array|jQuery.sceditor|Bool}
	 */
	$.fn.sceditor = function (options) {
		var	$this,
			ret = [];

		options = options || {};

		if(!options.runWithoutWysiwygSupport && !$.sceditor.isWysiwygSupported)
			return;

		this.each(function () {

			$this = this.jquery ? this : $(this);
			// Don't allow the editor to be initilised on it's own source editor
			if($this.parents('.sceditor-container').length > 0)
				return;

			// Add state of instance to ret if that is what options is set to
			if(options === "state")
				ret.push(!!$this.data('sceditor'));
			else if(options === "instance")
				ret.push($this.data('sceditor'));
			else if(!$this.data('sceditor'))
				(new $.sceditor(this, options));
		});

		// If nothing in the ret array then must be init so return this
		if(!ret.length)
			return this;

		return ret.length === 1 ? ret[0] : $(ret);
	};
})(jQuery, window, document);
