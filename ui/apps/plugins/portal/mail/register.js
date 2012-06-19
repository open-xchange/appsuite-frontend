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
     'less!plugins/portal/mail/style.css'], function (ext, links, strings) {

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
        label: 'Compose new email',
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
                                console.log("Loaded Mails", loadedMail);
                                mailsLoaded.resolve(loadedMail);
                            }).fail(mailsLoaded.reject);
                        }
                    })
                    .fail(mailsLoaded.reject);
            });
            return $.when(folderLoaded, mailsLoaded);
        },
        drawTile: function (folder, mail) {
            var $node = $(this);
            $node.addClass('mail-portal-tile');
            var subject = mail.subject;
            var mailtext = $("<div>").html(mail.attachments[0].content).text(); // Hihi
            subject = strings.shorten(subject, 40);
            mailtext = strings.shorten(mailtext, 60);
            
            
            $node.append(
                $('<h1>').text("Mail"),
                $('<span class="unread-mail-count">').text('Unread:'),
                $('<span class="badge badge-info unread-mail-count">').text(folder.unread),
                $('<div class="io-ox-clear">').append(
                    $('<div class="">').append($("<b>").text(subject), $('<br>'), $("<span>").text(mailtext))
                )
            );
            
            return $.when();
        },
        load: function () {
            var loading = new $.Deferred();
            require(['io.ox/mail/api'], function (api) {
                api.getAllThreads()
                    .done(function (ids) {
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
                    $('<div>').addClass('clear-title')
                        .text('New emails')
                );

            ext.point('io.ox/portal/widget/mail').invoke('draw', node);

            if (list.length === 0) {

                node.append('<div><b>No mails at all!</b></div>');
                return $.when();

            } else {

                return require(['io.ox/core/tk/dialogs',
                                'io.ox/mail/view-grid-template'], function (dialogs, viewGrid) {

                        viewGrid.drawSimpleGrid(list).appendTo(node);

                        new dialogs.SidePopup(600)
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
        },
        post: function (ext) {
            var self = this;
            require(['io.ox/mail/api'], function (api) {
                api.on('refresh.all', function () {
                    ext.load().done(_.bind(ext.draw, self));
                });
            });
        }
    });
});