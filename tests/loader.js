/* eslint-env node */
const libInstrument = require('istanbul-lib-instrument');

module.exports = function (source, sourceMap) {
	const instrumenter = libInstrument.createInstrumenter({
		esModules: true
	});

	instrumenter.instrument(source, this.resourcePath, (err, instrumentedSource) => {
		this.callback(err, instrumentedSource, instrumenter.lastSourceMap());
	}, sourceMap);
};
