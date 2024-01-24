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

define('io.ox/core/folder/title', [], function () {

    'use strict';

    // shortens the folder title and adds ellipsis
    return function getFolderTitle(title, max) {

        title = String(title || '').trim();

        // anything to do?
        if (title.length < max) return title;

        var leadingDelimiter = /[_-]/.test(title[0]) ? title[0] : false,
            endingDelimiter = /[_-]/.test(title[title.length - 1]) ? title[title.length - 1] : false,
            split = title.split(/[ _-]+/),
            delimiters = title.split(/[^ _-]+/),
            length = title.length;

        if (leadingDelimiter) {
            split[1] = leadingDelimiter + split[1];
            split.splice(0, 1);
        }

        if (endingDelimiter) {
            split[split.length - 1] = endingDelimiter + split[split.length - 1];
            split.splice(split.length - 1, 1);
        }

        while (length > max && split.length > 2) {
            var index = Math.floor(split.length / 2);
            length -= split[index].length + 2;
            split.splice(index, 1);
            delimiters.splice(index + 1, 1);
            delimiters[Math.floor(delimiters.length / 2)] = '\u2026';
        }

        if (length > max) {
            return _.ellipsis(title, { charpos: 'middle', max: max, length: Math.floor(max / 2 - 1) });
        }

        return _(split).map(function (val, key) { return val + delimiters[key + 1]; }).join('');
    };
});
