/**
 * @preserve SCEditor BBCode Plugin v1.1
 * http://www.samclarke.com/2011/07/sceditor/ 
 *
 * Copyright (C) 2011, Sam Clarke (samclarke.com)
 *
 * SCEditor is dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */

// ==ClosureCompiler==
// @output_file_name jquery.sceditor.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

(function($)
{
	$.sceditorBBCodePlugin = function(element, options)
	{
		var base = this;

		base.bbcodes = {
			b: {
				styles: {
					// 401 is for FF 3.5
					"font-weight": ["bold", "bolder", "401", "700", "800", "900"]
				},
				format: "[b]{0}[/b]",
				html: '<strong>{0}</strong>'
			},
			i: {
				styles: {
					"font-style": ["italic", "oblique"]
				},
				format: "[i]{0}[/i]",
				html: '<em>{0}</em>'
			},
			u: {
				styles: {
					"text-decoration": ["underline"]
				},
				format: "[u]{0}[/u]",
				html: '<u>{0}</u>'
			},
			s: {
				styles: {
					"text-decoration": ["line-through"]
				},
				format: "[s]{0}[/s]",
				html: '<s>{0}</s>'
			},
			sub: {
				tags: {
					sub: null
				},
				format: "[sub]{0}[/sub]",
				html: '<sub>{0}</sub>'
			},
			sup: {
				tags: {
					sup: null
				},
				format: "[sup]{0}[/sup]",
				html: '<sup>{0}</sup>'
			},


			left: {
				styles: {
					"text-align": ["left"]
				},
				format: "[left]{0}[/left]",
				html: '<div style="text-align: left">{0}</div>'
			},
			center: {
				styles: {
					"text-align": ["center"]
				},
				format: "[center]{0}[/center]",
				html: '<div style="text-align: center">{0}</div>'
			},
			right: {
				styles: {
					"text-align": ["right"]
				},
				format: "[right]{0}[/right]",
				html: '<div style="text-align: right">{0}</div>'
			},
			justify: {
				styles: {
					"text-align": ["justify"]
				},
				format: "[justify]{0}[/justify]",
				html: '<div style="text-align: justify">{0}</div>'
			},

			font: {
				styles: {
					"font-family": null
				},
				format: function(element, content) {
					if(element.css('font-family') == base.options.defaultFont)
						return content;

					return '[font=' + base.stripQuotes(element.css('font-family')) + ']' + content + '[/font]';
				},
				html: function(element, attrs, content) {
					return '<font face="' + attrs.defaultAttr + '">' + content + '</font>';
				}
			},
			size: {
				styles: {
					"font-size": null
				},
				format: function(element, content) {
					var fontSize = element.css('fontSize');
					var size     = 1;

					if(fontSize == base.options.defaultSize)
						return content;

					// Most browsers return px value but IE returns 1-7
					if(fontSize.indexOf("px") > -1)
					{
						fontSize = fontSize.replace("px", "") - 0;

						if(fontSize > 12)
							size = 2;
						if(fontSize > 15)
							size = 3;
						if(fontSize > 17)
							size = 4;
						if(fontSize > 23)
							size = 5;
						if(fontSize > 31)
							size = 6;
						if(fontSize > 47)
							size = 7;
					}
					else
						size = fontSize;

					return '[size=' + size + ']' + content + '[/size]';
				},
				html: function(element, attrs, content) {
					return '<font size="' + attrs.defaultAttr + '">' + content + '</font>';
				}
			},
			color: {
				styles: {
					color: null
				},
				format: function(element, content) {
					var color = base.rgbToHex(element.css('color'));

					if(color == base.options.defaultColor)
						return content;

					return '[color=' + color + ']' + content + '[/color]';
				},
				html: function(element, attrs, content) {
					return '<font color="' + attrs.defaultAttr + '">' + content + '</font>';
				}
			},

			ul: {
				tags: {
					ul: null
				},
				format: "[ul]{0}[/ul]",
				html: '<ul>{0}</ul>'
			},
			list: {
				html: '<ul>{0}</ul>'
			},
			ol: {
				tags: {
					ol: null
				},
				format: "[ol]{0}[/ol]",
				html: '<ol>{0}</ol>'
			},
			li: {
				tags: {
					li: null
				},
				format: "[li]{0}[/li]",
				html: '<li>{0}</li>'
			},
			"*": {
				html: '<li>{0}</li>'
			},


			table: {
				tags: {
					table: null
				},
				format: "[table]{0}[/table]",
				html: '<table>{0}</table>'
			},
			tr: {
				tags: {
					tr: null
				},
				format: "[tr]{0}[/tr]",
				html: '<tr>{0}</tr>'
			},
			th: {
				tags: {
					th: null
				},
				format: "[th]{0}[/th]",
				html: '<th>{0}</th>'
			},
			td: {
				tags: {
					td: null
				},
				format: "[td]{0}[/td]",
				html: '<td>{0}<br class="sceditor-ignore" /></td>'
			},


			emoticon: {
				tags: {
					img: {
						src: null,
						"data-sceditor-emoticon": null
					}
				},
				format: function(element, content) {
					return element.attr('data-sceditor-emoticon') + content;
				},
				html: '{0}'
			},


			horizontalrule: {
				tags: {
					hr: null
				},
				format: "[hr]{0}",
				html: '<hr />'
			},
			img: {
				tags: {
					img: {
						src: null
					}
				},
				format: function(element, content) {
					var attribs = "";

					// check if this is an emoticon image
					if(typeof element.attr('data-sceditor-emoticon') != "undefined")
						return content;

					if(typeof element.attr('width') != "undefined")
						attribs += " width=" + element.attr('width');
					if(typeof element.attr('height') != "undefined")
						attribs += " height=" + element.attr('height');

					return '[img' + attribs + ']' + element.attr('src') + '[/img]';
				},
				html: function(element, attrs, content) {
					var attribs = "";

					if(typeof attrs.width != "undefined")
						attribs += ' width="' + attrs.width + '"';
					if(typeof attrs.height != "undefined")
						attribs += ' height="' + attrs.width + '"';

					return '<img ' + attribs + ' src="' + content + '" />';
				}
			},
			url: {
				tags: {
					a: {
						href: null
					}
				},
				format: function(element, content) {
					return '[url=' + encodeURI(element.attr('href')).replace("=", "%3D") + ']' + content + '[/url]';
				},
				html: function(element, attrs, content) {
					if(typeof attrs.defaultAttr == "undefined")
						attrs.defaultAttr = content;

					return '<a href="' + attrs.defaultAttr + '">' + content + '</a>';
				}
			}
		};


		/**
		 * cache of all the tags pointing to their bbcodes to enable
		 * faster lookup of which bbcode a tag should have
		 * @private
		 */
		base.tagsToBbcodes = {};

		/**
		 * Same as tagsToBbcodes but instead of HTML tags it's styles
		 * @private
		 */
		base.stylesToBbcodes = {};


		/**
		 * Initializer
		 */
		base.init = function()
		{
			base.options = $.extend({}, $.sceditor.defaultOptions, $.sceditorBBCodePlugin.defaultOptions, options);

			// build the BBCode cache
			base.buildBbcodeCache();

			(new $.sceditor(element,
				$.extend({}, base.options, {
					getHtmlHandler: base.getHtmlHandler,
					getTextHandler: base.getTextHandler
				})
			));
		}

		/**
		 * Converts CSS rgb value into hex
		 * @TODO: May need to add rgb(n%,n%,n%) and rgb(n,n,n,a) formats
		 * @private
		 * @return string Hex color
		 */
		base.rgbToHex = function(rgbStr) {
			var matches;

			// rgb(n,n,n);
			if(matches = rgbStr.match(/rgb\((\d+),\s*?(\d+),\s*?(\d+)\)/i))
				return '#' + (matches[1]-0).toString(16) + (matches[2]-0).toString(16) + (matches[3]-0).toString(16);

			return rgbStr;
		};

		/**
		 * Populates tagsToBbcodes and stylesToBbcodes to enable faster lookups
		 */
		base.buildBbcodeCache = function()
		{
			$.each(base.bbcodes, function(bbcode, info) {
				if(typeof base.bbcodes[bbcode].tags != "undefined")
					$.each(base.bbcodes[bbcode].tags, function(tag, attrs)
					{
						base.tagsToBbcodes[tag] = (base.tagsToBbcodes[tag] || {});
						base.tagsToBbcodes[tag][bbcode] = attrs;
					});

				if(typeof base.bbcodes[bbcode].styles != "undefined")
					$.each(base.bbcodes[bbcode].styles, function(style, values)
					{
						base.stylesToBbcodes[style] = (base.stylesToBbcodes[style] || {});
						base.stylesToBbcodes[style][bbcode] = values;
					});
			});
		}

		/**
		 * Checks if any bbcode styles match the elements styles
		 * @private
		 * @return string Content with any matching bbcode tags wrapped around it.
		 */
		base.handleStyles = function(element, content)
		{
			$.each(base.stylesToBbcodes, function(property, bbcodes)
			{
				if(element.get(0).nodeName.toLowerCase() == "a"
					&& (property == 'color' || property == 'text-decoration'))
					return;

				elementPropVal = element.css(property);

				// if the parent has the same style use that instead of this one
				// so you dont end up with [i]parent[i]child[/i][/i]
				if(element.parent().css(property) == elementPropVal)
					return;

				$.each(bbcodes, function(bbcode, values)
				{
					if(values == null || $.inArray(elementPropVal.toString(), values) > -1)
					{
						if($.isFunction(base.bbcodes[bbcode].format))
							content = base.bbcodes[bbcode].format(element, content);
						else
							content = base.formatString(base.bbcodes[bbcode].format, content);
					}
				});
			});

			return content;
		}

		/**
		 * Handles a HTML tag and finds any matching bbcodes
		 * @private
		 * @return string Content with any matching bbcode tags wrapped around it.
		 */
		base.handleTags = function(element, content)
		{
			var tag = element.get(0).nodeName.toLowerCase();

			if(typeof base.tagsToBbcodes[tag] != "undefined")
				// loop all bbcodes for this tag
				$.each(base.tagsToBbcodes[tag], function(bbcode, bbcodeAttribs)
				{
					var runBbcode = false;

					// if the bbcode doesn't require any attributes then its
					// all valid and should be run
					if(bbcodeAttribs == null)
						runBbcode = true;
					else
					{
						// loop all the bbcode attribs
						$.each(bbcodeAttribs, function(attrib, values)
						{
							// check if has the bbcodes attrib
							if(typeof element.attr(attrib) == "undefined")
								return;

							// if the element has the bbcodes attribute and the bbcode attribute
							// has values check one of the values matches
							if(values != null && $.inArray(element.attr(attrib), values) < 0)
								return;

							// break this loop as we have matched this bbcode
							runBbcode = true;
							return false;
						});
					}

					if(!runBbcode)
						return;

					if($.isFunction(base.bbcodes[bbcode].format))
						content = base.bbcodes[bbcode].format(element, content);
					else
						content = base.formatString(base.bbcodes[bbcode].format, content);
				});

			if(tag == 'br' || tag == 'div' || tag == 'p')
				content += "\n";
			return content;
		}

		/**
		 * Formats a string in the format
		 * {0}, {1}, {2}, ect. with the params provided
		 * @private
		 * @return string
		 */
		base.formatString = function()
		{
			var args = arguments;
			return args[0].replace(/{(\d+)}/g, function(str, p1)
			{
				return typeof args[0-p1+1] != 'undefined'
						? args[0-p1+1]
						: '{' + p1 + '}';
			});
		};

		/**
		 * Removes any leading or trailing quotes ('")
		 * @private
		 * @return string
		 */
		base.stripQuotes = function(str)
		{
			return str.replace(/^["']+/, "").replace(/["']+$/, "");
		};

		/**
		 * Converts HTML to BBCode
		 * @return string BBCode which has been converted from HTML 
		 */
		base.getHtmlHandler = function(html, domBody)
		{
			return base.elementToBbcode($(domBody));
		}

		/**
		 * Converts a HTML dom element to BBCode starting from
		 * the innermost element and working backwards
		 * @return string BBCode
		 */
		base.elementToBbcode = function(element)
		{
			if(element.get(0).nodeType === 3)
				return element.get(0).nodeValue;

			var ret = "";

			if(element.contents().length > 0)
				$.each(element.contents(), function()
				{
					ret += base.elementToBbcode($(this));
				});

			ret = base.handleStyles(element, ret);
			ret = base.handleTags(element, ret);

			return ret;
		}

		/**
		 * Converts BBCode to HTML
		 * @private
		 * @return string HTML
		 */
		base.getTextHandler = function(text)
		{
			var bbcodeRegex =  /\[([^\[\s=]*?)(?:([^\[]*?))?]((?:[\s\S(?!=\[\\\1)](?!\[\1))*?)\[\/(\1)\]/g;
			var atribsRegex = /(\S+)=((?:(?:(["'])(?:\\\3|[^\3])*?\3))|(?:[^'"\s]+))/g;
			var oldText;

			text = text.replace(/&/g, "&amp;");
			text = text.replace(/</g, "&lt;");
			text = text.replace(/>/g, "&gt;");
			text = text.replace(/\r/g, "");
			text = text.replace(/(\[\/?(?:left|center|right|justify)\])\n/g, "$1");
			text = text.replace(/\n/g, "<br />");

			while(text != oldText)
			{
				oldText = text;
				text    = text.replace(bbcodeRegex, function(str, bbcode, attrs, content)
				{
					var attrsMap = {};

					if(typeof attrs != "undefined")
					{
						var matches;
						attrs = $.trim(attrs);
						// if only one attribute then remove the = from the start and strip any quotes
						if(attrs.charAt(0) == "=" && (attrs.split("=").length - 1) <= 1)
							attrsMap.defaultAttr = base.stripQuotes(attrs.substr(1));
						else
						{
							if(attrs.charAt(0) == "=")
								attrs = "defaultAttr" + attrs;

							while((matches = atribsRegex.exec(attrs)))
								attrsMap[matches[1].toLowerCase()] = base.stripQuotes(matches[2]);
						}
					}

					if(typeof base.bbcodes[bbcode] == "undefined")
						return str;

					if($.isFunction(base.bbcodes[bbcode].html))
						return base.bbcodes[bbcode].html(bbcode, attrsMap, content);
					else
						return base.formatString(base.bbcodes[bbcode].html, content);
				});
			}

			// As hr is the only bbcode not to have a start and end tag it's
			// just being replace here instead of adding support for it above.
			text = text.replace(/\[hr\]/gi, "<hr>");

			return text.replace(/  (?=([^\<\>]*?<|[^\<\>]*?$))/g, " &nbsp;");
		}

		base.init();
	};

	$.sceditorBBCodePlugin.defaultOptions = {
		defaultSize: 13,
		defaultColor: '#111111',
		defaultFont: 'Verdana, Arial, Helvetica, sans-serif'
	};

	$.fn.sceditorBBCodePlugin = function(options)
	{
		return this.each(function()
		{
			(new $.sceditorBBCodePlugin(this, options));
		});
	};
})(jQuery);
