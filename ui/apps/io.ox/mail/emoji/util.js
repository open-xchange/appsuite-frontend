/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/emoji/util',
    ['moxiecode/tiny_mce/plugins/emoji/main',
     'settings!io.ox/mail'], function (emoji, settings) {

    'use strict';

    return {

        processEmoji: function (text) {
            text = emoji.softbankToUnified(text);
            text = emoji.jisToUnified(text);
            return emoji.unifiedToImageTag(text, {
                forceEmojiIcons: settings.get('emoji/forceEmojiIcons', false)
            });
        }
    };

});
