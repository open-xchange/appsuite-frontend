/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/notes/parser', [], function () {

    'use strict';

    var replacements = {
        'u': '_', '/u': '_',
        'b': '*', '/b': '*',
        'strike': '~', '/strike': '~',
        'a': '', '/a': '',
        'div': '\n', '/div': '',
        'br': '\n',
        'ul': '', '/ul': '',
        'ol': '', '/ol': '',
        'li': function (attr) {
            if (/checkmark/.test(attr)) return /checked/.test(attr) ? '- [x] ' : '- [ ] ';
            if (/number/.test(attr)) return '# ';
            return '* ';
        },
        '/li': '\n'
    };

    return {

        parsePlainText: function (text) {

            text = $.trim(text);
            var lines = _.escape(text).split(/\n/), openList;

            lines = lines.map(function (line) {
                var match = line.match(/^(\*\s|\#\s|\-\s\[(?:\s|x)\])\s?(.+)$/), out, item;
                if (!match) {
                    if (openList) {
                        out = '</' + openList + '>' + line + '\n';
                        openList = false;
                    } else {
                        out = line + '\n';
                    }
                    return out;
                }
                item = (/^-\s\[x]/.test(line) ? '<li class="checked">' : '<li>') + match[2] + '</li>';
                if (openList) return item;
                switch (line[0]) {
                    case '#': out = '<ol>'; openList = 'ol'; break;
                    case '-': out = '<ul class="todo">'; openList = 'ul'; break;
                    default: out = '<ul>'; openList = 'ul'; break;
                }
                return out + item;
            });

            var html = lines.join('')
                    .replace(/(^|[^\\])\*([^<\*]+)\*/g, '$1<b>$2</b>')
                    .replace(/(^|[^\\])\_([^<\_]+)\_/g, '$1<u>$2</u>')
                    .replace(/(^|[^\\])\~([^<\~]+)\~/g, '$1<strike>$2</strike>')
                    .replace(/(http\:\/\/\S+)/ig, '<a href="$1" target="_blank" rel="noopener">$1</a>')
                    .replace(/\n/g, '<br>');

            return { html: html, preview: this.getPreview(text), content: text };
        },

        parseHTML: function ($content) {

            // add classes to ordered list items
            $content.find('ul.todo > li').addClass('checkmark');
            $content.find('ol > li').addClass('number');
            // fix special patterns
            var html = $content.html().replace(/<div><br><\/div>/g, '<br>');
            // get rid of unwanted DIVs (hopefully not needed)
            var text = html.replace(/<(\/?\w+)([^>]*)>/g, function (all, tag, attr) {
                // ensure lower case
                tag = tag.toLowerCase();
                var replacement = replacements[tag];
                if (replacement === undefined) return all;
                if (_.isFunction(replacement)) return replacement(attr);
                return replacement;
            });

            return { content: text, preview: this.getPreview(text) };
        },

        getPreview: function (text) {
            return String(text || '').replace(/\s+/g, ' ').substr(0, 200);
        }
    };
});
