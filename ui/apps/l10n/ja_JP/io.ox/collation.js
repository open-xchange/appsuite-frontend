/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('l10n/ja_JP/io.ox/collation', function () {

    'use strict';

    // raw alphabet data
    // see http://en.wikipedia.org/wiki/Goj%C5%ABon
    // or http://en.wikipedia.org/wiki/Japanese_writing_system#Collation
    var tableau = [
            'あ い う え お ゔ',
            'か き く け こ が ぎ ぐ げ ご',
            'さ し す せ そ ざ じ ず ぜ ぞ',
            'た ち つ て と だ ぢ づ で ど',
            'な に ぬ ね の',
            'は ひ ふ へ ほ ば び ぶ ぺ ぼ ぱ ぴ ぷ ぺ ぽ',
            'ま み む め も',
            'や ゆ よ',
            'ら り る れ ろ',
            'わ ゐ を ゑ ん'
        ],
        hash = {},
        label = {}, // first column of all rows
        position = 0,
        sorter,
        index = [],
        isABC = /^[a-zäöü]/i;

    // construct some meta data we need for sorting
    _(tableau).each(function (row) {
        index.push(row[0]);
        _(row.split(' ')).each(function (char) {
            hash[char] = position++;
            label[char] = row[0];
        });
    });

    // the sorter
    // order is: Kana, Other, Latin, Empty
    sorter = function (a, b) {
        /*eslint no-nested-ternary: 0*/
        a = a.sort_name[0];
        b = b.sort_name[0];
        // empty (put at end)
        if (a === undefined && b === undefined) return 0;
        if (a === undefined) return +1;
        if (b === undefined) return -1;
        // kana (first)
        if (a in hash && b in hash) return hash[a] - hash[b];
        if (a in hash) return -1;
        if (b in hash) return +1;
        // case-insensitive
        a = a.toUpperCase();
        b = b.toUpperCase();
        // other (second: not kana / not latin)
        if (!isABC.test(a) && !isABC.test(b)) return a < b ? -1 : (a > b ? +1 : 0);
        if (!isABC.test(a)) return -1;
        if (!isABC.test(b)) return +1;
        // latin (third)
        return a < b ? -1 : (a > b ? +1 : 0);
    };

    return {

        sorter: sorter,
        index: index,

        // just checks if getKanaLabel() would be successful
        isKana: function (char) {
            return label[char] !== undefined;
        },

        // actually looks in the tableau and returns the first char per row
        getKanaLabel: function (char) {
            return label[char] || '';
        }
    };
});
