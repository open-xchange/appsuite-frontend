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
       'moxiecode/tiny_mce/plugins/emoji/categories',
       'css!emoji/emoji.css',
       'less!moxiecode/tiny_mce/plugins/emoji/emoji.less'], function (emoji, categories) {

    "use strict";

    //"invert" the categories object
    function createCategoryMap() {
        return _.object(
            _(categories).chain().values().flatten(true).value(),
            _(categories)
            .chain()
            .pairs()
            .map(function (item) {
                var category = item[0];
                return _(item[1]).map(function () {
                    return category;
                });
            })
            .flatten(true)
            .value()
        );
    }

    function iconInfo(icon) {
        if (_.isString(icon)) {
            return iconInfo([icon, emoji.EMOJI_MAP[icon]]);
        }
        if (!icon || !icon[0] || !icon[1] || !icon[1][1] || !icon[1][2])
            return {invalid: true};

        return {
            css: 'emoji' + icon[1][2],
            unicode: icon[0],
            desc: icon[1][1],
            category: category_map[icon[0]]
        };
    }

    var category_map = createCategoryMap(),
        icons = _(emoji.EMOJI_MAP)
    .chain()
    .pairs()
    .map(iconInfo)
    .value();

    return _.extend({
        icons: icons,
        iconsForCategory: function (category) {
            return _(icons).filter(function (icon) {
                return icon.category === category;
            });
        },
        iconInfo: iconInfo,
        categories: categories,
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
