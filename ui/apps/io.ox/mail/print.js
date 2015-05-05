/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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

    var regImageSrc = /(<img[^>]+src=")\/ajax/g,
        // TODO: add setting (html OR text)
        type = 'html';

    function getContent(data) {
        if (!_.isArray(data.attachments)) return '';
        if (type === 'text') {
            var source = String(data.attachments[0].content || '');
            // replace images on source level
            source = source.replace(regImageSrc, '$1' + ox.apiRoot);
            return $.trim(source.replace(/\n/g, '').replace(/<br[ ]?\/?>/g, '\n'));
        } else {
            return content.get(data, { autoCollapseBlockquotes: false }).content.innerHTML;
        }
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

    function process(data) {
        return {
            from: getList(data, 'from'),
            to: getList(data, 'to'),
            cc: getList(data, 'cc'),
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
                    return api.get(_.extend({ view: type }, obj));
                },

                title: selection.length === 1 ? selection[0].subject : undefined,

                i18n: {
                    to: gt('To'),
                    copy: gt.pgettext('CC', 'Copy')
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
