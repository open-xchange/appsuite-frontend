/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
    'io.ox/backbone/views/modal',
    'io.ox/mail/sanitizer',
    'gettext!io.ox/portal'
], function (ext, strings, accountAPI, serviceAPI, messageAPI, keychain, rss, ModalDialog, sanitizer, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/rss').extend({

        title: gt('RSS Feed'),
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

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

                // fix some special characters
                _(data).each(function (item) {
                    item.subject = item.subject.replace(/&nbsp;/g, ' ').replace('&amp;', '&').replace(/&#034;/g, '"');
                });

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
                $content = $('<ul class="content pointer list-unstyled" tabindex="0" role="button" aria-label="' + gt('Press [enter] to jump to the rss stream.') + '">');

            if (data.items.length === 0) {
                $('<li class="item">').text(gt('No RSS feeds found.')).appendTo($content);
            } else {
                $(data.items).slice(0, count).each(function (index, entry) {
                    $content.append(
                        $('<li class="paragraph">').append(
                            function () {
                                if (data.urls.length > 1) {
                                    return $('<span class="gray">').text(entry.feedTitle + ' ');
                                }
                                return '';
                            },
                            $('<span>').text(entry.subject), $.txt('')
                        )
                    );
                });
            }

            this.append($content);
        },

        draw: (function () {

            function drawItem(item) {
                var $body = $('<div class="text-body noI18n">').html(sanitizer.simpleSanitize(item.body));

                // add target to a tags
                $body.find('a').attr({ target: '_blank', rel: 'noopener' });
                // allow images from https sources
                $body.find('img[src=""][data-original-src^="https://"]').each(function (index, img) {
                    $(img).attr('src', $(img).attr('data-original-src'))
                        .css({ 'max-width': '300px', 'max-height': '300px' });
                });

                this.append(
                    $('<div class="text">').append(
                        $('<h4>').text(item.subject),
                        $body,
                        $('<div class="rss-url">').append(
                            $('<a target="_blank" rel="noopener">').attr('href', item.url).text((item.feedTitle ? item.feedTitle + ' - ' : '') + moment(item.date).format('l'))
                        )
                    )
                );
            }

            return function (baton) {

                var data = baton.data,
                    node = $('<div class="portal-feed">');

                if (data.title) {
                    node.append($('<h2>').text(data.title));
                }

                _(data.items).each(drawItem, node);

                this.append(node);
            };

        }())
    });

    function edit(model, view) {

        // disable widget till data is set by user
        model.set('candidate', true, { silent: true, validate: true });

        var dialog = new ModalDialog({ title: gt('RSS Feeds'), async: true }),
            $url = $('<textarea id="rss_url" class="form-control" rows="5" placeholder="http://">'),
            $description = $('<input id="rss_desc" type="text" class="form-control">'),
            $error = $('<div class="alert alert-danger">').css('margin-top', '15px').hide(),
            props = model.get('props') || {};

        dialog.build(function () {
            this.$body.append(
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
        .addCancelButton()
        .addButton({ label: gt('Save'), action: 'save' })
        .on('cancel', function () {
            if (model.has('candidate') && _.isEmpty(model.attributes.props)) view.removeWidget();
        })
        .on('save', function () {
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
        })
        .open();
    }

    ext.point('io.ox/portal/widget/rss/settings').extend({
        title: gt('RSS Feed'),
        type: 'rss',
        editable: true,
        edit: edit
    });
});
