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

define('l10n/ja_JP/io.ox/collation', function () {

    'use strict';

    // helper for half width katakana
    // I really don't know who came up with this encoding style
    var dakuten = 'ﾞ ゙ ゛'.split(' '),
        handakuten = 'ﾟ ﾟ ゜'.split(' '),
        // only katakana that can have dakuten or handakuten
        halfWidthKana = 'ｳ ｴ ｵ ｶ ｷ ｸ ｹ ｺ ｻ ｼ ｽ ｾ ｿ ﾀ ﾁ ﾂ ｯ ﾃ ﾄ ﾊ ﾋ ﾌ ﾍ ﾎ ﾜ'.split(' ');

    // raw alphabet data
    // see http://en.wikipedia.org/wiki/Goj%C5%ABon
    // or http://en.wikipedia.org/wiki/Japanese_writing_system#Collation
    // and for half width kana https://en.wikipedia.org/wiki/Half-width_kana
    var tableau = [
            // Hiragana, Hiragana small, Katakana, Katakana half-width, , Katakana small, Hiragana with dakuten, Katakana with dakuten, Hiragana with handakuten, Katakana with handakuten
            'あ ぁ ア ｱ ァ ' + // a
            'い ぃ イ ｲ ィ ' + // i
            'う ぅ ウ ｳ ゥ ゔ ヴ ｳﾞ ' + // u, vu
            'え ぇ エ ｴ ェ ' +  // e
            'お ぉ オ ｵ ォ',  // o

            'か ゕ カ ｶ ヵ が ガ ｶﾞ ' + // ka, ga
            'き キ ｷ ぎ ギ ｷﾞ ' + // ki, gi
            'く ク ｸ ㇰ ぐ グ ㇰﾞ ' + // ku, gu
            'け ゖ ケ ｹ ヶ げ ゲ ｹﾞ ' + // ke, ge
            'こ コ ｺ ご ゴ ｺﾞ',      // ko, go

            'さ サ ｻ ざ ザ ｻﾞ ' + // sa, za
            'し シ ｼ ㇱ じ ジ ｼﾞ ' + // shi, ji
            'す ス ｽ ㇲ ず ズ ｽﾞ ' +// su ,zu
            'せ セ ｾ ぜ ゼ ｾﾞ ' + // se, ze
            'そ ソ ｿ ぞ ゾ ｿﾞ',  // so, zo

            'た タ ﾀ だ ダ ﾀﾞ ' + // ta, da
            'ち チ ﾀ ぢ ヂ ﾀﾞ ' + // chi, ji
            'つ っ ツ ﾂ ッ ｯ づ ヅ ﾂﾞ ｯﾞ ' + // tsu, zu ( note: there is a small half-width katakana character for tsu)
            'て テ ﾃ で デ ﾃﾞ ' + // te, de
            'と ト ﾄ ㇳ ど ド ﾄﾞ', // to, do

            'な ナ ﾅ ' + // na
            'に ニ ﾆ ' + // ni
            'ぬ ヌ ﾇ ㇴ ' + // nu
            'ね ネ ﾈ ' + // ne
            'の ノ ﾉ', // no

            'は ハ ﾊ ㇵ ば バ ﾊﾞ ぱ パ ﾊﾟ ' + // ha, ba, pa
            'ひ ヒ ﾋ ㇶ び ビ ﾋﾞ ぴ ピ ﾋﾟ ' + // hi, bi, pi
            'ふ フ ﾌ ㇷ ぶ ブ ﾌﾞ ぷ プ ﾌﾟ ' + // fu , bu, pi
            'へ ヘ ﾍ ㇸ べ ベ ﾍﾞ ぺ ペ ﾍﾟ ' + // he, be, pe
            'ほ ホ ﾎ ㇹ ぼ ボ ﾎﾞ ぽ ポ ﾎﾟ',  // ho, bo, po

            'ま マ ﾏ ' + // ma
            'み ミ ﾐ ' + // mi
            'む ム ﾑ ㇺ ' + // mu
            'め メ ﾒ ' + // me
            'も モ ﾓ',   // mo

            // ('yi' and 'ye' do not exist)
            'や ゃ ヤ ﾔ ャ ' + // ya
            'ゆ ゅ ユ ﾕ ュ ' + // yu
            'よ ょ ヨ ﾖ ョ', // yo

            'ら ラ ﾗ ㇻ ' + // ra
            'り リ ﾘ ㇼ ' + // ri
            'る ル ﾙ ㇽ ' + // ru
            'れ レ ﾚ ㇾ ' + // re
            'ろ ロ ﾛ ㇿ', // ro

            // ('wi' and 'we' are nearly obsolete. 'wu' does not exist. 'n' is an additional kana)
            'わ ゎ ワ ﾜ ヮ ヷ  ﾜﾞ' + // wa, va
            'ゐ ヰ ヸ ' + // wi
            'ゑ ヱ ヹ ' + // we
            'を ヲ ｦ ヺ ' + // wo
            'ん ン ﾝ' // n
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

    // dakuten and handakuten are written after the katakana they belong to if the katakana is a half width katakana. (think of umlauts with the dots after the character)
    var isHalfWidthWithDakutenOrHandakuten = function (char, sortName) {
        if (char && sortName && halfWidthKana.indexOf(char) !== -1) {
            //see if the next letter is a dakuten or handakuten
            if (sortName[1] && dakuten.indexOf(sortName[1]) !== -1) {
                char = char + dakuten[0];
            }
            if (sortName[1] && handakuten.indexOf(sortName[1]) !== -1) {
                char = char + handakuten[0];
            }
        }
        return char;
    };

    // the sorter
    // order is: Kana, Other, Latin, Empty
    sorter = function (a, b) {
        /*eslint no-nested-ternary: 0*/
        var aSortName = a.sort_name,
            bSortName = b.sort_name;
        a = a.sort_name[0];
        b = b.sort_name[0];
        // empty (put at end)
        if (a === undefined && b === undefined) return 0;
        if (a === undefined) return +1;
        if (b === undefined) return -1;
        // kana (first)
        if (a in hash && b in hash) {
            // see if this is a half width katakana
            a = isHalfWidthWithDakutenOrHandakuten(a, aSortName);
            b = isHalfWidthWithDakutenOrHandakuten(b, bSortName);
            return hash[a] - hash[b];
        }
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
