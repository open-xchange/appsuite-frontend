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

define('plugins/portal/rss/register', [
    'io.ox/core/extensions',
    'io.ox/core/strings',
    'io.ox/messaging/accounts/api',
    'io.ox/messaging/services/api',
    'io.ox/messaging/messages/api',
    'io.ox/keychain/api',
    'io.ox/rss/api',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/portal'
], function (ext, strings, accountAPI, serviceAPI, messageAPI, keychain, rss, dialogs, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/rss').extend({

        title: gt('RSS Feed'),

        load: function (baton) {
            var urls = baton.model.get('props').url || [],
                title = baton.model.attributes.title;
            //remove empty urls (causes backend error)
            urls = _(urls).filter(function (url) {
                return $.trim(url) !== '';
            });
            return rss.getMany(urls).done(function (data) {
                //limit data manually till api call can be limited
                data = data.slice(0, 100);
                baton.data = {
                    items: data,
                    title: '',
                    link: '',
                    urls: urls
                };

                //use existing title or the title of the first feed
                if (title !== undefined && title !== '') {
                    baton.data.title = title;
                } else {
                    var elem = _(data).first();

                    if (elem !== undefined && elem.feedTitle !== undefined) {
                        baton.data.title = elem.feedTitle;
                    } else {
                        baton.data.title = gt('RSS Feed');
                    }
                }
            });
        },

        preview: function (baton) {

            var data = baton.data,
                count = _.device('smartphone') ? 5 : 10,
                $content = $('<ul class="content pointer list-unstyled" tabindex="1" role="button" aria-label="' + gt('Press [enter] to jump to the rss stream.') + '">');

            if (data.items.length === 0) {
                $('<li class="item">').text(gt('No RSS feeds found.')).appendTo($content);
            } else {
                $(data.items).slice(0, count).each(function (index, entry) {
                    $content.append(
                        $('<li class="paragraph">').append(
                            function () {
                                if (data.urls.length > 1) {
                                    return $('<span class="gray">').text(_.noI18n(entry.feedTitle + ' '));
                                } else {
                                    return '';
                                }
                            },
                            $('<span class="bold">').text(_.noI18n(entry.subject)), $.txt('')
                        )
                    );
                });
            }

            this.append($content);
        },

        draw: (function () {

            function drawItem(item) {
                var $body = $('<div class="text-body noI18n">').html(item.body);

                // replace img tags with empty src
                $body.find('img[src=""]').replaceWith(gt('show image'));

                // add target to a tags
                $body.find('a').attr('target', '_blank');

                this.append(
                    $('<div class="text">').append(
                        $('<h4>').text(_.noI18n(item.subject)),
                        $body,
                        $('<div class="rss-url">').append(
                            $('<a>').attr({ href: item.url, target: '_blank' }).text(_.noI18n(item.feedTitle + ' - ' + moment(item.date).format('l')))
                        )
                    )
                );
            }

            return function (baton) {

                var data = baton.data,
                    node = $('<div class="portal-feed">');

                if (data.title) {
                    node.append($('<h2>').text(_.noI18n(data.title)));
                }

                _(data.items).each(drawItem, node);

                this.append(node);
            };

        }())
    });

    function edit(model, view) {

        // disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new dialogs.ModalDialog({ async: true }),
            $url = $('<textarea id="rss_url" class="form-control" rows="5">').attr({ placeholder: 'http://', tabindex: 1 }),
            $description = $('<input id="rss_desc" type="text" class="form-control" tabindex="1">'),
            $error = $('<div class="alert alert-danger">').css('margin-top', '15px').hide(),
            props = model.get('props') || {};

        dialog.header($('<h4>').text(gt('RSS Feeds')))
            .build(function () {
                this.getContentNode().append(
                    $('<div class="form-group">').append(
                        $('<label for="rss_url">').text(gt('URL')),
                        $url.val((props.url || []).join('\n'))
                    ),
                    $('<div class="form-group">').append(
                        $('<label for="rss_desc">').text(gt('Description')),
                        $description.val(props.description),
                        $error
                    )
                );
            })
            .addPrimaryButton('save', gt('Save'), 'save', { tabIndex: 1 })
            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
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
                //split and remove empty urls (causes backend error)
                url = _(url.split(/\n/)).filter(function (feed) {
                    return $.trim(feed) !== '';
                });
                dialog.close();
                model.set({
                    title: description,
                    props: { url: url, description: description }
                }, { validate: true });
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
