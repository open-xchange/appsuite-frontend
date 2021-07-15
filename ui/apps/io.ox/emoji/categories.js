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

define('io.ox/emoji/categories', [
    'gettext!io.ox/mail',
    'raw!io.ox/emoji/unified.json',
    'raw!io.ox/emoji/softbank.json',
    'raw!io.ox/emoji/japan_carrier.json'
], function (gt, unified, softbank, japan_carrier) {

    'use strict';

    return {

        unified: JSON.parse(unified),
        softbank: JSON.parse(softbank),
        japan_carrier: JSON.parse(japan_carrier),

        recently: {
            name: 'recently',
            iconClass: 'emoji-unified emoji1f552'
        },

        translations: {

            // collections
            unified:
                //#. Emoji collection. Unified/standard icons. "Standard" might work for other languages.
                gt('Unified'),
            softbank:
                //#. Emoji collection. SoftBank-specific icons. "SoftBank" in other languages, too.
                gt('SoftBank'),
            japan_carrier:
                //#. Emoji collection. Emoji icons that work across Japanese (telecom) carriers.
                gt('Japanese Carrier'),

            // recently used
            recently: gt('Recently used'),

            // softbank category names
            Face:
                //#. Emoji category
                //#. Japanese: 顔
                //#. Contains: All kinds of smilies
                gt('Face'),
            Feeling_Decoration:
                //#. Emoji category
                //#. Japanese should include "Katakana Middle Dot". Unicode: 30FB
                //#. Japanese: 気持ち・装飾
                //#. Other languages can use simple bullet. Unicode: 2022
                //#. Contains: Hearts, Gestures like thumbs up
                gt('Feeling • Decoration'),
            Weather_Season:
                //#. Emoji category
                //#. Japanese should include "Katakana Middle Dot". Unicode: 30FB
                //#. Japanese: 天気・季節
                //#. Other languages can use simple bullet. Unicode: 2022
                //#. Contains: Sun, rain, flowers
                gt('Weather • Season'),
            Character:
                //#. Emoji category
                //#. Japanese: キャラクター
                //#. Contains: Cartoon characters, animals
                gt('Character'),
            Food:
                //#. Emoji category
                //#. Japanese: 食べ物
                //#. Contains: Cup of coffee, cake, fruits
                gt('Food'),
            Life:
                //#. Emoji category
                //#. Japanese: 日常
                //#. Rather "everyday life". Contains: Cars, trucks, plane, buildings, flags
                gt('Life'),
            Tool:
                //#. Emoji category
                //#. Japanese: ツール
                //#. Contains: Phones, tv, clocks
                gt('Tool'),
            Hobby:
                //#. Emoji category
                //#. Japanese: 趣味
                //#. Contains: Tennis, golf, football, pool
                gt('Hobby'),
            Letters_Symbols:
                //#. Emoji category
                //#. Japanese should include "Katakana Middle Dot". Unicode: 30FB
                //#. Japanese: 文字・記号
                //#. Other languages can use simple bullet. Unicode: 2022
                //#. Contains: Arrows, numbers, symbols like play and fast-forward, copyright symbol
                gt('Letters • Symbols'),

            // unified
            People:
                //#. Emoji category
                gt('People'),
            Symbols:
                //#. Emoji category
                gt('Symbols'),
            Nature:
                //#. Emoji category
                gt('Nature'),
            Objects:
                //#. Emoji category
                gt('Objects'),
            Places:
                //#. Emoji category
                gt('Places'),

            // tabs
            commonEmoji:
                //#. Emojis that work across all Japanese carriers.
                //#. Japanese: 他社共通絵文字
                gt('Common Emoji'),
            allEmoji:
                //#. Emojis of SoftBank set.
                //#. Japanese: 全絵文字
                gt('All Emoji')
        }
    };
});
