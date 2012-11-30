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
     'io.ox/core/date',
     'gettext!plugins/portal',
     'less!plugins/portal/mail/style.css'], function (ext, links, strings, mailApi, date, gt) {

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
    ext.point('io.ox/portal/widget/mail').extend(new links.InlineLinks({
        index: 200,
        id: 'inline-links',
        ref: 'io.ox/portal/widget/mail/links/inline'
    }));


    ext.point('io.ox/portal/widget').extend({
        id: 'mail',
        title: gt("Inbox"),

        load: function () {
            return mailApi.getAll({ folder: mailApi.getDefaultFolder() }, false).pipe(function (mails) {
                return mailApi.getList(mails.slice(0, 10));
            });
        },

        preview: function (mails) {

            var $content = $('<div class="content">');

            _(mails).each(function (mail) {
                var subject = mail.subject,
                    from = mail.from[0][1],
                    received = new date.Local(mail.received_date).format(date.DATE);
                $content.append(
                    $('<div class="item">').append(
                        $('<span class="bold">').text(from), $.txt(' '),
                        $('<span class="normal">').text(strings.shorten(subject, 50)), $.txt(' '),
                        $('<span class="colored">').text(received)
                    )
                );
            });

            this.append($content);
        },

        loadContent: function () {
            var loading = new $.Deferred();
            require(['io.ox/mail/api'], function (api) {
                api.getAllThreads()
                    .done(function (response) {
                        var ids = response.data;
                        api.getThreads(ids.slice(0, 5))
                            .done(loading.resolve)
                            .fail(loading.reject);
                    })
                    .fail(loading.reject);
            });
            return loading;
        },
        draw: function (list) {

            var node = this;

            node.empty()
                .addClass('io-ox-portal-mail')
                .append(
                    $('<h1>').addClass('clear-title')
                        .text(gt('Recent mails'))
                );

            ext.point('io.ox/portal/widget/mail').invoke('draw', node);

            if (list.length === 0) {

                node.append('<div><b>' + gt('No mails at all!') + '</b></div>');
                return $.when();

            } else {

                return require(['io.ox/core/tk/dialogs',
                                'io.ox/mail/view-grid-template'], function (dialogs, viewGrid) {

                        viewGrid.drawSimpleGrid(list).appendTo(node);

                        if (!sidepopup) {
                            sidepopup = new dialogs.SidePopup({ modal: false });
                        }
                        sidepopup.delegate(node, '.vgrid-cell', function (pane, e, target) {
                                var data = target.data('object-data');
                                pane.parent().removeClass('default-content-padding');
                                require(['io.ox/mail/view-detail', 'io.ox/mail/api'], function (view, api) {
                                    // get thread
                                    var thread = api.getThread(data);
                                    // get first mail first
                                    api.get(thread[0]).done(function (data) {
                                        view.drawThread(pane, thread, data);
                                    });
                                });
                            });
                    }
                );
            }
        }
    });
});
