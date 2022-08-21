/* eslint-env node */
/*global module:false, require:false*/
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const rimraf = require('rimraf');
const path = require('path');

module.exports = (grunt) => {
	require('time-grunt')(grunt);

	grunt.event.on('qunit.coverage', function (data) {
		const outputDir = __dirname + '/coverage';

		rimraf.sync(outputDir);

		const coverageMap = libCoverage.createCoverageMap(data);
		const context = libReport.createContext({
			dir: outputDir,
			defaultSummarizer: 'nested',
			coverageMap: coverageMap
		});

		console.log('\n\n\nCoverage:');
		reports.create('text').execute(context);
		reports.create('html').execute(context);
		console.log('\n');
	});

	grunt.registerTask('dev-server', 'Dev server', function () {
		const done = this.async();

		require('./tests/dev-server').create(9001, true).then(done, done);
	});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// Runs the unit tests
		qunit: {
			all: {
				options: {
					urls: ['http://localhost:9001/tests/unit/index.html'],
					// Some tests rely on failing URLs so want to ignore them
					console: false,
					inject: path.join(__dirname, './tests/test-bridge.js'),
					// Sandbox doesn't always work well on Linux so just disable
					puppeteer: { args: ['--no-sandbox'] }
				}
			}
		},

		// Style checking of JS code using ESLint
		eslint: {
			source: {
				src: ['src/**/*.js']
			},
			tests: {
				src: ['tests/**/*.js']
			},
			translations: {
				src: 'languages/**/*.js'
			}
		},

		// Removes all the old files from the distributable directory
		clean: {
			build: ['minified/', 'coverage/'],
			dist: ['dist/']
		},

		// Copy files into the distributable directory ready to be compressed
		// into the ZIP archive
		copy: {
			dist: {
				files: [
					{
						expand: true,
						src: ['minified/**', 'languages/**'],
						dest: 'dist/'
					},
					{
						expand: true,
						cwd: 'src/',
						src: ['plugins/**.js', 'formats/**.js', 'icons/**.js'],
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
						cwd: 'src/themes/',
						src: 'content/**',
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
				options: {
				},
				files: [
					{
						expand: true,
						cwd: 'src/themes/icons/',
						src: '*.png',
						dest: 'minified/themes/'
					},
					{
						expand: true,
						cwd: 'src/themes/',
						src: 'content/**',
						dest: 'minified/themes/',
						rename: function (dest, src) {
							return dest + src.replace('.css','.min.css');
						}
					}
				]
			}
		},
		rollup: {
			options: {
				format: 'iife',
				external: ['jquery'],
				globals: {
					jquery: 'jQuery'
				},
				plugins: function () {
					return [
						nodeResolve({
							module: true
						})
					];
				}
			},
			build: {
				files: {
					'./minified/jquery.sceditor.min.js': [
						'./src/jquery.sceditor.js'
					],
					'./minified/sceditor.min.js': [
						'./src/sceditor.js'
					]
				}
			},
			dist: {
				files: {
					'./dist/development/jquery.sceditor.js': [
						'./src/jquery.sceditor.js'
					],
					'./dist/development/sceditor.js': [
						'./src/sceditor.js'
					]
				}
			}
		},

		// Create the XHTML and BBCode bundled JS files
		concat: {
			dist: {
				options: {
					separator: ';'
				},
				files: {
					'dist/development/jquery.sceditor.bbcode.js': [
						'dist/development/jquery.sceditor.js',
						'src/formats/bbcode.js'
					],
					'dist/development/jquery.sceditor.xhtml.js': [
						'dist/development/jquery.sceditor.js',
						'src/formats/xhtml.js'
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
					'(C) 2017, Sam Clarke | sceditor.com/license */\n'
				},
				files: [
					{
						src: 'minified/sceditor.min.js',
						dest: 'minified/sceditor.min.js'
					},
					{
						src: 'minified/jquery.sceditor.min.js',
						dest: 'minified/jquery.sceditor.min.js'
					},
					{
						src: [
							'minified/jquery.sceditor.min.js',
							'src/formats/bbcode.js'
						],
						dest: 'minified/jquery.sceditor.bbcode.min.js'
					},
					{
						src: [
							'minified/jquery.sceditor.min.js',
							'src/formats/xhtml.js'
						],
						dest: 'minified/jquery.sceditor.xhtml.min.js'
					},
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/',
						src: ['plugins/**.js', 'formats/**.js', 'icons/**.js'],
						dest: 'minified/'
					}
				]
			}
		},

		// Convert the less CSS theme files into CSS
		less: {
			build: {
				options: {
					paths: ['src/themes/', 'src/themes/icons'],
					cleancss: true
				},
				files: [
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/themes/',
						src: ['*.less'],
						dest: 'minified/themes/',
						ext: '.min.css'
					}
				]
			},
			dist: {
				options: {
					paths: ['src/themes/', 'src/themes/icons'],
					cleancss: true
				},
				files: [
					{
						expand: true,
						filter: 'isFile',
						cwd: 'src/themes/',
						src: ['*.less'],
						dest: 'dist/development/themes/',
						ext: '.css'
					}
				]
			}
		},

		// Manage CSS vendor prefixes
		postcss: {
			build: {
				options: {
					processors: [
						require('autoprefixer')(),
						require('cssnano')()
					]
				},
				files: [
					{
						expand: true,
						filter: 'isFile',
						cwd: 'minified/',
						src: ['themes/**/*.css'],
						dest: 'minified/'
					}
				]
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
						src: ['**']
					}
				]
			}
		},

		devUpdate: {
			main: {
				options: {
					updateType: 'force',
					semver: false
				}
			}
		}
	});


	grunt.loadNpmTasks('@lodder/grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-rollup');
	grunt.loadNpmTasks('grunt-eslint');

	grunt.registerTask('default', ['test']);

	// Lints the JS and runs the unit tests
	grunt.registerTask('test', ['eslint', 'dev-server', 'qunit']);

	// Minifies the source
	grunt.registerTask('build', [
		'clean:build',
		'copy:build',
		'rollup:build',
		'uglify:build',
		'less:build',
		'postcss:build'
	]);

	// Creates a directory containing the contents of
	// the release ZIP but without compressing it
	grunt.registerTask('dist', [
		'test',
		'build',
		'clean:dist',
		'rollup:dist',
		'concat:dist',
		'copy:dist',
		'less:dist'
	]);

	// Creates the simplified distributable ZIP
	grunt.registerTask('release', [
		'dist',
		'compress:dist',
		'clean:dist'
	]);
};
