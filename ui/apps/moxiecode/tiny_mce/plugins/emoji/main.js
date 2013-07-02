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
       ['3rd.party/emoji/emoji',
       'moxiecode/tiny_mce/plugins/emoji/categories',
       'io.ox/core/extensions',
       'settings!io.ox/mail/emoji',
       'css!3rd.party/emoji/emoji.css',
       'less!moxiecode/tiny_mce/plugins/emoji/emoji.less'
    ], function (emoji, categories, ext, settings) {

    "use strict";

    ext.point('3rd.party/emoji/editor_css').extend({
        id: 'unified/icons',
        css: '3rd.party/emoji/emoji.css'
    });

    function parseCollections() {
        //TODO: may be, filter the list for collections, we support in the frontend
        var e = settings.get('availableCollections', '');
        return _(e.split(',')).map(function (collection) {
            return collection.trim();
        });
    }

    function parseUnicode(str) {
        var unicode;

        //HACK: fix number emojis and flags (&#x doesn’t work with to large numbers)
        //may be, there is a better way to calculate the utf-8 code from the number
        if (str.length === 6) {
            return parseUnicode(str.substr(0, 2)) + parseUnicode(str.substr(2));
        }
        if (str.length === 10) {
            return parseUnicode(str.substr(0, 5)) + parseUnicode(str.substr(5));
        }

        unicode = '&#x' + str + ';';
        //transform unicode html entity to text
        return $('<div>').html(unicode).text();
    }

    var collections = parseCollections();

    function escape(s) {
        return window.escape(s).replace(/%u/g, '\\u').toLowerCase();
    }

    // introduce Emoji class
    function Emoji() {

        // inherit from emoji
        _.extend(this, emoji);

        // plain data API
        this.icons = [];
        this.collections = collections;
        this.category_map = {};

        // make settings accessible, esp. for editor plugin
        this.settings = settings;

        var defaultCollection = settings.get('defaultCollection', 'japan_carrier');
        this.currentCollection = settings.get('userCollection', defaultCollection);

        this.createCategoryMap();
    }

    _.extend(Emoji.prototype, {

        iconInfo: function (icon) {

            if (_.isString(icon))
                return this.iconInfo([icon, emoji.EMOJI_MAP[icon]]);

            if (!icon || !icon[0] || !icon[1] || !icon[1][1] || !icon[1][2])
                return undefined;

            return {
                css: this.cssFor(icon[0]),
                unicode: icon[0],
                desc: icon[1][1],
                category: this.category_map[icon[0]]
            };
        },

        cssFor: function (unicode) {

            var icon = emoji.EMOJI_MAP[unicode];

            if (this.currentCollection === 'softbank' || this.currentCollection === 'japan_carrier') {
                return 'emoji-softbank sprite-emoji-' + icon[5][1].substring(2).toLowerCase();
            }

            return 'emoji-unified emoji' + icon[2];
        },

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

        getRecently: function () {
            return _(categories[this.currentCollection].meta).find(function (cat) {
                return cat.name === 'recently';
            }) || categories.recently;
        },

        resetRecents: function () {
            settings.set('recently', {}).save();
        },

        iconsForCategory: function (category) {

            if (category === 'recently') {

                var recently = settings.get('recently', {});

                return _(this.icons)
                    .chain()
                    // get relevant icons
                    .filter(function (icon) {
                        // encode unicode to avoid backend bug
                        var key = escape(icon.unicode);
                        return key in recently && !!icon.category;
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

            return _(this.icons).filter(function (icon) {
                return icon.category === category;
            });
        },

        getCategories: function () {
            return (categories[this.currentCollection].meta || []).slice()
            .filter(function (cat) {
                return cat.name !== 'recently';
            }); // return copy
        },

        getDefaultCategory: function () {
            return (_(this.getCategories()).first() || {}).name;
        },

        hasCategory: function (category) {
            return _(categories[this.currentCollection].meta).chain().pluck('name').indexOf(category).value() > -1;
        },

        getTitle: function (id) {
            return categories.translations[id];
        },

        setCollection: function (collection) {

            if (!_(this.collections).contains(collection)) return;

            this.currentCollection = collection;
            settings.set('userCollection', collection).save();
            this.createCategoryMap();
        },

        getCollection: function () {
            return this.currentCollection;
        },

        // "invert" the categories object
        createCategoryMap: function () {

            var cat = categories[this.currentCollection];

            this.category_map = _.object(
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

            this.icons = _(emoji.EMOJI_MAP)
                .chain()
                .pairs()
                .map(this.iconInfo, this)
                .value();
        }
    });

    return {

        getInstance: function () {
            return new Emoji();
        },

        // HTML related API
        unifiedToImageTag: function (text, options) {

            var parsedText,
                self = this;

            options = options || {};

            if (options.forceEmojiIcons !== true && _.device('emoji')) {
                return text;
            }
            parsedText = $('<div>').append(emoji.unifiedToHTML(text));

            parsedText.find('span.emoji').each(function (index, node) {
                //parse unicode number
                var unicode = parseUnicode(_.find($(node).attr('class').split('emoji'), function (item) {
                    return item.trim();
                }));
                $(node).replaceWith(
                    $('<img src="apps/themes/login/1x1.gif" class="' + self.getInstance().cssFor(unicode) + '">')
                    .attr('data-emoji-unicode', unicode)
                );
            });
            return parsedText.html();
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
