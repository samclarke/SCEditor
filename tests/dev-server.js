/* eslint-env node */
/* global Promise */
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const path = require('path');

// TODO: make coverage optional and accept port
exports.create = function (port, coverage) {
	return new Promise(function (resolve, reject) {
		const webpackOptions = {
			entry: {
				main: [
					'./src/jquery.sceditor.js',
					'webpack-dev-server/client?http://localhost:9000'
				],
				unit: [
					'./tests/unit/index.js'
				]
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						include: path.resolve('src/'),
						loader: 'istanbul-instrumenter-loader',
						options: {
							esModules: true
						}
					}
				]
			},
			output: {
				path: path.join(__dirname, 'dist'),
				filename: '[name].js'
			},
			resolve: {
				modules: [
					path.join(__dirname, '..'),
					path.join(__dirname, '../node_modules')
				],
				alias: {
					src: path.join(__dirname, '../src'),
					tests: path.join(__dirname, '../tests')
				}
			},
			externals: {
				jquery: 'jQuery',
				rangy: 'rangy'
			},
			devtool: 'cheap-module-inline-source-map'
		};

		if (!coverage) {
			webpackOptions.module = {};
		}

		const compiler = webpack(webpackOptions);

		// Resolve promise when bundle generated
		compiler.plugin('done', resolve);

		/* eslint no-new: off */
		new WebpackDevServer(compiler, {
			contentBase: path.join(__dirname, '..'),
			compress: true,
			publicPath: '/webpack-server/'
		}).listen(port, 'localhost', function (err) {
			if (err) {
				reject(err);
			}
		});
	});
};

if (require.main === module) {
	exports.create(9000, false);
}
