define(function (require) {
	'use strict';

	var $ = require('jquery');


	/**
	 * Default options for SCEditor
	 * @type {Object}
	 */
	return {
		/** @lends jQuery.sceditor.defaultOptions */
		/**
		 * Toolbar buttons order and groups. Should be comma separated and
		 * have a bar | to separate groups
		 *
		 * @type {String}
		 */
		toolbar: 'bold,italic,underline,strike,subscript,superscript|' +
			'left,center,right,justify|font,size,color,removeformat|' +
			'cut,copy,paste,pastetext|bulletlist,orderedlist,indent,outdent|' +
			'table|code,quote|horizontalrule,image,email,link,unlink|' +
			'emoticon,youtube,date,time|ltr,rtl|print,maximize,source',

		/**
		 * Comma separated list of commands to excludes from the toolbar
		 *
		 * @type {String}
		 */
		toolbarExclude: null,

		/**
		 * Stylesheet to include in the WYSIWYG editor. This is what will style
		 * the WYSIWYG elements
		 *
		 * @type {String}
		 */
		style: 'jquery.sceditor.default.css',

		/**
		 * Comma separated list of fonts for the font selector
		 *
		 * @type {String}
		 */
		fonts: 'Arial,Arial Black,Comic Sans MS,Courier New,Georgia,Impact,' +
			'Sans-serif,Serif,Times New Roman,Trebuchet MS,Verdana',

		/**
		 * Colors should be comma separated and have a bar | to signal a new
		 * column.
		 *
		 * If null the colors will be auto generated.
		 *
		 * @type {string}
		 */
		colors: '#000,#44B8FF,#1E92F7,#0074D9,#005DC2,#00369B,#b3d5f4|' +
				'#444,#C3FFFF,#9DF9FF,#7FDBFF,#68C4E8,#419DC1,#d9f4ff|' +
				'#666,#72FF84,#4CEA5E,#2ECC40,#17B529,#008E02,#c0f0c6|' +
				'#888,#FFFF44,#FFFA1E,#FFDC00,#E8C500,#C19E00,#fff5b3|' +
				'#aaa,#FFC95F,#FFA339,#FF851B,#E86E04,#C14700,#ffdbbb|' +
				'#ccc,#FF857A,#FF5F54,#FF4136,#E82A1F,#C10300,#ffc6c3|' +
				'#eee,#FF56FF,#FF30DC,#F012BE,#D900A7,#B20080,#fbb8ec|' +
				'#fff,#F551FF,#CF2BE7,#B10DC9,#9A00B2,#9A00B2,#e8b6ef',

		/**
		 * The locale to use.
		 * @type {String}
		 */
		locale: $('html').attr('lang') || 'en',

		/**
		 * The Charset to use
		 * @type {String}
		 */
		charset: 'utf-8',

		/**
		 * Compatibility mode for emoticons.
		 *
		 * Helps if you have emoticons such as :/ which would put an emoticon
		 * inside http://
		 *
		 * This mode requires emoticons to be surrounded by whitespace or end of
		 * line chars. This mode has limited As You Type emoticon conversion
		 * support. It will not replace AYT for end of line chars, only
		 * emoticons surrounded by whitespace. They will still be replaced
		 * correctly when loaded just not AYT.
		 *
		 * @type {Boolean}
		 */
		emoticonsCompat: false,

		/**
		 * If to enable emoticons. Can be changes at runtime using the
		 * emoticons() method.
		 *
		 * @type {Boolean}
		 * @since 1.4.2
		 */
		emoticonsEnabled: true,

		/**
		 * Emoticon root URL
		 *
		 * @type {String}
		 */
		emoticonsRoot: '',
		emoticons: {
			dropdown: {
				':)': 'emoticons/smile.png',
				':angel:': 'emoticons/angel.png',
				':angry:': 'emoticons/angry.png',
				'8-)': 'emoticons/cool.png',
				':\'(': 'emoticons/cwy.png',
				':ermm:': 'emoticons/ermm.png',
				':D': 'emoticons/grin.png',
				'<3': 'emoticons/heart.png',
				':(': 'emoticons/sad.png',
				':O': 'emoticons/shocked.png',
				':P': 'emoticons/tongue.png',
				';)': 'emoticons/wink.png'
			},
			more: {
				':alien:': 'emoticons/alien.png',
				':blink:': 'emoticons/blink.png',
				':blush:': 'emoticons/blush.png',
				':cheerful:': 'emoticons/cheerful.png',
				':devil:': 'emoticons/devil.png',
				':dizzy:': 'emoticons/dizzy.png',
				':getlost:': 'emoticons/getlost.png',
				':happy:': 'emoticons/happy.png',
				':kissing:': 'emoticons/kissing.png',
				':ninja:': 'emoticons/ninja.png',
				':pinch:': 'emoticons/pinch.png',
				':pouty:': 'emoticons/pouty.png',
				':sick:': 'emoticons/sick.png',
				':sideways:': 'emoticons/sideways.png',
				':silly:': 'emoticons/silly.png',
				':sleeping:': 'emoticons/sleeping.png',
				':unsure:': 'emoticons/unsure.png',
				':woot:': 'emoticons/w00t.png',
				':wassat:': 'emoticons/wassat.png'
			},
			hidden: {
				':whistling:': 'emoticons/whistling.png',
				':love:': 'emoticons/wub.png'
			}
		},

		/**
		 * Width of the editor. Set to null for automatic with
		 *
		 * @type {int}
		 */
		width: null,

		/**
		 * Height of the editor including toolbar. Set to null for automatic
		 * height
		 *
		 * @type {int}
		 */
		height: null,

		/**
		 * If to allow the editor to be resized
		 *
		 * @type {Boolean}
		 */
		resizeEnabled: true,

		/**
		 * Min resize to width, set to null for half textarea width or -1 for
		 * unlimited
		 *
		 * @type {int}
		 */
		resizeMinWidth: null,
		/**
		 * Min resize to height, set to null for half textarea height or -1 for
		 * unlimited
		 *
		 * @type {int}
		 */
		resizeMinHeight: null,
		/**
		 * Max resize to height, set to null for double textarea height or -1
		 * for unlimited
		 *
		 * @type {int}
		 */
		resizeMaxHeight: null,
		/**
		 * Max resize to width, set to null for double textarea width or -1 for
		 * unlimited
		 *
		 * @type {int}
		 */
		resizeMaxWidth: null,
		/**
		 * If resizing by height is enabled
		 *
		 * @type {Boolean}
		 */
		resizeHeight: true,
		/**
		 * If resizing by width is enabled
		 *
		 * @type {Boolean}
		 */
		resizeWidth: true,

		/**
		 * Date format, will be overridden if locale specifies one.
		 *
		 * The words year, month and day will be replaced with the users current
		 * year, month and day.
		 *
		 * @type {String}
		 */
		dateFormat: 'year-month-day',

		/**
		 * Element to inset the toolbar into.
		 *
		 * @type {HTMLElement}
		 */
		toolbarContainer: null,

		/**
		 * If to enable paste filtering. This is currently experimental, please
		 * report any issues.
		 *
		 * @type {Boolean}
		 */
		enablePasteFiltering: false,

		/**
		 * If to completely disable pasting into the editor
		 *
		 * @type {Boolean}
		 */
		disablePasting: false,

		/**
		 * If the editor is read only.
		 *
		 * @type {Boolean}
		 */
		readOnly: false,

		/**
		 * If to set the editor to right-to-left mode.
		 *
		 * If set to null the direction will be automatically detected.
		 *
		 * @type {Boolean}
		 */
		rtl: false,

		/**
		 * If to auto focus the editor on page load
		 *
		 * @type {Boolean}
		 */
		autofocus: false,

		/**
		 * If to auto focus the editor to the end of the content
		 *
		 * @type {Boolean}
		 */
		autofocusEnd: true,

		/**
		 * If to auto expand the editor to fix the content
		 *
		 * @type {Boolean}
		 */
		autoExpand: false,

		/**
		 * If to auto update original textbox on blur
		 *
		 * @type {Boolean}
		 */
		autoUpdate: false,

		/**
		 * If to enable the browsers built in spell checker
		 *
		 * @type {Boolean}
		 */
		spellcheck: true,

		/**
		 * If to run the source editor when there is no WYSIWYG support. Only
		 * really applies to mobile OS's.
		 *
		 * @type {Boolean}
		 */
		runWithoutWysiwygSupport: false,

		/**
		 * If to load the editor in source mode and still allow switching
		 * between WYSIWYG and source mode
		 *
		 * @type {Boolean}
		 */
		startInSourceMode: false,

		/**
		 * Optional ID to give the editor.
		 *
		 * @type {String}
		 */
		id: null,

		/**
		 * Comma separated list of plugins
		 *
		 * @type {String}
		 */
		plugins: '',

		/**
		 * z-index to set the editor container to. Needed for jQuery UI dialog.
		 *
		 * @type {Int}
		 */
		zIndex: null,

		/**
		 * If to trim the BBCode. Removes any spaces at the start and end of the
		 * BBCode string.
		 *
		 * @type {Boolean}
		 */
		bbcodeTrim: false,

		/**
		 * If to disable removing block level elements by pressing backspace at
		 * the start of them
		 *
		 * @type {Boolean}
		 */
		disableBlockRemove: false,

		/**
		 * BBCode parser options, only applies if using the editor in BBCode
		 * mode.
		 *
		 * See SCEditor.BBCodeParser.defaults for list of valid options
		 *
		 * @type {Object}
		 */
		parserOptions: { },

		/**
		 * CSS that will be added to the to dropdown menu (eg. z-index)
		 *
		 * @type {Object}
		 */
		dropDownCss: { }
	};
});
