/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/print',
    ['io.ox/core/print',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'gettext!io.ox/mail'], function (print, api, util, gt) {

    'use strict';

    var regImageSrc = /(<img[^>]+src=")\/ajax/g;

    function getContent(data) {
        if (!_.isArray(data.attachments)) return '';
        var source = String(data.attachments[0].content || ''),
            isLarge = source.length > 1024 * 512; // > 512 KB
        // replace images on source level
        source = source.replace(regImageSrc, '$1' + ox.apiRoot);
        return $.trim(source.replace(/\n/g, '').replace(/<br[ ]?\/?>/g, '\n'));
    }

    function getList(data, field) {
        return _(data[field || 'from']).map(function (obj) {
            return util.getDisplayName(obj).replace(/\s/g, '\u00A0');
        }).join('\u00A0\u2022 ');
    }

    function process(data) {
        return {
            from: getList(data, 'from'),
            to: getList(data, 'to'),
            cc: getList(data, 'cc'),
            subject: data.subject,
            date: util.getFullDate(data.received_date || data.sent_date),
            content: getContent(data)
        };
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(_.extend({ view: 'text' }, obj));
                },

                i18n: {
                    to: gt('To'),
                    copy: gt.npgettext('CC', 'Copy', 'Copy', 1)
                },

                file: 'print.html',
                process: process,
                selection: selection,
                selector: '.mail',
                window: win
            });
        }
    };
});
