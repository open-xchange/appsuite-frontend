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

    // raw alphabet data
    // see http://en.wikipedia.org/wiki/Goj%C5%ABon
    // or http://en.wikipedia.org/wiki/Japanese_writing_system#Collation
    //and for half width kana https://en.wikipedia.org/wiki/Half-width_kana
    var tableau = [
          // a  i  u  e  o
            'あ い う え お ' +      // Hiragana
            'ぁ ぃ ぅ ぇ ぉ ' +      // Hiragana small
            'ア イ ウ エ オ ' +      // Katakana
            'ァ ィ ゥ ェ ォ ' +      // Katakana small
            'ｱ ｲ ｳ ｴ ｵ ' +           // Katakana half width
            'ゔ ' +                 // Hiragana with dakuten uncommon (vu)
            'ヴ',                   // Katakana with dakuten uncommon (vu)
          // ka ki ku ke ko
            'か き く け こ ' +      // Hiragana
            'ゕ ゖ ' +              // Hiragana small
            'が ぎ ぐ げ ご ' +      // Hiragana with dakuten (ga gi gu ge go)
            'カ キ ク ケ コ ' +      // Katakana
            'ヵ ㇰ ヶ ' +           // Katakana small
            'ｶ ｷ ｸ ｹ ｺ ' +          // Katakana half width
            'ガ ギ グ ゲ ゴ',       // Katakana with dakuten (ga gi gu ge go)
         // sa shi su se so
            'さ し す せ そ ' +      // Hiragana
            'ざ じ ず ぜ ぞ ' +      // Hiragana with dakuten (za ji zu ze zo)
            'サ シ ス セ ソ ' +      // Katakana
            'ㇱ ㇲ' +               // Katakana small
            'ｻ ｼ ｽ ｾ ｿ ' +          // Katakana half width
            'ザ ジ ズ ゼ ゾ',        // Katakana with dakuten (za ji zu ze zo)
        // ta chi tsu te to
            'た ち つ て と ' +      // Hiragana
            'っ ' +                 // Hiragana small
            'だ ぢ づ で ど ' +      // Hiragana with dakuten (da ji zu de do)
            'タ チ ツ テ ト ' +      // Katakana
            'ｯ ㇳ' +                 // Katakana small
            'ﾀ ﾁ ﾂ ﾃ ﾄ ' +           // Katakana half width
            'ダ ヂ ヅ デ ド っ ッ',   // Katakana with dakuten (da ji zu de do)
         // na ni nu ne no
            'な に ぬ ね の ' +      // Hiragana
            'ナ ニ ヌ ネ ノ ' +      // Katakana
            'ㇴ ' +                 // Katakana small
            'ﾅ ﾆ ﾇ ﾈ ﾉ',            // Katakana half width
         // ha hi fu he ho
            'は ひ ふ へ ほ ' +      // Hiragana
            'ば び ぶ ぺ ぼ ' +      // Hiragana with dakuten (ba bi bu be bo)
            'ぱ ぴ ぷ ぺ ぽ ' +      // Hiragana with handakuten (pa pi pu pe po)
            'ハ ヒ フ ヘ ホ ' +      // Katakana
            'ㇵ ㇶ ㇷ ㇸ ㇹ' +       // Katakana small
            'ﾊ ﾋ ﾌ ﾍ ﾎ ' +           // Katakana half width
            'バ ビ ブ ベ ボ ' +      // Katakana with dakuten (ba bi bu be bo)
            'パ ピ プ ペ ポ',        // Katakana with handakuten (pa pi pu pe po)
         // ma mi mu me mo
            'ま み む め も ' +      // Hiragana
            'マ ミ ム メ モ ' +      // Katakana
            'ㇺ ' +                  // Katakana small
            'ﾏ ﾐ ﾑ ﾒ ﾓ',             // Katakana half width
         // ya yu yo                ('yi' and 'ye' do not exist)
            'や ゆ よ ' +            // Hiragana
            'ゃ ゅ ょ ' +            // Hiragana small
            'ヤ ユ ヨ ' +            // Katakana
            'ャ ュ ョ ' +            // Katakana small
            'ﾔ ﾕ ﾖ',                 // Katakana half width
         // ra ri ru re ro
            'ら り る れ ろ ' +      // Hiragana
            'ラ リ ル レ ロ ' +      // Katakana
            'ㇻ ㇼ ㇽ ㇾ ㇿ' +       // Katakana small
            'ﾗ ﾘ ﾙ ﾚ ﾛ',            // Katakana half width
         // wa (wi)(we)wo n        ('wi' and 'we' are nearly obsolete. 'wu' does not exist. 'n' is an additional kana)
            'わ ゐ ゑ を ん ' +      // Hiragana
            'ゎ ' +                 // Hiragana small
            'ワ ヰ ヱ ヲ ン ' +     // Katakana
            'ﾜ ｦ ﾝ ' +             // Katakana half width
            'ヮ ' +                // Katakana small
            'ヷ ヸ ヹ ヺ'           // Katakana with dakuten uncommon (va vi ve vo ). vu is written as ヴ uncommon as well
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
