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
    'settings!io.ox/rss',
    'gettext!plugins/portal',
    'less!plugins/portal/rss/style.css'], function (ext, strings, accountApi, serviceApi, messageApi, keychain, rss, date, settings, gt) {

    "use strict";

    var migrateIfNecessary = function () {
        if (!settings.get('needsMigration')) {
            return;
        }
        var members = [];
        var group = {groupname: gt('RSS Feeds'), index: 100, members: members};

        accountApi.all('com.openexchange.messaging.rss').done(function (accounts) {
            var index = 0;
            _(accounts).each(function (account) {
                index += 100;
                members.push({url: account.configuration.url, feedname: account.displayName, index: index});
            });
            settings.set('groups', [group]);
            settings.save();
            settings.set('needsMigration', false);
            settings.save();
        });
    };

    var feeds = [];

    var tileGroups = settings.get('groups');
    tileGroups = _(tileGroups).sortBy(function (group) { return group.index || 0; });

    _(tileGroups).each(function (tilegroup) {
        ext.point("io.ox/portal/widget").extend({
            id: 'rss-' + tilegroup.groupname.replace(/[^a-z0-9]/g, '-'),
            index: 100,
            title: tilegroup.groupname,
            load: function () {
                var def = $.Deferred();
                var requests = [];

                migrateIfNecessary();

                _(tilegroup.members).each(function (member) {
                    requests.push(member.url);
                });

                rss.getMany(requests, "date")
                    .done(def.resolve)
                    .fail(def.reject);
                return def;
            },
            drawTile: function () {
                $(this).append(
                    $('<div class="io-ox-portal-title">').append(
                        $('<i class="icon-rss tile-image">'),
                        $('<h1 class="tile-heading">').text(tilegroup.groupname)
                    ),
                    $('<div class="io-ox-portal-content">')
                );
               
            },
            draw: function (feed) {
                var togglePreview = function () {
                    $(this).parent().find('.io-ox-portal-rss-content').toggleClass('portal-preview');
                    $(this).parent().find('.io-ox-portal-previewToggle').toggleClass('icon-chevron-down');
                };
                var $node = $('<div class="io-ox-portal-rss">').appendTo(this);

                $('<h1 class="clear-title">').text(tilegroup.groupname).appendTo($node);

                _(feed).each(function (entry) {
                    var $entry = $('<div class="io-ox-portal-rss-entry">').appendTo($node);
                    $entry.append(
                        $('<h2 class="io-ox-portal-rss-feedTitle">').text(entry.subject).click(togglePreview),
                        $('<div class="io-ox-portal-rss-source">').append(
                            $('<a class="io-ox-portal-feedName" target="_blank">').attr({href: entry.feedUrl}).text(entry.feedTitle),
                            $('<span>').text(': '),
                            $('<a class="io-ox-portal-feedUrl" target="_blank">').attr({href: entry.url}).text(new date.Local(entry.date))
                        ),
                        $('<div class="io-ox-portal-rss-content portal-preview">').html(entry.body).click(togglePreview)
                    );
                });
                return $.Deferred().resolve();
            }
        }); //END: ext.point(...).extend
    }); //END: tileGroups.each
});
