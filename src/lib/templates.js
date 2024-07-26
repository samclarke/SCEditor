import * as dom from './dom.js';
import * as escape from './escape.js';


/**
 * HTML templates used by the editor and default commands
 * @type {Object}
 * @private
 */
var _templates = {
	html:
		'<!DOCTYPE html>' +
			'<html data-bs-theme="{themeMode}">' +
			'<head>' +
			'<meta http-equiv="Content-Type" ' +
			'content="text/html;charset={charset}" />' +
			'{styles}' +
			'</head>' +
			'<body style="min-height:265px" contenteditable="true" {spellcheck}><p></p>' +
			'</body>' +
			'</html>',

	style: '<link rel="stylesheet" type="text/css" href="{style}" />',

	toolbarButton: '<a class="btn sceditor-button sceditor-button-{name}" ' +
		'data-sceditor-command="{name}" unselectable="on">' +
		'<span unselectable="on">  </span></a>',

	codeOpt: '<a class="sceditor-font-option dropdown-item" href="#" ' +
		'data-language="{language}">{languageName}</a>',

	extensionOpt: '<a class="sceditor-extension-option dropdown-item" href="#" ' +
		'data-language="{extension}">{extension}</a>',

	fontOpt: '<a class="sceditor-font-option dropdown-item" href="#" ' +
		'data-font="{font}"><font face="{font}">{font}</font></a>',

	sizeOpt: '<a class="sceditor-fontsize-option dropdown-item" data-size="{size}" ' +
		'href="#"><font size="{size}">{size}</font></a>',

	albums:
		'<form class="m-3"><div class="AlbumsListMenu"><div id="AlbumsListBox" class="content">' +
			'<div id="AlbumsListPager"></div>' +
			'<div id="PostAlbumsLoader" class="text-center"><div class="fa-3x"><i class="fas fa-spinner fa-pulse"></i>' +
			'</div></div>' +
			'<div id="AlbumsListBox" class="content">' +
			'<div id="PostAlbumsListPlaceholder" data-url="{root}" style="clear: both; ">' +
			'<ul class="AlbumsList list-group"></ul>' +
			'</div>' +
			'</div></form>',

	attachments:
		'<form class="m-3"><div class="AttachmentListMenu"><div id="AttachmentsListBox" class="content">' +
			'<div id="AttachmentsListPager"></div>' +
			'<div id="PostAttachmentLoader" class="text-center"><div class="fa-3x"><i class="fas fa-spinner fa-pulse"></i>' +
			'</div></div>' +
			'<div id="AttachmentsListBox" class="content">' +
			'<div id="PostAttachmentListPlaceholder" data-url="{root}" style="clear: both; ">' +
			'<ul class="AttachmentList list-group"></ul>' +
			'</div>' +
			'<div class="OpenUploadDialog mt-1 d-grid gap-2">' +
			'<button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#UploadDialog">Upload</button>' +
			'</div>' +
			'</div></form>',

	pastetext:
		'<form class="m-3"><div class="mb-3"><label for="txt" class="form-label">{label}</label> ' +
			'<textarea cols="20" rows="7" id="txt" class="form-control"></textarea></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</div></form>',

	table:
		'<form class="m-3"><div class="mb-3"><label for="rows" class="form-label">{rows}</label><input type="text" ' +
			'id="rows" value="2" class="form-control" /></div>' +
			'<div class="mb-3"><label for="cols" class="form-label">{cols}</label><input type="text" ' +
			'id="cols" value="2" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" /></form>',

	image:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{url}</label> ' +
			'<input type="text" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<div class="mb-3"><label for="des" class="form-label">{desc}</label> ' +
			'<input type="text" id="des" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" /></form>',

	email:
		'<form class="m-3"><div class="mb-3"><label for="email" class="form-label">{label}</label> ' +
			'<input type="text" id="email" dir="ltr" class="form-control" /></div>' +
			'<div class="mb-3"><label for="des" class="form-label">{desc}</label> ' +
			'<input type="text" id="des" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</form>',

	link:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{url}</label> ' +
			'<input type="text" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<div class="mb-3"><label for="des" class="form-label">{desc}</label> ' +
			'<input type="text" id="des" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{ins}" /></form>',

	mediaMenu:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{label}</label> ' +
			'<input type="url" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</form>',

	youtubeMenu:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{label}</label> ' +
			'<input type="text" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</form>',

	instagramMenu:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{label}</label> ' +
			'<input type="text" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</form>',

	facebookMenu:
		'<form class="m-3"><div class="mb-3"><label for="link" class="form-label">{label}</label> ' +
			'<input type="text" id="link" dir="ltr" placeholder="https://" class="form-control" /></div>' +
			'<input type="button" class="btn btn-sm btn-primary button" value="{insert}" />' +
			'</form>',

	facebook:
		'<div class="ratio ratio-1x1 border" data-oembed-url="{url}" data-facebook-url="{url}"><iframe src="https://www.facebook.com/plugins/post.php?href={url}"></iframe></div>',

	instagram:
		'<div class="ratio ratio-1x1 border" data-oembed-url="https://www.instagram.com/p/{id}" data-instagram-url="{url}"><iframe src="https://www.instagram.com/p/{id}/embed/captioned/"></iframe></div>',

	youtube:
		'<div data-oembed-url="https://youtube.com/embed/{id}" data-youtube-url="{url}" class="ratio ratio-16x9 border"><iframe src="https://youtube.com/embed/{id}?hd=1"></iframe></div>',

	vimeo:
		'<div data-oembed-url="https://vimeo.com/{vimeoId}" data-vimeo-url="{url}" class="ratio ratio-16x9 border"><iframe src="https://player.vimeo.com/video/{vimeoId}?show_title=1&show_byline=1&show_portrait=1&fullscreen=1"></iframe></div>'
};

/**
 * Replaces any params in a template with the passed params.
 *
 * If createHtml is passed it will return a DocumentFragment
 * containing the parsed template.
 *
 * @param {string} name
 * @param {Object} [params]
 * @param {boolean} [createHtml]
 * @returns {string|DocumentFragment}
 * @private
 */
export default function(name, params, createHtml) {
	var template = _templates[name];

	Object.keys(params).forEach(function(name) {
		template = template.replace(
			new RegExp(escape.regex(`{${name}}`), 'g'),
			params[name]
		);
	});

	if (createHtml) {
		template = dom.parseHTML(template);
	}

	return template;
};
