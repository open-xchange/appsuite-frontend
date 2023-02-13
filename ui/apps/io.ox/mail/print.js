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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/print',
    ['io.ox/core/print',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/mail/detail/content',
     'gettext!io.ox/mail'
    ], function (print, api, util, content,  gt) {

    'use strict';

    // TODO: add setting (html OR text)
    var type = 'html';

    function getContent(data) {
        if (!_.isArray(data.attachments)) return '';
        // no longer needed to distinguish by type. content.get can handle html as well as text
        return content.get(data, { autoCollapseBlockquotes: false }).content.innerHTML;
    }

    function getList(data, field) {
        return _(data[field || 'from']).map(function (obj) {
            return _.escape(util.getDisplayName(obj, { showMailAddress: true })).replace(/\s/g, '\u00A0');
        }).join('\u00A0\u2022 ');
    }

    function getAttachments(data) {
        return _(util.getAttachments(data) || []).map(function (attachment, i) {
            return {
                title: attachment.filename || ('Attachment #' + i),
                size: attachment.size ? _.filesize(attachment.size || 0) : 0
            };
        });
    }

    // Check if decrypted Guard email
    function isDecrypted(selection) {
        return selection[0] && selection[0].security && selection[0].security.decrypted;
    }

    function process(data) {
        return {
            from: getList(data, 'from'),
            to: getList(data, 'to'),
            cc: getList(data, 'cc'),
            bcc: getList(data, 'bcc'),
            subject: data.subject,
            date: util.getFullDate(data.received_date || data.sent_date),
            sort_date: -(data.received_date || data.sent_date),
            content: getContent(data),
            attachments: getAttachments(data)
        };
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    // is an embedded email?
                    if (util.isEmbedded(selection[0])) return $.Deferred().resolve(selection[0]);
                    // fetch normal message
                    return api.get(_.extend({ view: type, unseen: true, decrypt: isDecrypted(selection) }, obj));
                },

                title: selection.length === 1 ? selection[0].subject : undefined,

                i18n: {
                    to: gt('To'),
                    copy: gt.pgettext('CC', 'Copy'),
                    blindcopy: gt.pgettext('BCC', 'Blind copy')
                },

                process: process,
                selection: selection,
                selector: '.mail' + '-' + type,
                sortBy: 'sort_date',
                window: win
            });
        }
    };
});
