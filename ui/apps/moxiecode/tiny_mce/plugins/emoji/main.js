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
define('moxiecode/tiny_mce/plugins/emoji/main',
       ['emoji/emoji',
       'css!emoji/emoji.css',
       'less!moxiecode/tiny_mce/plugins/emoji/emoji.less'], function (emoji) {

    "use strict";

    var icons = _(emoji.EMOJI_MAP)
    .chain()
    .pairs()
    .map(function (icon) {
        return {css: 'emoji' + icon[1][2], unicode: icon[0], desc: icon[1][1]};
    })
    .value();


    return _.extend({
        icons: icons,
        unifiedToImageTag: function (text) {
            var parsedText = $('<div>').append(emoji.unifiedToHTML(text));

            parsedText.find('span.emoji').each(function (index, node) {
                //parse unicode number
                var unicode = '&#x' + _.find($(node).attr('class').split('emoji'), function (item) {
                    return item.trim();
                });
                //transform unicode html entity to text
                unicode = $('<div>').html(unicode).text();
                $(node).replaceWith(
                    $('<img src="apps/themes/login/1x1.gif" class="' + $(node).attr('class') + '">')
                    .attr('data-emoji-unicode', unicode)
                );
            });
            return parsedText.html();
        },
        imageTagsToUnified: function (html) {
            var node = $('<div>').append(html);

            node.find('img.emoji').each(function (index, node) {
                $(node).replaceWith($(node).attr('data-emoji-unicode'));
            });

            return node.html();
        }
    }, emoji);
});
