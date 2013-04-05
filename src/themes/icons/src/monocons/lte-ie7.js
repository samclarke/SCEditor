/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'monocons\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-youtube' : '&#xe000;',
			'icon-unlink' : '&#xe001;',
			'icon-underline' : '&#xe002;',
			'icon-time' : '&#xe003;',
			'icon-table' : '&#xe004;',
			'icon-superscript' : '&#xe005;',
			'icon-subscript' : '&#xe006;',
			'icon-strike' : '&#xe007;',
			'icon-source' : '&#xe008;',
			'icon-size' : '&#xe009;',
			'icon-rtl' : '&#xe00a;',
			'icon-right' : '&#xe00b;',
			'icon-removeformat' : '&#xe00c;',
			'icon-quote' : '&#xe00d;',
			'icon-print' : '&#xe00e;',
			'icon-pastetext' : '&#xe00f;',
			'icon-paste' : '&#xe010;',
			'icon-orderedlist' : '&#xe011;',
			'icon-ltr' : '&#xe012;',
			'icon-link' : '&#xe013;',
			'icon-left' : '&#xe014;',
			'icon-justify' : '&#xe015;',
			'icon-italic' : '&#xe016;',
			'icon-image' : '&#xe017;',
			'icon-horizontalrule' : '&#xe018;',
			'icon-grip' : '&#xe019;',
			'icon-font' : '&#xe01a;',
			'icon-emoticon' : '&#xe01b;',
			'icon-email' : '&#xe01c;',
			'icon-date' : '&#xe01d;',
			'icon-cut' : '&#xe01e;',
			'icon-copy' : '&#xe01f;',
			'icon-color' : '&#xe020;',
			'icon-code' : '&#xe021;',
			'icon-center' : '&#xe022;',
			'icon-bulletlist' : '&#xe023;',
			'icon-bold' : '&#xe024;',
			'icon-grip-rtl' : '&#xe025;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; i < els.length; i += 1) {
		el = els[i];
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};