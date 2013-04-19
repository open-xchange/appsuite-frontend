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
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/portal'], function (ext, strings, accountApi, serviceApi, messageApi, keychain, rss, date, dialogs, gt) {

    "use strict";

    var migrate = function (settings) {

        if (true || !settings.get('rss-migrated')) {
            return $.when();
        }

        return accountApi.all('com.openexchange.messaging.rss').pipe(function (accounts) {
            var index = 0;
            _(accounts).each(function (account) {
                index += 100;
                settings.set('widgets/user/rss-migrated-' + index, {
                    plugin: 'plugins/portal/rss/register',
                    color: 'lightblue',
                    index: index,
                    props: {
                        url: account.configuration.url,
                        description: account.displayName
                    }
                });
            });
            return settings.save();
        });
    };

    ext.point('io.ox/portal/widget/rss').extend({

        title: gt('RSS Feed'),

        load: function (baton) {
            return migrate().pipe(function () {
                var urls = baton.model.get('props').url || [];
                return rss.getMany(urls, 'date').done(function (data) {
                    //limit data manually till api call can be limited
                    data = data.slice(0, 100);
                    baton.data = { items: data, title: '', link: '' };
                    // get title & link of the first found feed
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
                        $('<span class="gray">').text(entry.feedTitle + ' '),
                        $('<span class="bold">').text(entry.subject), $.txt('')
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
                        $('<div class="text-body">').html(item.body),
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

    function edit(model, view) {

        var dialog = new dialogs.ModalDialog({ easyOut: true, async: true }),
            $url = $('<textarea class="input-block-level" rows="5">').attr('placeholder', 'http://').placeholder(),
            $description = $('<input type="text" class="input-block-level">'),
            $error = $('<div class="alert alert-error">').hide(),
            props = model.get('props') || {},
            that = this;

        dialog.header($("<h4>").text(gt('RSS Feeds')))
            .build(function () {
                this.getContentNode().append(
                    $('<label>').text(gt('URL')),
                    $url.val((props.url || []).join('\n')),
                    $('<label>').text(gt('Description')),
                    $description.val(props.description),
                    $error
                );
            })
            .addPrimaryButton('save', gt('Save'))
            .addButton('cancel', gt('Cancel'))
            .show(function () {
                $url.focus();
            });

        dialog.on('cancel', function () {
            if (model.candidate) {
                view.removeWidget();
            }
        });

        dialog.on('save', function (e) {

            var url = $.trim($url.val()),
                description = $.trim($description.val()),
                deferred = $.Deferred();

            $error.hide();

            if (url.length === 0) {
                $error.text(gt('Please enter a feed URL.'));
                deferred.reject();
            } else {
                deferred.resolve();
            }

            deferred.done(function () {
                dialog.close();
                model.candidate = false;
                model.set({
                    title: description,
                    props: { url: url.split(/\n/), description: description }
                });
            });

            deferred.fail(function () {
                $error.show();
                dialog.idle();
            });
        });
    }

    ext.point('io.ox/portal/widget/rss/settings').extend({
        title: gt('RSS Feed'),
        type: 'rss',
        editable: true,
        edit: edit
    });
});
