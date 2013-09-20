(function() {
	'use strict';

	// Yes adding methods to String is bad, but this is just for testing
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

	String.prototype.ieURLFix = function(str) {
		if(!$.sceditor.ie || $.sceditor.ie > 7)
			return this;

		var urlParts = window.location.href.split('/');
		urlParts.pop();

		return this.replace(
			new RegExp($.sceditor.regexEscape(urlParts.join('/')) + '/', 'g'),
			''
		);
	};
}());