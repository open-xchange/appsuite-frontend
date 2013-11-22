/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

function normalizePath(str) {
    if (str.slice(-1) !== '/') str += '/';

    return str;
}

var escapes = {
    '\x00': '\\x00', '\x01': '\\x01', '\x02': '\\x02', '\x03': '\\x03',
    '\x04': '\\x04', '\x05': '\\x05', '\x06': '\\x06', '\x07': '\\x07',
    '\b': '\\b', '\t': '\\t', '\n': '\\n', '\v': '\\v', '\f': '\\f',
    '\r': '\\r', '\x0e': '\\x0e', '\x0f': '\\x0f', '\x10': '\\x10',
    '\x11': '\\x11', '\x12': '\\x12', '\x13': '\\x13', '\x14': '\\x14',
    '\x15': '\\x15', '\x16': '\\x16', '\x17': '\\x17', '\x18': '\\x18',
    '\x19': '\\x19', '\x1a': '\\x1a', '\x1b': '\\x1b', '\x1c': '\\x1c',
    '\x1d': '\\x1d', '\x1e': '\\x1e', '\x1f': '\\x1f', "'": "\\'",
    '\\': '\\\\', '\u2028': '\\u2028', '\u2029': '\\u2029'
};

function escape(s) {
    return s.replace(/[\x00-\x1f'\\\u2028\u2029]/g, function(c) {
        return escapes[c];
    });
}

module.exports = {
    escape: escape,
    normalizePath: normalizePath
}
