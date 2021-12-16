/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/tk/textproc', [
    'settings!io.ox/mail',
    'static/3rd.party/purify.min.js'
], function (mailSettings, DOMPurify) {

    'use strict';

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
            text = self.text().match(/^[ \u00A0\t]$/) ? self.text : $.trim(self.text());
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
        } else if (tagName === 'DIV' && !self.attr('class') && !self.attr('style') && unwrapDiv) {
            // extraneous DIV?
            children.eq(0).unwrap();
            return false;
        }
        return memo;
    }

    function unwrap() {
        $(this).children().first().unwrap();
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
            .find('td, th').css({ borderTop: '1px solid #555' });
        self.find('tr').last()
            .find('td, th').css({ borderBottom: '1px solid #555' });
    }

    function replaceParagraphs() {
        var p = $(this),
            style = p.attr('style'),
            div = $('<div>');
        if (style) div.attr('style', style);
        p.replaceWith(div.append(p.contents()), $('<div><br></div>'));
    }

    return {

        paste_preprocess: function (pl, o) {
            //console.debug('pre', o.content);
            o.content = o.content
                // remove comments
                .replace(/<!--(.*?)-->/g, '');
        },

        paste_postprocess: function (pl, o) {

            var node = $(o.node), done;
            //console.debug('post', node.html());
            // remove iframes and other stuff that shouldn't be in an email
            // images too - doesn't work with copy/paste (except for emoji classed images)
            node.find(
                'iframe, object, applet, input, textarea, button, select, canvas, script, noscript, audio, video, img'
            )
            .filter(':not(' +
                [
                    'img.emoji',
                    'img[src*="' + ox.abs + ox.root + '/api/file"]',
                    'img[src*="' + ox.root + '/api/file"]',
                    'img[src*="' + ox.abs + ox.root + '/api/image"]',
                    'img[src*="' + ox.root + '/api/image"]',
                    'img[data-pending="true"]'
                ].join(', ') + ')'
            ).remove();
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
            // replace <p>...</p> by <div>....<br></div>
            node.find('p').each(replaceParagraphs);
        },

        htmltotext: function (string) {

            var node = DOMPurify.sanitize(string, {
                FORBID_TAGS: ['STYLE', 'SCRIPT', 'TITLE'],
                ALLOWED_ATTR: ['href', 'type', 'value', 'checked', 'start', 'class'],
                RETURN_DOM: true
            });

            return finalize(traverse(node, {}));

            function traverse(node, flags) {
                return removeMarkers(_(node.childNodes).map(processElement.bind(null, flags)).join(''));
            }

            function processElement(flags, item, i, all) {
                if (item.nodeType === 3) {
                    if (flags.preserveWhitespace) return item.nodeValue;

                    // https://www.w3.org/TR/css-text-3/#white-space-processing
                    var str = item.nodeValue;
                    // remove leading whitespace only after a segment brak
                    if (i === 0 || isBlockElement(all[i - 1])) str = str.replace(/^\s+/g, '');
                    // remove trailing whitespace only before a segment break
                    if (i === all.length - 1 || isBlockElement(all[i + 1])) str = str.replace(/\s+$/g, '');
                    return str
                        // replace all newlines and tags by spaces
                        .replace(/[\n\t]/g, ' ')
                        // remove multiple space
                        .replace(/\s{2,}/g, ' ');
                }
                return processEmptyElements(item, i, all.length) || markBlockElements(item, processNestedElements(item, flags));
            }

            function processEmptyElements(item, i, length) {
                switch (item.nodeName) {
                    case 'BR':
                        // <br> at first or last position doesn't necessarily add a line break
                        // \u0001 = line break, \u200B = zero width space
                        var first = i === 0, last = i === length - 1, alone = length === 1;
                        return (first && alone) || last ? '\u200B' : '\u0001';
                    case 'HR':
                        return '\0------------------------------\0';
                    case 'INPUT':
                        switch (item.getAttribute('type')) {
                            case 'checkbox':
                            case 'radio':
                                return '[' + (item.hasAttribute('checked') ? 'X' : ' ') + ']';
                            default:
                                return '[' + (item.getAttribute('value') || '') + ']';
                        }
                    // no default
                }
            }

            function processNestedElements(item, flags) {
                var str = traverse(item, { preserveWhitespace: flags.preserveWhitespace || item.nodeName === 'PRE' });

                switch (item.nodeName) {
                    case 'DIV':
                        var isCustomBlock = item.classList.contains('io-ox-signature') || item.classList.contains('io-ox-hint');
                        return isCustomBlock ? '\0' + str + '\n' : str;
                    case 'A':
                        var href = item.getAttribute('href');
                        if (!/^https?:\/\//i.test(href)) return str;
                        return str && str !== href ? str + ' (' + href + ')' : href;
                    case 'BLOCKQUOTE':
                        return str.replace(/^/gm, '> ').replace(/\u0001/gm, '\n> ');
                    case 'UL':
                        return str.replace(/^/gm, '  ');
                    case 'OL':
                        var count = parseInt(item.getAttribute('start') || '1', 10);
                        return str.replace(/^\* /gm, function () {
                            return '  ' + (count++) + '. ';
                        });
                    case 'LI':
                        return '* ' + str.replace(/\u0001/g, '\n  ');
                    case 'TD':
                        return str + '\t';
                    case 'H1':
                    case 'H2':
                    case 'H3':
                        return '\n' + str;
                    default:
                        return str;
                }
            }

            function markBlockElements(item, str) {
                return isBlockElement(item) ? '\0' + str + '\0' : str;
            }

            function isBlockElement(item) {
                return /^(P|DIV|BLOCKQUOTE|UL|OL|LI|PRE|H\d|DL|ADDRESS|FIELDSET|FORM|NOSCRIPT|SECTION|TABLE|TR)$/.test(item.nodeName);
            }

            function removeMarkers(str) {
                return str
                    // remove superfluous markers (head & tail)
                    .replace(/(^\0+|\0+$)/g, '')
                    // finally replace block element markers by \n
                    // not \0+ or we loose empty newlines that are actually part of the signature, see OXUIB-331 reopen
                    .replace(/\0\0?/g, '\n');
            }

            function finalize(str) {
                return str
                    // remove zero width space
                    .replace(/\u200B/g, '')
                    // finally convert all <br> to \n
                    .replace(/\u0001+/g, '\n');
            }

        }
    };
});
