/**
 * SCEditor XHTML Plugin
 * http://www.sceditor.com/
 *
 * Copyright (C) 2017, Sam Clarke (samclarke.com)
 *
 * SCEditor is licensed under the MIT license:
 *	http://www.opensource.org/licenses/mit-license.php
 *
 * @author Sam Clarke
 */

var dom = sceditor.dom;
var css = dom.css;
var is = dom.is;
var attr = dom.attr;
var removeAttr = dom.removeAttr;
var convertElement = dom.convertElement;

/**
 * Tag conveters, a converter is applied to all
 * tags that match the criteria.
 *
 * @type {Array}
 * @name sceditor.plugins.xhtml.converters
 * @since v1.4.1
 */
export default [
	{
		tags: {
			'*': {
				width: null
			}
		},
		conv: function (node) {
			css(node, 'width', attr(node, 'width'));
			removeAttr(node, 'width');
		}
	},
	{
		tags: {
			'*': {
				height: null
			}
		},
		conv: function (node) {
			css(node, 'height', attr(node, 'height'));
			removeAttr(node, 'height');
		}
	},
	{
		tags: {
			'li': {
				value: null
			}
		},
		conv: function (node) {
			removeAttr(node, 'value');
		}
	},
	{
		tags: {
			'*': {
				text: null
			}
		},
		conv: function (node) {
			css(node, 'color', attr(node, 'text'));
			removeAttr(node, 'text');
		}
	},
	{
		tags: {
			'*': {
				color: null
			}
		},
		conv: function (node) {
			css(node, 'color', attr(node, 'color'));
			removeAttr(node, 'color');
		}
	},
	{
		tags: {
			'*': {
				face: null
			}
		},
		conv: function (node) {
			css(node, 'fontFamily', attr(node, 'face'));
			removeAttr(node, 'face');
		}
	},
	{
		tags: {
			'*': {
				align: null
			}
		},
		conv: function (node) {
			css(node, 'textAlign', attr(node, 'align'));
			removeAttr(node, 'align');
		}
	},
	{
		tags: {
			'*': {
				border: null
			}
		},
		conv: function (node) {
			css(node, 'borderWidth', attr(node, 'border'));
			removeAttr(node, 'border');
		}
	},
	{
		tags: {
			applet: {
				name: null
			},
			img: {
				name: null
			},
			layer: {
				name: null
			},
			map: {
				name: null
			},
			object: {
				name: null
			},
			param: {
				name: null
			}
		},
		conv: function (node) {
			if (!attr(node, 'id')) {
				attr(node, 'id', attr(node, 'name'));
			}

			removeAttr(node, 'name');
		}
	},
	{
		tags: {
			'*': {
				vspace: null
			}
		},
		conv: function (node) {
			css(node, 'marginTop', attr(node, 'vspace') - 0);
			css(node, 'marginBottom', attr(node, 'vspace') - 0);
			removeAttr(node, 'vspace');
		}
	},
	{
		tags: {
			'*': {
				hspace: null
			}
		},
		conv: function (node) {
			css(node, 'marginLeft', attr(node, 'hspace') - 0);
			css(node, 'marginRight', attr(node, 'hspace') - 0);
			removeAttr(node, 'hspace');
		}
	},
	{
		tags: {
			'hr': {
				noshade: null
			}
		},
		conv: function (node) {
			css(node, 'borderStyle', 'solid');
			removeAttr(node, 'noshade');
		}
	},
	{
		tags: {
			'*': {
				nowrap: null
			}
		},
		conv: function (node) {
			css(node, 'whiteSpace', 'nowrap');
			removeAttr(node, 'nowrap');
		}
	},
	{
		tags: {
			big: null
		},
		conv: function (node) {
			css(convertElement(node, 'span'), 'fontSize', 'larger');
		}
	},
	{
		tags: {
			small: null
		},
		conv: function (node) {
			css(convertElement(node, 'span'), 'fontSize', 'smaller');
		}
	},
	{
		tags: {
			b: null
		},
		conv: function (node) {
			convertElement(node, 'strong');
		}
	},
	{
		tags: {
			u: null
		},
		conv: function (node) {
			css(convertElement(node, 'span'), 'textDecoration',
				'underline');
		}
	},
	{
		tags: {
			s: null,
			strike: null
		},
		conv: function (node) {
			css(convertElement(node, 'span'), 'textDecoration',
				'line-through');
		}
	},
	{
		tags: {
			dir: null
		},
		conv: function (node) {
			convertElement(node, 'ul');
		}
	},
	{
		tags: {
			center: null
		},
		conv: function (node) {
			css(convertElement(node, 'div'), 'textAlign', 'center');
		}
	},
	{
		tags: {
			font: {
				size: null
			}
		},
		conv: function (node) {
			css(node, 'fontSize', css(node, 'fontSize'));
			removeAttr(node, 'size');
		}
	},
	{
		tags: {
			font: null
		},
		conv: function (node) {
			// All it's attributes will be converted
			// by the attribute converters
			convertElement(node, 'span');
		}
	},
	{
		tags: {
			'*': {
				type: ['_moz']
			}
		},
		conv: function (node) {
			removeAttr(node, 'type');
		}
	},
	{
		tags: {
			'*': {
				'_moz_dirty': null
			}
		},
		conv: function (node) {
			removeAttr(node, '_moz_dirty');
		}
	},
	{
		tags: {
			'*': {
				'_moz_editor_bogus_node': null
			}
		},
		conv: function (node) {
			node.parentNode.removeChild(node);
		}
	},
	{
		tags: {
			'*': {
				'data-sce-target': null
			}
		},
		conv: function (node) {
			var rel = attr(node, 'rel') || '';
			var target = attr(node, 'data-sce-target');

			// Only allow the value _blank and only on links
			if (target === '_blank' && is(node, 'a')) {
				if (!/(^|\s)noopener(\s|$)/.test(rel)) {
					attr(node, 'rel', 'noopener' + (rel ? ' ' + rel : ''));
				}

				attr(node, 'target', target);
			}


			removeAttr(node, 'data-sce-target');
		}
	}
];
