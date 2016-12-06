/**
 * SCEditor Auto Youtube Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2016, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 * @requires jQuery
 */
(function ($, document) {
	'use strict';

	/*
		(^|\s)					Start of line or space
		(?:https?:\/\/)?  		Optional scheme like http://
		(?:www\.)?      		Optional www. prefix
		(?:
			youtu\.be\/     	Ends with .be/ so whatever comes next is the ID
		|
			youtube\.com\/watch\?v=		Matches the .com version
		)
		([^"&?\/ ]{11}) 				The actual YT ID
		(?:\&[\&_\?0-9a-z\#]+)?			Any extra URL params
		(\s|$)							End of line or space
	*/
	var ytIdRegex = /(^|\s)(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([^"&?\/ ]{11})(?:\&[\&_\?0-9a-z\#]+)?(\s|$)/i;

	function youtubeEmbedCode(id) {
		return '<iframe width="560" height="315" frameborder="0" ' +
			'src="https://www.youtube-nocookie.com/embed/' + id + '" ' +
			'data-youtube-id="' + id + '" allowfullscreen></iframe>';
	}

	function convertYoutubeLinks(root) {
		var node = root.firstChild;

		while (node) {
			// 3 is TextNodes
			if (node.nodeType === 3) {
				var nodeValue = node.nodeValue;
				var m = nodeValue.match(ytIdRegex);

				if (m) {
					node.nodeValue = nodeValue.substr(0, m.index) + m[1];

					$(node)
						.after(document.createTextNode(
							m[3] + nodeValue.substr(m.index + m[0].length)
						))
						.after(youtubeEmbedCode(m[2]));
				}
			} else {
				// TODO: Make this tag configurable.
				if (!$(node).is('code')) {
					convertYoutubeLinks(node);
				}
			}

			node = node.nextSibling;
		}
	};

	$.sceditor.plugins.autoyoutube = function () {
		this.signalPasteRaw = function (data) {
			// TODO: Make this tag configurable.
			// Skip code tags
			if ($(this.currentNode()).closest('code').length) {
				return;
			}

			if (!data.html && data.text) {
				data.html = $.sceditor.escapeEntities(data.text || '');
			}

			if (data.html) {
				var $html = $('<div />')
					.html(data.html)
					.appendTo(document.body);

				convertYoutubeLinks($html[0]);

				data.html = $html[0].innerHTML;

				$html.remove();
			}
		};
	};
})(jQuery, document);
