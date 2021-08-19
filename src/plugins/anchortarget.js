/**
 * SCEditor Paragraph Formatting Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2011-2013, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Anchor target type plugin
 * @author Jamie Toloui
 */
(function (sceditor) {
	'use strict';

	sceditor.plugins.anchortarget = function () {
		var base = this;

		/**
     * Default Link Toolbar with target options
     * @type {Array}
     * @private
     */
		var dropDownElements = [
			{ name: 'URL:', type: 'input', children: [], id: 'url' },
			{
				name: 'Description (optional):',
				type: 'input',
				children: [],
				id: 'desc'
			},
			{
				name: 'Target Type:',
				type: 'select',
				children: {
					_self: 'Open in current window',
					_blank: 'Open in window or tab',
					_parent: 'Open in parent frame',
					_top: 'Open in full body of the window'
				},
				id: 'target-type'
			},
			{ name: 'Insert', type: 'button', children: [], id: 'insert' }
		];

		/**
     * Private functions
     * @private
     */
		var insertTag, linkTargetCmd;

		base.init = function () {
			var opts = this.opts;

			// Don't enable if the BBCode plugin is enabled.
			if (opts.format && opts.format === 'bbcode') {
				return;
			}

			if (!this.commands.format) {
				this.commands.format = {
					exec: linkTargetCmd,
					txtExec: linkTargetCmd,
					tooltip: 'Anchor Target Type'
				};
			}

			if (opts.toolbar === sceditor.defaultOptions.toolbar) {
				opts.toolbar = opts.toolbar.replace(',link,', ',format,');
			}
		};

		/**
     * Inserts the specified tag into the editor
     *
     * @param  {sceditor} editor
     * @param  {string} targetType anchor target type
     * @param  {string} href href to link
     * @param  {string} description Optional param
     * @private
     */
		insertTag = function (editor, targetType, href, description) {
			var attrs = '',
				text;
			console.log(editor.getRangeHelper().selectedHtml());
			attrs += ' target="' + targetType + '"';
			attrs += ' href="' + href + '"';

			if (editor.getRangeHelper().selectedHtml().trim('').length > 0) {
				text = description || editor.getRangeHelper().selectedHtml();
			} else {
				text = description.trim('').length > 0 ? description : href;
			}

			editor.insert('<a' + attrs + '>' + text + '</a>');
		};

		/**
     * Function for the exec and txtExec properties
     *
     * @param  {node} caller
     * @private
     */
		linkTargetCmd = function (caller) {
			var editor = this,
				content = document.createElement('div');

			sceditor.utils.each(dropDownElements, function (index, val) {
				var wrapperElement = document.createElement('div'),
					parentElement,
					childElement,
					subChildren;
				switch (val.type) {
					case 'input':
						parentElement = document.createElement('label');
						parentElement.setAttribute('for', val.id);
						parentElement.innerText = val.name;
						childElement = document.createElement(val.type);
						childElement.type = 'text';
						childElement.id = val.id;
						wrapperElement.appendChild(parentElement);
						wrapperElement.appendChild(childElement);
						content.appendChild(wrapperElement);
						break;
					case 'select':
						parentElement = document.createElement('label');
						parentElement.setAttribute('for', val.id);
						parentElement.innerText = val.name;
						childElement = document.createElement(val.type);
						childElement.setAttribute('for', val.id);
						childElement.innerText = val.name;
						childElement.id = val.id;
						sceditor.utils.each(val.children,
							function (type, text) {
								subChildren = document.createElement('option');
								subChildren.value = type;
								subChildren.innerText = text;
								childElement.appendChild(subChildren);
							});
						wrapperElement.appendChild(parentElement);
						wrapperElement.appendChild(childElement);
						content.appendChild(wrapperElement);
						break;
					case 'button':
						parentElement = document.createElement('input');
						parentElement.setAttribute('for', val.id);
						parentElement.type = val.type;
						parentElement.value = val.name;
						parentElement.className = val.type;

						parentElement.addEventListener('click', function (e) {
							var urlValue = document.querySelector('#url'),
								descValue = document.querySelector('#desc'),
								targetValue =
                                document.querySelector('#target-type');
							if (val.exec) {
								val.exec(editor);
							} else {
								insertTag(
									editor,
									targetValue.value,
									urlValue.value,
									descValue.value
								);
							}
							e.preventDefault();
							editor.closeDropDown(true);
						});
						wrapperElement.appendChild(parentElement);
						content.appendChild(wrapperElement);
						break;
					default:
						break;
				}
			});

			editor.createDropDown(caller, 'anchorTag', content);
		};
	};
})(sceditor);
