/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/publications/wizard', ['io.ox/publications/api', 'gettext!io.ox/publications'], function (api, gt) {

    'use strict';

    var hSendPublicationByMail = function (e) {
        e.preventDefault();
        // send email
        var pub = e.data.publication,
            data = { subject: gt('New publication'), attachments: [{ content: pub.url }] };
        // hide dialog
        e.data.dialog.modal('hide');
        // open compose
        require(['io.ox/mail/write/main'], function (m) {
            m.getApp().launch().done(function () {
                this.compose(data);
            });
        });
    };

    var hCloseDialog = function (e) {
        e.preventDefault();
        e.data.dialog.modal('hide');
    };

    return {

        oneClickAdd: function (folderId) {
            api.publishFolder(folderId).done(function (data) {
                // get publication
                var pub = data['com.openexchange.publish.microformats.infostore.online'];
                // build modal dialog
                var dialog = $('<div>').addClass('modal fade');
                dialog.append(
                    // header
                    $('<div>').addClass('modal-header')
                    .append($('<a>').addClass('close').attr('data-dismiss', 'modal').text('x'))
                    .append($('<h3>').text(gt('Publication created'))),
                    // body
                    $('<div>').addClass('modal-body')
                    .append($('<a>', { href: pub.url, target: '_blank' }).text(pub.url)),
                    // footer
                    $('<div>').addClass('modal-footer')
                    .append(
                        $('<a>', { href: '#' }).addClass('btn btn-primary').text(gt('Close'))
                        .on('click', { dialog: dialog }, hCloseDialog),
                        $('<a>', { href: '#' }).addClass('btn').text(gt('Send email'))
                        .on('click', { publication: pub, dialog: dialog }, hSendPublicationByMail)
                    )
                )
                .appendTo('body')
                .modal()
                .on('hide', function () {
                    dialog.remove();
                    dialog = null;
                });
            });
        }
    };
});
