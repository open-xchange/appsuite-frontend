/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */


define('io.ox/mail/compose/model',
    ['io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/emoji/main',
     'settings!io.ox/mail'
    ], function (mailAPI, mailUtil, emoji, settings) {

    'use strict';

    var MailModel = Backbone.Model.extend({
        defaults: {
            editorMode: settings.get('messageFormat', 'html'),
            account_name: '',
            attachment: '',
            attachments: [],
            bcc: [],
            cc: [],
            color_label: '',
            contacts_ids: [],
            content_type: '',
            disp_notification_to: false,
            flag_seen: '',
            flags: '',
            folder_id: 'default0/INBOX',
            from: [],
            headers: {},
            infostore_ids: [],
            level: '',
            modified: '',
            msgref: '',
            nested_msgs: [],
            priority: 3,
            received_date: '',
            reply_to: '',
            sendtype: mailAPI.SENDTYPE.NORMAL,
            sent_date: '',
            signature: false,
            size: '',
            subject: '',
            to: [],
            unread: '',
            user: [],
            vcard: false
        },

        parse: function (list) {
            return _(mailUtil.parseRecipients([].concat(list).join(', ')))
                .map(function (recipient) {
                    var typesuffix = mailUtil.getChannel(recipient[1]) === 'email' ? '' : mailUtil.getChannelSuffixes().msisdn;
                    return ['"' + recipient[0] + '"', recipient[1], typesuffix];
                });
        },
        setFrom: function () {
            /*var select = view.leftside.find('.sender-dropdown'),
                filteredAccountId;

            filteredAccountId = accountAPI.isUnified(data.account_id) ? accountAPI.parseAccountId(data.msgref) : data.account_id;

            accountAPI.getPrimaryAddressFromFolder(filteredAccountId || folder_id).done(function (from) {
                sender.set(select, from);

            });*/
        },
        getMail: function () {
            var mail = {
                to: [['David Bauer', 'david.bauer@open-xchange.com']],
                from: [['David Bauer', 'david.bauer@open-xchange.com']],
                subject: this.get('subject')
            };
            return mail;
        },
        convertAllToUnified: emoji.converterFor({
            from: 'all',
            to: 'unified'
        })
    });

    return MailModel;
});
