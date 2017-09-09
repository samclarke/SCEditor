/*global module:false, require:false, process:false*/
module.exports = (grunt) => {
	require('time-grunt')(grunt);
	const istanbul = require('istanbul');

	grunt.event.on('qunit.coverage', function (data) {
		const Report = istanbul.Report;
		const Collector = istanbul.Collector;
		const collector = new Collector();

		collector.add(data);

		console.log('\n\n\nCoverage:');
		Report.create('text').writeReport(collector, true);
		Report.create('html', {
			dir: './coverage/html'
		}).writeReport(collector, true);
	});

	grunt.registerTask('dev-server', 'Dev server', function () {
		const done = this.async();

		require('./tests/dev-server').create(9001, true).then(done, done);
	});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// Runs the QUnit unit tests in multiple browsers automatically.
		'saucelabs-qunit': {
			all: {
				options: {
					username: 'sceditor',
					key: () => process.env.SCEDITOR_SAUCE_KEY,
					urls: [
						'http://localhost:9001/tests/unit/index.html?hidepassed'
					],
					tunnelTimeout: 10,
					tunnelArgs: ['--direct-domains', 'www.sceditor.com'],
					build: process.env.TRAVIS_JOB_ID ||
						('Local ' + (new Date()).toISOString()),
					concurrency: 5,
					browsers: grunt.file.readJSON('browsers.json'),
					'max-duration': 60,
					sauceConfig: {
						'video-upload-on-pass': false
					},
					testname: 'SCEditor QUnit tests'
				}
			}
		},

		// Runs the unit tests
		qunit: {
			all: {
				options: {
					urls: ['http://localhost:9001/tests/unit/index.html']
				}
			}
		},

		// Style checking of JS code using ESLint
		eslint: {
			source: {
				src: ['src/**/*.js']
			},
			tests: {
				src: ['tests/**/*.js', '!tests/libs/**/*.js']
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
					},
					{
						expand: true,
						cwd: 'src/themes/inc/',
						src: 'iesize.htc',
						dest: 'dist/development/themes/'
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
					},
					{
						expand: true,
						cwd: 'src/themes/inc',
						src: 'iesize.htc',
						dest: 'minified/themes/'
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
						'src/plugins/bbcode.js'
					],
					'dist/development/jquery.sceditor.xhtml.js': [
						'dist/development/jquery.sceditor.js',
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
						require('autoprefixer')({
							browsers: [
								'last 4 versions',
								'ie 9'
							]
						}),
						require('postcss-clean')({
							compatibility: 'ie9'
						})
					]
				},
				files: [
					{
						'minified/jquery.sceditor.default.min.css': [
							'src/jquery.sceditor.default.css'
						]
					},
					{
						expand: true,
						cwd: 'minified/themes',
						src: ['*.min.css'],
						dest: 'minified/themes',
						ext: '.min.css'
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

		githooks: {
			all: {
				'pre-commit': 'test'
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


	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadNpmTasks('grunt-rollup');
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-githooks');
	grunt.loadNpmTasks('grunt-dev-update');


	grunt.registerTask('default', ['test']);

	// Sauce Labs. Runs the QUnit tests in multiple browsers automatically.
	grunt.registerTask('sauce', ['dev-server', 'saucelabs-qunit']);

	// Lints the JS and runs the unit tests
	grunt.registerTask('test', ['eslint', 'dev-server', 'qunit']);

	// Lints JS, runs unit tests and then runs unit tests via Sauce Labs.
	grunt.registerTask('full-test', ['test', 'sauce']);

	// Minifies the source
	grunt.registerTask('build', [
		'clean:build',
		'copy:build',
		'rollup:build',
		'uglify:build',
		'less:build',
		'postcss:build'
	]);

	// Creates the simplified distributable ZIP
	grunt.registerTask('release', [
		'test',
		'build',
		'clean:dist',
		'rollup:dist',
		'concat:dist',
		'copy:dist',
		'less:dist',
		'compress:dist',
		'clean:dist'
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

	// Update dev dependencies
	grunt.registerTask('dev-upd', ['devUpdate:main']);
};
