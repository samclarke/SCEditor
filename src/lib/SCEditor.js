define(function (require) {
	'use strict';

	var $             = require('jquery');
	var PluginManager = require('./PluginManager');
	var RangeHelper   = require('./RangeHelper');
	var dom           = require('./dom');
	var escape        = require('./escape');
	var browser       = require('./browser');
	var _tmpl         = require('./templates');

	var globalWin  = window;
	var globalDoc  = document;
	var $globalWin = $(globalWin);
	var $globalDoc = $(globalDoc);

	var IE_VER = browser.ie;

	// In IE < 11 a BR at the end of a block level element
	// causes a line break. In all other browsers it's collapsed.
	var IE_BR_FIX = IE_VER && IE_VER < 11;


	/**
	 * SCEditor - A lightweight WYSIWYG editor
	 *
	 * @param {Element} el The textarea to be converted
	 * @return {Object} options
	 * @class sceditor
	 * @name jQuery.sceditor
	 */
	var SCEditor = function (el, options) {
		/**
		 * Alias of this
		 *
		 * @private
		 */
		var base = this;

		/**
		 * The textarea element being replaced
		 *
		 * @private
		 */
		var original  = el.get ? el.get(0) : el;
		var $original = $(original);

		/**
		 * The div which contains the editor and toolbar
		 *
		 * @private
		 */
		var $editorContainer;

		/**
		 * The editors toolbar
		 *
		 * @private
		 */
		var $toolbar;

		/**
		 * The editors iframe which should be in design mode
		 *
		 * @private
		 */
		var $wysiwygEditor;
		var wysiwygEditor;

		/**
		 * The WYSIWYG editors body element
		 *
		 * @private
		 */
		var $wysiwygBody;

		/**
		 * The WYSIWYG editors document
		 *
		 * @private
		 */
		var $wysiwygDoc;

		/**
		 * The editors textarea for viewing source
		 *
		 * @private
		 */
		var $sourceEditor;
		var sourceEditor;

		/**
		 * The current dropdown
		 *
		 * @private
		 */
		var $dropdown;

		/**
		 * Store the last cursor position. Needed for IE because it forgets
		 *
		 * @private
		 */
		var lastRange;

		/**
		 * The editors locale
		 *
		 * @private
		 */
		var locale;

		/**
		 * Stores a cache of preloaded images
		 *
		 * @private
		 * @type {Array}
		 */
		var preLoadCache = [];

		/**
		 * The editors rangeHelper instance
		 *
		 * @type {jQuery.sceditor.rangeHelper}
		 * @private
		 */
		var rangeHelper;

		/**
		 * Tags which require the new line fix
		 *
		 * @type {Array}
		 * @private
		 */
		var requireNewLineFix = [];

		/**
		 * An array of button state handlers
		 *
		 * @type {Array}
		 * @private
		 */
		var btnStateHandlers = [];

		/**
		 * Plugin manager instance
		 *
		 * @type {jQuery.sceditor.PluginManager}
		 * @private
		 */
		var pluginManager;

		/**
		 * The current node containing the selection/caret
		 *
		 * @type {Node}
		 * @private
		 */
		var currentNode;

		/**
		 * The first block level parent of the current node
		 *
		 * @type {node}
		 * @private
		 */
		var currentBlockNode;

		/**
		 * The current node selection/caret
		 *
		 * @type {Object}
		 * @private
		 */
		var currentSelection;

		/**
		 * Used to make sure only 1 selection changed
		 * check is called every 100ms.
		 *
		 * Helps improve performance as it is checked a lot.
		 *
		 * @type {Boolean}
		 * @private
		 */
		var isSelectionCheckPending;

		/**
		 * If content is required (equivalent to the HTML5 required attribute)
		 *
		 * @type {Boolean}
		 * @private
		 */
		var isRequired;

		/**
		 * The inline CSS style element. Will be undefined
		 * until css() is called for the first time.
		 *
		 * @type {HTMLElement}
		 * @private
		 */
		var inlineCss;

		/**
		 * Object containing a list of shortcut handlers
		 *
		 * @type {Object}
		 * @private
		 */
		var shortcutHandlers = {};

		/**
		 * An array of all the current emoticons.
		 *
		 * Only used or populated when emoticonsCompat is enabled.
		 *
		 * @type {Array}
		 * @private
		 */
		var currentEmoticons = [];

		/**
		 * Cache of the current toolbar buttons
		 *
		 * @type {Object}
		 * @private
		 */
		var toolbarButtons = {};

		/**
		 * If the current autoUpdate action is canceled.
		 *
		 * @type {Boolean}
		 * @private
		 */
		var autoUpdateCanceled;

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
			handleKeyDown,
			handleBackSpace,
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
			emoticonsKeyPress,
			emoticonsCheckWhitespace,
			currentStyledBlockNode,
			triggerValueChanged,
			valueChangedBlur,
			valueChangedKeyUp,
			autoUpdate;

		/**
		 * All the commands supported by the editor
		 * @name commands
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.commands = $.extend(
			true,
			{},
			(options.commands || SCEditor.commands)
		);

		/**
		 * Options for this editor instance
		 * @name opts
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.opts = options = $.extend({}, SCEditor.defaultOptions, options);


		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		init = function () {
			$original.data('sceditor', base);

			// Clone any objects in options
			$.each(options, function (key, val) {
				if ($.isPlainObject(val)) {
					options[key] = $.extend(true, {}, val);
				}
			});

			// Load locale
			if (options.locale && options.locale !== 'en') {
				initLocale();
			}

			$editorContainer = $('<div class="sceditor-container" />')
				.insertAfter($original)
				.css('z-index', options.zIndex);

			// Add IE version to the container to allow IE specific CSS
			// fixes without using CSS hacks or conditional comments
			if (IE_VER) {
				$editorContainer.addClass('ie ie' + IE_VER);
			}

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
			if (!browser.isWysiwygSupported) {
				base.toggleSourceMode();
			}

			updateActiveButtons();

			var loaded = function () {
				$globalWin.unbind('load', loaded);

				if (options.autofocus) {
					autofocus();
				}

				if (options.autoExpand) {
					base.expandToContent();
				}

				// Page width might have changed after CSS is loaded so
				// call handleWindowResize to update any % based dimensions
				handleWindowResize();

				pluginManager.call('ready');
			};
			$globalWin.load(loaded);
			if (globalDoc.readyState && globalDoc.readyState === 'complete') {
				loaded();
			}
		};

		initPlugins = function () {
			var plugins   = options.plugins;

			plugins       = plugins ? plugins.toString().split(',') : [];
			pluginManager = new PluginManager(base);

			$.each(plugins, function (idx, plugin) {
				pluginManager.register($.trim(plugin));
			});
		};

		/**
		 * Init the locale variable with the specified locale if possible
		 * @private
		 * @return void
		 */
		initLocale = function () {
			var lang;

			locale = SCEditor.locale[options.locale];

			if (!locale) {
				lang   = options.locale.split('-');
				locale = SCEditor.locale[lang[0]];
			}

			// Locale DateTime format overrides any specified in the options
			if (locale && locale.dateFormat) {
				options.dateFormat = locale.dateFormat;
			}
		};

		/**
		 * Creates the editor iframe and textarea
		 * @private
		 */
		initEditor = function () {
			var doc, tabIndex;

			$sourceEditor  = $('<textarea></textarea>').hide();
			$wysiwygEditor = $(
				'<iframe frameborder="0" allowfullscreen="true"></iframe>'
			);

			if (!options.spellcheck) {
				$sourceEditor.attr('spellcheck', 'false');
			}

			/*jshint scripturl: true*/
			if (globalWin.location.protocol === 'https:') {
				$wysiwygEditor.attr('src', 'javascript:false');
			}

			// Add the editor to the container
			$editorContainer.append($wysiwygEditor).append($sourceEditor);
			wysiwygEditor = $wysiwygEditor[0];
			sourceEditor  = $sourceEditor[0];

			base.dimensions(
				options.width || $original.width(),
				options.height || $original.height()
			);

			doc = getWysiwygDoc();
			doc.open();
			doc.write(_tmpl('html', {
				// Add IE version class to the HTML element so can apply
				// conditional styling without CSS hacks
				attrs: IE_VER ? ' class="ie ie"' + IE_VER : '',
				spellcheck: options.spellcheck ? '' : 'spellcheck="false"',
				charset: options.charset,
				style: options.style
			}));
			doc.close();

			$wysiwygDoc  = $(doc);
			$wysiwygBody = $(doc.body);

			base.readOnly(!!options.readOnly);

			// iframe overflow fix for iOS, also fixes an IE issue with the
			// editor not getting focus when clicking inside
			if (browser.ios || IE_VER) {
				$wysiwygBody.height('100%');

				if (!IE_VER) {
					$wysiwygBody.bind('touchend', base.focus);
				}
			}

			tabIndex = $original.attr('tabindex');
			$sourceEditor.attr('tabindex', tabIndex);
			$wysiwygEditor.attr('tabindex', tabIndex);

			rangeHelper = new RangeHelper(wysiwygEditor.contentWindow);

			// load any textarea value into the editor
			base.val($original.hide().val());
		};

		/**
		 * Initialises options
		 * @private
		 */
		initOptions = function () {
			// auto-update original textbox on blur if option set to true
			if (options.autoUpdate) {
				$wysiwygBody.bind('blur', autoUpdate);
				$sourceEditor.bind('blur', autoUpdate);
			}

			if (options.rtl === null) {
				options.rtl = $sourceEditor.css('direction') === 'rtl';
			}

			base.rtl(!!options.rtl);

			if (options.autoExpand) {
				$wysiwygDoc.bind('keyup', base.expandToContent);
			}

			if (options.resizeEnabled) {
				initResize();
			}

			$editorContainer.attr('id', options.id);
			base.emoticons(options.emoticonsEnabled);
		};

		/**
		 * Initialises events
		 * @private
		 */
		initEvents = function () {
			var CHECK_SELECTION_EVENTS = IE_VER ?
				'selectionchange' :
				'keyup focus blur contextmenu mouseup touchend click';

			var EVENTS_TO_FORWARD = 'keydown keyup keypress ' +
				'focus blur contextmenu';

			$globalDoc.click(handleDocumentClick);

			$(original.form)
				.bind('reset', handleFormReset)
				.submit(base.updateOriginal);

			$globalWin.bind('resize orientationChanged', handleWindowResize);

			$wysiwygBody
				.keypress(handleKeyPress)
				.keydown(handleKeyDown)
				.keydown(handleBackSpace)
				.keyup(appendNewLine)
				.blur(valueChangedBlur)
				.keyup(valueChangedKeyUp)
				.bind('paste', handlePasteEvt)
				.bind(CHECK_SELECTION_EVENTS, checkSelectionChanged)
				.bind(EVENTS_TO_FORWARD, handleEvent);

			if (options.emoticonsCompat && globalWin.getSelection) {
				$wysiwygBody.keyup(emoticonsCheckWhitespace);
			}

			$sourceEditor
				.blur(valueChangedBlur)
				.keyup(valueChangedKeyUp)
				.keydown(handleKeyDown)
				.bind(EVENTS_TO_FORWARD, handleEvent);

			$wysiwygDoc
				.mousedown(handleMouseDown)
				.blur(valueChangedBlur)
				.bind(CHECK_SELECTION_EVENTS, checkSelectionChanged)
				.bind('beforedeactivate keyup', saveRange)
				.keyup(appendNewLine)
				.focus(function () {
					lastRange = null;
				});

			$editorContainer
				.bind('selectionchanged', checkNodeChanged)
				.bind('selectionchanged', updateActiveButtons)
				.bind('selectionchanged valuechanged nodechanged', handleEvent);
		};

		/**
		 * Creates the toolbar and appends it to the container
		 * @private
		 */
		initToolBar = function () {
			var	$group,
				commands = base.commands,
				exclude  = (options.toolbarExclude || '').split(','),
				groups   = options.toolbar.split('|');

			$toolbar = $('<div class="sceditor-toolbar" unselectable="on" />');

			$.each(groups, function (idx, group) {
				$group  = $('<div class="sceditor-group" />');

				$.each(group.split(','), function (idx, commandName) {
					var	$button, shortcut,
						command  = commands[commandName];

					// The commandName must be a valid command and not excluded
					if (!command || $.inArray(commandName, exclude) > -1) {
						return;
					}

					shortcut = command.shortcut;
					$button  = _tmpl('toolbarButton', {
						name: commandName,
						dispName: base._(command.tooltip || commandName)
					}, true);

					$button
						.data('sceditor-txtmode', !!command.txtExec)
						.data('sceditor-wysiwygmode', !!command.exec)
						.toggleClass('disabled', !command.exec)
						.mousedown(function () {
							// IE < 8 supports unselectable attribute
							// so don't need this
							if (!IE_VER || IE_VER < 9) {
								autoUpdateCanceled = true;
							}
						})
						.click(function () {
							var $this = $(this);

							if (!$this.hasClass('disabled')) {
								handleCommand($this, command);
							}

							updateActiveButtons();
							return false;
						});

					if (command.tooltip) {
						$button.attr(
							'title',
							base._(command.tooltip) +
								(shortcut ? '(' + shortcut + ')' : '')
						);
					}

					if (shortcut) {
						base.addShortcut(shortcut, commandName);
					}

					if (command.state) {
						btnStateHandlers.push({
							name: commandName,
							state: command.state
						});
					// exec string commands can be passed to queryCommandState
					} else if (typeof command.exec === 'string') {
						btnStateHandlers.push({
							name: commandName,
							state: command.exec
						});
					}

					$group.append($button);
					toolbarButtons[commandName] = $button;
				});

				// Exclude empty groups
				if ($group[0].firstChild) {
					$toolbar.append($group);
				}
			});

			// Append the toolbar to the toolbarContainer option if given
			$(options.toolbarContainer || $editorContainer).append($toolbar);
		};

		/**
		 * Creates an array of all the key press functions
		 * like emoticons, ect.
		 * @private
		 */
		initCommands = function () {
			$.each(base.commands, function (name, cmd) {
				if (cmd.forceNewLineAfter && $.isArray(cmd.forceNewLineAfter)) {
					requireNewLineFix = $.merge(
						requireNewLineFix,
						cmd.forceNewLineAfter
					);
				}
			});

			appendNewLine();
		};

		/**
		 * Creates the resizer.
		 * @private
		 */
		initResize = function () {
			var	minHeight, maxHeight, minWidth, maxWidth,
				mouseMoveFunc, mouseUpFunc,
				$grip       = $('<div class="sceditor-grip" />'),
				// Cover is used to cover the editor iframe so document
				// still gets mouse move events
				$cover      = $('<div class="sceditor-resize-cover" />'),
				moveEvents  = 'touchmove mousemove',
				endEvents   = 'touchcancel touchend mouseup',
				startX      = 0,
				startY      = 0,
				newX        = 0,
				newY        = 0,
				startWidth  = 0,
				startHeight = 0,
				origWidth   = $editorContainer.width(),
				origHeight  = $editorContainer.height(),
				isDragging  = false,
				rtl         = base.rtl();

			minHeight = options.resizeMinHeight || origHeight / 1.5;
			maxHeight = options.resizeMaxHeight || origHeight * 2.5;
			minWidth  = options.resizeMinWidth  || origWidth  / 1.25;
			maxWidth  = options.resizeMaxWidth  || origWidth  * 1.25;

			mouseMoveFunc = function (e) {
				// iOS uses window.event
				if (e.type === 'touchmove') {
					e    = globalWin.event;
					newX = e.changedTouches[0].pageX;
					newY = e.changedTouches[0].pageY;
				} else {
					newX = e.pageX;
					newY = e.pageY;
				}

				var	newHeight = startHeight + (newY - startY),
					newWidth  = rtl ?
						startWidth - (newX - startX) :
						startWidth + (newX - startX);

				if (maxWidth > 0 && newWidth > maxWidth) {
					newWidth = maxWidth;
				}
				if (minWidth > 0 && newWidth < minWidth) {
					newWidth = minWidth;
				}
				if (!options.resizeWidth) {
					newWidth = false;
				}

				if (maxHeight > 0 && newHeight > maxHeight) {
					newHeight = maxHeight;
				}
				if (minHeight > 0 && newHeight < minHeight) {
					newHeight = minHeight;
				}
				if (!options.resizeHeight) {
					newHeight = false;
				}

				if (newWidth || newHeight) {
					base.dimensions(newWidth, newHeight);

					// The resize cover will not fill the container
					// in IE6 unless a height is specified.
					if (IE_VER < 7) {
						$editorContainer.height(newHeight);
					}
				}

				e.preventDefault();
			};

			mouseUpFunc = function (e) {
				if (!isDragging) {
					return;
				}

				isDragging = false;

				$cover.hide();
				$editorContainer.removeClass('resizing').height('auto');
				$globalDoc.unbind(moveEvents, mouseMoveFunc);
				$globalDoc.unbind(endEvents, mouseUpFunc);

				e.preventDefault();
			};

			$editorContainer.append($grip);
			$editorContainer.append($cover.hide());

			$grip.bind('touchstart mousedown', function (e) {
				// iOS uses window.event
				if (e.type === 'touchstart') {
					e      = globalWin.event;
					startX = e.touches[0].pageX;
					startY = e.touches[0].pageY;
				} else {
					startX = e.pageX;
					startY = e.pageY;
				}

				startWidth  = $editorContainer.width();
				startHeight = $editorContainer.height();
				isDragging  = true;

				$editorContainer.addClass('resizing');
				$cover.show();
				$globalDoc.bind(moveEvents, mouseMoveFunc);
				$globalDoc.bind(endEvents, mouseUpFunc);

				// The resize cover will not fill the container in
				// IE6 unless a height is specified.
				if (IE_VER < 7) {
					$editorContainer.height(startHeight);
				}

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

			if (!$.isPlainObject(emoticons) || !options.emoticonsEnabled) {
				return;
			}

			$.each(emoticons, function (idx, val) {
				$.each(val, function (key, url) {
					// Prefix emoticon root to emoticon urls
					if (root) {
						url = {
							url: root + (url.url || url),
							tooltip: url.tooltip || key
						};

						emoticons[idx][key] = url;
					}

					// Preload the emoticon
					emoticon     = globalDoc.createElement('img');
					emoticon.src = url.url || url;
					preLoadCache.push(emoticon);
				});
			});
		};

		/**
		 * Autofocus the editor
		 * @private
		 */
		autofocus = function () {
			var	range, txtPos,
				doc      = $wysiwygDoc[0],
				body     = $wysiwygBody[0],
				node     = body.firstChild,
				focusEnd = !!options.autofocusEnd;

			// Can't focus invisible elements
			if (!$editorContainer.is(':visible')) {
				return;
			}

			if (base.sourceMode()) {
				txtPos = focusEnd ? sourceEditor.value.length : 0;

				if (sourceEditor.setSelectionRange) {
					sourceEditor.setSelectionRange(txtPos, txtPos);
				} else {
					range = sourceEditor.createTextRange();
					range.moveEnd('character', txtPos);
					range.collapse(false);
					range.select();
				}

				return;
			}

			dom.removeWhiteSpace(body);

			if (focusEnd) {
				if (!(node = body.lastChild)) {
					node = doc.createElement('p');
					$wysiwygBody.append(node);
				}

				while (node.lastChild) {
					node = node.lastChild;

					// IE < 11 should place the cursor after the <br> as
					// it will show it as a newline. IE >= 11 and all
					// other browsers should place the cursor before.
					if (!IE_BR_FIX && $(node).is('br') &&
						node.previousSibling) {
						node = node.previousSibling;
					}
				}
			}

			if (doc.createRange) {
				range = doc.createRange();

				if (!dom.canHaveChildren(node)) {
					range.setStartBefore(node);

					if (focusEnd) {
						range.setStartAfter(node);
					}
				} else {
					range.selectNodeContents(node);
				}
			} else {
				range = body.createTextRange();
				range.moveToElementText(node.nodeType !== 3 ?
					node : node.parentNode);
			}

			range.collapse(!focusEnd);
			rangeHelper.selectRange(range);

			if (focusEnd) {
				$wysiwygDoc.scrollTop(body.scrollHeight);
				$wysiwygBody.scrollTop(body.scrollHeight);
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
		base.readOnly = function (readOnly) {
			if (typeof readOnly !== 'boolean') {
				return $sourceEditor.attr('readonly') === 'readonly';
			}

			$wysiwygBody[0].contentEditable = !readOnly;

			if (!readOnly) {
				$sourceEditor.removeAttr('readonly');
			} else {
				$sourceEditor.attr('readonly', 'readonly');
			}

			updateToolBar(readOnly);

			return base;
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
		base.rtl = function (rtl) {
			var dir = rtl ? 'rtl' : 'ltr';

			if (typeof rtl !== 'boolean') {
				return $sourceEditor.attr('dir') === 'rtl';
			}

			$wysiwygBody.attr('dir', dir);
			$sourceEditor.attr('dir', dir);

			$editorContainer
				.removeClass('rtl')
				.removeClass('ltr')
				.addClass(dir);

			return base;
		};

		/**
		 * Updates the toolbar to disable/enable the appropriate buttons
		 * @private
		 */
		updateToolBar = function (disable) {
			var mode = base.inSourceMode() ? 'txtmode' : 'wysiwygmode';

			$.each(toolbarButtons, function (idx, $button) {
				if (disable === true || !$button.data('sceditor-' + mode)) {
					$button.addClass('disabled');
				} else {
					$button.removeClass('disabled');
				}
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
		 * @param {int}     width            Width in pixels
		 * @param {boolean}	[saveWidth=true] If to store the width
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name width^3
		 * @return {this}
		 */
		base.width = function (width, saveWidth) {
			if (!width && width !== 0) {
				return $editorContainer.width();
			}

			base.dimensions(width, null, saveWidth);

			return base;
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
		base.dimensions = function (width, height, save) {
			// IE6 & IE7 add 2 pixels to the source mode textarea
			// height which must be ignored.
			// Doesn't seem to be any way to fix it with only CSS
			var ieBorder = IE_VER < 8 || globalDoc.documentMode < 8 ? 2 : 0;
			var undef;

			// set undefined width/height to boolean false
			width  = (!width && width !== 0) ? false : width;
			height = (!height && height !== 0) ? false : height;

			if (width === false && height === false) {
				return { width: base.width(), height: base.height() };
			}

			if ($wysiwygEditor.data('outerWidthOffset') === undef) {
				base.updateStyleCache();
			}

			if (width !== false) {
				if (save !== false) {
					options.width = width;
				}
// This is the problem
				if (height === false) {
					height = $editorContainer.height();
					save   = false;
				}

				$editorContainer.width(width);
				if (width && width.toString().indexOf('%') > -1) {
					width = $editorContainer.width();
				}

				$wysiwygEditor.width(
					width - $wysiwygEditor.data('outerWidthOffset')
				);

				$sourceEditor.width(
					width - $sourceEditor.data('outerWidthOffset')
				);

				// Fix overflow issue with iOS not
				// breaking words unless a width is set
				if (browser.ios && $wysiwygBody) {
					$wysiwygBody.width(
						width - $wysiwygEditor.data('outerWidthOffset') -
						($wysiwygBody.outerWidth(true) - $wysiwygBody.width())
					);
				}
			}

			if (height !== false) {
				if (save !== false) {
					options.height = height;
				}

				// Convert % based heights to px
				if (height && height.toString().indexOf('%') > -1) {
					height = $editorContainer.height(height).height();
					$editorContainer.height('auto');
				}

				height -= !options.toolbarContainer ?
					$toolbar.outerHeight(true) : 0;

				$wysiwygEditor.height(
					height - $wysiwygEditor.data('outerHeightOffset')
				);

				$sourceEditor.height(
					height - ieBorder - $sourceEditor.data('outerHeightOffset')
				);
			}

			return base;
		};

		/**
		 * Updates the CSS styles cache.
		 *
		 * This shouldn't be needed unless changing the editors theme.
		 *F
		 * @since 1.4.1
		 * @function
		 * @memberOf jQuery.sceditor.prototype
		 * @name updateStyleCache
		 * @return {int}
		 */
		base.updateStyleCache = function () {
			// caching these improves FF resize performance
			$wysiwygEditor.data(
				'outerWidthOffset',
				$wysiwygEditor.outerWidth(true) - $wysiwygEditor.width()
			);
			$sourceEditor.data(
				'outerWidthOffset',
				$sourceEditor.outerWidth(true) - $sourceEditor.width()
			);

			$wysiwygEditor.data(
				'outerHeightOffset',
				$wysiwygEditor.outerHeight(true) - $wysiwygEditor.height()
			);
			$sourceEditor.data(
				'outerHeightOffset',
				$sourceEditor.outerHeight(true) - $sourceEditor.height()
			);
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
		 * The saveHeight specifies if to save the height.
		 *
		 * The stored height can be used for things like
		 * restoring from maximized state.
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
			if (!height && height !== 0) {
				return $editorContainer.height();
			}

			base.dimensions(null, height, saveHeight);

			return base;
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
		base.maximize = function (maximize) {
			if (typeof maximize === 'undefined') {
				return $editorContainer.is('.sceditor-maximize');
			}

			maximize = !!maximize;

			// IE 6 fix
			if (IE_VER < 7) {
				$('html, body').toggleClass('sceditor-maximize', maximize);
			}

			$editorContainer.toggleClass('sceditor-maximize', maximize);
			base.width(maximize ? '100%' : options.width, false);
			base.height(maximize ? '100%' : options.height, false);

			return base;
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
		base.expandToContent = function (ignoreMaxHeight) {
			var	currentHeight = $editorContainer.height(),
				padding       = (currentHeight - $wysiwygEditor.height()),
				height        = $wysiwygBody[0].scrollHeight ||
					$wysiwygDoc[0].documentElement.scrollHeight,
				maxHeight     = options.resizeMaxHeight ||
					((options.height || $original.height()) * 2);

			height += padding;

			if ((ignoreMaxHeight === true || height <= maxHeight) &&
				height > currentHeight) {
				base.height(height);
			}
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
			// Don't destroy if the editor has already been destroyed
			if (!pluginManager) {
				return;
			}

			pluginManager.destroy();

			rangeHelper   = null;
			lastRange     = null;
			pluginManager = null;

			$globalDoc.unbind('click', handleDocumentClick);
			$globalWin.unbind('resize orientationChanged', handleWindowResize);

			$(original.form)
				.unbind('reset', handleFormReset)
				.unbind('submit', base.updateOriginal);

			$wysiwygBody.unbind();
			$wysiwygDoc.unbind().find('*').remove();

			$sourceEditor.unbind().remove();
			$toolbar.remove();
			$editorContainer.unbind().find('*').unbind().remove();
			$editorContainer.remove();

			$original
				.removeData('sceditor')
				.removeData('sceditorbbcode')
				.show();

			if (isRequired) {
				$original.attr('required', 'required');
			}
		};


		/**
		 * Creates a menu item drop down
		 *
		 * @param  {HTMLElement} menuItem The button to align the dropdown with
		 * @param  {string} name          Used for styling the dropown, will be
		 *                                a class sceditor-name
		 * @param  {HTMLElement} content  The HTML content of the dropdown
		 * @param  {bool} ieFix           If to add the unselectable attribute
		 *                                to all the contents elements. Stops
		 *                                IE from deselecting the text in the
		 *                                editor
		 * @function
		 * @name createDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.createDropDown = function (menuItem, name, content, ieFix) {
			// first click for create second click for close
			var	dropDownCss,
				cssClass = 'sceditor-' + name,
				onlyclose = $dropdown && $dropdown.is('.' + cssClass);

			base.closeDropDown();

			if (onlyclose) {
				return;
			}

			// IE needs unselectable attr to stop it from
			// unselecting the text in the editor.
			// SCEditor can cope if IE does unselect the
			// text it's just not nice.
			if (ieFix !== false) {
				$(content)
					.find(':not(input,textarea)')
					.filter(function () {
						return this.nodeType === 1;
					})
					.attr('unselectable', 'on');
			}

			dropDownCss = {
				top: menuItem.offset().top,
				left: menuItem.offset().left,
				marginTop: menuItem.outerHeight()
			};
			$.extend(dropDownCss, options.dropDownCss);

			$dropdown = $('<div class="sceditor-dropdown ' + cssClass + '" />')
				.css(dropDownCss)
				.append(content)
				.appendTo($('body'))
				.on('click focusin', function (e) {
					// stop clicks within the dropdown from being handled
					e.stopPropagation();
				});

			$dropdown.find('input,textarea').first().focus();
		};

		/**
		 * Handles any document click and closes the dropdown if open
		 * @private
		 */
		handleDocumentClick = function (e) {
			// ignore right clicks
			if (e.which !== 3 && $dropdown) {
				autoUpdate();

				base.closeDropDown();
			}
		};

		/**
		 * Handles the WYSIWYG editors paste event
		 * @private
		 */
		handlePasteEvt = function (e) {
			var	html, handlePaste, scrollTop,
				elm             = $wysiwygBody[0],
				doc             = $wysiwygDoc[0],
				checkCount      = 0,
				pastearea       = globalDoc.createElement('div'),
				prePasteContent = doc.createDocumentFragment(),
				clipboardData   = e ? e.clipboardData : false;

			if (options.disablePasting) {
				return false;
			}

			if (!options.enablePasteFiltering) {
				return;
			}

			rangeHelper.saveRange();
			globalDoc.body.appendChild(pastearea);

			if (clipboardData && clipboardData.getData) {
				if ((html = clipboardData.getData('text/html')) ||
					(html = clipboardData.getData('text/plain'))) {
					pastearea.innerHTML = html;
					handlePasteData(elm, pastearea);

					return false;
				}
			}

			// Save the scroll position so can be restored
			// when contents is restored
			scrollTop = $wysiwygBody.scrollTop() || $wysiwygDoc.scrollTop();

			while (elm.firstChild) {
				prePasteContent.appendChild(elm.firstChild);
			}

// try make pastearea contenteditable and redirect to that? Might work.
// Check the tests if still exist, if not re-0create
			handlePaste = function (elm, pastearea) {
				if (elm.childNodes.length > 0 || checkCount > 25) {
					while (elm.firstChild) {
						pastearea.appendChild(elm.firstChild);
					}

					while (prePasteContent.firstChild) {
						elm.appendChild(prePasteContent.firstChild);
					}

					$wysiwygBody.scrollTop(scrollTop);
					$wysiwygDoc.scrollTop(scrollTop);

					if (pastearea.childNodes.length > 0) {
						handlePasteData(elm, pastearea);
					} else {
						rangeHelper.restoreRange();
					}
				} else {
					// Allow max 25 checks before giving up.
					// Needed in case an empty string is pasted or
					// something goes wrong.
					checkCount++;
					setTimeout(function () {
						handlePaste(elm, pastearea);
					}, 20);
				}
			};
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
		handlePasteData = function (elm, pastearea) {
			// fix any invalid nesting
			dom.fixNesting(pastearea);
// TODO: Trigger custom paste event to allow filtering
// (pre and post converstion?)
			var pasteddata = pastearea.innerHTML;

			if (pluginManager.hasHandler('toSource')) {
				pasteddata = pluginManager.callOnlyFirst(
					'toSource', pasteddata, $(pastearea)
				);
			}

			pastearea.parentNode.removeChild(pastearea);

			if (pluginManager.hasHandler('toWysiwyg')) {
				pasteddata = pluginManager.callOnlyFirst(
					'toWysiwyg', pasteddata, true
				);
			}

			rangeHelper.restoreRange();
			base.wysiwygEditorInsertHtml(pasteddata, null, true);
		};

		/**
		 * Closes any currently open drop down
		 *
		 * @param {bool} [focus=false] If to focus the editor
		 *                             after closing the drop down
		 * @function
		 * @name closeDropDown
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.closeDropDown = function (focus) {
			if ($dropdown) {
				$dropdown.unbind().remove();
				$dropdown = null;
			}

			if (focus === true) {
				base.focus();
			}
		};

		/**
		 * Gets the WYSIWYG editors document
		 * @private
		 */
		getWysiwygDoc = function () {
			if (wysiwygEditor.contentDocument) {
				return wysiwygEditor.contentDocument;
			}

			if (wysiwygEditor.contentWindow &&
				wysiwygEditor.contentWindow.document) {
				return wysiwygEditor.contentWindow.document;
			}

			return wysiwygEditor.document;
		};


		/**
		 * <p>Inserts HTML into WYSIWYG editor.</p>
		 *
		 * <p>If endHtml is specified, any selected text will be placed
		 * between html and endHtml. If there is no selected text html
		 * and endHtml will just be concated together.</p>
		 *
		 * @param {string} html
		 * @param {string} [endHtml=null]
		 * @param {boolean} [overrideCodeBlocking=false] If to insert the html
		 *                                               into code tags, by
		 *                                               default code tags only
		 *                                               support text.
		 * @function
		 * @name wysiwygEditorInsertHtml
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.wysiwygEditorInsertHtml = function (
			html, endHtml, overrideCodeBlocking
		) {
			var	$marker, scrollTop, scrollTo,
				editorHeight = $wysiwygEditor.height();

			base.focus();

// TODO: This code tag should be configurable and
// should maybe convert the HTML into text instead
			// Don't apply to code elements
			if (!overrideCodeBlocking && ($(currentBlockNode).is('code') ||
				$(currentBlockNode).parents('code').length !== 0)) {
				return;
			}

			// Insert the HTML and save the range so the editor can be scrolled
			// to the end of the selection. Also allows emoticons to be replaced
			// without affecting the cusrsor position
			rangeHelper.insertHTML(html, endHtml);
			rangeHelper.saveRange();
			replaceEmoticons($wysiwygBody[0]);

			// Scroll the editor after the end of the selection
			$marker   = $wysiwygBody.find('#sceditor-end-marker').show();
			scrollTop = $wysiwygBody.scrollTop() || $wysiwygDoc.scrollTop();
			scrollTo  = (dom.getOffset($marker[0]).top +
				($marker.outerHeight(true) * 1.5)) - editorHeight;
			$marker.hide();

			// Only scroll if marker isn't already visible
			if (scrollTo > scrollTop || scrollTo + editorHeight < scrollTop) {
				$wysiwygBody.scrollTop(scrollTo);
				$wysiwygDoc.scrollTop(scrollTo);
			}

			triggerValueChanged(false);
			rangeHelper.restoreRange();

			// Add a new line after the last block element
			// so can always add text after it
			appendNewLine();
		};

		/**
		 * Like wysiwygEditorInsertHtml except it will convert any HTML
		 * into text before inserting it.
		 *
		 * @param {String} text
		 * @param {String} [endText=null]
		 * @function
		 * @name wysiwygEditorInsertText
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.wysiwygEditorInsertText = function (text, endText) {
			base.wysiwygEditorInsertHtml(
				escape.entities(text), escape.entities(endText)
			);
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
			if (base.inSourceMode()) {
				base.sourceEditorInsertText(text, endText);
			} else {
				base.wysiwygEditorInsertText(text, endText);
			}

			return base;
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
			var range, scrollTop, currentValue,
				startPos = sourceEditor.selectionStart,
				endPos   = sourceEditor.selectionEnd;

			scrollTop = sourceEditor.scrollTop;
			sourceEditor.focus();

			// All browsers except IE < 9
			if (typeof startPos !== 'undefined') {
				currentValue = sourceEditor.value;

				if (endText) {
					text += currentValue.substring(startPos, endPos) + endText;
				}

				sourceEditor.value = currentValue.substring(0, startPos) +
					text +
					currentValue.substring(endPos, currentValue.length);

				sourceEditor.selectionStart = (startPos + text.length) -
					(endText ? endText.length : 0);
				sourceEditor.selectionEnd = sourceEditor.selectionStart;
			// IE < 9
			} else {
				range = globalDoc.selection.createRange();

				if (endText) {
					text += range.text + endText;
				}

				range.text = text;

				if (endText) {
					range.moveEnd('character', 0 - endText.length);
				}

				range.moveStart('character', range.End - range.Start);
				range.select();
			}

			sourceEditor.scrollTop = scrollTop;
			sourceEditor.focus();

			triggerValueChanged();
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
		 * Gets the source editors textarea.
		 *
		 * This shouldn't be used to insert text
		 *
		 * @return {jQuery}
		 * @function
		 * @since 1.4.5
		 * @name sourceEditorCaret
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.sourceEditorCaret = function (position) {
			var range,
				ret = {};

			sourceEditor.focus();

			// All browsers except IE <= 8
			if (typeof sourceEditor.selectionStart !== 'undefined') {
				if (position) {
					sourceEditor.selectionStart = position.start;
					sourceEditor.selectionEnd   = position.end;
				} else {
					ret.start = sourceEditor.selectionStart;
					ret.end   = sourceEditor.selectionEnd;
				}

			// IE8 and below
			} else {
				range = globalDoc.selection.createRange();

				if (position) {
					range.moveEnd('character', position.end);
					range.moveStart('character', position.start);
					range.select();
				} else {
					ret.start = range.Start;
					ret.end   = range.End;
				}
			}

			return position ? this : ret;
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
			if (typeof val !== 'string') {
				return base.inSourceMode() ?
					base.getSourceEditorValue(false) :
					base.getWysiwygEditorValue(filter);
			}

			if (!base.inSourceMode()) {
				if (filter !== false &&
					pluginManager.hasHandler('toWysiwyg')) {
					val = pluginManager.callOnlyFirst('toWysiwyg', val);
				}

				base.setWysiwygEditorValue(val);
			} else {
				base.setSourceEditorValue(val);
			}

			return base;
		};

		/**
		 * <p>Inserts HTML/BBCode into the editor</p>
		 *
		 * <p>If end is supplied any selected text will be placed between
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
		/**
		 * <p>Inserts HTML/BBCode into the editor</p>
		 *
		 * <p>If end is supplied any selected text will be placed between
		 * start and end. If there is no selected text start and end
		 * will be concated together.</p>
		 *
		 * <p>If the filter param is set to true, the HTML/BBCode will be
		 * passed through any plugin filters. If using the BBCode plugin
		 * this will convert any BBCode into HTML.</p>
		 *
		 * <p>If the allowMixed param is set to true, HTML any will not be
		 * escaped</p>
		 *
		 * @param {String} start
		 * @param {String} [end=null]
		 * @param {Boolean} [filter=true]
		 * @param {Boolean} [convertEmoticons=true] If to convert emoticons
		 * @param {Boolean} [allowMixed=false]
		 * @return {this}
		 * @since 1.4.3
		 * @function
		 * @name insert^2
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.insert = function (
			/*jshint maxparams: false */
			start, end, filter, convertEmoticons, allowMixed
		) {
			if (base.inSourceMode()) {
				base.sourceEditorInsertText(start, end);
				return base;
			}

			// Add the selection between start and end
			if (end) {
				var	html = rangeHelper.selectedHtml(),
					$div = $('<div>').appendTo($('body')).hide().html(html);

				if (filter !== false && pluginManager.hasHandler('toSource')) {
					html = pluginManager.callOnlyFirst('toSource', html, $div);
				}

				$div.remove();

				start += html + end;
			}
// TODO: This filter should allow empty tags as it's inserting.
			if (filter !== false && pluginManager.hasHandler('toWysiwyg')) {
				start = pluginManager.callOnlyFirst('toWysiwyg', start, true);
			}

			// Convert any escaped HTML back into HTML if mixed is allowed
			if (filter !== false && allowMixed === true) {
				start = start.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&amp;/g, '&');
			}

			base.wysiwygEditorInsertHtml(start);

			return base;
		};

		/**
		 * Gets the WYSIWYG editors HTML value.
		 *
		 * If using a plugin that filters the Ht Ml like the BBCode plugin
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
			var	html, ieBookmark,
				hasSelection = rangeHelper.hasSelection();

			if (hasSelection) {
				rangeHelper.saveRange();
			// IE <= 8 bookmark the current TextRange position
			// and restore it after
			} else if (lastRange && lastRange.getBookmark) {
				ieBookmark = lastRange.getBookmark();
			}

			dom.fixNesting($wysiwygBody[0]);

			// filter the HTML and DOM through any plugins
			html = $wysiwygBody.html();

			if (filter !== false && pluginManager.hasHandler('toSource')) {
				html = pluginManager.callOnlyFirst(
					'toSource', html, $wysiwygBody
				);
			}

			if (hasSelection) {
				rangeHelper.restoreRange();

				// remove the last stored range for
				// IE as it no longer applies
				lastRange = null;
			} else if (ieBookmark) {
				lastRange.moveToBookmark(ieBookmark);

				// remove the last stored range for
				// IE as it no longer applies
				lastRange = null;
			}

			return html;
		};

		/**
		 * Gets the WYSIWYG editor's iFrame Body.
		 *
		 * @return {jQuery}
		 * @function
		 * @since 1.4.3
		 * @name getBody
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getBody = function () {
			return $wysiwygBody;
		};

		/**
		 * Gets the WYSIWYG editors container area (whole iFrame).
		 *
		 * @return {Node}
		 * @function
		 * @since 1.4.3
		 * @name getContentAreaContainer
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.getContentAreaContainer = function () {
			return $wysiwygEditor;
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

			if (filter !== false && pluginManager.hasHandler('toWysiwyg')) {
				val = pluginManager.callOnlyFirst('toWysiwyg', val);
			}

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
			if (!value) {
				value = '<p>' + (IE_VER ? '' : '<br />') + '</p>';
			}

			$wysiwygBody[0].innerHTML = value;
			replaceEmoticons($wysiwygBody[0]);

			appendNewLine();
			triggerValueChanged();
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

			triggerValueChanged();
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
		 * Replaces any emoticon codes in the passed HTML
		 * with their emoticon images
		 * @private
		 */
		replaceEmoticons = function (node) {
// TODO: Make this tag configurable.
			if (!options.emoticonsEnabled || $(node).parents('code').length) {
				return;
			}

			var	doc           = node.ownerDocument,
				whitespace    = '\\s|\xA0|\u2002|\u2003|\u2009|&nbsp;',
				emoticonCodes = [],
				emoticonRegex = [],
				emoticons     = $.extend(
					{},
					options.emoticons.more,
					options.emoticons.dropdown,
					options.emoticons.hidden
				);
// TODO: cache the emoticonCodes and emoticonCodes objects and share them with
// the AYT converstion
			$.each(emoticons, function (key) {
				if (options.emoticonsCompat) {
					emoticonRegex[key] = new RegExp(
						'(>|^|' + whitespace + ')' +
						escape.regex(key) +
						'($|<|' + whitespace + ')'
					);
				}

				emoticonCodes.push(key);
			});
// TODO: tidy below
			var convertEmoticons = function (node) {
				node = node.firstChild;

				while (node) {
					var	parts, key, emoticon, parsedHtml,
						emoticonIdx, nextSibling, matchPos,
						nodeParent  = node.parentNode,
						nodeValue   = node.nodeValue;

					// All none textnodes
					if (node.nodeType !== 3) {
// TODO: Make this tag configurable.
						if (!$(node).is('code')) {
							convertEmoticons(node);
						}
					} else if (nodeValue) {
						emoticonIdx = emoticonCodes.length;
						while (emoticonIdx--) {
							key      = emoticonCodes[emoticonIdx];
							matchPos = options.emoticonsCompat ?
								nodeValue.search(emoticonRegex[key]) :
								nodeValue.indexOf(key);

							if (matchPos > -1) {
								nextSibling    = node.nextSibling;
								emoticon       = emoticons[key];
								parts          = nodeValue
									.substr(matchPos).split(key);
								nodeValue      = nodeValue
									.substr(0, matchPos) + parts.shift();
								node.nodeValue = nodeValue;

								parsedHtml = dom.parseHTML(_tmpl('emoticon', {
									key: key,
									url: emoticon.url || emoticon,
									tooltip: emoticon.tooltip || key
								}), doc);

								nodeParent.insertBefore(
									parsedHtml[0],
									nextSibling
								);

								nodeParent.insertBefore(
									doc.createTextNode(parts.join(key)),
									nextSibling
								);
							}
						}
					}

					node = node.nextSibling;
				}
			};

			convertEmoticons(node);

			if (options.emoticonsCompat) {
				currentEmoticons = $wysiwygBody
					.find('img[data-sceditor-emoticon]');
			}
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
			var inSourceMode = base.inSourceMode();

			if (typeof enable !== 'boolean') {
				return inSourceMode;
			}

			if ((inSourceMode && !enable) || (!inSourceMode && enable)) {
				base.toggleSourceMode();
			}

			return base;
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
			var sourceMode = base.inSourceMode();

			// don't allow switching to WYSIWYG if doesn't support it
			if (!browser.isWysiwygSupported && sourceMode) {
				return;
			}

			if (!sourceMode) {
				rangeHelper.saveRange();
				rangeHelper.clear();
			}

			base.blur();

			if (sourceMode) {
				base.setWysiwygEditorValue(base.getSourceEditorValue());
			} else {
				base.setSourceEditorValue(base.getWysiwygEditorValue());
			}

			lastRange = null;
			$sourceEditor.toggle();
			$wysiwygEditor.toggle();
			$editorContainer
				.toggleClass('wysiwygMode', sourceMode)
				.toggleClass('sourceMode', !sourceMode);

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

			if (typeof sourceEditor.selectionStart !== 'undefined') {
				return sourceEditor.value.substring(
					sourceEditor.selectionStart,
					sourceEditor.selectionEnd
				);
			} else {
				return globalDoc.selection.createRange().text;
			}
		};

		/**
		 * Handles the passed command
		 * @private
		 */
		handleCommand = function (caller, cmd) {
			// check if in text mode and handle text commands
			if (base.inSourceMode()) {
				if (cmd.txtExec) {
					if ($.isArray(cmd.txtExec)) {
						base.sourceEditorInsertText.apply(base, cmd.txtExec);
					} else {
						cmd.txtExec.call(
							base,
							caller,
							sourceEditorSelectedText()
						);
					}
				}
			} else if (cmd.exec) {
				if ($.isFunction(cmd.exec)) {
					cmd.exec.call(base, caller);
				} else {
					base.execCommand(
						cmd.exec,
						cmd.hasOwnProperty('execParam') ?
							cmd.execParam : null
					);
				}
			}

		};

		/**
		 * Saves the current range. Needed for IE because it forgets
		 * where the cursor was and what was selected
		 * @private
		 */
		saveRange = function () {
			/* this is only needed for IE */
			if (IE_VER) {
				lastRange = rangeHelper.selectedRange();
			}
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
				commandObj  = base.commands[command],
				$parentNode = $(rangeHelper.parentNode());

			base.focus();

// TODO: make configurable
			// don't apply any commands to code elements
			if ($parentNode.is('code') ||
				$parentNode.parents('code').length !== 0) {
				return;
			}

			try {
				executed = $wysiwygDoc[0].execCommand(command, false, param);
			} catch (ex) {}

			// show error if execution failed and an error message exists
			if (!executed && commandObj && commandObj.errorMessage) {
				/*global alert:false*/
				alert(base._(commandObj.errorMessage));
			}

			updateActiveButtons();
		};

		/**
		 * Checks if the current selection has changed and triggers
		 * the selectionchanged event if it has.
		 *
		 * In browsers other than IE, it will check at most once every 100ms.
		 * This is because only IE has a selection changed event.
		 * @private
		 */
		checkSelectionChanged = function () {
			var check = function () {
				// rangeHelper could be null if editor was destroyed
				// before the timeout had finished
				if (rangeHelper && !rangeHelper.compare(currentSelection)) {
					currentSelection = rangeHelper.cloneSelected();
					$editorContainer.trigger($.Event('selectionchanged'));
				}

				isSelectionCheckPending = false;
			};

			if (isSelectionCheckPending) {
				return;
			}

			isSelectionCheckPending = true;

			// In IE, this is only called on the selectionchange event so no
			// need to limit checking as it should always be valid to do.
			if (IE_VER) {
				check();
			} else {
				setTimeout(check, 100);
			}
		};

		/**
		 * Checks if the current node has changed and triggers
		 * the nodechanged event if it has
		 * @private
		 */
		checkNodeChanged = function () {
			// check if node has changed
			var	oldNode,
				node = rangeHelper.parentNode();

			if (currentNode !== node) {
				oldNode          = currentNode;
				currentNode      = node;
				currentBlockNode = rangeHelper.getFirstBlockParent(node);

				$editorContainer.trigger($.Event('nodechanged', {
					oldNode: oldNode,
					newNode: currentNode
				}));
			}
		};

		/**
		 * <p>Gets the current node that contains the selection/caret in
		 * WYSIWYG mode.</p>
		 *
		 * <p>Will be null in sourceMode or if there is no selection.</p>
		 * @return {Node}
		 * @function
		 * @name currentNode
		 * @memberOf jQuery.sceditor.prototype
		 */
		base.currentNode = function () {
			return currentNode;
		};

		/**
		 * <p>Gets the first block level node that contains the
		 * selection/caret in WYSIWYG mode.</p>
		 *
		 * <p>Will be null in sourceMode or if there is no selection.</p>
		 * @return {Node}
		 * @function
		 * @name currentBlockNode
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.4
		 */
		base.currentBlockNode = function () {
			return currentBlockNode;
		};

		/**
		 * Updates if buttons are active or not
		 * @private
		 */
		updateActiveButtons = function (e) {
			var	state, stateHandler, firstBlock, $button, parent, isDisabled,
				disabledClass = 'disabled',
				activeClass   = 'active',
				doc           = $wysiwygDoc[0],
				btnIdx        = btnStateHandlers.length,
				sourceMode    = base.sourceMode();

			if (base.readOnly()) {
				$toolbar.find('.sceditor-button').removeClass(activeClass);
				return;
			}

			if (!sourceMode) {
				parent     = e ? e.newNode : rangeHelper.parentNode();
				firstBlock = rangeHelper.getFirstBlockParent(parent);
			}

			while (btnIdx--) {
				state        = 0;
				isDisabled   = false;
				stateHandler = btnStateHandlers[btnIdx];
				$button      = toolbarButtons[stateHandler.name];

				isDisabled = sourceMode && !$button.data('sceditor-txtmode') ||
					!sourceMode && !$button.data('sceditor-wysiwygmode');

				if (!isDisabled) {
					if (typeof stateHandler.state === 'string') {
						try {
							state = doc.queryCommandEnabled(
								stateHandler.state
							) ? 0 : -1;

							/*jshint maxdepth: false*/
							if (state > -1) {
								state = doc.queryCommandState(
									stateHandler.state
								) ? 1 : 0;
							}
						} catch (ex) {}
					} else {
						state = stateHandler.state.call(
							base, parent, firstBlock
						);
					}
				}

				$button
					.toggleClass(disabledClass, isDisabled || state < 0)
					.toggleClass(activeClass, state > 0);
			}
		};

		/**
		 * Handles any key press in the WYSIWYG editor
		 *
		 * @private
		 */
		handleKeyPress = function (e) {
			var	$closestTag, br, brParent, lastChild;

// TODO: improve this so isn't set list, probably should just use
// dom.hasStyling to all block parents and if one does insert a br
			var DUPLICATED_TAGS = 'code,blockquote,pre';
			var LIST_TAGS = 'li,ul,ol';

			// FF bug: https://bugzilla.mozilla.org/show_bug.cgi?id=501496
			if (e.originalEvent.defaultPrevented) {
				return;
			}

			base.closeDropDown();

			$closestTag = $(currentBlockNode)
				.closest(DUPLICATED_TAGS + ',' + LIST_TAGS)
				.first();

			// "Fix" (OK it's a cludge) for blocklevel elements being
			// duplicated in some browsers when enter is pressed instead
			// of inserting a newline
			if (e.which === 13 && $closestTag.length &&
					!$closestTag.is(LIST_TAGS)) {
				lastRange = null;

				br = $wysiwygDoc[0].createElement('br');
				rangeHelper.insertNode(br);

				// Last <br> of a block will be collapsed unless it is
				// IE < 11 so need to make sure the <br> that was inserted
				// isn't the last node of a block.
				if (!IE_BR_FIX) {
					brParent    = br.parentNode;
					lastChild = brParent.lastChild;

					// Sometimes an empty next node is created after the <br>
					if (lastChild && lastChild.nodeType === 3 &&
						lastChild.nodeValue === '') {
						brParent.removeChild(lastChild);
						lastChild = brParent.lastChild;
					}

					// If this is the last BR of a block and the previous
					// sibling is inline then will need an extra BR. This
					// is needed because the last BR of a block will be
					// collapsed. Fixes issue #248
					if (!dom.isInline(brParent, true) && lastChild === br &&
						dom.isInline(br.previousSibling)) {
						rangeHelper.insertHTML('<br>');
					}
				}

				return false;
			}
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
		appendNewLine = function () {
			var name, requiresNewLine, paragraph,
				body = $wysiwygBody[0];

			dom.rTraverse(body, function (node) {
				name = node.nodeName.toLowerCase();
// TODO: Replace requireNewLineFix with just a block level fix for any
// block that has styling and any block that isn't a plain <p> or <div>
				if ($.inArray(name, requireNewLineFix) > -1) {
					requiresNewLine = true;
				}
// TODO: tidy this up
				// find the last non-empty text node or line break.
				if ((node.nodeType === 3 && !/^\s*$/.test(node.nodeValue)) ||
					name === 'br' || (IE_BR_FIX && !node.firstChild &&
					!dom.isInline(node, false))) {

					// this is the last text or br node, if its in a code or
					// quote tag then add a newline to the end of the editor
					if (requiresNewLine) {
						paragraph = wysiwygDoc.createElement('p');
						paragraph.className = 'sceditor-nlf';
						paragraph.innerHTML = !IE_BR_FIX ? '<br />' : '';
						body.appendChild(paragraph);
					}

					return false;
				}
			});
		};

		/**
		 * Handles form reset event
		 * @private
		 */
		handleFormReset = function () {
			base.val($original.val());
		};

		/**
		 * Handles any mousedown press in the WYSIWYG editor
		 * @private
		 */
		handleMouseDown = function () {
			base.closeDropDown();
			lastRange = null;
		};

		/**
		 * Handles the window resize event. Needed to resize then editor
		 * when the window size changes in fluid designs.
		 * @ignore
		 */
		handleWindowResize = function () {
			var	height = options.height,
				width  = options.width;

			if (!base.maximize()) {
				if ((height && height.toString().indexOf('%') > -1) ||
					(width && width.toString().indexOf('%') > -1)) {
					base.dimensions(width, height);
				}
			} else {
				base.dimensions('100%', '100%', false);
			}
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
		base._ = function () {
			var	undef,
				args = arguments;

			if (locale && locale[args[0]]) {
				args[0] = locale[args[0]];
			}

			return args[0].replace(/\{(\d+)\}/g, function (str, p1) {
				return args[p1 - 0 + 1] !== undef ?
					args[p1 - 0 + 1] :
					'{' + p1 + '}';
			});
		};

		/**
		 * Passes events on to any handlers
		 * @private
		 * @return void
		 */
		handleEvent = function (e) {
			// Send event to all plugins
			pluginManager.call(e.type + 'Event', e, base);

			// convert the event into a custom event to send
			var prefix       = e.target === sourceEditor ? 'scesrc' : 'scewys';
			var customEvent  = $.Event(e);
			customEvent.type = prefix + e.type;

			$editorContainer.trigger(customEvent, base);
		};

		/**
		 * <p>Binds a handler to the specified events</p>
		 *
		 * <p>This function only binds to a limited list of
		 * supported events.<br />
		 * The supported events are:
		 * <ul>
		 *   <li>keyup</li>
		 *   <li>keydown</li>
		 *   <li>Keypress</li>
		 *   <li>blur</li>
		 *   <li>focus</li>
		 *   <li>nodechanged<br />
		 *       When the current node containing the selection changes
		 *       in WYSIWYG mode</li>
		 *   <li>contextmenu</li>
		 *   <li>selectionchanged</li>
		 *   <li>valuechanged</li>
		 * </ul>
		 * </p>
		 *
		 * <p>The events param should be a string containing the event(s)
		 * to bind this handler to. If multiple, they should be separated
		 * by spaces.</p>
		 *
		 * @param  {String} events
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name bind
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.bind = function (events, handler, excludeWysiwyg, excludeSource) {
			events = events.split(' ');

			var i  = events.length;
			while (i--) {
				if ($.isFunction(handler)) {
					// Use custom events to allow passing the instance as the
					// 2nd argument.
					// Also allows unbinding without unbinding the editors own
					// event handlers.
					if (!excludeWysiwyg) {
						$editorContainer.bind('scewys' + events[i], handler);
					}

					if (!excludeSource) {
						$editorContainer.bind('scesrc' + events[i], handler);
					}

					// Start sending value changed events
					if (events[i] === 'valuechanged') {
						triggerValueChanged.hasHandler = true;
					}
				}
			}

			return base;
		};

		/**
		 * Unbinds an event that was bound using bind().
		 *
		 * @param  {String} events
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude unbinding this
		 *                                  handler from the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude unbinding this
		 *                                  handler from the source editor
		 * @return {this}
		 * @function
		 * @name unbind
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 * @see bind
		 */
		base.unbind = function (
			events, handler, excludeWysiwyg, excludeSource
		) {
			events = events.split(' ');

			var i  = events.length;
			while (i--) {
				if ($.isFunction(handler)) {
					if (!excludeWysiwyg) {
						$editorContainer.unbind('scewys' + events[i], handler);
					}

					if (!excludeSource) {
						$editorContainer.unbind('scesrc' + events[i], handler);
					}
				}
			}

			return base;
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
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name blur^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.blur = function (handler, excludeWysiwyg, excludeSource) {
			if ($.isFunction(handler)) {
				base.bind('blur', handler, excludeWysiwyg, excludeSource);
			} else if (!base.sourceMode()) {
				$wysiwygBody.blur();
			} else {
				$sourceEditor.blur();
			}

			return base;
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
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  if to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name focus^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.focus = function (handler, excludeWysiwyg, excludeSource) {
			if ($.isFunction(handler)) {
				base.bind('focus', handler, excludeWysiwyg, excludeSource);
			} else if (!base.inSourceMode()) {
				var container,
					rng = rangeHelper.selectedRange();

				// Check if cursor is set after a BR when the BR is the only
				// child of the parent. In Firefox this causes a line break
				// to occur when something is typed. See issue #321
				if (!IE_BR_FIX && rng && rng.endOffset === 1 && rng.collapsed) {
					container = rng.endContainer;

					if (container && container.childNodes.length === 1 &&
						$(container.firstChild).is('br')) {
						rng.setStartBefore(container.firstChild);
						rng.collapse(true);
						rangeHelper.selectRange(rng);
					}
				}

				wysiwygEditor.contentWindow.focus();
				$wysiwygBody[0].focus();

				// Needed for IE < 9
				if (lastRange) {
					rangeHelper.selectRange(lastRange);

					// remove the stored range after being set.
					// If the editor loses focus it should be
					// saved again.
					lastRange = null;
				}
			} else {
				sourceEditor.focus();
			}

			return base;
		};

		/**
		 * Adds a handler to the key down event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  If to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name keyDown
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyDown = function (handler, excludeWysiwyg, excludeSource) {
			return base.bind('keydown', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * Adds a handler to the key press event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  If to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name keyPress
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyPress = function (handler, excludeWysiwyg, excludeSource) {
			return base
				.bind('keypress', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * Adds a handler to the key up event
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  If to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name keyUp
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.keyUp = function (handler, excludeWysiwyg, excludeSource) {
			return base.bind('keyup', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * <p>Adds a handler to the node changed event.</p>
		 *
		 * <p>Happends whenever the node containing the selection/caret
		 * changes in WYSIWYG mode.</p>
		 *
		 * @param  {Function} handler
		 * @return {this}
		 * @function
		 * @name nodeChanged
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.nodeChanged = function (handler) {
			return base.bind('nodechanged', handler, false, true);
		};

		/**
		 * <p>Adds a handler to the selection changed event</p>
		 *
		 * <p>Happens whenever the selection changes in WYSIWYG mode.</p>
		 *
		 * @param  {Function} handler
		 * @return {this}
		 * @function
		 * @name selectionChanged
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.1
		 */
		base.selectionChanged = function (handler) {
			return base.bind('selectionchanged', handler, false, true);
		};

		/**
		 * <p>Adds a handler to the value changed event</p>
		 *
		 * <p>Happens whenever the current editor value changes.</p>
		 *
		 * <p>Whenever anything is inserted, the value changed or
		 * 1.5 secs after text is typed. If a space is typed it will
		 * cause the event to be triggered immediately instead of
		 * after 1.5 seconds</p>
		 *
		 * @param  {Function} handler
		 * @param  {Boolean} excludeWysiwyg If to exclude adding this handler
		 *                                  to the WYSIWYG editor
		 * @param  {Boolean} excludeSource  If to exclude adding this handler
		 *                                  to the source editor
		 * @return {this}
		 * @function
		 * @name valueChanged
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.5
		 */
		base.valueChanged = function (handler, excludeWysiwyg, excludeSource) {
			return base
				.bind('valuechanged', handler, excludeWysiwyg, excludeSource);
		};

		/**
		 * Emoticons keypress handler
		 * @private
		 */
		emoticonsKeyPress = function (e) {
			var	replacedEmoticon,
				cachePos       = 0,
				emoticonsCache = base.emoticonsCache,
				curChar        = String.fromCharCode(e.which);
// TODO: Make configurable
			if ($(currentBlockNode).is('code') ||
				$(currentBlockNode).parents('code').length) {
				return;
			}

			if (!emoticonsCache) {
				emoticonsCache = [];

				$.each($.extend(
					{},
					options.emoticons.more,
					options.emoticons.dropdown,
					options.emoticons.hidden
				), function (key, url) {
					emoticonsCache[cachePos++] = [
						key,
						_tmpl('emoticon', {
							key: key,
							url: url.url || url,
							tooltip: url.tooltip || key
						})
					];
				});

				emoticonsCache.sort(function (a, b) {
					return a[0].length - b[0].length;
				});

				base.emoticonsCache = emoticonsCache;
				base.longestEmoticonCode =
					emoticonsCache[emoticonsCache.length - 1][0].length;
			}

			replacedEmoticon = rangeHelper.raplaceKeyword(
				base.emoticonsCache,
				true,
				true,
				base.longestEmoticonCode,
				options.emoticonsCompat,
				curChar
			);

			if (replacedEmoticon && options.emoticonsCompat) {
				currentEmoticons = $wysiwygBody
					.find('img[data-sceditor-emoticon]');

				return /^\s$/.test(curChar);
			}

			return !replacedEmoticon;
		};

		/**
		 * Makes sure emoticons are surrounded by whitespace
		 * @private
		 */
		emoticonsCheckWhitespace = function () {
			if (!currentEmoticons.length) {
				return;
			}

			var	prev, next, parent, range, previousText, rangeStartContainer,
				currentBlock = base.currentBlockNode(),
				rangeStart   = false,
				noneWsRegex  = /[^\s\xA0\u2002\u2003\u2009\u00a0]+/;

			currentEmoticons = $.map(currentEmoticons, function (emoticon) {
				// Ignore emotiocons that have been removed from DOM
				if (!emoticon || !emoticon.parentNode) {
					return null;
				}

				if (!$.contains(currentBlock, emoticon)) {
					return emoticon;
				}

				prev         = emoticon.previousSibling;
				next         = emoticon.nextSibling;
				previousText = prev.nodeValue;

				// For IE's HTMLPhraseElement
				if (previousText === null) {
					previousText = prev.innerText || '';
				}

				if ((!prev || !noneWsRegex.test(prev.nodeValue.slice(-1))) &&
					(!next || !noneWsRegex.test((next.nodeValue || '')[0]))) {
					return emoticon;
				}

				parent              = emoticon.parentNode;
				range               = rangeHelper.cloneSelected();
				rangeStartContainer = range.startContainer;
				previousText        = previousText +
					$(emoticon).data('sceditor-emoticon');

				// Store current caret position
				if (rangeStartContainer === next) {
					rangeStart = previousText.length + range.startOffset;
				} else if (rangeStartContainer === currentBlock &&
					currentBlock.childNodes[range.startOffset] === next) {
					rangeStart = previousText.length;
				} else if (rangeStartContainer === prev) {
					rangeStart = range.startOffset;
				}

				if (!next || next.nodeType !== 3) {
					next = parent.insertBefore(
						parent.ownerDocument.createTextNode(''), next
					);
				}

				next.insertData(0, previousText);
				parent.removeChild(prev);
				parent.removeChild(emoticon);

				// Need to update the range starting
				// position if it has been modified
				if (rangeStart !== false) {
					range.setStart(next, rangeStart);
					range.collapse(true);
					rangeHelper.selectRange(range);
				}

				return null;
			});
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
		base.emoticons = function (enable) {
			if (!enable && enable !== false) {
				return options.emoticonsEnabled;
			}

			options.emoticonsEnabled = enable;

			if (enable) {
				$wysiwygBody.keypress(emoticonsKeyPress);

				if (!base.sourceMode()) {
					rangeHelper.saveRange();

					replaceEmoticons($wysiwygBody[0]);
					currentEmoticons = $wysiwygBody
						.find('img[data-sceditor-emoticon]');
					triggerValueChanged(false);

					rangeHelper.restoreRange();
				}
			} else {
				$wysiwygBody
					.find('img[data-sceditor-emoticon]')
					.replaceWith(function () {
						return $(this).data('sceditor-emoticon');
					});

				currentEmoticons = [];
				$wysiwygBody.unbind('keypress', emoticonsKeyPress);

				triggerValueChanged();
			}

			return base;
		};

		/**
		 * Gets the current WYSIWYG editors inline CSS
		 *
		 * @return {string}
		 * @function
		 * @name css
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.3
		 */
		/**
		 * Sets inline CSS for the WYSIWYG editor
		 *
		 * @param {string} css
		 * @return {this}
		 * @function
		 * @name css^2
		 * @memberOf jQuery.sceditor.prototype
		 * @since 1.4.3
		 */
		base.css = function (css) {
			if (!inlineCss) {
				inlineCss = $('<style id="#inline" />', $wysiwygDoc[0])
					.appendTo($wysiwygDoc.find('head'))[0];
			}

			if (typeof css !== 'string') {
				return inlineCss.styleSheet ?
					inlineCss.styleSheet.cssText : inlineCss.innerHTML;
			}

			if (inlineCss.styleSheet) {
				inlineCss.styleSheet.cssText = css;
			} else {
				inlineCss.innerHTML = css;
			}

			return base;
		};

		/**
		 * Handles the keydown event, used for shortcuts
		 * @private
		 */
		handleKeyDown = function (e) {
			var	shortcut   = [],
				SHIFT_KEYS = {
					'`': '~',
					'1': '!',
					'2': '@',
					'3': '#',
					'4': '$',
					'5': '%',
					'6': '^',
					'7': '&',
					'8': '*',
					'9': '(',
					'0': ')',
					'-': '_',
					'=': '+',
					';': ': ',
					'\'': '"',
					',': '<',
					'.': '>',
					'/': '?',
					'\\': '|',
					'[': '{',
					']': '}'
				},
				SPECIAL_KEYS = {
					8: 'backspace',
					9: 'tab',
					13: 'enter',
					19: 'pause',
					20: 'capslock',
					27: 'esc',
					32: 'space',
					33: 'pageup',
					34: 'pagedown',
					35: 'end',
					36: 'home',
					37: 'left',
					38: 'up',
					39: 'right',
					40: 'down',
					45: 'insert',
					46: 'del',
					91:  'win',
					92:  'win',
					93: 'select',
					96: '0',
					97: '1',
					98: '2',
					99: '3',
					100: '4',
					101: '5',
					102: '6',
					103: '7',
					104: '8',
					105: '9',
					106: '*',
					107: '+',
					109: '-',
					110: '.',
					111: '/',
					112: 'f1',
					113: 'f2',
					114: 'f3',
					115: 'f4',
					116: 'f5',
					117: 'f6',
					118: 'f7',
					119: 'f8',
					120: 'f9',
					121: 'f10',
					122: 'f11',
					123: 'f12',
					144: 'numlock',
					145: 'scrolllock',
					186: ';',
					187: '=',
					188: ',',
					189: '-',
					190: '.',
					191: '/',
					192: '`',
					219: '[',
					220: '\\',
					221: ']',
					222: '\''
				},
				NUMPAD_SHIFT_KEYS = {
					109: '-',
					110: 'del',
					111: '/',
					96: '0',
					97: '1',
					98: '2',
					99: '3',
					100: '4',
					101: '5',
					102: '6',
					103: '7',
					104: '8',
					105: '9'
				},
				which     = e.which,
				character = SPECIAL_KEYS[which] ||
					String.fromCharCode(which).toLowerCase();

			if (e.ctrlKey) {
				shortcut.push('ctrl');
			}

			if (e.altKey) {
				shortcut.push('alt');
			}

			if (e.shiftKey) {
				shortcut.push('shift');

				if (NUMPAD_SHIFT_KEYS[which]) {
					character = NUMPAD_SHIFT_KEYS[which];
				} else if (SHIFT_KEYS[character]) {
					character = SHIFT_KEYS[character];
				}
			}

			// Shift is 16, ctrl is 17 and alt is 18
			if (character && (which < 16 || which > 18)) {
				shortcut.push(character);
			}

			shortcut = shortcut.join('+');
			if (shortcutHandlers[shortcut]) {
				return shortcutHandlers[shortcut].call(base);
			}
		};

		/**
		 * Adds a shortcut handler to the editor
		 * @param  {String}          shortcut
		 * @param  {String|Function} cmd
		 * @return {jQuery.sceditor}
		 */
		base.addShortcut = function (shortcut, cmd) {
			shortcut = shortcut.toLowerCase();

			if (typeof cmd === 'string') {
				shortcutHandlers[shortcut] = function () {
					handleCommand(
						toolbarButtons[cmd],
						base.commands[cmd]
					);

					return false;
				};
			} else {
				shortcutHandlers[shortcut] = cmd;
			}

			return base;
		};

		/**
		 * Removes a shortcut handler
		 * @param  {String} shortcut
		 * @return {jQuery.sceditor}
		 */
		base.removeShortcut = function (shortcut) {
			delete shortcutHandlers[shortcut.toLowerCase()];

			return base;
		};

		/**
		 * Handles the backspace key press
		 *
		 * Will remove block styling like quotes/code ect if at the start.
		 * @private
		 */
		handleBackSpace = function (e) {
			var	node, offset, tmpRange, range, parent;

			// 8 is the backspace key
			if (options.disableBlockRemove || e.which !== 8 ||
				!(range = rangeHelper.selectedRange())) {
				return;
			}

			if (!globalWin.getSelection) {
				node     = range.parentElement();
				tmpRange = $wysiwygDoc[0].selection.createRange();

				// Select te entire parent and set the end
				// as start of the current range
				tmpRange.moveToElementText(node);
				tmpRange.setEndPoint('EndToStart', range);

				// Number of characters selected is the start offset
				// relative to the parent node
				offset = tmpRange.text.length;
			} else {
				node   = range.startContainer;
				offset = range.startOffset;
			}

			if (offset !== 0 || !(parent = currentStyledBlockNode())) {
				return;
			}

			while (node !== parent) {
				while (node.previousSibling) {
					node = node.previousSibling;

					// Everything but empty text nodes before the cursor
					// should prevent the style from being removed
					if (node.nodeType !== 3 || node.nodeValue) {
						return;
					}
				}

				if (!(node = node.parentNode)) {
					return;
				}
			}

			if (!parent || $(parent).is('body')) {
				return;
			}

			// The backspace was pressed at the start of
			// the container so clear the style
			base.clearBlockFormatting(parent);
			return false;
		};

		/**
		 * Gets the first styled block node that contains the cursor
		 * @return {HTMLElement}
		 */
		currentStyledBlockNode = function () {
			var block = currentBlockNode;

			while (!dom.hasStyling(block) || dom.isInline(block, true)) {
				if (!(block = block.parentNode) || $(block).is('body')) {
					return;
				}
			}

			return block;
		};

		/**
		 * Clears the formatting of the passed block element.
		 *
		 * If block is false, if will clear the styling of the first
		 * block level element that contains the cursor.
		 * @param  {HTMLElement} block
		 * @since 1.4.4
		 */
		base.clearBlockFormatting = function (block) {
			block = block || currentStyledBlockNode();

			if (!block || $(block).is('body')) {
				return base;
			}

			rangeHelper.saveRange();

			block.className = '';
			lastRange       = null;

			$(block).attr('style', '');

			if (!$(block).is('p,div,td')) {
				dom.convertElement(block, 'p');
			}

			rangeHelper.restoreRange();
			return base;
		};

		/**
		 * Triggers the valueChnaged signal if there is
		 * a plugin that handles it.
		 *
		 * If rangeHelper.saveRange() has already been
		 * called, then saveRange should be set to false
		 * to prevent the range being saved twice.
		 *
		 * @since 1.4.5
		 * @param {Boolean} saveRange If to call rangeHelper.saveRange().
		 * @private
		 */
		triggerValueChanged = function (saveRange) {
			if (!pluginManager ||
				(!pluginManager.hasHandler('valuechangedEvent') &&
					!triggerValueChanged.hasHandler)) {
				return;
			}

			var	currentHtml,
				sourceMode   = base.sourceMode(),
				hasSelection = !sourceMode && rangeHelper.hasSelection();

			// Don't need to save the range if sceditor-start-marker
			// is present as the range is already saved
			saveRange = saveRange !== false &&
				!$wysiwygDoc[0].getElementById('sceditor-start-marker');

			// Clear any current timeout as it's now been triggered
			if (valueChangedKeyUp.timer) {
				clearTimeout(valueChangedKeyUp.timer);
				valueChangedKeyUp.timer = false;
			}

			if (hasSelection && saveRange) {
				rangeHelper.saveRange();
			}

			currentHtml = sourceMode ?
				$sourceEditor.val() :
				$wysiwygBody.html();

			// Only trigger if something has actually changed.
			if (currentHtml !== triggerValueChanged.lastHtmlValue) {
				triggerValueChanged.lastHtmlValue = currentHtml;

				$editorContainer.trigger($.Event('valuechanged', {
					rawValue: sourceMode ? base.val() : currentHtml
				}));
			}

			if (hasSelection && saveRange) {
				rangeHelper.removeMarkers();
			}
		};

		/**
		 * Should be called whenever there is a blur event
		 * @private
		 */
		valueChangedBlur = function () {
			if (valueChangedKeyUp.timer) {
				triggerValueChanged();
			}
		};

		/**
		 * Should be called whenever there is a keypress event
		 * @param  {Event} e The keypress event
		 * @private
		 */
		valueChangedKeyUp = function (e) {
			var which         = e.which,
				lastChar      = valueChangedKeyUp.lastChar,
				lastWasSpace  = (lastChar === 13 || lastChar === 32),
				lastWasDelete = (lastChar === 8 || lastChar === 46);

			valueChangedKeyUp.lastChar = which;

			// 13 = return & 32 = space
			if (which === 13 || which === 32) {
				if (!lastWasSpace) {
					triggerValueChanged();
				} else {
					valueChangedKeyUp.triggerNextChar = true;
				}
			// 8 = backspace & 46 = del
			} else if (which === 8 || which === 46) {
				if (!lastWasDelete) {
					triggerValueChanged();
				} else {
					valueChangedKeyUp.triggerNextChar = true;
				}
			} else if (valueChangedKeyUp.triggerNextChar) {
				triggerValueChanged();
				valueChangedKeyUp.triggerNextChar = false;
			}

			// Clear the previous timeout and set a new one.
			if (valueChangedKeyUp.timer) {
				clearTimeout(valueChangedKeyUp.timer);
			}

			// Trigger the event 1.5s after the last keypress if space
			// isn't pressed. This might need to be lowered, will need
			// to look into what the slowest average Chars Per Min is.
			valueChangedKeyUp.timer = setTimeout(function () {
				triggerValueChanged();
			}, 1500);
		};

		autoUpdate = function () {
			if (!autoUpdateCanceled) {
				base.updateOriginal();
			}

			autoUpdateCanceled = false;
		};

		// run the initializer
		init();
	};


	/**
	 * Map containing the loaded SCEditor locales
	 * @type {Object}
	 * @name locale
	 * @memberOf jQuery.sceditor
	 */
	SCEditor.locale = {};


	/**
	 * Static command helper class
	 * @class command
	 * @name jQuery.sceditor.command
	 */
	SCEditor.command =
	/** @lends jQuery.sceditor.command */
	{
		/**
		 * Gets a command
		 *
		 * @param {String} name
		 * @return {Object|null}
		 * @since v1.3.5
		 */
		get: function (name) {
			return SCEditor.commands[name] || null;
		},

		/**
		 * <p>Adds a command to the editor or updates an existing
		 * command if a command with the specified name already exists.</p>
		 *
		 * <p>Once a command is add it can be included in the toolbar by
		 * adding it's name to the toolbar option in the constructor. It
		 * can also be executed manually by calling
		 * {@link jQuery.sceditor.execCommand}</p>
		 *
		 * @example
		 * SCEditor.command.set("hello",
		 * {
		 *     exec: function () {
		 *         alert("Hello World!");
		 *     }
		 * });
		 *
		 * @param {String} name
		 * @param {Object} cmd
		 * @return {this|false} Returns false if name or cmd is false
		 * @since v1.3.5
		 */
		set: function (name, cmd) {
			if (!name || !cmd) {
				return false;
			}

			// merge any existing command properties
			cmd = $.extend(SCEditor.commands[name] || {}, cmd);

			cmd.remove = function () {
				SCEditor.command.remove(name);
			};

			SCEditor.commands[name] = cmd;
			return this;
		},

		/**
		 * Removes a command
		 *
		 * @param {String} name
		 * @return {this}
		 * @since v1.3.5
		 */
		remove: function (name) {
			if (SCEditor.commands[name]) {
				delete SCEditor.commands[name];
			}

			return this;
		}
	};

	return SCEditor;
});
