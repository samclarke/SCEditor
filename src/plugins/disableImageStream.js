/**
 * SCEditor Image stream filtering plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2015, Francis Schiavo (francisschiavo.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @fileoverview SCEditor Image stream filtering plugin
 * @author Francis Schiavo
 * @requires jQuery
 */
(function ($) {
	'use strict';

	$.sceditor.plugins.disableImageStream = function () {
		var base = this;

		/**
		 * Private functions
		 * @private
		 */
		base.init = function () {
      document.title = 'DisableImageStream Loaded';
		};

    base.signalPasteData = function(pastedata) {
      if (/data:image/ig.test(pastedata)) {
        return '';
      }
      return pastedata;
    }
	};
})(jQuery);
