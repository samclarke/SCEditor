/**
 * Check if the passed argument is the
 * the passed type.
 *
 * @param {string} type
 * @param {*} arg
 * @returns {boolean}
 */
function isTypeof(type, arg) {
	return typeof arg === type;
}

/**
 * @type {function(*): boolean}
 */
export var isString = isTypeof.bind(null, 'string');

/**
 * @type {function(*): boolean}
 */
export var isUndefined = isTypeof.bind(null, 'undefined');

/**
 * @type {function(*): boolean}
 */
export var isFunction = isTypeof.bind(null, 'function');

/**
 * @type {function(*): boolean}
 */
export var isNumber = isTypeof.bind(null, 'number');

/**
 * @type {function(*): boolean}
 */
export var isDigit = x => /^\d+$/.test(x);

/**
 * Returns true if an object has no keys
 *
 * @param {!object} obj
 * @returns {boolean}
 */
export function isEmptyObject(obj) {
	return !Object.keys(obj).length;
}

/**
 * Extends the first object with any extra objects passed
 *
 * If the first argument is boolean and set to true
 * it will extend child arrays and objects recursively.
 *
 * @param {!object | boolean} targetArg
 * @param {...object} source
 * @param sourceArg
 * @returns {object}
 */
export function extend(targetArg, sourceArg) {
	var isTargetBoolean = targetArg === !!targetArg;
	var i      = isTargetBoolean ? 2 : 1;
	var target = isTargetBoolean ? sourceArg : targetArg;
	var isDeep = isTargetBoolean ? targetArg : false;

	for (; i < arguments.length; i++) {
		var source = arguments[i];

		// Copy all properties for jQuery compatibility
		/* eslint guard-for-in: off */
		for (var key in source) {
			var value = source[key];
			// Protect against prototype pollution
			var isSpecialKey = key === '__proto__' || key === 'constructor';

			// Skip undefined values to match jQuery and
			// skip if target to prevent infinite loop
			if (!isUndefined(value)) {
				var isObject = value !== null && typeof value === 'object' &&
					Object.getPrototypeOf(value) === Object.prototype;
				var isArray = Array.isArray(value);

				if (!isSpecialKey && isDeep && (isObject || isArray)) {
					target[key] = extend(
						true,
						target[key] || (isArray ? [] : {}),
						value
					);
				} else {
					target[key] = value;
				}
			}
		}
	}

	return target;
}

/**
 * Removes an item from the passed array
 *
 * @param {!Array} arr
 * @param {*} item
 */
export function arrayRemove(arr, item) {
	var i = arr.indexOf(item);

	if (i > -1) {
		arr.splice(i, 1);
	}
}

/**
 * Iterates over an array or object
 *
 * @param {!object | Array} obj
 * @param {function(*, *)} fn
 */
export function each(obj, fn) {
	if (Array.isArray(obj) || 'length' in obj && isNumber(obj.length)) {
		for (var i = 0; i < obj.length; i++) {
			fn(i, obj[i]);
		}
	} else {
		Object.keys(obj).forEach(function (key) {
			fn(key, obj[key]);
		});
	}
}
/**
 * Replaces any {0}, {1}, {2}, ect. with the params provided.
 *
 * @param {string} format
 * @param {...string} args
 * @returns {string}
 * @function
 */
export var format = (format, ...args) => format.replace(
	/\{(\d+)\}/g,
	(match, number) => args[number] || match
);

/**
 * Formats a string replacing {name} with the values of
 * vars.name properties.
 *
 * If there is no property for the specified {name} then
 * it will be left intact.
 *
 * @param  {string} format
 * @param  {object} vars
 * @returns {string}
 * @function
 */
export var replaceVars = (format, vars) => format.replace(
	/{\s*?([a-zA-Z0-9\-_\.]+)\s*?}/g,
	(match, name) => vars[name] || match
);

/**
 * Converts a number 0-255 to hex.
 *
 * Will return 0 if number is not a valid number.
 *
 * @param  {any} d
 * @returns {string}
 * @function
 */
//eslint-disable-next-line no-bitwise
export var toHex = d => (d >>> 0).toString(16);

/**
 * Normalises a CSS colour to hex #xxxxxx format
 *
 * @param  {string} x
 * @returns {string}
 * @private
 */
export var normaliseColour = x => x.replace(
	/^#[0-f]{3}$/i,
	(match) =>  '#' +
			match.charAt(1).repeat(2) +
			match.charAt(2).repeat(2) +
			match.charAt(3).repeat(2)
).replace(
	/rgb\((\d{1,3}),\s*?(\d{1,3}),\s*?(\d{1,3})\)/i,
	//eslint-disable-next-line no-bitwise
	(match, r, g, b) => '#' + (r << 16 | g << 8 | b)
		.toString(16)
		.padStart(6, '0')
);

/**
 * Removes any leading or trailing quotes ('")
 *
 * @param str
 * @returns string
 */
export var stripQuotes = str => str
	.replace(/\\(.)/g, '$1')
	.replace(/^(["'])(.*?)\1$/, '$2');

