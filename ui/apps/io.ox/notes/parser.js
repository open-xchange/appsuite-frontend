/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/notes/parser', [], function () {

    'use strict';

    var replacements = {
        'i': '*', '/i': '*',
        'b': '**', '/b': '**',
        'u': '_', '/u': '_',
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
        '/li': '\n',
        'img': function (attr) {
            var match = attr.match(/src="(.*?)"/i);
            return match ? '![](' + match[1] + ') ' : ' ';
        }
    };

    return {

        parsePlainText: function (text) {

            text = $.trim(text);
            var lines = _.escape(text).split(/\n/), openList;

            lines = lines.map(function (line) {
                var match = line.match(/^(\*\s|#\s|-\s\[(?:\s|x)\])\s?(.+)$/), out, item;
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
                    .replace(/!\[\]\((.*?)\)/g, '<img src="$1">')
                    .replace(/(^|[^\\])\*\*([^<*]+)\*\*/g, '$1<b>$2</b>')
                    .replace(/(^|[^\\])\*([^<*]+)\*/g, '$1<i>$2</i>')
                    .replace(/(^|[^\\])_([^<_]+)_/g, '$1<u>$2</u>')
                    .replace(/(^|[^\\])~([^<~]+)~/g, '$1<strike>$2</strike>')
                    .replace(/(https?:\/\/\S+)/ig, '<a href="$1" target="_blank" rel="noopener">$1</a>')
                    .replace(/\n/g, '<br>');

            return { html: html, preview: this.getPreview(text), content: text };
        },

        parseHTML: function ($content) {

            // add classes to ordered list items
            $content.find('ul.todo > li').addClass('checkmark');
            $content.find('ol > li').addClass('number');
            // get html
            var html = $content.html();
            // fix special patterns
            html = html.replace(/<div><br><\/div>/g, '<br>');
            // convert entities
            html = html.replace(/&\w+;/g, function (entity) {
                var elem = document.createElement('span');
                elem.innerHTML = entity;
                return elem.innerText;
            });
            // get rid of unwanted DIVs (hopefully not needed)
            var text = html.replace(/<(\/?\w+)([^>]*)>/g, function (all, tag, attr) {
                // ensure lower case
                tag = tag.toLowerCase();
                var replacement = replacements[tag];
                if (replacement === undefined) return '';
                if (_.isFunction(replacement)) return replacement(attr);
                return replacement;
            });

            text = $.trim(text);

            return { content: text, html: html, preview: this.getPreview(text) };
        },

        getPreview: function (text) {
            return String(text || '').replace(/\s+/g, ' ').substr(0, 200);
        }
    };
});
