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
     'gettext!plugins/portal/mail',
     'less!plugins/portal/mail/style.css'], function (ext, links, strings, gt) {

    'use strict';

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
        index: 300,
        tileHeight: 2,

        loadTile: function () {
            var folderLoaded = $.Deferred();
            var mailsLoaded = $.Deferred();

            require(['io.ox/core/api/folder', 'io.ox/mail/api'], function (folderApi, mailApi) {
                folderApi.get(
                    {
                        folder: folderApi.getDefaultFolder('mail'),
                        cache: false
                    })
                    .done(function (folder) {
                        folderLoaded.resolve(folder);
                    })
                    .fail(folderLoaded.reject);

                mailApi.getAll({
                    folder: folderApi.getDefaultFolder('mail'),
                    cache: false
                }, false)
                    .done(function (mails) {
                        if (mails.length === 0) {
                            mailsLoaded.resolve(null);
                        } else {
                            var mail = _.extend({view: "text"}, mails[0]);
                            mailApi.get(mail).done(function (loadedMail) {
                                mailsLoaded.resolve(loadedMail);
                            }).fail(mailsLoaded.reject);
                        }
                    })
                    .fail(mailsLoaded.reject);
            });
            return $.when(folderLoaded, mailsLoaded);
        },
        drawTile: function (folder, mail) {
            var deferred = $.Deferred();
            var $node = $(this);
            require(["io.ox/mail/api"], function (mailApi) {
                $node.addClass('mail-portal-tile');
                var subject = mail.subject;
                var from = mail.from[0][1] + ":"; //brittle, but I could not care less. Don't ask me why the fuck I cannot _(mail.from).reduce(...) this.
                var mailtext = mailApi.beautifyMailText(mail.attachments[0].content, 100);
                subject = strings.shorten(subject, 40);

                $node.append(
                    $('<h1 class="tile-heading">').text(gt("Inbox")),
                    $('<div class="io-ox-clear io-ox-mail-preview">').append(
                        $("<b>").text(from),
                        $('<br>'),
                        $("<span>").text(subject),
                        $('<br>'),
                        $("<i>").html(mailtext)
                    )
                );
                deferred.resolve();
            });

            return deferred;
        },
        load: function () {
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

                        new dialogs.SidePopup({ modal: true })
                        .delegate(node, '.vgrid-cell', function (pane) {
                            var data = $(this).data('object-data');
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