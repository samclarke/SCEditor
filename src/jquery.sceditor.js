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
 * @requires jQuery
 */

import $ from 'jquery';
import './sceditor.js';


// For backwards compatibility
$.sceditor = window.sceditor;

/**
 * Creates an instance of sceditor on all textareas
 * matched by the jQuery selector.
 *
 * If options is set to "state" it will return bool value
 * indicating if the editor has been initialised on the
 * matched textarea(s). If there is only one textarea
 * it will return the bool value for that textarea.
 * If more than one textarea is matched it will
 * return an array of bool values for each textarea.
 *
 * If options is set to "instance" it will return the
 * current editor instance for the textarea(s). Like the
 * state option, if only one textarea is matched this will
 * return just the instance for that textarea. If more than
 * one textarea is matched it will return an array of
 * instances each textarea.
 *
 * @param  {Object|string} [options] Should either be an Object of options or
 *                                   the strings "state" or "instance"
 * @return {this|Array<SCEditor>|Array<boolean>|SCEditor|boolean}
 */
$.fn.sceditor = function (options) {
	var	instance;
	var ret = [];

	this.each(function () {
		instance = this._sceditor;

		// Add state of instance to ret if that is what options is set to
		if (options === 'state') {
			ret.push(!!instance);
		} else if (options === 'instance') {
			ret.push(instance);
		} else if (!instance) {
			$.sceditor.create(this, options);
		}
	});

	// If nothing in the ret array then must be init so return this
	if (!ret.length) {
		return this;
	}

	return ret.length === 1 ? ret[0] : ret;
};
