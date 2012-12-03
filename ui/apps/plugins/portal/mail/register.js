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
     'gettext!plugins/portal'], function (ext, links, strings, mailApi, util, date, gt) {

    'use strict';

    var sidepopup; //only one detailsidepopup is needed
    // actions
    ext.point('io.ox/portal/widget/mail/actions/compose').extend({
        id: 'compose',
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose();
                });
            });
        }
    });

    // link
    ext.point('io.ox/portal/widget/mail/links/inline').extend(new links.Link({
        index: 100,
        id: 'compose',
        label: gt('Compose new email'),
        ref: 'io.ox/portal/widget/mail/actions/compose'
    }));

    // inline links
    ext.point('io.ox/portal/widget/mail/links').extend(new links.InlineLinks({
        ref: 'io.ox/portal/widget/mail/links/inline'
    }));


    ext.point('io.ox/portal/widget/mail').extend({

        title: gt("Inbox"),

        load: function (baton) {
            return mailApi.getAll({ folder: mailApi.getDefaultFolder() }, false).pipe(function (mails) {
                return mailApi.getList(mails.slice(0, 10)).done(function (data) {
                    baton.data = data;
                });
            });
        },

        preview: function (baton) {
            var $content = $('<div class="content">');
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
            this.append($content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/mail/view-detail', 'io.ox/mail/api'], function (view, api) {
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(
                        view.draw(data).css('padding', 0)
                    );
                });
            });
        }
    });
});
