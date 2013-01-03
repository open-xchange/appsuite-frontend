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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/mail/register',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/strings',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/date',
     'gettext!plugins/portal'], function (ext, links, strings, api, util, date, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/mail').extend({

        title: gt("Inbox"),

        action: function (baton) {
            ox.launch('io.ox/mail/main', { folder: api.getDefaultFolder() });
        },

        load: function (baton) {
            return api.getAll({ folder: api.getDefaultFolder() }, false).pipe(function (mails) {
                return api.getList(mails.slice(0, 10)).done(function (data) {
                    baton.data = data;
                });
            });
        },

        preview: function (baton) {
            var $content = $('<div class="content">');
            if (baton.data && baton.data.length) {
                _(baton.data).each(function (mail) {
                    var received = new date.Local(mail.received_date).format(date.DATE);
                    $content.append(
                        $('<div class="item">')
                        .data('item', mail)
                        .append(
                            $('<span class="bold">').text(util.getDisplayName(mail.from[0])), $.txt(' '),
                            $('<span class="normal">').text(strings.shorten(mail.subject, 50)), $.txt(' '),
                            $('<span class="accent">').text(received)
                        )
                    );
                });
            } else {
                $content.text(gt('No mails at all!'));
            }
            this.append($content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/mail/view-detail'], function (view) {
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });

    ext.point('io.ox/portal/widget/mail/settings').extend({
        title: gt('E-mail'),
        type: 'mail',
        editable: false
    });

    ext.point('io.ox/portal/widget/stickymail').extend({

        // called right after initialize. Should return a deferred object when done
        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id, view: 'text' }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {
            var data = baton.data,
                received = new date.Local(data.received_date).format(date.DATE),
                content = '',
                source = _(data.attachments).reduce(function (memo, a) {
                    return memo + (a.content_type === 'text/plain' ? a.content : '');
                }, '');
            // escape html
            $('<div>').html(source).contents().each(function () {
                content += $(this).text() + ' ';
            });
            this.append(
                $('<div class="content">').append(
                    $('<div class="item">')
                    .data('item', data)
                    .append(
                        $('<span class="bold">').text(util.getDisplayName(data.from[0])), $.txt(' '),
                        $('<span class="normal">').text(strings.shorten(data.subject, 100)), $.txt(' '),
                        $('<span class="accent">').text(received), $.txt(' '),
                        $('<span class="gray">').text(strings.shorten(content, 600))
                    )
                )
            );
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/mail/view-detail'], function (view) {
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });
});
