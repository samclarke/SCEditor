/**
 * SCEditor Inline-Code Plugin for BBCode format
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Video plugin
 * This plugin replaces the youtube command with "add video" command, which
 * will recognize youtube and facebook URLs (hopefully other URLs as well
 * in the future) and generate the tags accordingly
 * @author Alex Betis
 */

(function (sceditor) {
	'use strict';

	sceditor.plugins.video = function () {
		var base = this;

		var utils = sceditor.utils;
		var dom = sceditor.dom;

		/**
		 * Private functions
		 * @private
		 */
		var commandHandler;
		var processYoutube;
		var processFacebook;
		var youtubeHtml;
		var facebookHtml;

		base.init = function () {
			var opts = this.opts;

			// Enable for BBCode only
			if (opts.format && opts.format !== 'bbcode') {
				return;
			}

			if (opts.toolbar === sceditor.defaultOptions.toolbar) {
				opts.toolbar = opts.toolbar.replace(',image,',
					',image,video,');

				opts.toolbar = opts.toolbar.replace(',youtube', '');
			}

			// Remove youtube command
			sceditor.command.remove('youtube');

			// Add new movie command
			sceditor.command.set('video', {
				exec: commandHandler,
				txtExec: commandHandler,
				tooltip: 'Insert a video (YouTube, Facebook)'
			});

			sceditor.formats.bbcode.set('facebook', {
				allowsEmpty: true,
				tags: {
					iframe: {
						'data-facebook-id': null
					}
				},
				format: function (element, content) {
					var id = dom.attr(element, 'data-facebook-id');

					return id ? '[facebook]' + id + '[/facebook]' : content;
				},
				html: function (token, attrs, content) {
					return facebookHtml(this.opts.facebookParameters, content);
				}
			});
		};

		youtubeHtml = function (pOpts, id, time) {
			return '<iframe ' + pOpts + ' ' +
				'src="https://www.youtube.com/embed/' + id +
				'?start=' + time +
				'&wmode=opaque" ' +
				'data-youtube-id="' + id + '" ' +
				'data-youtube-start="' + time + '"></iframe>';
		};

		facebookHtml = function (pOpts, id) {
			return '<iframe ' + pOpts + ' ' +
				'src="https://www.facebook.com/video/embed?video_id=' +
				id + '" ' +
				'data-facebook-id="' + id + '"></iframe>';
		};

		processYoutube = function (editor, val) {
			var pOpts = editor.opts.parserOptions;
			var idMatch = val.match(/(?:v=|v\/|embed\/|youtu.be\/)(.{11})/);
			var timeMatch = val.match(/[&|?](?:star)?t=((\d+[hms]?){1,3})/);
			var time = 0;

			if (timeMatch) {
				utils.each(timeMatch[1].split(/[hms]/), function (i, val) {
					if (val !== '') {
						time = (time * 60) + Number(val);
					}
				});
			}

			if (idMatch && /^[a-zA-Z0-9_\-]{11}$/.test(idMatch[1])) {
				var id = idMatch[1];

				if (editor.sourceMode()) {
					if (time === 0) {
						editor.insertText('[youtube]' + id + '[/youtube]');
					} else {
						editor.insertText('[youtube=' + time + ']' + id +
							'[/youtube]');
					}
				} else {
					editor.wysiwygEditorInsertHtml(
						youtubeHtml(pOpts.youtubeParameters, id, time));
				}

				return true;
			} else {
				return false;
			}
		};

		processFacebook = function (editor, val) {
			var pOpts = editor.opts.parserOptions;
			var idMatch = val.match(/videos\/(\d+)+|v=(\d+)|vb.\d+\/(\d+)/);

			if (idMatch && /^[a-zA-Z0-9]/.test(idMatch[1])) {
				var id = idMatch[1];

				if (editor.sourceMode()) {
					editor.insertText('[facebook]' + id + '[/facebook]');
				} else {
					editor.wysiwygEditorInsertHtml(
						facebookHtml(pOpts.facebookParameters, id));
				}

				return true;
			} else {
				return false;
			}
		};

		/**
		 * Function for the txtExec and exec properties
		 *
		 * @param  {node} caller
		 * @private
		 */
		commandHandler = function (caller) {
			var editor = this;
			var content = document.createElement('div');

			var div;
			var label;
			var input;
			var button;

			div = document.createElement('div');
			label = document.createElement('label');
			label.setAttribute('for', 'link');
			label.textContent = editor._('Video URL:');
			input = document.createElement('input');
			input.type = 'text';
			input.id = 'link';
			input.dir = 'ltr';
			input.placeholder = 'https://';
			div.appendChild(label);
			div.appendChild(input);

			content.appendChild(div);

			div = document.createElement('div');
			button = document.createElement('input');
			button.type = 'button';
			button.className = 'button';
			button.value = editor._('Insert');
			div.appendChild(button);

			content.appendChild(div);

			button.addEventListener('click', function (e) {
				var val = input.value;
				var done;

				done = processYoutube(editor, val);
				if (!done) {
					processFacebook(editor, val);
				}

				editor.closeDropDown(true);
				e.preventDefault();
			});

			editor.createDropDown(caller, 'insertlink', content);
		};
	};
})(sceditor);
