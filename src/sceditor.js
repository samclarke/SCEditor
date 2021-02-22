/**
 * SCEditor
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor - A lightweight WYSIWYG BBCode and HTML editor
 * @author Sam Clarke
 */

import SCEditor from './lib/SCEditor.js';
import PluginManager from './lib/PluginManager.js';
import * as escape from './lib/escape.js';
import * as browser from './lib/browser.js';
import * as dom from './lib/dom.js';
import * as utils from './lib/utils.js';
import defaultCommands from './lib/defaultCommands.js';
import defaultOptions from './lib/defaultOptions.js';


window.sceditor = {
	command: SCEditor.command,
	commands: defaultCommands,
	defaultOptions: defaultOptions,

	ios: browser.ios,
	isWysiwygSupported: browser.isWysiwygSupported,

	regexEscape: escape.regex,
	escapeEntities: escape.entities,
	escapeUriScheme: escape.uriScheme,

	dom: {
		css: dom.css,
		attr: dom.attr,
		removeAttr: dom.removeAttr,
		is: dom.is,
		closest: dom.closest,
		width: dom.width,
		height: dom.height,
		traverse: dom.traverse,
		rTraverse: dom.rTraverse,
		parseHTML: dom.parseHTML,
		hasStyling: dom.hasStyling,
		convertElement: dom.convertElement,
		blockLevelList: dom.blockLevelList,
		canHaveChildren: dom.canHaveChildren,
		isInline: dom.isInline,
		copyCSS: dom.copyCSS,
		fixNesting: dom.fixNesting,
		findCommonAncestor: dom.findCommonAncestor,
		getSibling: dom.getSibling,
		removeWhiteSpace: dom.removeWhiteSpace,
		extractContents: dom.extractContents,
		getOffset: dom.getOffset,
		getStyle: dom.getStyle,
		hasStyle: dom.hasStyle
	},
	locale: SCEditor.locale,
	icons: SCEditor.icons,
	utils: {
		each: utils.each,
		isEmptyObject: utils.isEmptyObject,
		extend: utils.extend
	},
	plugins: PluginManager.plugins,
	formats: SCEditor.formats,
	create: function (textarea, options) {
		options = options || {};

		// Don't allow the editor to be initialised
		// on it's own source editor
		if (dom.parent(textarea, '.sceditor-container')) {
			return;
		}

		if (options.runWithoutWysiwygSupport || browser.isWysiwygSupported) {
			/*eslint no-new: off*/
			(new SCEditor(textarea, options));
		}
	},
	instance: function (textarea) {
		return textarea._sceditor;
	}
};
