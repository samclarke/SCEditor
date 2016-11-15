define(function (require) {
	'use strict';

	var $       = require('jquery');
	var dom     = require('./dom');
	var escape  = require('./escape');
	var browser = require('./browser');

	var IE_VER = browser.ie;

	// In IE < 11 a BR at the end of a block level element
	// causes a line break. In all other browsers it's collapsed.
	var IE_BR_FIX = IE_VER && IE_VER < 11;


	var _nodeToHtml = function (node) {
		return $('<p>', node.ownerDocument).append(node).html();
	};

	/**
	 * Gets the text, start/end node and offset for
	 * length chars left or right of the passed node
	 * at the specified offset.
	 *
	 * @param  {Node}  node
	 * @param  {Number}  offset
	 * @param  {Boolean} isLeft
	 * @param  {Number}  length
	 * @return {Object}
	 * @private
	 */
	var outerText = function (range, isLeft, length) {
		var nodeValue, remaining, start, end, node,
			text = '',
			next = range.startContainer,
			offset = range.startOffset;

		// Handle cases where node is a paragraph and offset
		// refers to the index of a text node.
		// 3 = text node
		if (next && next.nodeType !== 3) {
			next = next.childNodes[offset];
			offset = 0;
		}

		start = end = offset;

		while (length > text.length && next && next.nodeType === 3) {
			nodeValue = next.nodeValue;
			remaining = length - text.length;

			// If not the first node, start and end should be at their
			// max values as will be updated when getting the text
			if (node) {
				end = nodeValue.length;
				start = 0;
			}

			node = next;

			if (isLeft) {
				start = Math.max(end - remaining, 0);
				offset = start;

				text = nodeValue.substr(start, end - start) + text;
				next = node.previousSibling;
			} else {
				end = Math.min(remaining, nodeValue.length);
				offset = start + end;

				text += nodeValue.substr(start, end);
				next = node.nextSibling;
			}
		}

		return {
			node: node || next,
			offset: offset,
			text: text
		};
	};

	var RangeHelper = function (w, d) {
		var	_createMarker, _isOwner, _prepareInput,
			doc          = d || w.contentDocument || w.document,
			win          = w,
			isW3C        = !!w.getSelection,
			startMarker  = 'sceditor-start-marker',
			endMarker    = 'sceditor-end-marker',
			CHARACTER    = 'character', // Used to improve minification
			base         = this;

		/**
		 * <p>Inserts HTML into the current range replacing any selected
		 * text.</p>
		 *
		 * <p>If endHTML is specified the selected contents will be put between
		 * html and endHTML. If there is nothing selected html and endHTML are
		 * just concatenate together.</p>
		 *
		 * @param {string} html
		 * @param {string} endHTML
		 * @return False on fail
		 * @function
		 * @name insertHTML
		 * @memberOf RangeHelper.prototype
		 */
		base.insertHTML = function (html, endHTML) {
			var	node, div,
				range = base.selectedRange();

			if (!range) {
				return false;
			}

			if (isW3C) {
				if (endHTML) {
					html += base.selectedHtml() + endHTML;
				}

				div           = doc.createElement('p');
				node          = doc.createDocumentFragment();
				div.innerHTML = html;

				while (div.firstChild) {
					node.appendChild(div.firstChild);
				}

				base.insertNode(node);
			} else {
				range.pasteHTML(_prepareInput(html, endHTML, true));
				base.restoreRange();
			}
		};

		/**
		 * Prepares HTML to be inserted by adding a zero width space
		 * if the last child is empty and adding the range start/end
		 * markers to the last child.
		 *
		 * @param  {Node|string} node
		 * @param  {Node|string} endNode
		 * @param  {boolean} returnHtml
		 * @return {Node|string}
		 * @private
		 */
		_prepareInput = function (node, endNode, returnHtml) {
			var lastChild, $lastChild,
				div  = doc.createElement('div'),
				$div = $(div);

			if (typeof node === 'string') {
				if (endNode) {
					node += base.selectedHtml() + endNode;
				}

				$div.html(node);
			} else {
				$div.append(node);

				if (endNode) {
					$div
						.append(base.selectedRange().extractContents())
						.append(endNode);
				}
			}

			if (!(lastChild = div.lastChild)) {
				return;
			}

			while (!dom.isInline(lastChild.lastChild, true)) {
				lastChild = lastChild.lastChild;
			}

			if (dom.canHaveChildren(lastChild)) {
				$lastChild = $(lastChild);

				// IE <= 8 and Webkit won't allow the cursor to be placed
				// inside an empty tag, so add a zero width space to it.
				if (!lastChild.lastChild) {
					$lastChild.append('\u200B');
				}
			}

			// Needed so IE <= 8 can place the cursor after emoticons and images
			if (IE_VER && IE_VER < 9 && $(lastChild).is('img')) {
				$div.append('\u200B');
			}

			base.removeMarkers();

			// Append marks to last child so when restored cursor will be in
			// the right place
			($lastChild || $div)
				.append(_createMarker(startMarker))
				.append(_createMarker(endMarker));

			if (returnHtml) {
				return $div.html();
			}

			return $(doc.createDocumentFragment()).append($div.contents())[0];
		};

		/**
		 * <p>The same as insertHTML except with DOM nodes instead</p>
		 *
		 * <p><strong>Warning:</strong> the nodes must belong to the
		 * document they are being inserted into. Some browsers
		 * will throw exceptions if they don't.</p>
		 *
		 * @param {Node} node
		 * @param {Node} endNode
		 * @return False on fail
		 * @function
		 * @name insertNode
		 * @memberOf RangeHelper.prototype
		 */
		base.insertNode = function (node, endNode) {
			if (isW3C) {
				var	input  = _prepareInput(node, endNode),
					range  = base.selectedRange(),
					parent = range.commonAncestorContainer;

				if (!input) {
					return false;
				}

				range.deleteContents();

				// FF allows <br /> to be selected but inserting a node
				// into <br /> will cause it not to be displayed so must
				// insert before the <br /> in FF.
				// 3 = TextNode
				if (parent && parent.nodeType !== 3 &&
					!dom.canHaveChildren(parent)) {
					parent.parentNode.insertBefore(input, parent);
				} else {
					range.insertNode(input);
				}

				base.restoreRange();
			} else {
				base.insertHTML(
					_nodeToHtml(node),
					endNode ? _nodeToHtml(endNode) : null
				);
			}
		};

		/**
		 * <p>Clones the selected Range</p>
		 *
		 * <p>IE <= 8 will return a TextRange, all other browsers
		 * will return a Range object.</p>
		 *
		 * @return {Range|TextRange}
		 * @function
		 * @name cloneSelected
		 * @memberOf RangeHelper.prototype
		 */
		base.cloneSelected = function () {
			var range = base.selectedRange();

			if (range) {
				return isW3C ? range.cloneRange() : range.duplicate();
			}
		};

		/**
		 * <p>Gets the selected Range</p>
		 *
		 * <p>IE <= 8 will return a TextRange, all other browsers
		 * will return a Range object.</p>
		 *
		 * @return {Range|TextRange}
		 * @function
		 * @name selectedRange
		 * @memberOf RangeHelper.prototype
		 */
		base.selectedRange = function () {
			var	range, firstChild,
				sel = isW3C ? win.getSelection() : doc.selection;

			if (!sel) {
				return;
			}

			// When creating a new range, set the start to the first child
			// element of the body element to avoid errors in FF.
			if (sel.getRangeAt && sel.rangeCount <= 0) {
				firstChild = doc.body;
				while (firstChild.firstChild) {
					firstChild = firstChild.firstChild;
				}

				range = doc.createRange();
				// Must be setStartBefore otherwise it can cause infinite
				// loops with lists in WebKit. See issue 442
				range.setStartBefore(firstChild);

				sel.addRange(range);
			}

			if (isW3C && sel.rangeCount > 0) {
				range = sel.getRangeAt(0);
			}

			if (!isW3C && sel.type !== 'Control') {
				range = sel.createRange();
			}

			// IE fix to make sure only return selections that
			// are part of the WYSIWYG iframe
			return _isOwner(range) ? range : null;
		};

		/**
		 * Checks if an IE TextRange range belongs to
		 * this document or not.
		 *
		 * Returns true if the range isn't an IE range or
		 * if the range is null.
		 *
		 * @private
		 */
		_isOwner = function (range) {
			var parent;

			if (range && !isW3C) {
				parent = range.parentElement();
			}

			// IE fix to make sure only return selections
			// that are part of the WYSIWYG iframe
			return parent ?
				parent.ownerDocument === doc :
				true;
		};

		/**
		 * Gets if there is currently a selection
		 *
		 * @return {boolean}
		 * @function
		 * @name hasSelection
		 * @since 1.4.4
		 * @memberOf RangeHelper.prototype
		 */
		base.hasSelection = function () {
			var	sel = isW3C ? win.getSelection() : doc.selection;

			if (isW3C || !sel) {
				return sel && sel.rangeCount > 0;
			}

			return sel.type !== 'None' && _isOwner(sel.createRange());
		};

		/**
		 * Gets the currently selected HTML
		 *
		 * @return {string}
		 * @function
		 * @name selectedHtml
		 * @memberOf RangeHelper.prototype
		 */
		base.selectedHtml = function () {
			var	div,
				range = base.selectedRange();

			if (range) {

				// IE9+ and all other browsers
				if (isW3C) {
					div = doc.createElement('p');
					div.appendChild(range.cloneContents());

					return div.innerHTML;
				// IE < 9
				} else if (range.text !== '' && range.htmlText) {
					return range.htmlText;
				}
			}

			return '';
		};

		/**
		 * Gets the parent node of the selected contents in the range
		 *
		 * @return {HTMLElement}
		 * @function
		 * @name parentNode
		 * @memberOf RangeHelper.prototype
		 */
		base.parentNode = function () {
			var range = base.selectedRange();

			if (range) {
				return range.parentElement ?
					range.parentElement() :
					range.commonAncestorContainer;
			}
		};

		/**
		 * Gets the first block level parent of the selected
		 * contents of the range.
		 *
		 * @return {HTMLElement}
		 * @function
		 * @name getFirstBlockParent
		 * @memberOf RangeHelper.prototype
		 */
		/**
		 * Gets the first block level parent of the selected
		 * contents of the range.
		 *
		 * @param {Node} n The element to get the first block level parent from
		 * @return {HTMLElement}
		 * @function
		 * @name getFirstBlockParent^2
		 * @since 1.4.1
		 * @memberOf RangeHelper.prototype
		 */
		base.getFirstBlockParent = function (n) {
			var func = function (node) {
				if (!dom.isInline(node, true)) {
					return node;
				}

				node = node ? node.parentNode : null;

				return node ? func(node) : node;
			};

			return func(n || base.parentNode());
		};

		/**
		 * Inserts a node at either the start or end of the current selection
		 *
		 * @param {Bool} start
		 * @param {Node} node
		 * @function
		 * @name insertNodeAt
		 * @memberOf RangeHelper.prototype
		 */
		base.insertNodeAt = function (start, node) {
			var	currentRange = base.selectedRange(),
				range        = base.cloneSelected();

			if (!range) {
				return false;
			}

			range.collapse(start);

			if (isW3C) {
				range.insertNode(node);
			} else {
				range.pasteHTML(_nodeToHtml(node));
			}

			// Reselect the current range.
			// Fixes issue with Chrome losing the selection. Issue#82
			base.selectRange(currentRange);
		};

		/**
		 * Creates a marker node
		 *
		 * @param {string} id
		 * @return {Node}
		 * @private
		 */
		_createMarker = function (id) {
			base.removeMarker(id);

			var marker              = doc.createElement('span');
			marker.id               = id;
			marker.style.lineHeight = '0';
			marker.style.display    = 'none';
			marker.className        = 'sceditor-selection sceditor-ignore';
			marker.innerHTML        = ' ';

			return marker;
		};

		/**
		 * Inserts start/end markers for the current selection
		 * which can be used by restoreRange to re-select the
		 * range.
		 *
		 * @memberOf RangeHelper.prototype
		 * @function
		 * @name insertMarkers
		 */
		base.insertMarkers = function () {
			base.insertNodeAt(true, _createMarker(startMarker));
			base.insertNodeAt(false, _createMarker(endMarker));
		};

		/**
		 * Gets the marker with the specified ID
		 *
		 * @param {string} id
		 * @return {Node}
		 * @function
		 * @name getMarker
		 * @memberOf RangeHelper.prototype
		 */
		base.getMarker = function (id) {
			return doc.getElementById(id);
		};

		/**
		 * Removes the marker with the specified ID
		 *
		 * @param {string} id
		 * @function
		 * @name removeMarker
		 * @memberOf RangeHelper.prototype
		 */
		base.removeMarker = function (id) {
			var marker = base.getMarker(id);

			if (marker) {
				marker.parentNode.removeChild(marker);
			}
		};

		/**
		 * Removes the start/end markers
		 *
		 * @function
		 * @name removeMarkers
		 * @memberOf RangeHelper.prototype
		 */
		base.removeMarkers = function () {
			base.removeMarker(startMarker);
			base.removeMarker(endMarker);
		};

		/**
		 * Saves the current range location. Alias of insertMarkers()
		 *
		 * @function
		 * @name saveRage
		 * @memberOf RangeHelper.prototype
		 */
		base.saveRange = function () {
			base.insertMarkers();
		};

		/**
		 * Select the specified range
		 *
		 * @param {Range|TextRange} range
		 * @function
		 * @name selectRange
		 * @memberOf RangeHelper.prototype
		 */
		base.selectRange = function (range) {
			if (isW3C) {
				var lastChild;
				var sel = win.getSelection();
				var container = range.endContainer;

				// Check if cursor is set after a BR when the BR is the only
				// child of the parent. In Firefox this causes a line break
				// to occur when something is typed. See issue #321
				if (!IE_BR_FIX && range.collapsed && container &&
					!dom.isInline(container, true)) {

					lastChild = container.lastChild;
					while (lastChild && $(lastChild).is('.sceditor-ignore')) {
						lastChild = lastChild.previousSibling;
					}

					if ($(lastChild).is('br')) {
						var rng = doc.createRange();
						rng.setEndAfter(lastChild);
						rng.collapse(false);

						if (base.compare(range, rng)) {
							range.setStartBefore(lastChild);
							range.collapse(true);
						}
					}
				}

				if (sel) {
					base.clear();
					sel.addRange(range);
				}
			} else {
				range.select();
			}
		};

		/**
		 * Restores the last range saved by saveRange() or insertMarkers()
		 *
		 * @function
		 * @name restoreRange
		 * @memberOf RangeHelper.prototype
		 */
		base.restoreRange = function () {
			var	marker, isCollapsed, previousSibling,
				range = base.selectedRange(),
				start = base.getMarker(startMarker),
				end   = base.getMarker(endMarker);

			if (!start || !end || !range) {
				return false;
			}

			isCollapsed = start.nextSibling === end;

			if (!isW3C) {
				range  = doc.body.createTextRange();
				marker = doc.body.createTextRange();

				// IE < 9 cannot set focus after a BR so need to insert
				// a dummy char after it to allow the cursor to be placed
				previousSibling = start.previousSibling;
				if (start.nextSibling === end && (!previousSibling ||
					!dom.isInline(previousSibling, true) ||
					$(previousSibling).is('br'))) {
					$(start).before('\u200B');
				}

				marker.moveToElementText(start);
				range.setEndPoint('StartToStart', marker);
				range.moveStart(CHARACTER, 0);

				marker.moveToElementText(end);
				range.setEndPoint('EndToStart', marker);
				range.moveEnd(CHARACTER, 0);
			} else {
				range = doc.createRange();

				range.setStartBefore(start);
				range.setEndAfter(end);
			}

			if (isCollapsed) {
				range.collapse(true);
			}

			base.selectRange(range);
			base.removeMarkers();
		};

		/**
		 * Selects the text left and right of the current selection
		 *
		 * @param {int} left
		 * @param {int} right
		 * @since 1.4.3
		 * @function
		 * @name selectOuterText
		 * @memberOf RangeHelper.prototype
		 */
		base.selectOuterText = function (left, right) {
			var start, end,
				range = base.cloneSelected();

			if (!range) {
				return false;
			}

			range.collapse(false);

			if (!isW3C) {
				range.moveStart(CHARACTER, 0 - left);
				range.moveEnd(CHARACTER, right);
			} else {
				start = outerText(range, true, left);
				end = outerText(range, false, right);

				range.setStart(start.node, start.offset);
				range.setEnd(end.node, end.offset);
			}

			base.selectRange(range);
		};

		/**
		 * Gets the text left or right of the current selection
		 *
		 * @param {boolean} before
		 * @param {number} length
		 * @since 1.4.3
		 * @function
		 * @name selectOuterText
		 * @memberOf RangeHelper.prototype
		 */
		base.getOuterText = function (before, length) {
			var	range = base.cloneSelected();

			if (!range) {
				return '';
			}

			range.collapse(!before);

			if (!isW3C) {
				if (before) {
					range.moveStart(CHARACTER, 0 - length);
				} else {
					range.moveEnd(CHARACTER, length);
				}

				return range.text;
			}

			return outerText(range, before, length).text;
		};

		/**
		 * Replaces keywords with values based on the current caret position
		 *
		 * @param {Array}   keywords
		 * @param {boolean} includeAfter      If to include the text after the
		 *                                    current caret position or just
		 *                                    text before
		 * @param {boolean} keywordsSorted    If the keywords array is pre
		 *                                    sorted shortest to longest
		 * @param {number}  longestKeyword    Length of the longest keyword
		 * @param {boolean} requireWhitespace If the key must be surrounded
		 *                                    by whitespace
		 * @param {string}  keypressChar      If this is being called from
		 *                                    a keypress event, this should be
		 *                                    set to the pressed character
		 * @return {boolean}
		 * @function
		 * @name replaceKeyword
		 * @memberOf RangeHelper.prototype
		 */
		// eslint-disable-next-line max-params
		base.replaceKeyword = function (
			keywords,
			includeAfter,
			keywordsSorted,
			longestKeyword,
			requireWhitespace,
			keypressChar
		) {
			if (!keywordsSorted) {
				keywords.sort(function (a, b) {
					return a[0].length - b[0].length;
				});
			}

			var outerText, matchPos, startIndex, leftLen,
				charsLeft, keyword, keywordLen,
				whitespaceRegex = '[\\s\xA0\u2002\u2003\u2009]',
				keywordIdx      = keywords.length,
				whitespaceLen   = requireWhitespace ? 1 : 0,
				maxKeyLen       = longestKeyword ||
					keywords[keywordIdx - 1][0].length;

			if (requireWhitespace) {
				// requireWhitespace doesn't work with textRanges as they
				// select text on the other side of elements causing
				// space-img-key to match when it shouldn't.
				if (!isW3C) {
					return false;
				}

				maxKeyLen++;
			}

			keypressChar = keypressChar || '';
			outerText    = base.getOuterText(true, maxKeyLen);
			leftLen      = outerText.length;
			outerText   += keypressChar;

			if (includeAfter) {
				outerText += base.getOuterText(false, maxKeyLen);
			}

			while (keywordIdx--) {
				keyword    = keywords[keywordIdx][0];
				keywordLen = keyword.length;
				startIndex = Math.max(0, leftLen - keywordLen - whitespaceLen);

				if (requireWhitespace) {
					matchPos = outerText
						.substr(startIndex)
						.search(new RegExp(
							'(?:' + whitespaceRegex + ')' +
							escape.regex(keyword) +
							'(?=' + whitespaceRegex + ')'
						));
				} else {
					matchPos = outerText.indexOf(keyword, startIndex);
				}

				if (matchPos > -1) {
					// Add the length of the text that was removed by substr()
					// when matching and also add 1 for the whitespace
					if (requireWhitespace) {
						matchPos += startIndex + 1;
					}

					// Make sure the match is between before and
					// after, not just entirely in one side or the other
					if (matchPos <= leftLen &&
						matchPos + keywordLen + whitespaceLen >= leftLen) {
						charsLeft = leftLen - matchPos;

						// If the keypress char is white space then it should
						// not be replaced, only chars that are part of the
						// key should be replaced.
						base.selectOuterText(
							charsLeft,
							keywordLen - charsLeft -
								(/^\S/.test(keypressChar) ? 1 : 0)
						);

						base.insertHTML(keywords[keywordIdx][1]);
						return true;
					}
				}
			}

			return false;
		};

		/**
		 * Compares two ranges.
		 *
		 * If rangeB is undefined it will be set to
		 * the current selected range
		 *
		 * @param  {Range|TextRange} rangeA
		 * @param  {Range|TextRange} rangeB
		 * @return {boolean}
		 */
		base.compare = function (rangeA, rangeB) {
			var	END_TO_END     = isW3C ? Range.END_TO_END : 'EndToEnd',
				START_TO_START = isW3C ? Range.START_TO_START : 'StartToStart',
				comparePoints  = isW3C ?
					'compareBoundaryPoints' :
					'compareEndPoints';

			if (!rangeB) {
				rangeB = base.selectedRange();
			}

			if (!rangeA || !rangeB) {
				return !rangeA && !rangeB;
			}

			return _isOwner(rangeA) && _isOwner(rangeB) &&
				rangeA[comparePoints](END_TO_END, rangeB) === 0 &&
				rangeA[comparePoints](START_TO_START, rangeB) === 0;
		};

		/**
		 * Removes any current selection
		 *
		 * @since 1.4.6
		 */
		base.clear = function () {
			var sel = isW3C ? win.getSelection() : doc.selection;

			if (sel) {
				if (sel.removeAllRanges) {
					sel.removeAllRanges();
				} else if (sel.empty) {
					sel.empty();
				}
			}
		};
	};

	return RangeHelper;
});
