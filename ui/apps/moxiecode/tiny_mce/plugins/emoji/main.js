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
       'settings!io.ox/mail/emoji',
       'css!emoji/emoji.css',
       'less!moxiecode/tiny_mce/plugins/emoji/emoji.less'], function (emoji, categories, settings) {

    "use strict";

    //"invert" the categories object
    function createCategoryMap() {
        var cat = categories[defaultCollection()];

        category_map = _.object(
            _(cat).chain().values().flatten(true).value(),
            _(cat)
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
        icons = _(emoji.EMOJI_MAP)
            .chain()
            .pairs()
            .map(iconInfo)
            .value();
    }

    function defaultCollection() {
        var defaultCollection = settings.get('defaultCollection');
        return settings.get('userCollection', defaultCollection);
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
            category: category_map[icon[0]] || 'People' // matthias: was undefined, needed that to continue
        };
    }

    function parseCollections() {
        //TODO: may be, filter the list for collections, we support in the frontend
        var e = settings.get('availableCollections');

        return _(e.split(','))
            .map(function (collection) {
                return collection.trim();
            });
    }

    var category_map = {},
        icons = [],
        collections = parseCollections();

    // generate category_map for the first time
    createCategoryMap();

    function escape(s) {
        return window.escape(s).replace(/%u/g, '\\u').toLowerCase();
    }

    return _.extend({

        // plain data API
        icons: icons,

        // add to "recently used" category
        recent: function (unicode) {

            var recently = settings.get('recently', {}),
                // encode unicode to avoid backend bug
                key = escape(unicode);

            if (key in recently) {
                recently[key].count++;
                recently[key].time = _.now();
            } else {
                recently[key] = { count: 1, time: _.now() };
            }

            settings.set('recently', recently).save();
        },

        iconsForCategory: function (category) {

            if (category === 'recently') {

                var recently = settings.get('recently', {});

                return _(icons)
                    .chain()
                    // get relevant icons
                    .filter(function (icon) {
                        // encode unicode to avoid backend bug
                        var key = escape(icon.unicode);
                        return key in recently;
                    })
                    .map(function (icon) {
                        var key = escape(icon.unicode);
                        return [icon, recently[key]];
                    })
                    // sort by timestamp
                    .sortBy(function (array) {
                        return array[1].time;
                    })
                    // get first 40 icons (5 rows; 8 per row)
                    .first(40)
                    // now sort by frequency (descending order)
                    .sortBy(function (array) {
                        return 0 - array[1].count;
                    })
                    // extract the icon
                    .pluck(0)
                    .value();
            }

            return _(icons).filter(function (icon) {
                return icon.category === category;
            });
        },

        iconInfo: iconInfo,

        categories: function () {
            return categories[this.defaultCollection()].meta || [];
        },

        // collections API
        collections: collections,

        collectionTitle: function (collection) {
            return categories.translatedNames[collection];
        },

        defaultCollection: defaultCollection,

        setDefaultCollection: function (collection) {

            if (!_(collections).contains(collection)) return;

            settings.set('userCollection', collection);
            settings.save();
            createCategoryMap();
        },

        // HTML related API
        unifiedToImageTag: function (text, options) {

            var parsedText;
            options = _.extend({forceProcessing: false}, options);

            if (!options.forceProcessing && _.device('emoji')) {
                return text;
            }
            parsedText = $('<div>').append(emoji.unifiedToHTML(text));

            parsedText.find('span.emoji').each(function (index, node) {
                //parse unicode number
                var unicode = '&#x' + _.find($(node).attr('class').split('emoji'), function (item) {
                    return item.trim();
                }) + ';';
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
        },

        // make settings accessible, esp. for editor plugin
        settings: settings

    }, emoji);
});
