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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
