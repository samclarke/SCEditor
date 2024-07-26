/**
 * SCEditor SVG fontawesome plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */
(function(document, sceditor) {


	var dom = sceditor.dom;

	/* eslint max-len: off*/
	var icons = {
		'albums': '<i class="fa-solid fa-images"></i',
		'attachments': '<i class="fa-solid fa-paperclip"></i',
		'bold': '<i class="fa-solid fa-bold"></i>',
		'bulletlist': '<i class="fa-solid fa-list-ul"></i>',
		'center': '<i class="fa-solid fa-align-center"></i>',
		'code': '<i class="fa-solid fa-code"></i>',
		'color':
			'<span class="fa-stack me-2 pe-2"><i class="fas fa-font fa-stack-1x"></i><i class="fa fa-xs fa-palette sce-color fa-badge"></i></span>',
		'copy': '<i class="fa-solid fa-copy"></i>',
		'cut': '<i class="fa-solid fa-scissors"></i>',
		'email': '<i class="fa-solid fa-envelope"></i>',
		'emojis': '<i class="fa-solid fa-face-smile"></i>',
		'extensions': '<i class="fa-solid fa-plug"></i>',
		'font':
			'<span class="fa-stack me-2 pe-2"><i class="fas fa-font fa-stack-1x"></i><i class="fa fa-xs fa-font fa-badge"></i></span>',
		'format': '<i class="fa-solid fa-font"></i>',
		'grip':
			'<svg xmlns="http://www.w3.org/2000/svg"viewbox="0 0 16 16" unselectable="on"><path d="M14.656 5.156l-10 10 .688.688 10-10-.688-.688zm0 3l-7 7 .688.688 7-7-.688-.688zm0 3l-4 4 .688.688 4-4-.688-.688z"/></svg>',
		'mark': '<i class="fa-solid fa-highlighter"></i>',
		'horizontalrule': '<i class="fa-solid fa-grip-lines"></i>',
		'image': '<i class="fa-solid fa-image"></i>',
		'indent': '<i class="fa-solid fa-indent"></i>',
		'italic': '<i class="fa-solid fa-italic"></i>',
		'justify': '<i class="fa-solid fa-align-justify"></i>',
		'left': '<i class="fa-solid fa-align-left"></i>',
		'link': '<i class="fa-solid fa-link"></i>',
		'maximize': '<i class="fa-solid fa-maximize"></i>',
		'media': '<i class="fa-solid fa-photo-film"></i>',
		'orderedlist': '<i class="fa-solid fa-list-ol"></i>',
		'outdent': '<i class="fa-solid fa-outdent"></i>',
		'paste': '<i class="fa-solid fa-paste"></i>',
		'pastetext': '<i class="fa-solid fa-paste"></i>',
		'quote': '<i class="fa-solid fa-quote-left"></i>',
		'redo': '<i class="fa-solid fa-redo"></i>',
		'removeformat': '<i class="fa-solid fa-remove-format"></i>',
		'reply': '<i class="fa-solid fa-reply"></i>',
		'right': '<i class="fa-solid fa-align-right"></i>',
		'size':
			'<span class="fa-stack me-2 pe-2"><i class="fas fa-font fa-stack-1x"></i><i class="fa fa-xs fa-up-down fa-badge"></i></span>',
		'source': '<i class="fa-solid fa-file-code"></i>',
		'strike': '<i class="fa-solid fa-strikethrough"></i>',
		'table': '<i class="fa-solid fa-table"></i>',
		'underline': '<i class="fa-solid fa-underline"></i>',
		'undo': '<i class="fa-solid fa-undo"></i>',
		'unlink': '<i class="fa-solid fa-link-slash"></i>',
		'vimeo': '<i class="fa-brands fa-vimeo"></i>',
		'instagram': '<i class="fa-brands fa-instagram"></i>',
		'facebook': '<i class="fa-brands fa-facebook"></i>',
		'youtube': '<i class="fa-brands fa-youtube"></i>'
	};

	sceditor.icons.fontawesome = function() {
		var nodes = {};
		var colorPath;

		return {
			create: function(command) {
				if (command in icons) {
					nodes[command] = sceditor.dom.parseHTML(
						icons[command]
					).firstChild;

					if (command === 'color') {
						colorPath = nodes[command].querySelector('.sce-color');
					}
				}

				return nodes[command];
			},
			update: function(isSourceMode, currentNode) {
				if (colorPath) {
					let color = 'inherit';

					if (!isSourceMode && currentNode) {
						color = currentNode.ownerDocument
							.queryCommandValue('forecolor');
					}

					dom.css(colorPath, 'color', color);
				}
			},
			rtl: function(isRtl) {
				const gripNode = nodes.grip;

				if (gripNode) {
					const transform = isRtl ? 'scaleX(-1)' : '';

					dom.css(gripNode, 'transform', transform);
					dom.css(gripNode, 'msTransform', transform);
					dom.css(gripNode, 'webkitTransform', transform);
				}
			}
		};
	};

	sceditor.icons.fontawesome.icons = icons;
})(document, sceditor);
