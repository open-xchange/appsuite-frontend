/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/rss/register',
    ['io.ox/core/extensions',
     'io.ox/core/strings',
     'io.ox/messaging/accounts/api',
     'io.ox/messaging/services/api',
     'io.ox/messaging/messages/api',
     'io.ox/keychain/api',
     'io.ox/rss/api',
     'io.ox/core/date',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/portal'
    ], function (ext, strings, accountAPI, serviceAPI, messageAPI, keychain, rss, date, dialogs, gt) {

    'use strict';

    var migrate = function (settings) {

        if (true || !settings.get('rss-migrated')) {
            return $.when();
        }

        return accountAPI.all('com.openexchange.messaging.rss').pipe(function (accounts) {
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

            // console.log('RSS title fix', this);
            // this.find('.title').text('YEAH!!!');
            // var props = baton.model.get('props');
            // props.title = "YEAH !!!!";
            // baton.model.set('props', props);

            return migrate().pipe(function () {
                var urls = baton.model.get('props').url || [];
                return rss.getMany(urls).done(function (data) {
                    //limit data manually till api call can be limited
                    data = data.slice(0, 100);
                    baton.data = {
                        items: data,
                        title: '',
                        link: '',
                        urls: urls
                    };
                    // get title & link of the first found feed
                    _(data).find(function (item) {
                        if (urls.length > 1) {
                            baton.data.title = item.feedTitle || '';
                        }
                        baton.data.link = item.feedLink || '';
                    });
                });
            });
        },

        preview: function (baton) {

            var data = baton.data,
                count = _.device('small') ? 5 : 10,
                $content = $('<div class="content pointer">');

            if (data.items.length === 0) {
                $('<div class="item">').text(gt('No RSS feeds found.')).appendTo($content);
            } else {
                $(data.items).slice(0, count).each(function (index, entry) {
                    $content.append(
                        $('<div class="paragraph">').append(
                            function () {
                                if (data.urls.length > 1) {
                                    return $('<span class="gray">').text(_.noI18n(entry.feedTitle + ' '));
                                } else {
                                    return '';
                                }
                            },
                            $('<span class="bold">').html(_.noI18n(entry.subject)), $.txt('')
                        )
                    );
                });
            }

            this.append($content);
        },

        draw: (function () {

            function drawItem(item) {
                var publishedDate = new date.Local(item.date).format(date.DATE),
                    $body = $(item.body);

                //replace img tags with empty src
                $body.find('img[src=""]').replaceWith(gt('show image'));

                //add target to a tags
                $body.find('a').attr('target', '_blank');

                this.append(
                    $('<div class="text">').append(
                        $('<h2>').html(_.noI18n(item.subject)),
                        $('<div class="text-body noI18n">').append($body),
                        $('<div class="rss-url">').append(
                            $('<a>').attr({ href: item.url, target: '_blank' }).text(_.noI18n(item.feedTitle + ' - ' + publishedDate))
                        )
                    )
                );
            }

            return function (baton) {

                var data = baton.data,
                    node = $('<div class="portal-feed">');

                if (data.title) {
                    node.append($('<h1>').text(_.noI18n(data.title)));
                }

                _(data.items).each(drawItem, node);

                this.append(node);
            };

        }())
    });

    function edit(model, view) {
        //disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new dialogs.ModalDialog({ async: true }),
            $url = $('<textarea class="input-block-level" rows="5">').attr('placeholder', 'http://').placeholder(),
            $description = $('<input type="text" class="input-block-level">'),
            $error = $('<div class="alert alert-error">').hide(),
            props = model.get('props') || {};

        dialog.header($('<h4>').text(gt('RSS Feeds')))
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
            if (model.has('candidate') && _.isEmpty(model.attributes.props)) {
                view.removeWidget();
            }
        });

        dialog.on('save', function () {

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
                model.set({
                    title: description,
                    props: { url: url.split(/\n/), description: description }
                }, {validate: true});
                model.unset('candidate');
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
