(function (html, wrapInJquery) {
	'use strict';

	window.equalMulti = function(actual, expectedArr, message) {
		var matched = false;

		$.each(expectedArr, function(idx, expected) {
			if(actual == expected)
				matched = true;
		});

		QUnit.push(matched, actual, expectedArr, message);
	};

	String.prototype.toDOM = function() {
		var ret = document.createElement('div');
		ret.innerHTML = this;

		$('#qunit-fixture').append(ret);

		return ret;
	};

	String.prototype.toJquery = function() {
		return $(this.toDOM());
	};

	String.prototype.ignoreSpace = function(str) {
		return this.replace(/[\n\r \t]+/g, '');
	};

	String.prototype.ignoreSemicolon = function(str) {
		return this.replace(/[;]+/g, '');
	};

	String.prototype.ignoreCase = function(str) {
		return this.toLowerCase();
	};

	String.prototype.ignoreAll = function(str) {
		return this.ignoreSpace().ignoreSemicolon().ignoreCase();
	};
}());