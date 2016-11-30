define(function (require, exports) {
	'use strict';

	var $ = require('jquery');

	var USER_AGENT = navigator.userAgent;

	/**
	 * Detects the version of IE is being used if any.
	 *
	 * Will be the IE version number or undefined if the
	 * browser is not IE.
	 *
	 * Source: https://gist.github.com/527683 with extra code
	 * for IE 10 & 11 detection.
	 *
	 * @function
	 * @name ie
	 * @type {int}
	 */
	exports.ie = (function () {
		var	undef,
			v   = 3,
			doc = document,
			div = doc.createElement('div'),
			all = div.getElementsByTagName('i');

		do {
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->';
		} while (all[0]);

		// Detect IE 10 as it doesn't support conditional comments.
		if ((doc.documentMode && doc.all && window.atob)) {
			v = 10;
		}

		// Detect IE 11
		if (v === 4 && doc.documentMode) {
			v = 11;
		}

		return v > 4 ? v : undef;
	}());

	exports.edge = '-ms-ime-align' in document.documentElement.style;

	/**
	 * <p>Detects if the browser is iOS</p>
	 *
	 * <p>Needed to fix iOS specific bugs/</p>
	 *
	 * @function
	 * @name ios
	 * @memberOf jQuery.sceditor
	 * @type {Boolean}
	 */
	exports.ios = /iPhone|iPod|iPad| wosbrowser\//i.test(USER_AGENT);

	/**
	 * If the browser supports WYSIWYG editing (e.g. older mobile browsers).
	 *
	 * @function
	 * @name isWysiwygSupported
	 * @return {Boolean}
	 */
	exports.isWysiwygSupported = (function () {
		var	match, isUnsupported, undef,
			editableAttr = $('<p contenteditable="true">')[0].contentEditable;

		// Check if the contenteditable attribute is supported
		if (editableAttr === undef || editableAttr === 'inherit') {
			return false;
		}

		// I think blackberry supports contentEditable or will at least
		// give a valid value for the contentEditable detection above
		// so it isn't included in the below tests.

		// I hate having to do UA sniffing but some mobile browsers say they
		// support contentediable when it isn't usable, i.e. you can't enter
		// text.
		// This is the only way I can think of to detect them which is also how
		// every other editor I've seen deals with this issue.

		// Exclude Opera mobile and mini
		isUnsupported = /Opera Mobi|Opera Mini/i.test(USER_AGENT);

		if (/Android/i.test(USER_AGENT)) {
			isUnsupported = true;

			if (/Safari/.test(USER_AGENT)) {
				// Android browser 534+ supports content editable
				// This also matches Chrome which supports content editable too
				match = /Safari\/(\d+)/.exec(USER_AGENT);
				isUnsupported = (!match || !match[1] ? true : match[1] < 534);
			}
		}

		// The current version of Amazon Silk supports it, older versions didn't
		// As it uses webkit like Android, assume it's the same and started
		// working at versions >= 534
		if (/ Silk\//i.test(USER_AGENT)) {
			match = /AppleWebKit\/(\d+)/.exec(USER_AGENT);
			isUnsupported = (!match || !match[1] ? true : match[1] < 534);
		}

		// iOS 5+ supports content editable
		if (exports.ios) {
			// Block any version <= 4_x(_x)
			isUnsupported = /OS [0-4](_\d)+ like Mac/i.test(USER_AGENT);
		}

		// FireFox does support WYSIWYG on mobiles so override
		// any previous value if using FF
		if (/Firefox/i.test(USER_AGENT)) {
			isUnsupported = false;
		}

		if (/OneBrowser/i.test(USER_AGENT)) {
			isUnsupported = false;
		}

		// UCBrowser works but doesn't give a unique user agent
		if (navigator.vendor === 'UCWEB') {
			isUnsupported = false;
		}

		// IE <= 8 is not supported any more
		if (exports.ie < 9) {
			isUnsupported = true;
		}

		return !isUnsupported;
	}());
});
