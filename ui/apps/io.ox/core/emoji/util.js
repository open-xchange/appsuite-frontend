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

define('io.ox/core/emoji/util', ['settings!io.ox/mail/emoji'], function (settings) {

    'use strict';

    var emoji,
        convert = function (text) {
            var allToUnified = emoji.converterFor({
                from: 'all',
                to: 'unified'
            });
            text = allToUnified(text);
            text = emoji.unifiedToImageTag(text, {
                forceEmojiIcons: settings.get('forceEmojiIcons', false)
            });
            return text;
        };

    return {

        processEmoji: function (text, callback) {

            var tooLarge = text.length > (1024 * (_.device('chrome >= 30') ? 64 : 32)),
                // check if there might be any emojis; pure ascii cannot contain them (except 0xA9 and 0xAE)
                // using a regex is 50-100 times faster than looping over the characters
                hasEmoji = /[\xa9\xae\u0100-\uffff]/.test(text);

            function cont(text) {
                if (callback) callback(text, { loaded: !!emoji });
                return text;
            }

            if (tooLarge || !hasEmoji) {
                return cont(text);
            }
            else if (emoji) {
                return cont(convert(text));
            }
            else {
                require(['io.ox/emoji/main'], function (code) {
                    emoji = code;
                    cont(convert(text));
                });
                return text;
            }
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
