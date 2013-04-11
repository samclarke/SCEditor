/*global module:false*/
module.exports = function(grunt) {
	"use strict";

	grunt.initConfig({
		qunit: {
			all: ['tests/index.html']
		},
		jshint: {
			options: {
				browser: true
			},
			all: ['src/**/*.js', 'tests/**/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.registerTask('default', ['jshint', 'qunit']);
	grunt.registerTask('test', ['jshint', 'qunit']);
};