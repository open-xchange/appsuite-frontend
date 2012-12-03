/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("plugins/portal/rss/register",
    ["io.ox/core/extensions",
    "io.ox/core/strings",
    "io.ox/messaging/accounts/api",
    "io.ox/messaging/services/api",
    "io.ox/messaging/messages/api",
    'io.ox/keychain/api',
    'io.ox/rss/api',
    'io.ox/core/date',
    'gettext!io.ox/portal',
    'less!plugins/portal/rss/style.css'], function (ext, strings, accountApi, serviceApi, messageApi, keychain, rss, date, gt) {

    "use strict";

    var migrate = function (settings) {

        if (true || !settings.get('rss-migrated')) {
            return $.when();
        }

        var members = [],
            group = { groupname: gt('RSS Feeds'), index: 100, members: members };

        return accountApi.all('com.openexchange.messaging.rss').pipe(function (accounts) {
            var index = 0;
            _(accounts).each(function (account) {
                console.log('migrate.account', account);
                index += 100;
                members.push({ url: account.configuration.url, feedname: account.displayName, index: index });
            });
            return settings
                .set('groups', [group])
                .set('rss-migrated', false)
                .save();
        });
    };

    ext.point('io.ox/portal/widget/rss').extend({

        title: gt('RSS Feed'),

        load: function (baton) {
            return migrate().pipe(function () {
                var urls = baton.model.get('props').url || [];
                return rss.getMany(urls, 'date').done(function (data) {
                    baton.data = { items: data, title: '', link: '' };
                    // get title & link
                    _(data).find(function (item) {
                        baton.data.title = item.feedTitle || '';
                        baton.data.link = item.feedLink || '';
                    });
                });
            });
        },

        preview: function (baton) {

            var data = baton.data,
                $content = $('<div class="content pointer">');

            _(data.items).each(function (entry) {
                $content.append(
                    $('<div class="paragraph">').append(
                        $('<span class="bold">').text(entry.feedTitle + ": "),
                        $('<span class="normal">').text(entry.subject)
                    )
                );
            });

            if (data.items.length === 0) {
                $('<div class="item">').text(gt('No RSS feeds found.')).appendTo($content);
            }

            this.append($content);
        },

        draw: (function () {

            function drawItem(item) {
                var publishedDate = new date.Local(item.date).format(date.DATE);
                this.append(
                    $('<div class="text">').append(
                        $('<h2>').text(item.subject),
                        $('<div class="">').html(item.body),
                        $('<div class="rss-url">').append(
                            $('<a>').attr({ href: item.url, target: '_blank' }).text(item.feedTitle + ' - ' + publishedDate)
                        )
                    )
                );
            }

            return function (baton) {

                var data = baton.data,
                    node = $('<div class="portal-feed">');

                if (data.title) {
                    node.append($('<h1>').text(data.title));
                }

                _(data.items).each(drawItem, node);

                this.append(node);
            };

        }())
    });

    // var feeds = [];

    // var tileGroups = settings.get('groups');
    // tileGroups = _(tileGroups).sortBy(function (group) { return group.index || 0; });

    // _(tileGroups).each(function (tilegroup) {
    //     var extension = {
    //         id: 'rss-' + tilegroup.groupname.replace(/[^a-zA-Z0-9]/g, '-'),
    //         index: 100,
    //         title: tilegroup.groupname,
    //         load: function () {


    //         },

    //         preview: function () {


    //         },

    //         draw: function (feed) {

    //         }
    //     };
    //     ext.point("io.ox/portal/widget").extend(extension); //END: ext.point(...).extend
    // }); //END: tileGroups.each
});
