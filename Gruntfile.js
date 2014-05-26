/*global module:false*/
module.exports = function (grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

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
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-jscs-checker');
	grunt.loadNpmTasks('grunt-webpack');


	grunt.registerTask('default', ['test']);

	// Lints the JS and runs the unit tests
	grunt.registerTask('test', ['jshint', 'jscs', 'qunit']);

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
