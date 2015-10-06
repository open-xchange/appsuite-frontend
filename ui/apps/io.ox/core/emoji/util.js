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

        /** process a string and replace emoji characters with img tags
         *
         *
         * @param str - the string to be processed
         * @param callback - a callback method that gets called with 2 parameters:
         *      @param result - the processed text
         *      @param object - an object containing a key 'loaded', a boolean to indicate wether
         *                      the emoji lib has just been loaded or had been loaded before
         * @returns the processed or unprocessed string
         *
         * please mind that this functions returns HTML!
         * if source is regarded as plain text you needs to escape it via _.escape()
        */
        processEmoji: function (str, callback) {

            var tooLarge = str.length > (1024 * (_.device('chrome >= 30') ? 64 : 32)),
                /* check if there might be any emojis
                 * using a regex is 50-100 times faster than looping over the characters
                 *
                 * When adjusting this regex, make sure, all supported emoji do still
                 * match (all unified + all softbank codepoints)
                 */
                hasEmoji = /[\u203c\u2049\u20e3\u2123-\uffff]/.test(str);

            function cont(str, libJustLoaded) {
                if (callback) callback(str, { loaded: !!libJustLoaded });
                return str;
            }

            if (tooLarge || !hasEmoji) {
                return cont(str);
            }
            else if (emoji) {
                return cont(convert(str));
            }
            else {
                require(['io.ox/emoji/main'], function (code) {
                    emoji = code;
                    cont(convert(str), true);
                });
                return str;
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
