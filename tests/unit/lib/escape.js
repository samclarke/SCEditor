import * as escape from 'src/lib/escape.js';

QUnit.module('lib/escape');


QUnit.test('regex()', function (assert) {
	assert.equal(
		escape.regex('- \\ ^ / $ * + ? . ( ) | { } [ ] | ! :'),
		'\\- \\\\ \\^ \\/ \\$ \\* \\+ \\? \\. \\( \\) \\| ' +
			'\\{ \\} \\[ \\] \\| \\! \\:'
	);
});

QUnit.test('regex() - Emoticons', function (assert) {
	assert.equal(
		escape.regex('^^ >.< =)'),
		'\\^\\^ >\\.< \\=\\)'
	);
});


QUnit.test('entities()', function (assert) {
	assert.strictEqual(escape.entities(null), null);
	assert.strictEqual(escape.entities(''), '');

	assert.equal(
		escape.entities('& < > " \'    `'),
		'&amp; &lt; &gt; &#34; &#39;&nbsp; &nbsp; &#96;'
	);
});

QUnit.test('entities() - XSS', function (assert) {
	assert.equal(
		escape.entities('<script>alert("XSS");</script>'),
		'&lt;script&gt;alert(&#34;XSS&#34;);&lt;/script&gt;'
	);
});

QUnit.test('entities() - IE XSS', function (assert) {
	assert.equal(
		escape.entities('<img src="x" alt="``onerror=alert(1)" />'),
		'&lt;img src=&#34;x&#34; alt=&#34;&#96;&#96;onerror=alert(1)&#34; /&gt;'
	);
});


QUnit.test('uriScheme() - No schmes', function (assert) {
	var urls = [
		'',
		'/test.html',
		'//localhost/test.html',
		'www.example.com/test?id=123'
	];

	assert.expect(urls.length);

	for (var i = 0; i < urls.length; i++) {
		var url = urls[i];

		assert.equal(escape.uriScheme(url), url);
	}
});

QUnit.test('uriScheme() - Valid schmes', function (assert) {
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

	assert.expect(urls.length);

	for (var i = 0; i < urls.length; i++) {
		var url = urls[i];

		assert.equal(escape.uriScheme(url), url);
	}
});

QUnit.test('uriScheme() - Invalid schmes', function (assert) {
	var path = location.pathname.split('/');
	path.pop();

	var baseUrl = location.protocol + '//' +
		location.host +
		path.join('/') + '/';

	/*jshint scripturl:true*/
	var urls = [
		// eslint-disable-next-line no-script-url
		'javascript:alert("XSS");',
		'jav	ascript:alert(\'XSS\');',
		'vbscript:msgbox("XSS")',
		'data:application/javascript;alert("xss")'
	];

	assert.expect(urls.length);

	for (var i = 0; i < urls.length; i++) {
		var url = urls[i];

		assert.equal(escape.uriScheme(url), baseUrl + url);
	}
});
