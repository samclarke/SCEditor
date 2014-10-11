define(function (require, exports) {
	'use strict';

	var VALID_SCHEME_REGEX =
		/^(?:https?|s?ftp|mailto|spotify|skype|ssh|teamspeak|tel|data):|(?:\/\/)/i;

	/**
	 * Escapes a string so it's safe to use in regex
	 *
	 * @param {String} str
	 * @return {String}
	 * @name regex
	 */
	exports.regex = function (str) {
		return str.replace(/([\-.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
	};

	/**
	 * Escapes all HTML entities in a string
	 *
	 * If noQuotes is set to false, all single and double
	 * quotes will also be escaped
	 *
	 * @param {String} str
	 * @param {Boolean} [noQuotes=false]
	 * @return {String}
	 * @name entities
	 * @since 1.4.1
	 */
	exports.entities = function (str, noQuotes) {
		if (!str) {
			return str;
		}

		var replacements = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'  ': ' &nbsp;',
			'\r\n': '\n',
			'\r': '\n',
			'\n': '<br />'
		};

		if (noQuotes !== false) {
			replacements['"']  = '&#34;';
			replacements['\''] = '&#39;';
			replacements['`']  = '&#96;';
		}

		str = str.replace(/ {2}|\r\n|[&<>\r\n'"`]/g, function (match) {
			return replacements[match] || match;
		});

		return str;
	};

	/**
	 * Escape URI scheme.
	 *
	 * Appends the current URL to a url if it has a scheme that is not:
	 *
	 * http
	 * https
	 * sftp
	 * ftp
	 * mailto
	 * spotify
	 * skype
	 * ssh
	 * teamspeak
	 * tel
	 * //
	 *
	 * **IMPORTANT**: This does not escape any HTML in a url, for
	 * that use the escape.entities() method.
	 *
	 * @param  {String} url
	 * @return {String}
	 * @name escapeUriScheme
	 * @memberOf jQuery.sceditor
	 * @since 1.4.5
	 */
	exports.uriScheme = function (url) {
		/*jshint maxlen:false*/
		var	path,
			// If there is a : before a / then it has a scheme
			hasScheme = /^[^\/]*:/i,
			location = window.location;

		// Has no scheme or a valid scheme
		if ((!url || !hasScheme.test(url)) || VALID_SCHEME_REGEX.test(url)) {
			return url;
		}

		path = location.pathname.split('/');
		path.pop();

		return location.protocol + '//' +
			location.host +
			path.join('/') + '/' +
			url;
	};
});
