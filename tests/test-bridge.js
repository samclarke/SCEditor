// The grunt-contrib-qunit bridge file is injected into all new pages which
// includes iframes.
//
// This causes an issue as the editor uses an iframe that doesn't contain a
// reference to QUnit. When the bridge tries to access QUnit it causes an
// undefined error.
//
// This file has is modified version of the grunt-contrib-qunit bridge file to
// prevent the bridge from trying to initialise inside the editors iframe.
//
// Source: https://raw.githubusercontent.com/gruntjs/grunt-contrib-qunit/main/chrome/bridge.js

/*
 * grunt-contrib-qunit
 * https://gruntjs.com/
 *
 * Copyright (c) 2016 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */
/* global QUnit:true, require, define */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		require(['qunit'], factory);
	} else {
		if (typeof QUnit !== 'undefined') {
			factory(QUnit);
		}
	}
})(function (QUnit) {
	'use strict';

	var lastMessage = performance.now();

	// Don't re-order tests.
	QUnit.config.reorder = false;

	// Send messages to the Node process
	function sendMessage() {
		self.__grunt_contrib_qunit__.apply(self, [].slice.call(arguments));
		lastMessage = performance.now();
	}

	if (self.__grunt_contrib_qunit_timeout__) {
		setTimeout(function checkTimeout() {
			if (
				performance.now() - lastMessage >
				self.__grunt_contrib_qunit_timeout__
			) {
				sendMessage('fail.timeout');
			} else {
				// Keep checking
				setTimeout(checkTimeout, 1000);
			}
		}, 1000);
	}

	// QUnit reporter events
	// https://api.qunitjs.com/callbacks/QUnit.on/

	QUnit.on('testStart', function (obj) {
		sendMessage('qunit.on.testStart', obj);
	});

	QUnit.on('testEnd', function (obj) {
		sendMessage('qunit.on.testEnd', obj);
	});

	QUnit.on('runEnd', function (obj) {
		// Re-create object to strip out large 'tests' field (deprecated).
		sendMessage('qunit.on.runEnd', {
			testCounts: obj.testCounts,
			runtime: obj.runtime,
			status: obj.status
		});
	});

	// QUnit plugin callbacks (for back-compat)
	// https://api.qunitjs.com/callbacks/
	//
	// TODO: Remove the below in a future major version of grunt-contrib-qunit,
	// after updating docs for grunt.event.on() and announcing their deprecation,
	// to give developers time to migrate any event consumers to their
	// newer equivalents.

	QUnit.log(function (obj) {
		// What is this I don’t even
		if (obj.message === '[object Object], undefined:undefined') {
			return;
		}

		// Parse some stuff before sending it.
		var actual;
		var expected;

		if (!obj.result) {
			// Dumping large objects can be very slow, and the dump isn't used for
			// passing tests, so only dump if the test failed.
			actual = QUnit.dump.parse(obj.actual);
			expected = QUnit.dump.parse(obj.expected);
		}
		// Send it.
		sendMessage(
			'qunit.log',
			obj.result,
			actual,
			expected,
			obj.message,
			obj.source,
			obj.todo
		);
	});

	QUnit.testStart(function (obj) {
		sendMessage('qunit.testStart', obj.name);
	});

	QUnit.testDone(function (obj) {
		sendMessage(
			'qunit.testDone',
			obj.name,
			obj.failed,
			obj.passed,
			obj.total,
			obj.runtime,
			obj.skipped,
			obj.todo
		);
	});

	QUnit.moduleStart(function (obj) {
		sendMessage('qunit.moduleStart', obj.name);
	});

	QUnit.moduleDone(function (obj) {
		sendMessage(
			'qunit.moduleDone',
			obj.name,
			obj.failed,
			obj.passed,
			obj.total
		);
	});

	QUnit.begin(function () {
		sendMessage('qunit.begin');
	});

	QUnit.done(function (obj) {
		sendMessage('qunit.done', obj.failed, obj.passed, obj.total, obj.runtime);
	});
});
