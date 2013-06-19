/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('moxiecode/tiny_mce/plugins/emoji/categories',
       ['gettext!io.ox/mail/emoji',
       'raw!moxiecode/tiny_mce/plugins/emoji/unified.json',
       'raw!moxiecode/tiny_mce/plugins/emoji/softbank.json',
       'raw!moxiecode/tiny_mce/plugins/emoji/japan_carrier.json'
    ], function (gt, unified, softbank, japan_carrier) {

    "use strict";

    return {

        unified: JSON.parse(unified),
        softbank: JSON.parse(softbank),
        japan_carrier: JSON.parse(japan_carrier),

        recently: {
            name: 'recently',
            iconClass: 'emoji1f552'
        },

        translations: {
            // collections
            unified: gt('Unified'),
            softbank: gt('SoftBank'),
            japan_carrier: gt('Japanese Carrier'),
            // category names
            // recently used
            recently: gt('Recently used'),
            // softbank
            Face: gt('Face'),
            Feeling_Decoration: gt('Feeling + Decoration'),
            Weather_Season: gt('Weather + Season'),
            Character: gt('Character'),
            Food: gt('Food'),
            Life: gt('Life'),
            Tool: gt('Tool'),
            Hobby: gt('Hobby'),
            Letters_Symbols: gt('Letters + Symbols'),
            // unified
            People: gt('People'),
            Symbols: gt('Symbols'),
            Nature: gt('Nature'),
            Objects: gt('Objects'),
            Places: gt('Places'),
            // tabs
            commonEmoji:
                //#. Emojis that work across all Japanese carriers. In Japanese: 他社共通絵文字
                gt('Common Emoji'),
            allEmoji:
                //#. Emojis of SoftBank set. In Japanese: 全絵文字
                gt('All Emoji')
        }
    };
});
