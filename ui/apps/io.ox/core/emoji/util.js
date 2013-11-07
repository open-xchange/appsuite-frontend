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

define('io.ox/core/emoji/util',
    ['settings!io.ox/mail/emoji'], function (settings) {

    'use strict';

    var emoji;

    return {

        processEmoji: function (text) {

            var i = 0, asciiOnly = true, exceptions = {
                '\u00a9': true,
                '\u00ae': true
            };

            // check if there might be any emojis; pure ascii cannot contain them
            for (var i = 0; asciiOnly && i < text.length; i++) {
                if (text.charCodeAt(i) > 255 || exceptions[text.charAt(i)]) asciiOnly = false;
            }

            if (asciiOnly) return text;

            if (emoji) {
                text = emoji.softbankToUnified(text);
                text = emoji.jisToUnified(text);
                text = emoji.unifiedToImageTag(text, {
                    forceEmojiIcons: settings.get('forceEmojiIcons', false)
                });
            } else {
                require(['moxiecode/tiny_mce/plugins/emoji/main'], function (code) {
                    emoji = code;
                });
            }

            return text;
        },
        imageTagsToUnified: function (html) {
            var node = $('<div>').append(html);

            node.find('img[data-emoji-unicode]').each(function (index, node) {
                $(node).replaceWith($(node).attr('data-emoji-unicode'));
            });

            return node.html();
        }
    };

});
