/**
 * SCEditor BBCode Plugin v1.2.7
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

/*jshint smarttabs: true */

(function($) {
	'use strict';

	$.sceditorBBCodePlugin = function(element, options) {
		var base = this;

		/**
		 * Private methods
		 * @private
		 */
		var	init,
			buildBbcodeCache,
			handleStyles,
			handleTags,
			formatString;

		base.bbcodes = $.sceditorBBCodePlugin.bbcodes;


		/**
		 * cache of all the tags pointing to their bbcodes to enable
		 * faster lookup of which bbcode a tag should have
		 * @private
		 */
		var tagsToBbcodes = {};

		/**
		 * Same as tagsToBbcodes but instead of HTML tags it's styles
		 * @private
		 */
		var stylesToBbcodes = {};
		
		var validChildren = {
			ul: ['li'],
			ol: ['li'],
			table: ['tr', 'th'],
			tr: ['td'],
			th: ['td'],
			code: [],
			youtube: []
		};


		/**
		 * Initializer
		 */
		init = function() {
			base.options = $.extend({}, $.sceditor.defaultOptions, $.sceditorBBCodePlugin.defaultOptions, options);

			// build the BBCode cache
			buildBbcodeCache();

			(new $.sceditor(element,
				$.extend({}, base.options, {
					getHtmlHandler: base.getHtmlHandler,
					getTextHandler: base.getTextHandler
				})
			));
		};
		
		/**
		 * Populates tagsToBbcodes and stylesToBbcodes to enable faster lookups
		 * 
		 * @private
		 */
		buildBbcodeCache = function() {
			$.each(base.bbcodes, function(bbcode, info) {
				if(typeof base.bbcodes[bbcode].tags !== "undefined")
					$.each(base.bbcodes[bbcode].tags, function(tag, values) {
						var isBlock = !!base.bbcodes[bbcode].isBlock;
						tagsToBbcodes[tag] = (tagsToBbcodes[tag] || {});
						tagsToBbcodes[tag][isBlock] = (tagsToBbcodes[tag][isBlock] || {});
						tagsToBbcodes[tag][isBlock][bbcode] = values;
					});

				if(typeof base.bbcodes[bbcode].styles !== "undefined")
					$.each(base.bbcodes[bbcode].styles, function(style, values) {
						var isBlock = !!base.bbcodes[bbcode].isBlock;
						stylesToBbcodes[isBlock] = (stylesToBbcodes[isBlock] || {});
						stylesToBbcodes[isBlock][style] = (stylesToBbcodes[isBlock][style] || {});
						stylesToBbcodes[isBlock][style][bbcode] = values;
					});
			});
		};

		/**
		 * Checks if any bbcode styles match the elements styles
		 * 
		 * @private
		 * @return string Content with any matching bbcode tags wrapped around it.
		 */
		handleStyles = function(element, content, blockLevel) {
			var elementPropVal;

			// convert blockLevel to boolean
			blockLevel = !!blockLevel;
			
			if(!stylesToBbcodes[blockLevel])
				return content;
			
			$.each(stylesToBbcodes[blockLevel], function(property, bbcodes) {
				if(element.get(0).nodeName.toLowerCase() === "a" &&
					(property === 'color' || property === 'text-decoration'))
					return;
				else if(element.get(0).nodeName.toLowerCase() === "code" &&
					(property === 'font-family'))
					return;

				elementPropVal = element.css(property);

				// if the parent has the same style use that instead of this one
				// so you dont end up with [i]parent[i]child[/i][/i]
				if(element.parent().css(property) === elementPropVal)
					return;

				$.each(bbcodes, function(bbcode, values) {

					if(values === null || $.inArray(elementPropVal.toString(), values) > -1) {
						if($.isFunction(base.bbcodes[bbcode].format))
							content = base.bbcodes[bbcode].format.call(base, element, content);
						else
							content = formatString(base.bbcodes[bbcode].format, content);
					}
				});
			});

			return content;
		};

		/**
		 * Handles a HTML tag and finds any matching bbcodes
		 * 
		 * @private
		 * @param	jQuery element	element		The element to convert
		 * @param	string			content		The Tags text content
		 * @param	bool			blockLevel	If to convert block level tags
		 * @return	string	Content with any matching bbcode tags wrapped around it.
		 */
		handleTags = function(element, content, blockLevel) {
			var tag = element.get(0).nodeName.toLowerCase();
			
			// convert blockLevel to boolean
			blockLevel = !!blockLevel;

			if(tagsToBbcodes[tag] && tagsToBbcodes[tag][blockLevel]) {
				// loop all bbcodes for this tag
				$.each(tagsToBbcodes[tag][blockLevel], function(bbcode, bbcodeAttribs) {
					// if the bbcode requires any attributes then check this has
					// all needed
					if(bbcodeAttribs !== null) {
						var runBbcode = false;

						// loop all the bbcode attribs
						$.each(bbcodeAttribs, function(attrib, values)
						{
							// check if has the bbcodes attrib
							if(typeof element.attr(attrib) === "undefined")
								return;

							// if the element has the bbcodes attribute and the bbcode attribute
							// has values check one of the values matches
							if(values !== null && $.inArray(element.attr(attrib), values) < 0)
								return;

							// break this loop as we have matched this bbcode
							runBbcode = true;
							return false;
						});

						if(!runBbcode)
							return;
					}

					if($.isFunction(base.bbcodes[bbcode].format))
						content = base.bbcodes[bbcode].format.call(base, element, content);
					else
						content = formatString(base.bbcodes[bbcode].format, content);
				});
			}
			
			// add newline after paragraph elements p and div (Chrome uses divs) and br tags
			if(blockLevel && /^(br|div|p)$/.test(tag))
				content += "\n";

			return content;
		};

		/**
		 * Formats a string in the format
		 * {0}, {1}, {2}, ect. with the params provided
		 * @private
		 * @return string
		 */
		formatString = function() {
			var args = arguments;
			return args[0].replace(/\{(\d+)\}/g, function(str, p1) {
				return typeof args[p1-0+1] !== 'undefined'? 
						args[p1-0+1] :
						'{' + p1 + '}';
			});
		};

		/**
		 * Removes any leading or trailing quotes ('")
		 *
		 * @return string
		 */
		base.stripQuotes = function(str) {
			return str.replace(/^["']+/, "").replace(/["']+$/, "");
		};

		/**
		 * Converts HTML to BBCode
		 * @param string	html	Html string, this function ignores this, it works off domBody
		 * @param HtmlElement	domBody	Editors dom body object to convert
		 * @return string BBCode which has been converted from HTML 
		 */
		base.getHtmlHandler = function(html, domBody) {
			return base.elementToBbcode(domBody);
		};

		/**
		 * Converts a HTML dom element to BBCode starting from
		 * the innermost element and working backwards
		 * 
		 * @private
		 * @param HtmlElement	element		The element to convert to BBCode
		 * @param array			vChildren	Valid child tags allowed
		 * @return string BBCode
		 */
		base.elementToBbcode = function($element) {
			return (function toBBCode(node, vChildren) {
				var ret = '';

				$.sceditor.dom.traverse(node, function(node) {
					var	$node			= $(node),
						curTag			= '',
						tag				= node.nodeName.toLowerCase(),
						vChild			= validChildren[tag],
						isValidChild	= true;
					
					if(typeof vChildren === 'object')
					{
						isValidChild = $.inArray(tag, vChildren) > -1;

						// if this tag is one of the parents allowed children
						// then set this tags allowed children to whatever it allows,
						// otherwise set to what the parent allows
						if(!isValidChild)
							vChild = vChildren;
					}
					
					// 3 is text element
					if(node.nodeType !== 3)
					{
						// skip ignored elments
						if($node.hasClass("sceditor-ignore"))
							return;

						// don't loop inside iframes
						if(tag !== 'iframe')
							curTag = toBBCode(node, vChild);
						
						if(isValidChild)
						{
							// code tags should skip most styles
							if(!$node.is('code'))
							{
								// handle inline bbcodes
								curTag = handleStyles($node, curTag);
								curTag = handleTags($node, curTag);
								
								// handle blocklevel bbcodes
								curTag = handleStyles($node, curTag, true);
							}
							
							ret += handleTags($node, curTag, true);
						}
						else
							ret += curTag;
					}
					else
						ret += node.nodeValue;
				}, false, true);
				
				return ret;
			}($element.get(0)));
		};

		/**
		 * Converts BBCode to HTML
		 * 
		 * @param string text
		 * @return string HTML
		 */
		base.getTextHandler = function(text) {
			var bbcodeRegex = /\[([^\[\s=]*?)(?:([^\[]*?))?\]((?:[\s\S(?!=\[\\\1)](?!\[\1))*?)\[\/(\1)\]/g,
				atribsRegex = /(\S+)=((?:(?:(["'])(?:\\\3|[^\3])*?\3))|(?:[^'"\s]+))/g,
				oldText;

			var replaceBBCodeFunc = function(str, bbcode, attrs, content)
			{
				var attrsMap = {},
					matches;
					
				if(attrs)
				{
					attrs = $.trim(attrs);
					
					// if only one attribute then remove the = from the start and strip any quotes
					if((attrs.charAt(0) === "=" && (attrs.split("=").length - 1) <= 1) || bbcode === 'url')
						attrsMap.defaultAttr = base.stripQuotes(attrs.substr(1));
					else
					{
						if(attrs.charAt(0) === "=")
							attrs = "defaultAttr" + attrs;

						while((matches = atribsRegex.exec(attrs)))
							attrsMap[matches[1].toLowerCase()] = base.stripQuotes(matches[2]);
					}
				}

				if(!base.bbcodes[bbcode])
					return str;

				if($.isFunction(base.bbcodes[bbcode].html))
					return base.bbcodes[bbcode].html.call(base, bbcode, attrsMap, content);
				else
					return formatString(base.bbcodes[bbcode].html, content);
			};

			text = text.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;")
						.replace(/\r/g, "")
						.replace(/(\[\/?(?:left|center|right|justify)\])\n/g, "$1")
						.replace(/\n/g, "<span><br /></span>");// opera needs a parent element

			while(text !== oldText)
			{
				oldText = text;
				text    = text.replace(bbcodeRegex, replaceBBCodeFunc);
			}

			// As hr is the only bbcode not to have a start and end tag it's
			// just being replace here instead of adding support for it above.
			text = text.replace(/\[hr\]/gi, "<hr>");

			return text.replace(/ {2}(?=([^<\>]*?<|[^<\>]*?$))/g, " &nbsp;");
		};

		init();
	};
	
	$.sceditorBBCodePlugin.bbcodes = {
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

		font: {
			styles: {
				"font-family": null
			},
			format: function(element, content) {
				if(element.css('font-family') === this.options.defaultFont)
					return content;

				return '[font=' + this.stripQuotes(element.css('font-family')) + ']' + content + '[/font]';
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

				if(fontSize === this.options.defaultSize)
					return content;

				// Most browsers return px value but IE returns 1-7
				if(fontSize.indexOf("px") > -1) {
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
				/**
				 * Converts CSS rgb value into hex
				 * @private
				 * @return string Hex color
				 */
				var rgbToHex = function(rgbStr) {
					var matches;
		
					function toHex(n) {
						n = parseInt(n,10);
						if(isNaN(n))
							return "00";
						n = Math.max(0,Math.min(n,255)).toString(16);
		
						return n.length<2 ? '0'+n : n;
					}
		
					// rgb(n,n,n);
					if((matches = rgbStr.match(/rgb\((\d+),\s*?(\d+),\s*?(\d+)\)/i)))
						return '#' + toHex(matches[1]) + toHex(matches[2]-0) + toHex(matches[3]-0);
		
					return rgbStr;
				};
		
				var color = rgbToHex(element.css('color'));

				if(color === this.options.defaultColor)
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
			isBlock: true,
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
			isBlock: true,
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
				// check if this is an emoticon image
				if(typeof element.attr('data-sceditor-emoticon') !== "undefined")
					return content;

				var attribs =	"=" + $(element).width() +
						"x" + $(element).height();

				return '[img' + attribs + ']' + element.attr('src') + '[/img]';
			},
			html: function(element, attrs, content) {
				var attribs = "";

				if(typeof attrs.width !== "undefined")
					attribs += ' width="' + attrs.width + '"';
				if(typeof attrs.height !== "undefined")
					attribs += ' height="' + attrs.height + '"';

				if(typeof attrs.defaultAttr !== "undefined") {
					var parts = attrs.defaultAttr.split(/x/i);

					attribs = ' width="' + parts[0] + '"' +
						' height="' + (parts.length === 2 ? parts[1] : parts[0]) + '"';
				}

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
				if(element.attr('href').substr(0, 7) === 'mailto:')
					return '[email=' + element.attr('href').substr(7) + ']' + content + '[/email]';

				return '[url=' + decodeURI(element.attr('href')) + ']' + content + '[/url]';
			},
			html: function(element, attrs, content) {
				if(typeof attrs.defaultAttr === "undefined" || attrs.defaultAttr.length === 0)
					attrs.defaultAttr = content;

				return '<a href="' + encodeURI(attrs.defaultAttr) + '">' + content + '</a>';
			}
		},
		email: {
			html: function(element, attrs, content) {
				if(typeof attrs.defaultAttr === "undefined")
					attrs.defaultAttr = content;

				return '<a href="mailto:' + attrs.defaultAttr + '">' + content + '</a>';
			}
		},

		quote: {
			tags: {
				blockquote: null
			},
			isBlock: true,
			format: function(element, content) {
				var attr = '',
					that = this;

				if($(element).children("cite:first").length === 1) {
					attr = '=' + $(element).children("cite:first").text();

					content = '';
					$(element).children("cite:first").remove();
					$(element).contents().each(function() {
						content += that.elementToBbcode($(this));
					});
				}

				return '[quote' + attr + ']' + content + '[/quote]';
			},
			html: function(element, attrs, content) {
				if(typeof attrs.defaultAttr !== "undefined")
					content = '<cite>' + attrs.defaultAttr + '</cite>' + content;

				return '<blockquote>' + content + '</blockquote>';
			}
		},
		code: {
			tags: {
				code: null
			},
			isBlock: true,
			format: "[code]{0}[/code]",
			html: '<code>{0}</code>'
		},
		
		left: {
			styles: {
				"text-align": ["left", "-webkit-left"]
			},
			isBlock: true,
			format: "[left]{0}[/left]",
			html: '<div align="left">{0}</div>'
		},
		center: {
			styles: {
				"text-align": ["center", "-webkit-center"]
			},
			isBlock: true,
			format: "[center]{0}[/center]",
			html: '<div align="center">{0}</div>'
		},
		right: {
			styles: {
				"text-align": ["right", "-webkit-right"]
			},
			isBlock: true,
			format: "[right]{0}[/right]",
			html: '<div align="right">{0}</div>'
		},
		justify: {
			styles: {
				"text-align": ["justify", "-webkit-justify"]
			},
			isBlock: true,
			format: "[justify]{0}[/justify]",
			html: '<div align="justify">{0}</div>'
		},

		youtube: {
			tags: {
				iframe: {
					'data-youtube-id': null
				}
			},
			format: function(element, content) {
				if(!element.attr('data-youtube-id'))
					return content;

				return '[youtube]' + element.attr('data-youtube-id') + '[/youtube]';
			},
			html: '<iframe width="560" height="315" src="http://www.youtube.com/embed/{0}' +
				'" data-youtube-id="{0}" frameborder="0" allowfullscreen></iframe>'
		}
	};
	
	/**
	 * Checks if a command with the specified name exists
	 * 
	 * @param string name
	 * @return bool
	 */
	$.sceditorBBCodePlugin.commandExists = function(name) {
		return typeof $.sceditorBBCodePlugin.bbcodes[name] !== "undefined";
	};
	
	/**
	 * Adds/updates a BBCode.
	 * 
	 * @param string		name		The BBCode name
	 * @param object		tags		Any html tags this bbcode applies to, i.e. strong for [b]
	 * @param object		styles		Any style properties this applies to, i.e. font-weight for [b]
	 * @param string|function	format		Function or string to convert the element into BBCode
	 * @param string|function	html		String or function to format the BBCode back into HTML.
	 * @return bool
	 */
	$.sceditorBBCodePlugin.setCommand = function(name, tags, styles, format, html) {
		if(!name || !format || !html)
			return false;
		
		if(!$.sceditorBBCodePlugin.commandExists(name))
			$.sceditorBBCodePlugin.bbcodes[name] = {};

		$.sceditorBBCodePlugin.bbcodes[name].format = format;
		$.sceditorBBCodePlugin.bbcodes[name].html = html;
		
		if(tags)
			$.sceditorBBCodePlugin.bbcodes[name].tags = tags;
		
		if(styles)
			$.sceditorBBCodePlugin.bbcodes[name].styles = styles;
		
		return true;
	};

	$.sceditorBBCodePlugin.defaultOptions = {
		defaultSize: 13,
		defaultColor: '#111111',
		defaultFont: 'Verdana, Arial, Helvetica, sans-serif'
	};

	$.fn.sceditorBBCodePlugin = function(options) {
		return this.each(function() {
			(new $.sceditorBBCodePlugin(this, options));
		});
	};
})(jQuery);
