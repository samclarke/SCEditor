define(function () {
	'use strict';
	
	var $ = require('jquery');

	/**
	 * HTML templates used by the editor and default commands
	 * @type {Object}
	 * @private
	 */
	var _templates = {
		html:
			'<!DOCTYPE html>' +
			'<html{attrs}>' +
				'<head>' +
// TODO: move these styles into the CSS file
					'<style>.ie * {min-height: auto !important} ' +
						'.ie table td {height:15px} ' +
						// Target Edge (fixes edge issues)
						'@supports (-ms-ime-align:auto) { ' +
							'* { min-height: auto !important; } ' +
						'}' +
						'</style>' +
					'<meta http-equiv="Content-Type" ' +
						'content="text/html;charset={charset}" />' +
					'<link rel="stylesheet" type="text/css" href="{style}" />' +
				'</head>' +
				'<body contenteditable="true" {spellcheck}><p></p></body>' +
			'</html>',

		toolbarButton: '<a class="sceditor-button sceditor-button-{name}" ' +
			'data-sceditor-command="{name}" unselectable="on">' +
			'<div unselectable="on">{dispName}</div></a>',

		emoticon: '<img src="{url}" data-sceditor-emoticon="{key}" ' +
			'alt="{key}" title="{tooltip}" />',

		fontOpt: '<a class="sceditor-font-option" href="#" ' +
			'data-font="{font}"><font face="{font}">{font}</font></a>',

		sizeOpt: '<a class="sceditor-fontsize-option" data-size="{size}" ' +
			'href="#"><font size="{size}">{size}</font></a>',

		pastetext:
			'<div><label for="txt">{label}</label> ' +
				'<textarea cols="20" rows="7" id="txt"></textarea></div>' +
				'<div><input type="button" class="button" value="{insert}" />' +
			'</div>',

		table:
			'<div><label for="rows">{rows}</label><input type="text" ' +
				'id="rows" value="2" /></div>' +
			'<div><label for="cols">{cols}</label><input type="text" ' +
				'id="cols" value="2" /></div>' +
			'<div><input type="button" class="button" value="{insert}"' +
				' /></div>',

		image:
			'<div><label for="link">{url}</label> ' +
				'<input type="text" id="image" placeholder="http://" /></div>' +
			'<div><label for="width">{width}</label> ' +
				'<input type="text" id="width" size="2" /></div>' +
			'<div><label for="height">{height}</label> ' +
				'<input type="text" id="height" size="2" /></div>' +
			'<div><input type="button" class="button" value="{insert}" />' +
				'</div>',

		email:
			'<div><label for="email">{label}</label> ' +
				'<input type="text" id="email" /></div>' +
			'<div><label for="des">{desc}</label> ' +
				'<input type="text" id="des" /></div>' +
			'<div><input type="button" class="button" value="{insert}" />' +
				'</div>',

		link:
			'<div><label for="link">{url}</label> ' +
				'<input type="text" id="link" placeholder="http://" /></div>' +
			'<div><label for="des">{desc}</label> ' +
				'<input type="text" id="des" /></div>' +
			'<div><input type="button" class="button" value="{ins}" /></div>',

		youtubeMenu:
			'<div><label for="link">{label}</label> ' +
				'<input type="text" id="link" placeholder="https://" /></div>' +
			'<div><input type="button" class="button" value="{insert}" />' +
				'</div>',

		youtube:
			'<iframe width="560" height="315" ' +
			'src="https://www.youtube.com/embed/{id}?wmode=opaque" ' +
			'data-youtube-id="{id}" frameborder="0" allowfullscreen></iframe>'
	};

	/**
	 * <p>Replaces any params in a template with the passed params.</p>
	 *
	 * <p>If createHtml is passed it will use jQuery to create the HTML. The
	 * same as doing: $(editor.tmpl("html", {params...}));</p>
	 *
	 * @param {string} name
	 * @param {Object} params
	 * @param {Boolean} createHtml
	 * @private
	 */
	return function (name, params, createHtml) {
		var template = _templates[name];

		$.each(params, function (name, val) {
			template = template.replace(
				new RegExp('\\{' + name + '\\}', 'g'), val
			);
		});

		if (createHtml) {
			template = $(template);
		}

		return template;
	};
});
