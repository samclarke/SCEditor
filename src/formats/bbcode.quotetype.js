var quoteType = {
	/**
	 * Always quote the attribute value
	 * @type {Number}
	 */
	always: 1,

	/**
	 * Never quote the attributes value
	 * @type {Number}
	 */
	never: 2,

	/**
	 * Only quote the attributes value when it contains spaces to equals
	 * @type {Number}
	 */
	auto: 3
};

export default quoteType;
