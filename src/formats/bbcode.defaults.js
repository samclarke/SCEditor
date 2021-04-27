import QuoteType from './bbcode.quotetype.js';

var defaults = {
	/**
	 * If to add a new line before block level elements
	 *
	 * @type {Boolean}
	 */
	breakBeforeBlock: false,

	/**
	 * If to add a new line after the start of block level elements
	 *
	 * @type {Boolean}
	 */
	breakStartBlock: false,

	/**
	 * If to add a new line before the end of block level elements
	 *
	 * @type {Boolean}
	 */
	breakEndBlock: false,

	/**
	 * If to add a new line after block level elements
	 *
	 * @type {Boolean}
	 */
	breakAfterBlock: true,

	/**
	 * If to remove empty tags
	 *
	 * @type {Boolean}
	 */
	removeEmptyTags: true,

	/**
	 * If to fix invalid nesting,
	 * i.e. block level elements inside inline elements.
	 *
	 * @type {Boolean}
	 */
	fixInvalidNesting: true,

	/**
	 * If to fix invalid children.
	 * i.e. A tag which is inside a parent that doesn't
	 * allow that type of tag.
	 *
	 * @type {Boolean}
	 */
	fixInvalidChildren: true,

	/**
	 * Attribute quote type
	 *
	 * @type {QuoteType}
	 * @since 1.4.1
	 */
	quoteType: QuoteType.auto
};

export default defaults;
