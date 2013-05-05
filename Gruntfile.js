/*global module:false*/
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		qunit: {
			all: ['tests/index.html']
		},
		jshint: {
			options: {
				browser: true
			},
			all: ['src/**/*.js', 'tests/**/*.js']
		},
		clean: {
			build: ['minified/'],
			dist: ['dist/']
		},
		copy: {
			dist: {
				files: [
					{expand: true, cwd: 'src/', src: ['plugins/**.js'], dest: 'dist/development/'},
					{expand: true, src: ['minified/**'], dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'jquery.sceditor.js', dest: 'dist/development/'},
					{expand: true, cwd: 'src/', src: 'jquery.sceditor.default.css', dest: 'dist/development/'},
					{expand: true, cwd: 'src/themes/icons/', src: '*.png', dest: 'dist/development/themes/'},
					{expand: true, cwd: 'src/themes/icons/', src: 'monocons/**', dest: 'dist/development/themes/'}
				]
			},
			build: {
				//TODP: icons
				files: [
					{expand: true, cwd: 'src/themes/icons/', src: '*.png', dest: 'minified/themes/'},
					{expand: true, cwd: 'src/themes/icons/', src: 'monocons/**', dest: 'minified/themes/'}
				]
			}
		},
		concat: {
			dist: {
				files: {
					'dist/development/jquery.sceditor.bbcode.js': ['src/jquery.sceditor.js', 'src/plugins/bbcode.js'],
					'dist/development/jquery.sceditor.xhtml.js': ['src/jquery.sceditor.js', 'src/plugins/xhtml.js']
				}
			}
		},
		uglify: {
			build: {
				options: {
					warnings: true,
					preserveComments: 'some',
					compress: true,
					mangle: true
				},
				files: [
					{src: 'src/jquery.sceditor.js', dest: 'minified/jquery.sceditor.min.js'},
					{src: ['src/jquery.sceditor.js', 'src/plugins/bbcode.js'], dest: 'minified/jquery.sceditor.bbcode.min.js'},
					{src: ['src/jquery.sceditor.js', 'src/plugins/xhtml.js'], dest: 'minified/jquery.sceditor.xhtml.min.js'},
					{expand: true, filter: 'isFile', cwd: 'src/', src: ['plugins/**.js'], dest: 'minified/'}
				]
			}
		},
		less: {
			build: {
				options: {
					paths: ["src/themes/"],
					yuicompress: true
				},
				files: [
					{expand: true, filter: 'isFile', cwd: 'src/themes/', src: ['*'], dest: 'minified/themes/', ext: '.min.css'}
				]
			},
			dist: {
				options: {
					paths: ["src/themes/"]

				},
				files: [
					{expand: true, filter: 'isFile', cwd: 'src/themes/', src: ['*'], dest: 'dist/development/themes/', ext: '.css'}
				]
			}
		},
		cssmin: {
			build: {
				files: {
					'minified/jquery.sceditor.default.min.css': ['src/jquery.sceditor.default.css']
				}
			}
		},
		compress: {
			dist: {
				options: {
					archive: 'sceditor-<%= pkg.version %>.zip'
				},
				files: [
					{expand: true, cwd: 'dist/', src: ['**'], dest: '/'}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-compress');



	grunt.registerTask('default', ['test']);

	// Runs all the tests
	grunt.registerTask('test', ['jshint', 'qunit']);

	// Minifies the source
	grunt.registerTask('build', [
		'clean:build',
		'copy:build',
		'uglify:build',
		'less:build',
		'cssmin:build'
	]);

	// Creates the simplified distributable ZIP
	grunt.registerTask('dist', [
		'test',
		'build',
		'clean:dist',
		'concat:dist',
		'copy:dist',
		'less:dist',
		'compress:dist'
	]);
};