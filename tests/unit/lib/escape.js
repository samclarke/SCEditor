define([
	'lib/escape'
], function (escape) {
	'use strict';

	module('lib/escape');


	test('regex()', function (assert) {
		assert.equal(
			escape.regex('- \\ ^ / $ * + ? . ( ) | { } [ ] | ! :'),
			'\\- \\\\ \\^ \\/ \\$ \\* \\+ \\? \\. \\( \\) \\| ' +
				'\\{ \\} \\[ \\] \\| \\! \\:'
		);
	});

	test('regex() - Emoticons', function (assert) {
		assert.equal(
			escape.regex('^^ >.< =)'),
			'\\^\\^ >\\.< \\=\\)'
		);
	});


	test('entities()', function (assert) {
		assert.strictEqual(escape.entities(null), null);
		assert.strictEqual(escape.entities(''), '');

		assert.equal(
			escape.entities('& < > " \'    `'),
			'&amp; &lt; &gt; &#34; &#39;&nbsp; &nbsp; &#96;'
		);
	});

	test('entities() - XSS', function (assert) {
		assert.equal(
			escape.entities('<script>alert("XSS");</script>'),
			'&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;'
		);
	});

	test('entities() - IE XSS', function (assert) {
		assert.equal(
			escape.entities('<img src="x" alt="``onerror=alert(1)" />'),
			'&lt;img src=&#34;x&#34; alt=&#34;&#96;&#96;onerror=alert(1)&#34; /&gt;'
		);
	});


	test('uriScheme() - No schmes', function (assert) {
		var urls = [
			'',
			'/test.html',
			'//localhost/test.html',
			'www.example.com/test?id=123'
		];

		expect(urls.length);

		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];

			assert.equal(escape.uriScheme(url), url);
		}
	});

	test('uriScheme() - Valid schmes', function (assert) {
		var urls = [
			'http://localhost',
			'https://example.com/test.html',
			'ftp://localhost',
			'sftp://example.com/test/',
			'mailto:user@localhost',
			'spotify:xyz',
			'skype:xyz',
			'ssh:user@host.com:22',
			'teamspeak:12345',
			'tel:12345',
			'//www.example.com/test?id=123',
			'data:image/png;test',
			'data:image/gif;test',
			'data:image/jpg;test',
			'data:image/bmp;test'
		];

		expect(urls.length);

		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];

			assert.equal(escape.uriScheme(url), url);
		}
	});

	test('uriScheme() - Invalid schmes', function (assert) {
		var path = location.pathname.split('/');
		path.pop();

		var baseUrl = location.protocol + '//' +
			location.host +
			path.join('/') + '/';

		/*jshint scripturl:true*/
		var urls = [
			'javascript:alert("XSS");',
			'jav	ascript:alert(\'XSS\');',
			'vbscript:msgbox("XSS")',
			'data:application/javascript;alert("xss")'
		];

		expect(urls.length);

		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];

			assert.equal(escape.uriScheme(url), baseUrl + url);
		}
	});
});
