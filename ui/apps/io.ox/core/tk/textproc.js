/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
'use strict';

define('io.ox/core/tk/textproc', ['io.ox/core/emoji/util'], function (emoji) {

    var paste_preprocess = function (pl, o) {
        //console.debug('pre', o.content);
        o.content = o.content
            // remove comments
            .replace(/<!--(.*?)-->/g, '')
            // remove emoji images and convert them back to unicode characters
            .replace(/<img[^>]* data-emoji-unicode=\"([^\"]*)\"[^>]*>/gi, '$1')
            // remove class attribute and custom attributes
            .replace(/(data-[^=]+|class)="[^"]*"/ig, '')
            // remove relative links (remove if links don't start with a protocol)
            .replace(/<a[^>]+href="(?!.+:)[^"].+?">(.+)<\/\s?a>/gi, '$1')
            // remove &nbsp;
            .replace(/&nbsp;/ig, ' ')
            // fix missing white-space before/after links
            .replace(/([^>\s])<a/ig, '$1 <a')
            .replace(/<\/\s?a>([^<\s,\.:;])/ig, '</a> $1')
            // beautify simple quotes
            .replace(/([^=])"([\w\- ]+)"/g, '$1\u201C$2\u201D')
            // beautify dashes
            .replace(/(\w\s)-(\s\w)/g, '$1\u2013$2');

        o.content = emoji.processEmoji(o.content);
    },

    paste_postprocess = function (pl, o) {

        // simplify DOM tree
        function simplify(memo, elem) {
            var self = $(elem),
                tagName = elem.tagName,
                children = self.children(),
                text,
                unwrapDiv = true;

            if (tagName === 'DIV' && self.attr('id') && self.attr('id').indexOf('ox-text-p') !== -1) {
                // OX Text Paragraph DIV
                unwrapDiv = false;
            }

            // remove attributes
            self.removeAttr('id title alt rel');
            // is closed tag?
            if (/^(BR|HR|IMG)$/.test(tagName)) {
                return memo;
            }
            // fix text align
            if (self.attr('align')) {
                self.css('textAlign', self.attr('align')).removeAttr('align');
            }
            // fix text nodes
            self.contents().each(function () {
                if (elem.nodeType === 3) {
                    elem.nodeValue = elem.nodeValue
                        // fix space before quotes
                        .replace(/:$/, ': ');
                }
            });
            // has no children?
            if (children.length === 0) {
                //do not trim single spaces
                text = self.text() === ' ' ? self.text : $.trim(self.text());
                // has no text?
                if (text === '') {
                    // empty table cell?
                    if (tagName === 'TD') {
                        self.text('\u00A0');
                    } else {
                        // remove empty element
                        self.remove();
                        return false;
                    }
                } else {
                    // remove simple <span>, <small>, and <pre>
                    if (/^(SPAN|SMALL|PRE)$/.test(tagName)) {
                        if (!self.attr('class') && !self.attr('style')) {
                            self.replaceWith($.txt(self.text()));
                            return false;
                        }
                    }
                    // is quote?
                    if (/^".+"$/.test(text)) {
                        self.text(text.replace(/^"/, '\u201C').replace(/"$/, '\u201D'));
                    }
                }
            } else {
                // extraneous DIV?
                if (tagName === 'DIV' && !self.attr('class') && !self.attr('style') && unwrapDiv) {
                    children.eq(0).unwrap();
                    return false;
                }
            }
            return memo;
        }

        function removeEmptyParagraphs() {
            var self = $(this),
                contents = self.contents();
            if (contents.length === 1 && contents.get(0).tagName === 'BR') {
                self.remove();
            }
        }

        function unwrap() {
            $(this).children().first().unwrap();
        }

        function makeParagraph() {
            var self = $(this),
                style = self.attr('style'),
                p = $('<p>');
            if (style) {
                p.attr('style', style);
            }
            self.replaceWith(p.append(self.contents()));
        }

        function replaceCodeByEm() {
            var self = $(this);
            self.replaceWith($('<em>').text(self.text()));
        }

        function cleanUpLinks() {
            var self = $(this), match;
            if (!self.attr('href')) {
                // unwrap dead links (usually javascript hooks)
                self.replaceWith(self.contents());
            } else {
                // remove title & target
                self.removeAttr('title target');
                // fix references
                if (/^\[\d+\]$/.test(self.text()) && /^#/.test(self.attr('href'))) {
                    match = (String(self.text())).match(/^\[(\d+)\]$/);
                    self.replaceWith($('<sup>').text(match[1]).add($.txt(' ')));
                }
            }
        }

        function beautifyTable() {
            var self = $(this);
            self.removeAttr('width')
                .attr({
                    border: '0',
                    cellSpacing: '0',
                    cellPadding: '0'
                })
                .css({
                    lineHeight: '1em',
                    // center!
                    margin: '0.5em auto 0.5em auto'
                });
            self.find('th')
                .css({
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderBottom: '1px solid #555',
                    padding: '0.4em 1em 0.4em 1em'
                });
            self.find('td')
                .css({
                    borderBottom: '1px solid #aaa',
                    padding: '0.4em 1em 0.4em 1em'
                });
            self.find('tr').first()
                .find('td, th').css({
                    borderTop: '1px solid #555'
                });
            self.find('tr').last()
                .find('td, th').css({
                    borderBottom: '1px solid #555'
                });
        }

        var node = $(o.node), done;
        //console.debug('post', node.html());
        // remove iframes and other stuff that shouldn't be in an email
        // images too - doesn't work with copy/paste (except for emoji classed images)
        node.find(
            'iframe, object, applet, input, textarea, button, select, ' +
            'canvas, script, noscript, audio, video, img'
            )
            .filter(':not(img.emoji,img[src*="' + ox.abs + ox.root + '/api/file"])').remove();
        // beautify SUP tags
        node.find('sup').css('lineHeight', '0');
        // unwrap
        node.find('article, header, footer, section, form').each(unwrap);
        // clean up links
        node.find('a').each(cleanUpLinks);
        // replace <code> by <em>
        node.find('code').each(replaceCodeByEm);
        // simplify structure
        do {
            done = _(node.find('*')).inject(simplify, true);
        } while (!done);
        // beautify tables
        node.find('table').each(beautifyTable);
        // replace top-level <div> by <p>
        node.eq(0).children('div').each(makeParagraph);
        // remove <p> with just one <br> inside
        node.find('p').each(removeEmptyParagraphs);
    },

    htmltotext = function (string) {
        var ELEMENTS = [{
            patterns: 'p',
            replacement: function (str, attrs, innerHTML) {
                return innerHTML ? '\n\n' + innerHTML + '\n' : '';
            }
        },
        {
            patterns: ['br'],
            type: 'void',
            replacement: '\n'
        },
        {
            patterns: 'h([1-6])',
            replacement: function (str, hLevel, attrs, innerHTML) {
                return '\n\n' + innerHTML + '\n';
            }
        },
        {
            patterns: 'hr',
            type: 'void',
            replacement: '\n\n- - -\n'
        },
        {
            patterns: 'a',
            replacement: function (str, attrs, innerHTML) {
                var href = attrs.match(attrRegExp('href'));
                if (/^mailto:/.test(href[1])) return href[1].substr(7).length ? href[1].substr(7) : '';
                return href ? (innerHTML ? innerHTML : href[1]) : '';
            }
        }];

        for (var i = 0, len = ELEMENTS.length; i < len; i++) {
            if (typeof ELEMENTS[i].patterns === 'string') {
                string = replaceEls(string, { tag: ELEMENTS[i].patterns, replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
            } else {
                for (var j = 0, pLen = ELEMENTS[i].patterns.length; j < pLen; j++) {
                    string = replaceEls(string, { tag: ELEMENTS[i].patterns[j], replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
                }
            }
        }

        function replaceEls(html, el) {

            var pattern, regex, markdown;
            /* jshint ignore:start */
            pattern = el.type === 'void' ? '<' + el.tag + '\\b([^>]*)\\/?>' : '<' + el.tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + el.tag + '>',
            /* jshint ignore:end */
            regex = new RegExp(pattern, 'gi');

            if (typeof el.replacement === 'string') {
                markdown = html.replace(regex, el.replacement);
            } else {
                markdown = html.replace(regex, function (str, p1, p2, p3) {
                    return el.replacement.call(this, str, p1, p2, p3);
                });
            }
            return markdown;
        }

        function attrRegExp(attr) {
            return new RegExp(attr + '\\s*=\\s*["\']?([^"\']*)["\']?', 'i');
        }

        // Pre code blocks

        string = string.replace(/<pre\b[^>]*>`([\s\S]*?)`<\/pre>/gi, function (str, innerHTML) {
            var text = innerHTML;
            text = text.replace(/^\t+/g, '  '); // convert tabs to spaces (you know it makes sense)
            text = text.replace(/\n/g, '\n    ');
            return '\n\n    ' + text + '\n';
        });

        // Lists

        // Escape numbers that could trigger an ol
        // If there are more than three spaces before the code, it would be in a pre tag
        // Make sure we are escaping the period not matching any character
        string = string.replace(/^(\s{0,3}\d+)\. /g, '$1\\. ');

        // Converts lists that have no child lists (of same type) first, then works its way up
        var noChildrenRegex = /<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;
        while (string.match(noChildrenRegex)) {
            string = string.replace(noChildrenRegex, replaceLists);
        }

        function replaceLists(html) {

            html = html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, function (str, listType, innerHTML) {
                var lis = innerHTML.split('</li>');
                lis.splice(lis.length - 1, 1);

                for (i = 0, len = lis.length; i < len; i++) {
                    if (lis[i]) {
                        /* jshint ignore:start */
                        var prefix = (listType === 'ol') ? (i + 1) + '.  ' : '*   ';
                        lis[i] = lis[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function (str, innerHTML) {
                            innerHTML = innerHTML
                                .replace(/^\s+/, '')
                                .replace(/\n\n/g, '\n\n    ')
                                // indent nested lists
                                .replace(/\n([ ]*)+(\*|\d+\.) /g, '\n$1    $2 ');
                            return prefix + innerHTML;
                        });
                        /* jshint ignore:end */
                    }
                    lis[i] = lis[i].replace(/(.) +$/m, '$1');
                }
                return lis.join('\n');
            });

            return '\n\n' + html.replace(/[ \t]+\n|\s+$/g, '');
        }

        // Blockquotes iterate
        var deepest = /<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;
        while (string.match(deepest)) {
            string = string.replace(deepest, replaceBlockquotes);
        }

        function replaceBlockquotes(html) {
            return html.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, function (string,  inner) {
                inner = inner.replace(/^\s+|\s+$/g, '');
                inner = cleanUp(inner);
                inner = inner
                    .replace(/^/gm, '> ')
                    .replace(/^(>([ \t]{2,}>)+)/gm, '> >');
                return inner;
            });
        }

        function cleanUp(string) {
            return string
                .replace(/&nbsp;/g, ' ')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/<!--(.*?)-->/g, '')             // Remove comments
                .replace(/<img[^>]* data-emoji-unicode=\"([^\"]*)\"[^>]*>/gi, '$1')
                .replace(/(<\/?\w+(\s[^<>]*)?\/?>)/g, '') // Remove all remaining tags except mail addresses
                .replace(/^[\t\r\n]+|[\t\r\n]+$/g, '')    // Trim leading/trailing whitespace
                .replace(/\n\s+\n/g, '\n\n')
                .replace(/\n{3,}/g, '\n\n');              // limit consecutive linebreaks to 2
        }

        string = cleanUp(string);
        string = string.replace(/^\s+\n\n/,'\n');
        // only insert newline when content starts with quote
        if (!/^\n\>\s/.test(string)) {
            string = string.replace(/^\n/, '');
        }
        return string;
    };

    var texttohtml = function (string) {
        var noop = { exec: $.noop };
        var def = $.Deferred();
        require(['static/3rd.party/marked/lib/marked.js']).then(function (marked) {

            marked.prototype.constructor.Parser.prototype.parse = function (src) {
                this.inline = new marked.InlineLexer(src.links, this.options, this.renderer);
                _.extend(this.inline.rules, {
                    em:       noop,
                    strong:   noop,
                    escape:   noop,
                    del:      noop,
                    image:    noop,
                    codespan: noop,
                    autolink: noop
                });
                this.tokens = src.reverse();

                var out = '';
                while (this.next()) {
                    out += this.tok();
                }

                return out;
            };

            marked.setOptions({
                renderer: new marked.Renderer(),
                gfm: true,
                tables: false,
                breaks: true,
                pedantic: false,
                sanitize: true,
                smartLists: true,
                smartypants: false
            });

            var lexer = new marked.Lexer();

            _.extend(lexer.rules, {
                heading:  noop,
                code: noop,
                hr: noop
            });

            def.resolve(marked.parser(lexer.lex(string)));
        });
        return def;
    };

    return {
        htmltotext: htmltotext,
        texttohtml: texttohtml,
        paste_preprocess: paste_preprocess,
        paste_postprocess: paste_postprocess
    };
});
