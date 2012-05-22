/**
 * SCEditor BBCode Plugin v1.3.3
 * http://www.samclarke.com/2011/07/sceditor/ 
 *
 * Copyright (C) 2011-2012, Sam Clarke (samclarke.com)
 *
 * SCEditor is dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */

// ==ClosureCompiler==
// @output_file_name jquery.sceditor.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/*jshint smarttabs: true, jquery: true, eqnull:true, curly: false */

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
			formatString,
			getStyle,
			wrapInDivs,
			mergeTextModeCommands;

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
		
		/**
		 * Allowed children of specific HTML tags. Empty array if no
		 * children other than text nodes are allowed
		 * @private
		 */
		var validChildren = {
			ul: ['li'],
			ol: ['li'],
			table: ['tr'],
			tr: ['td', 'th'],
			code: ['br', 'p', 'div'],
			youtube: []
		};


		/**
		 * Initializer
		 */
		init = function() {
			$.data(element, "sceditorbbcode", base);
			
			base.options = $.extend({}, $.sceditor.defaultOptions, options);

			// build the BBCode cache
			buildBbcodeCache();

			(new $.sceditor(element,
				$.extend({}, base.options, {
					getHtmlHandler: base.getHtmlHandler,
					getTextHandler: base.getTextHandler,
					commands: mergeTextModeCommands()
				})
			));
		};
		
		mergeTextModeCommands = function() {
			// TODO: use selection as display text if is one.
			// TODO: add translations of the prompts
			var merge = {
				bold: { txtExec: ["[b]", "[/b]"] },
				italic: { txtExec: ["[i]", "[/i]"] },
				underline: { txtExec: ["[u]", "[/u]"] },
				strike: { txtExec: ["[s]", "[/s]"] },
				subscript: { txtExec: ["[sub]", "[/sub]"] },
				superscript: { txtExec: ["[sup]", "[/sup]"] },
				left: { txtExec: ["[left]", "[/left]"] },
				center: { txtExec: ["[center]", "[/center]"] },
				right: { txtExec: ["[right]", "[/right]"] },
				justify: { txtExec: ["[justify]", "[/justify]"] },
				//font: { txtExec: ["[u]", "[/u]"] },
				//size: { txtExec: ["[u]", "[/u]"] },
				//color: { txtExec: ["[u]", "[/u]"] },
				//bulletlist: { txtExec: ["[u]", "[/u]"] },
				//orderedlist: { txtExec: ["[u]", "[/u]"] },
				//table: { txtExec: ["[u]", "[/u]"] },
				horizontalrule: { txtExec: ["[hr]"] },
				code: { txtExec: ["[code]", "[/code]"] },
				image: { txtExec: function() {
					var url = prompt(this._("Enter the images URL:"));
					
					if(url)
						this.textEditorInsertText("[img]" + url + "[/img]");
				} },
				email: { txtExec: function() {
					var	email	= prompt(this._("Enter the e-mail address:"), "@"),
						text	= prompt(this._("Enter the displayed text:"), email) || email;
					
					if(email)
						this.textEditorInsertText("[email=" + email + "]" + text + "[/email]");
				} },
				link: { txtExec: function() {
					var	url	= prompt(this._("Enter the links URL:"), "http://"),
						text	= prompt(this._("Enter the displayed text:"), url) || url;
					
					if(url)
						this.textEditorInsertText("[url=" + url + "]" + text + "[/url]");
				} },
				quote: { txtExec: ["[quote]", "[/quote]"] },
				youtube: { txtExec: function() {
					var url = prompt(this._("Enter the YouTube video URL or ID:"));
					
					if(url)
					{
						if(url.indexOf("://") > -1)
							url = url.replace(/^[^v]+v.(.{11}).*/,"$1");
						
						this.textEditorInsertText("[youtube]" + url + "[/youtube]");
					}
				} }
			};

			return $.extend(true, {}, merge, $.sceditor.commands);
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
		
		getStyle = function(element, property) {
			var	name = $.camelCase(property),
				$elm;

			// add special exception for align
			if("text-align" === property)
			{
				$elm = $(element);
				
				if($elm.parent().css(property) !== $elm.css(property) &&
					$elm.css('display') === "block" && !$elm.is('hr') && !$elm.is('th'))
					return $elm.css(property);
			}
			
			if(element.style)
				return element.style[name];
			
			return null;
		};

		/**
		 * Checks if any bbcode styles match the elements styles
		 * 
		 * @private
		 * @return string Content with any matching bbcode tags wrapped around it.
		 */
		handleStyles = function(element, content, blockLevel) {
			var	elementPropVal,
				tag = element[0].nodeName.toLowerCase();

			// convert blockLevel to boolean
			blockLevel = !!blockLevel;
			
			if(!stylesToBbcodes[blockLevel])
				return content;
			
			$.each(stylesToBbcodes[blockLevel], function(property, bbcodes) {
				elementPropVal = getStyle(element[0], property);
				if(elementPropVal == null || elementPropVal === "")
					return;

				// if the parent has the same style use that instead of this one
				// so you dont end up with [i]parent[i]child[/i][/i]
				if(getStyle(element.parent()[0], property) === elementPropVal)
					return;

				$.each(bbcodes, function(bbcode, values) {
					if((element[0].childNodes.length === 0 || element[0].childNodes[0].nodeName.toLowerCase() === "br") &&
						!base.bbcodes[bbcode].allowsEmpty)
						return;
					
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
			var tag = element[0].nodeName.toLowerCase();
			
			// convert blockLevel to boolean
			blockLevel = !!blockLevel;

			if(tagsToBbcodes[tag] && tagsToBbcodes[tag][blockLevel]) {
				// loop all bbcodes for this tag
				$.each(tagsToBbcodes[tag][blockLevel], function(bbcode, bbcodeAttribs) {
					if((element[0].childNodes.length === 0 || element[0].childNodes[0].nodeName.toLowerCase() === "br") &&
						!base.bbcodes[bbcode].allowsEmpty)
						return;
					
					// if the bbcode requires any attributes then check this has
					// all needed
					if(bbcodeAttribs !== null) {
						var runBbcode = false;

						// loop all the bbcode attribs
						$.each(bbcodeAttribs, function(attrib, values)
						{
							// check if has the bbcodes attrib
							if(element.attr(attrib) == null)
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
			
			// add newline after paragraph elements p and div (WebKit uses divs) and br tags
			if(blockLevel && /^(br|div|p)$/.test(tag))
			{
				var parentChildren = element[0].parentNode.childNodes;
				
				// if it's a <p><br /></p> the paragraph will put the newline so skip the br
				if(!("br" === tag && parentChildren.length === 1) &&
					!("br" === tag && parentChildren[parentChildren.length-1] === element[0])) {
					content += "\n";
				}

				// needed for browsers that enter textnode then when return is pressed put the rest in a div, i.e.:
				// text<div>line 2</div>
				if("br" !== tag && !$.sceditor.dom.isInline(element.parent()[0]) && element[0].previousSibling &&
					element[0].previousSibling.nodeType === 3) {
					content = "\n" + content;
				}
			}

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
				return typeof args[p1-0+1] !== "undefined"? 
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
			$.sceditor.dom.removeWhiteSpace(domBody[0]);
			
			return $.trim(base.elementToBbcode(domBody));
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
					var	$node		= $(node),
						curTag		= '',
						tag		= node.nodeName.toLowerCase(),
						vChild		= validChildren[tag],
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
					else if(node.wholeText && (!node.previousSibling || node.previousSibling.nodeType !== 3))
					{
						if($(node).parents('code').length === 0)
							ret += node.wholeText.replace(/ +/g, " ");
						else
							ret += node.wholeText;
					}
					else if(!node.wholeText)
						ret += node.nodeValue;
				}, false, true);
				
				return ret;
			}($element.get(0)));
		};

		/**
		 * Converts BBCode to HTML
		 * 
		 * @param {String} text
		 * @param {Bool} isPaste
		 * @return {String} HTML
		 */
		base.getTextHandler = function(text, isPaste) {
			var	oldText, replaceBBCodeFunc,
				bbcodeRegex = /\[([^\[\s=]*?)(?:([^\[]*?))?\]((?:[\s\S(?!=\[\\\1)](?!\[\1))*?)\[\/(\1)\]/g,
				atribsRegex = /(\S+)=((?:(?:(["'])(?:\\\3|[^\3])*?\3))|(?:[^'"\s]+))/g;

			replaceBBCodeFunc = function(str, bbcode, attrs, content)
			{
				var	attrsMap = {},
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
					.replace(/\n/g, "<br />");

			while(text !== oldText)
			{
				oldText = text;
				text    = text.replace(bbcodeRegex, replaceBBCodeFunc);
			}

			// As hr is the only bbcode not to have a start and end tag it's
			// just being replace here instead of adding support for it above.
			text = text.replace(/\[hr\]/gi, "<hr>");
			
			// replace multi-spaces which are not inside tags with a non-breaking space
			// to preserve them. Otherwise they will just be converted to 1!
			text = text.replace(/ {2}(?=([^<\>]*?<|[^<\>]*?$))/g, " &nbsp;");
			
			return wrapInDivs(text, isPaste);
		};
		
		/**
		 * Wraps divs around inline HTML. Needed for IE
		 * 
		 * @param string html
		 * @return string HTML
		 */
		wrapInDivs = function(html, excludeFirstLast)
		{
			var	d		= document,
				inlineFrag	= d.createDocumentFragment(),
				outputDiv	= d.createElement('div'),
				tmpDiv		= d.createElement('div'),
				div, node, next, nodeName;
			
			$(tmpDiv).hide().appendTo(d.body);
			tmpDiv.innerHTML = html;
			
			node = tmpDiv.firstChild;
			while(node)
			{
				next = node.nextSibling;
				nodeName = node.nodeName.toLowerCase();

				if((node.nodeType === 1 && !$.sceditor.dom.isInline(node)) || nodeName === "br")
				{
					if(inlineFrag.childNodes.length > 0 || nodeName === "br")
					{
						div = d.createElement('div');
						div.appendChild(inlineFrag);
						
						// Putting BR in a div in IE9 causes it to do a double line break,
						// as much as I hate browser UA sniffing, to do feature detection would
						// be more code than it's worth for this specific bug.
						if(nodeName === "br" && (!$.sceditor.ie || $.sceditor.ie < 9))
							div.appendChild(d.createElement('br'));
						
						outputDiv.appendChild(div);
						inlineFrag = d.createDocumentFragment();
					}
					
					if(nodeName !== "br")
						outputDiv.appendChild(node);
				}
				else
					inlineFrag.appendChild(node);
					
				node = next;
			}
			
			if(inlineFrag.childNodes.length > 0)
			{
				div = d.createElement('div');
				div.appendChild(inlineFrag);
				outputDiv.appendChild(div);
			}
			
			// needed for paste, the first shouldn't be wrapped in a div
			if(excludeFirstLast)
			{
				node = outputDiv.firstChild;
				if(node && node.nodeName.toLowerCase() === "div")
				{
					while((next = node.firstChild))
						outputDiv.insertBefore(next, node);
					
					if($.sceditor.ie >= 9)
						outputDiv.insertBefore(d.createElement('br'), node);
					
					outputDiv.removeChild(node);
				}
				
				node = outputDiv.lastChild;
				if(node && node.nodeName.toLowerCase() === "div")
				{
					while((next = node.firstChild))
						outputDiv.insertBefore(next, node);

					if($.sceditor.ie >= 9)
						outputDiv.insertBefore(d.createElement('br'), node);
					
					outputDiv.removeChild(node);
				}
			}

			$(tmpDiv).remove();
			return outputDiv.innerHTML;
		};

		init();
	};
	
	$.sceditorBBCodePlugin.bbcodes = {
		// START_COMMAND: Bold
		b: {
			tags: {
				b: null,
				strong: null
			},
			styles: {
				// 401 is for FF 3.5
				"font-weight": ["bold", "bolder", "401", "700", "800", "900"]
			},
			format: "[b]{0}[/b]",
			html: '<strong>{0}</strong>'
		},
		// END_COMMAND

		// START_COMMAND: Italic
		i: {
			tags: {
				i: null,
				em: null
			},
			styles: {
				"font-style": ["italic", "oblique"]
			},
			format: "[i]{0}[/i]",
			html: '<em>{0}</em>'
		},
		// END_COMMAND

		// START_COMMAND: Underline
		u: {
			tags: {
				u: null
			},
			styles: {
				"text-decoration": ["underline"]
			},
			format: "[u]{0}[/u]",
			html: '<u>{0}</u>'
		},
		// END_COMMAND

		// START_COMMAND: Strikethrough
		s: {
			tags: {
				s: null,
				strike: null
			},
			styles: {
				"text-decoration": ["line-through"]
			},
			format: "[s]{0}[/s]",
			html: '<s>{0}</s>'
		},
		// END_COMMAND

		// START_COMMAND: Subscript
		sub: {
			tags: {
				sub: null
			},
			format: "[sub]{0}[/sub]",
			html: '<sub>{0}</sub>'
		},
		// END_COMMAND

		// START_COMMAND: Superscript
		sup: {
			tags: {
				sup: null
			},
			format: "[sup]{0}[/sup]",
			html: '<sup>{0}</sup>'
		},
		// END_COMMAND

		// START_COMMAND: Font
		font: {
			tags: {
				font: {
					face: null
				}
			},
			styles: {
				"font-family": null
			},
			format: function(element, content) {
				if(element[0].nodeName.toLowerCase() === "font" && element.attr('face'))
					return '[font=' + this.stripQuotes(element.attr('face')) + ']' + content + '[/font]';

				return '[font=' + this.stripQuotes(element.css('font-family')) + ']' + content + '[/font]';
			},
			html: function(element, attrs, content) {
				return '<font face="' + attrs.defaultAttr + '">' + content + '</font>';
			}
		},
		// END_COMMAND

		// START_COMMAND: Size
		size: {
			tags: {
				font: {
					size: null
				}
			},
			styles: {
				"font-size": null
			},
			format: function(element, content) {
				var	fontSize = element.css('fontSize'),
					size     = 1;

				// Most browsers return px value but IE returns 1-7
				if(fontSize.indexOf("px") > -1) {
					// convert size to an int
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
		// END_COMMAND

		// START_COMMAND: Color
		color: {
			tags: {
				font: {
					color: null
				}
			},
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
					var m;
		
					function toHex(n) {
						n = parseInt(n,10);
						if(isNaN(n))
							return "00";
						n = Math.max(0,Math.min(n,255)).toString(16);
		
						return n.length<2 ? '0'+n : n;
					}
		
					// rgb(n,n,n);
					if((m = rgbStr.match(/rgb\((\d+),\s*?(\d+),\s*?(\d+)\)/i)))
						return '#' + toHex(m[1]) + toHex(m[2]-0) + toHex(m[3]-0);
		
					// expand shorthand
					if((m = rgbStr.match(/#([0-f])([0-f])([0-f])\s*?$/i)))
						return '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3];
					
					return rgbStr;
				};
		
				var color = element.css('color');

				if(element[0].nodeName.toLowerCase() === "font" && element.attr('color'))
					color = element.attr('color');
				
				color = rgbToHex(color);

				return '[color=' + color + ']' + content + '[/color]';
			},
			html: function(element, attrs, content) {
				return '<font color="' + attrs.defaultAttr + '">' + content + '</font>';
			}
		},
		// END_COMMAND

		// START_COMMAND: Lists
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
		// END_COMMAND

		// START_COMMAND: Table
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
			isBlock: true,
			format: "[th]{0}[/th]",
			html: '<th>{0}</th>'
		},
		td: {
			tags: {
				td: null
			},
			isBlock: true,
			format: "[td]{0}[/td]",
			html: '<td>{0}<br class="sceditor-ignore" /></td>'
		},
		// END_COMMAND

		// START_COMMAND: Emoticons
		emoticon: {
			allowsEmpty: true,
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
		// END_COMMAND

		// START_COMMAND: Horizontal Rule
		horizontalrule: {
			allowsEmpty: true,
			tags: {
				hr: null
			},
			format: "[hr]{0}",
			html: "<hr />"
		},
		// END_COMMAND

		// START_COMMAND: Image
		img: {
			allowsEmpty: true,
			tags: {
				img: {
					src: null
				}
			},
			format: function(element, content) {
				// check if this is an emoticon image
				if(typeof element.attr('data-sceditor-emoticon') !== "undefined")
					return content;

				var attribs = "=" + $(element).width() + "x" + $(element).height();

				return '[img' + attribs + ']' + element.attr('src') + '[/img]';
			},
			html: function(element, attrs, content) {
				var attribs = "", parts;

				// handle [img width=340 height=240]url[/img]
				if(typeof attrs.width !== "undefined")
					attribs += ' width="' + attrs.width + '"';
				if(typeof attrs.height !== "undefined")
					attribs += ' height="' + attrs.height + '"';

				// handle [img=340x240]url[/img]
				if(typeof attrs.defaultAttr !== "undefined") {
					parts = attrs.defaultAttr.split(/x/i);

					attribs = ' width="' + parts[0] + '"' +
						' height="' + (parts.length === 2 ? parts[1] : parts[0]) + '"';
				}

				return '<img ' + attribs + ' src="' + content + '" />';
			}
		},
		// END_COMMAND

		// START_COMMAND: URL
		url: {
			allowsEmpty: true,
			tags: {
				a: {
					href: null
				}
			},
			format: function(element, content) {
				// make sure this link is not an e-mail, if it is return e-mail BBCode
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
		// END_COMMAND

		// START_COMMAND: E-mail
		email: {
			html: function(element, attrs, content) {
				if(typeof attrs.defaultAttr === "undefined")
					attrs.defaultAttr = content;

				return '<a href="mailto:' + attrs.defaultAttr + '">' + content + '</a>';
			}
		},
		// END_COMMAND

		// START_COMMAND: Quote
		quote: {
			tags: {
				blockquote: null
			},
			isBlock: true,
			format: function(element, content) {
				var	attr = '';

				if($(element).children("cite:first").length === 1) {
					attr = '=' + $(element).children("cite:first").text();

					content = '';
					$(element).children("cite:first").remove();
					content = this.elementToBbcode($(element));
				}

				return '[quote' + attr + ']' + content + '[/quote]';
			},
			html: function(element, attrs, content) {
				if(typeof attrs.defaultAttr !== "undefined")
					content = '<cite>' + attrs.defaultAttr + '</cite>' + content;

				return '<blockquote>' + content + '</blockquote>';
			}
		},
		// END_COMMAND

		// START_COMMAND: Code
		code: {
			tags: {
				code: null
			},
			isBlock: true,
			format: "[code]{0}[/code]",
			html: '<code>{0}</code>'
		},
		// END_COMMAND


		// START_COMMAND: Left
		left: {
			styles: {
				"text-align": ["left", "-webkit-left", "-moz-left", "-khtml-left"]
			},
			isBlock: true,
			format: "[left]{0}[/left]",
			html: '<div align="left">{0}</div>'
		},
		// END_COMMAND

		// START_COMMAND: Centre
		center: {
			styles: {
				"text-align": ["center", "-webkit-center", "-moz-center", "-khtml-center"]
			},
			isBlock: true,
			format: "[center]{0}[/center]",
			html: '<div align="center">{0}</div>'
		},
		// END_COMMAND

		// START_COMMAND: Right
		right: {
			styles: {
				"text-align": ["right", "-webkit-right", "-moz-right", "-khtml-right"]
			},
			isBlock: true,
			format: "[right]{0}[/right]",
			html: '<div align="right">{0}</div>'
		},
		// END_COMMAND

		// START_COMMAND: Justify
		justify: {
			styles: {
				"text-align": ["justify", "-webkit-justify", "-moz-justify", "-khtml-justify"]
			},
			isBlock: true,
			format: "[justify]{0}[/justify]",
			html: '<div align="justify">{0}</div>'
		},
		// END_COMMAND

		// START_COMMAND: YouTube
		youtube: {
			allowsEmpty: true,
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
			html: '<iframe width="560" height="315" src="http://www.youtube.com/embed/{0}?wmode=opaque' +
				'" data-youtube-id="{0}" frameborder="0" allowfullscreen></iframe>'
		},
		// END_COMMAND
		
		// this is here so that commands above can be removed
		// without having to remove the , after the last one.
		// Needed for IE.
		ignore: {}
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
	 * @param String		name		The BBCode name
	 * @param Object		tags		Any html tags this bbcode applies to, i.e. strong for [b]
	 * @param Object		styles		Any style properties this applies to, i.e. font-weight for [b]
	 * @param String|Function	format		Function or string to convert the element into BBCode
	 * @param String|Function	html		String or function to format the BBCode back into HTML.
	 * @param BOOL			allowsEmpty	If this BBCodes is allowed to be empty, e.g. [b][/b]
	 * @return Bool
	 */
	$.sceditorBBCodePlugin.setCommand = function(name, tags, styles, format, html, allowsEmpty) {
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
			
		if(allowsEmpty)
			$.sceditorBBCodePlugin.bbcodes[name].allowsEmpty = allowsEmpty;
		
		return true;
	};

	$.fn.sceditorBBCodePlugin = function(options) {
		return this.each(function() {
			(new $.sceditorBBCodePlugin(this, options));
		});
	};
})(jQuery);
