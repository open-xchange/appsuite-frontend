/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/metrics/util', ['io.ox/core/folder/api'], function (folderAPI) {

    'use strict';

    /*eslint-disable */

    // TODO: bower
    // https://github.com/wbond/md5-js
    /*!
     * Joseph Myer's md5() algorithm wrapped in a self-invoked function to prevent
     * global namespace polution, modified to hash unicode characters as UTF-8.
     *
     * Copyright 1999-2010, Joseph Myers, Paul Johnston, Greg Holt, Will Bond <will@wbond.net>
     * http://www.myersdaily.org/joseph/javascript/md5-text.html
     * http://pajhome.org.uk/crypt/md5
     *
     * Released under the BSD license
     * http://www.opensource.org/licenses/bsd-license
     */
    var md5;
    (function () {

        var add32;
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];

            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);

            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);

            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);

            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);

            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }

        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }

        function ff(a, b, c, d, x, s, t) {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
        }

        function gg(a, b, c, d, x, s, t) {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
        }

        function hh(a, b, c, d, x, s, t) {
            return cmn(b ^ c ^ d, a, b, x, s, t);
        }

        function ii(a, b, c, d, x, s, t) {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
        }

        function md51(s) {
            // Converts the string to UTF-8 "bytes" when necessary
            if (/[\x80-\xFF]/.test(s)) {
                s = unescape(encodeURI(s));
            }
            var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
            for (i = 64; i <= s.length; i += 64) {
                md5cycle(state, md5blk(s.substring(i - 64, i)));
            }
            s = s.substring(i - 64);
            var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i = 0; i < s.length; i++)
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) {
                md5cycle(state, tail);
                for (i = 0; i < 16; i++) tail[i] = 0;
            }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }

        function md5blk(s) { /* I figured global was faster.   */
            var md5blks = [], i; /* Andy King said do it this way. */
            for (i = 0; i < 64; i += 4) {
                md5blks[i >> 2] = s.charCodeAt(i) +
                                  (s.charCodeAt(i + 1) << 8) +
                                  (s.charCodeAt(i + 2) << 16) +
                                  (s.charCodeAt(i + 3) << 24);
            }
            return md5blks;
        }

        var hex_chr = '0123456789abcdef'.split('');

        function rhex(n) {
            var s = '', j = 0;
            for (; j < 4; j++)
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] +
                 hex_chr[(n >> (j * 8)) & 0x0F];
            return s;
        }

        function hex(x) {
            for (var i = 0; i < x.length; i++)
            x[i] = rhex(x[i]);
            return x.join('');
        }

        md5 = function (s) {
            return hex(md51(s));
        };

        /* this function is much faster, so if possible we use it. Some IEs are the
        only ones I know of that need the idiotic second function, generated by an
        if clause.  */
        add32 = function (a, b) {
            return (a + b) & 0xFFFFFFFF;
        };

        if (md5('hello') !== '5d41402abc4b2a76b9719d911017c592') {
            add32 = function (x, y) {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            };
        }
    })();

    // https://developer.mozilla.org/de/docs/Web/API/navigator/doNotTrack
    function doNotTrack() {
        return [
            navigator.doNotTrack,
            navigator.msDoNotTrack,
            window.doNotTrack
        ].indexOf('1') > -1;
    }

    var KEY = 'metrics-userhash-v2';

    // hash of userdata + salt
    function getUserHash() {
        var userhash = _.getCookie(KEY);
        if (!userhash) {
            var salt = (Math.random() + 1).toString(36).substring(2),
                userhash = md5(salt);
            _.setCookie(KEY, userhash);
        }
        return userhash;
    }

    var getFolderFlags = (function () {

        var defaults = {
                1: 'default',   // tasks
                2: 'default',   // calendar
                3: 'default',   // contacts
                8: 'default'    // drive
            },
            types = {
                20: 'pictures',
                21: 'documents',
                22: 'music',
                23: 'videos',
                24: 'templates'
            },
            standard = {
                7: 'inbox',
                9: 'drafts',
                10: 'sent',
                11: 'spam',
                12: 'trash'
            },
            special = {
                'virtual/myshares': 'all-my-shares',
                'virtual/favorites/infostore': 'favorites',
                'virtual/favorites/contacts': 'favorites',
                'virtual/favorites/mail': 'favorites',
                'virtual/myfolders': 'my-folders'
            },
            reSection = /virtual\/flat\/(\D+)\/(private|public|shared|hidden)/;

        function getDefault(data) {
            // drive: not precise so leave it out
            if (data.module === 'infostore' && data.folder_id !== '9') return;
            return defaults[data.standard_folder_type]
        }

        function getContent(data) {
            // contacts: gab special
            if (data.module === 'contacts' && data.id === '6') return 'gab';
            // virtual section folders
            var match = data.id.match(reSection)
            if (match) return 'section-' + match[2];
            // special, type and standard-type
            return special[data.id] || types[data.type] || standard[data.standard_folder_type];
        }

        function gather(data) {
            data = data || {};
            var result = {};

            // account: 'dropbox://164' -> ['dropbox', '164']
            if (data.module === 'infostore' && data.account_id) result.account = data.account_id.split('://')[0];

            // type: access
            _.each(['shared', 'private', 'public', 'system'/*, 'unifiedfolder'*/], function (type) {
                // drive: not precise so leave it
                if (data.module === 'infostore') return;
                if (!result.type && folderAPI.is(type, data)) result.type = type;
            });
            // real vs. virtual
            if (folderAPI.isVirtual(data.id)) result.virtual = 'virtual'
            // type: content
            result.content = getContent(data) || (folderAPI.is('trash', data) ? 'trash' : undefined);
            // type: default
            result.default = getDefault(data);// || (folderAPI.is('defaultfolder', data) ? 'default' : undefined);
            return result;
        }

        function listify (data) {
            return _.compact([data.account, data.type, data.virtual, data.content, data.default]);
        }

        return function (folder) {
            // ensure data is fully available
            return folderAPI
                .get(folder)
                .then(gather)
                .then(listify);
        }

    }());

    // stringified list to chunks (based on maximal number of chars)
    // TODO: edge case if first string in list is shorter than maxlength
    function toChunks(list, max, result) {
        result = result || [];
        var str = String(list);
        // exit condition
        if (str.length <= max) {
            result.push(str.split(','));
            return result;
        }
        // recursivley split at delimiter
        for (var i = max - 1; i >= 0; i--) {
            if (str[i] !== ',') continue;
            var head = str.substr(0,i),
                tail = str.substr(i + 1);
            // push head-array to result and process string-tail
            result.push(head.split(','));
            return toChunks(tail, max, result);
        }
    }

    return {
        md5: md5,
        doNotTrack: doNotTrack,
        getUserHash: getUserHash,
        getFolderFlags: getFolderFlags,
        toChunks: toChunks
    };

    /*eslint-enable */

});
