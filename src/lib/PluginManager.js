var plugins = {};

/**
 * Plugin Manager class
 * @class PluginManager
 * @name PluginManager
 */
export default function PluginManager(thisObj) {
	/**
	 * Alias of this
	 *
	 * @private
	 * @type {Object}
	 */
	var base = this;

	/**
	 * Array of all currently registered plugins
	 *
	 * @type {Array}
	 * @private
	 */
	var registeredPlugins = [];


	/**
	 * Changes a signals name from "name" into "signalName".
	 *
	 * @param  {String} signal
	 * @return {String}
	 * @private
	 */
	var formatSignalName = function (signal) {
		return 'signal' + signal.charAt(0).toUpperCase() + signal.slice(1);
	};

	/**
	 * Calls handlers for a signal
	 *
	 * @see call()
	 * @see callOnlyFirst()
	 * @param  {Array}   args
	 * @param  {Boolean} returnAtFirst
	 * @return {Mixed}
	 * @private
	 */
	var callHandlers = function (args, returnAtFirst) {
		args = [].slice.call(args);

		var	idx, ret,
			signal = formatSignalName(args.shift());

		for (idx = 0; idx < registeredPlugins.length; idx++) {
			if (signal in registeredPlugins[idx]) {
				ret = registeredPlugins[idx][signal].apply(thisObj, args);

				if (returnAtFirst) {
					return ret;
				}
			}
		}
	};

	/**
	 * Calls all handlers for the passed signal
	 *
	 * @param  {String}    signal
	 * @param  {...String} args
	 * @return {Void}
	 * @function
	 * @name call
	 * @memberOf PluginManager.prototype
	 */
	base.call = function () {
		callHandlers(arguments, false);
	};

	/**
	 * Calls the first handler for a signal, and returns the
	 *
	 * @param  {String}    signal
	 * @param  {...String} args
	 * @return {Mixed} The result of calling the handler
	 * @function
	 * @name callOnlyFirst
	 * @memberOf PluginManager.prototype
	 */
	base.callOnlyFirst = function () {
		return callHandlers(arguments, true);
	};

	/**
	 * Checks if a signal has a handler
	 *
	 * @param  {String} signal
	 * @return {Boolean}
	 * @function
	 * @name hasHandler
	 * @memberOf PluginManager.prototype
	 */
	base.hasHandler = function (signal) {
		var i  = registeredPlugins.length;
		signal = formatSignalName(signal);

		while (i--) {
			if (signal in registeredPlugins[i]) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Checks if the plugin exists in plugins
	 *
	 * @param  {String} plugin
	 * @return {Boolean}
	 * @function
	 * @name exists
	 * @memberOf PluginManager.prototype
	 */
	base.exists = function (plugin) {
		if (plugin in plugins) {
			plugin = plugins[plugin];

			return typeof plugin === 'function' &&
				typeof plugin.prototype === 'object';
		}

		return false;
	};

	/**
	 * Checks if the passed plugin is currently registered.
	 *
	 * @param  {String} plugin
	 * @return {Boolean}
	 * @function
	 * @name isRegistered
	 * @memberOf PluginManager.prototype
	 */
	base.isRegistered = function (plugin) {
		if (base.exists(plugin)) {
			var idx = registeredPlugins.length;

			while (idx--) {
				if (registeredPlugins[idx] instanceof plugins[plugin]) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Registers a plugin to receive signals
	 *
	 * @param  {String} plugin
	 * @return {Boolean}
	 * @function
	 * @name register
	 * @memberOf PluginManager.prototype
	 */
	base.register = function (plugin) {
		if (!base.exists(plugin) || base.isRegistered(plugin)) {
			return false;
		}

		plugin = new plugins[plugin]();
		registeredPlugins.push(plugin);

		if ('init' in plugin) {
			plugin.init.call(thisObj);
		}

		return true;
	};

	/**
	 * Deregisters a plugin.
	 *
	 * @param  {String} plugin
	 * @return {Boolean}
	 * @function
	 * @name deregister
	 * @memberOf PluginManager.prototype
	 */
	base.deregister = function (plugin) {
		var	removedPlugin,
			pluginIdx = registeredPlugins.length,
			removed   = false;

		if (!base.isRegistered(plugin)) {
			return removed;
		}

		while (pluginIdx--) {
			if (registeredPlugins[pluginIdx] instanceof plugins[plugin]) {
				removedPlugin = registeredPlugins.splice(pluginIdx, 1)[0];
				removed       = true;

				if ('destroy' in removedPlugin) {
					removedPlugin.destroy.call(thisObj);
				}
			}
		}

		return removed;
	};

	/**
	 * Clears all plugins and removes the owner reference.
	 *
	 * Calling any functions on this object after calling
	 * destroy will cause a JS error.
	 *
	 * @name destroy
	 * @memberOf PluginManager.prototype
	 */
	base.destroy = function () {
		var i = registeredPlugins.length;

		while (i--) {
			if ('destroy' in registeredPlugins[i]) {
				registeredPlugins[i].destroy.call(thisObj);
			}
		}

		registeredPlugins = [];
		thisObj    = null;
	};
};

PluginManager.plugins = plugins;
