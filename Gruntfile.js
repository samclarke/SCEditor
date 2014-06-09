/*global module:false, process:false*/
module.exports = function (grunt) {
	'use strict';

	var sauceBrowsers = [
		// Chrome
		{
			platform: 'Linux',
			browserName: 'chrome',
			version: '35'
		},
		{
			platform: 'Linux',
			browserName: 'chrome',
			version: '30'
		},

		// FF
		{
			platform: 'Linux',
			browserName: 'firefox',
			version: '29'
		},
		{
			platform: 'Linux',
			browserName: 'firefox',
			version: '25'
		},
		{
			platform: 'Linux',
			browserName: 'firefox',
			version: '19'
		},

		// IE
		{
			platform: 'Windows 8.1',
			browserName: 'internet explorer',
			version: '11'
		},
		{
			platform: 'Windows 8',
			browserName: 'internet explorer',
			version: '10'
		},
		{
			platform: 'Windows 7',
			browserName: 'internet explorer',
			version: '9'
		},
		{
			platform: 'Windows 7',
			browserName: 'internet explorer',
			version: '8'
		},
		{
			platform: 'Windows XP',
			browserName: 'internet explorer',
			version: '7'
		},
		{
			platform: 'Windows XP',
			browserName: 'internet explorer',
			version: '6'
		},

		// Safari
		{
			platform: 'OS X 10.9',
			browserName: 'safari',
			version: '7'
		},
		{
			platform: 'OS X 10.8',
			browserName: 'safari',
			version: '6'
		},
		{
			platform: 'OS X 10.6',
			browserName: 'safari',
			version: '5'
		},

		// Android browser
		{
			platform: 'Linux',
			browserName: 'android',
			deviceName: 'Android',
			version: '4.3'
		},
		{
			platform: 'Linux',
			browserName: 'android',
			deviceName: 'Android',
			version: '4.2'
		},
		{
			platform: 'Linux',
			browserName: 'android',
			deviceName: 'Android',
			version: '4.1'
		},
		{
			platform: 'Linux',
			browserName: 'android',
			deviceName: 'Android',
			version: '4.0'
		},

		// iOS
		{
			platform: 'OS X 10.9',
			browserName: 'ipad',
			deviceName: 'iPad',
			version: '7.1'
		},
		{
			platform: 'OS X 10.8',
			browserName: 'ipad',
			deviceName: 'iPad',
			version: '6.1'
		},
		{
			platform: 'OS X 10.6',
			browserName: 'ipad',
			deviceName: 'iPad',
			version: '5.1'
		},
		{
			platform: 'OS X 10.9',
			browserName: 'iphone',
			deviceName: 'iPhone',
			version: '7.0'
		},
		{
			platform: 'OS X 10.8',
			browserName: 'iphone',
			deviceName: 'iPhone',
			version: '6.0'
		},
		{
			platform: 'OS X 10.6',
			browserName: 'iphone',
			deviceName: 'iPhone',
			version: '5.0'
		}
	];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// Used for Sauce Labs. Creates a server for the
		// unit tests to be served from.
		connect: {
			server: {
				options: {
					port: 9999,
					hostname: '*'
				}
			}
		},

		// Runs the QUnit unit tests in multiple browsers automatically.
		'saucelabs-qunit': {
			all: {
				options: {
					username: 'sceditor',
					key: process.env.SAUCE_ACCESS_KEY ||
						grunt.file.readJSON(process.env.HOME +
							'/.sauce.json').key,
					urls: ['http://127.0.0.1:9999/tests/unit/index.html'],
					tunnelTimeout: 5,
					build: process.env.TRAVIS_JOB_ID ||
						('Local ' + (new Date()).toISOString()),
					concurrency: 3,
					browsers: sauceBrowsers,
					'max-duration': 120,
					sauceConfig: {
						'video-upload-on-pass': false
					},
					testname: 'SCEditor QUnit unit tests'
				}
			}
		},

		// Runs the unit tests
		qunit: {
			all: ['tests/unit/index.html']
		},

		// Linting for JS files with JSHint
		jshint: {
			source: {
				src: ['src/**/*.js'],
				options: {
					jshintrc: '.jshintrc'
				}
			},
			tests: {
				src: ['tests/**/*.js'],
				options: {
					ignores: ['tests/libs/**/*.js'],
					jshintrc: 'tests/.jshintrc'
				}
			},
			translations: {
				src: 'languages/**/*.js',
				options: {
					jshintrc: 'languages/.jshintrc'
				}
			}
		},

		// Style checking of JS code using JSCS
		jscs: {
			source: {
				src: ['src/**/*.js'],
				options: {
					config: '.jscsrc'
				}
			},
			tests: {
				src: ['tests/**/*.js', '!tests/libs/**/*.js'],
				options: {
					config: '.jscsrc'
				}
			},
			translations: {
				src: 'languages/**/*.js',
				options: {
					config: '.jscsrc',
					maximumLineLength: 400,
				}
			}
		},

		// Removes all the old files from the distributable directory
		clean: {
			build: ['minified/'],
			dist: ['dist/']
		},

		// Copy files into the distributable directory ready to be compressed
		// into the ZIP archive
		copy: {
			dist: {
				files: [
					{
						expand: true,
						src: ['minified/**'],
						dest: 'dist/'
					},
					{
						expand: true,
						src: ['languages/**'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'src/',
						src: ['plugins/**.js'],
						dest: 'dist/development/'
					},
					{
						expand: true,
						cwd: 'src/',
						src: 'jquery.sceditor.js',
						dest: 'dist/development/'
					},
					{
						expand: true,
						cwd: 'src/',
						src: 'jquery.sceditor.default.css',
						dest: 'dist/development/'
					},
					{
						expand: true,
						cwd: 'src/themes/icons/',
						src: '*.png',
						dest: 'dist/development/themes/'
					},
					{
						expand: true,
						cwd: 'src/themes/icons/',
						src: 'monocons/**',
						dest: 'dist/development/themes/'
					},
					{
						expand: true,
						src: 'README.md',
						dest: 'dist/'
					},
					{
						expand: true,
						src: 'MIT.txt',
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'distributable/data/',
						src: 'example.html',
						dest: 'dist/'
					},
					{
						expand: true,
						src: 'emoticons/**',
						dest: 'dist/'
					}
				]
			},
			build: {
				//TODO: icons
				files: [
					{
						expand: true,
						cwd: 'src/themes/icons/',
						src: '*.png',
						dest: 'minified/themes/'
					},
					{
						expand: true,
						cwd: 'src/themes/icons/',
						src: 'monocons/**',
						dest: 'minified/themes/'
					}
				]
			}
		},
//TODO: Improve webpack compression
		// Convert modules into a single JS file
		webpack: {
			build: {
				entry: './src/jquery.sceditor.js',
				output: {
					path: './minified/',
					filename: 'jquery.sceditor.min.js'
				},
				externals: {
					jquery: 'jQuery'
				}
			}
		},

//TODO: dist should create webpack version and concat that instead
		// Create the XHTML and BBCode bundled JS files
		concat: {
			dist: {
				files: {
					'dist/development/jquery.sceditor.bbcode.js': [
						'src/jquery.sceditor.js',
						'src/plugins/bbcode.js'
					],
					'dist/development/jquery.sceditor.xhtml.js': [
						'src/jquery.sceditor.js',
						'src/plugins/xhtml.js'
					]
				}
			}
		},

		// Minify the JavaScript
		uglify: {
			build: {
				options: {
					warnings: true,
					compress: true,
					mangle: true,
					banner: '/* SCEditor v<%= pkg.version %> | ' +
						'(C) 2014, Sam Clarke | sceditor.com/license */\n'
				},
				files: [
					{
						src: 'minified/jquery.sceditor.min.js',
						dest: 'minified/jquery.sceditor.min.js'
					},
					{
						src: [
							'minified/jquery.sceditor.min.js',
							'src/plugins/bbcode.js'
						],
						dest: 'minified/jquery.sceditor.bbcode.min.js'
					},
					{
						src: [
							'minified/jquery.sceditor.min.js',
							'src/plugins/xhtml.js'
						],
						dest: 'minified/jquery.sceditor.xhtml.min.js'
					},
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/',
						src: ['plugins/**.js'],
						dest: 'minified/'
					}
				]
			}
		},

		// Convert the less CSS theme files into CSS
		less: {
			build: {
				options: {
					paths: ['src/themes/'],
					cleancss: true
				},
				files: [
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/themes/',
						src: ['*'],
						dest: 'minified/themes/',
						ext: '.min.css'
					}
				]
			},
			dist: {
				options: {
					paths: ['src/themes/'],
					cleancss: true
				},
				files: [
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/themes/',
						src: ['*'],
						dest: 'dist/development/themes/',
						ext: '.css'
					}
				]
			}
		},

		// Compress the WYSIWYG CSS
		cssmin: {
			build: {
				files: {
					'minified/jquery.sceditor.default.min.css': [
						'src/jquery.sceditor.default.css'
					]
				}
			}
		},

		// Creates the distributable ZIP file
		compress: {
			dist: {
				options: {
					archive: 'distributable/sceditor-<%= pkg.version %>.zip'
				},
				files: [
					{
						expand: true,
						cwd: 'dist/',
						src: ['**'],
						dest: '/'
					}
				]
			}
		}
	});


	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-jscs-checker');
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadNpmTasks('grunt-webpack');


	grunt.registerTask('default', ['test']);

	// Sauce Labs. Runs the QUnit tests in multiple browsers automatically.
	grunt.registerTask('sauce', ['connect', 'saucelabs-qunit']);

	// Lints the JS and runs the unit tests
	grunt.registerTask('test', ['jshint', 'jscs', 'qunit']);

	// Lints JS, runs unit tests and then runs unit tests via Sauce Labs.
	grunt.registerTask('full-test', ['test', 'sauce']);

	// Minifies the source
	grunt.registerTask('build', [
		'clean:build',
		'copy:build',
		'webpack:build',
		'uglify:build',
		'less:build',
		'cssmin:build'
	]);

// TODO: Rename to release and update docs
	// Creates the simplified distributable ZIP
	grunt.registerTask('dist', [
		'test',
		'build',
		'clean:dist',
		'concat:dist',
		'copy:dist',
		'less:dist',
		'compress:dist',
		'clean:dist'
	]);
};
