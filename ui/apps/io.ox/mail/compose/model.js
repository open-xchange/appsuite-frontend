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
     'io.ox/core/tk/attachments',
     'settings!io.ox/mail'
    ], function (mailAPI, mailUtil, emoji, attachments, settings) {

    'use strict';

    var MailModel = Backbone.Model.extend({
        defaults: {
            editorMode: settings.get('messageFormat', 'html'),
            account_name: '',
            attachment: '',
            attachments: new attachments.model.Attachments(),
            bcc: [],
            cc: [],
            color_label: '',
            contacts_ids: [],
            content_type: '',
            disp_notification_to: false,
            flag_seen: '',
            flags: '',
            folder_id: 'default0/INBOX',
            from: '',
            headers: {},
            infostore_ids: [],
            initial: true,
            level: '',
            modified: '',
            msgref: '',
            nested_msgs: [],
            priority: 3,
            received_date: '',
            reply_to: '',
            sendtype: mailAPI.SENDTYPE.NORMAL,
            sent_date: '',
            signature: _.device('smartphone') ? (settings.get('mobileSignatureType') === 'custom' ? 0 : 1) : settings.get('defaultSignature'),
            currentSignature: '',
            size: '',
            subject: '',
            to: [],
            unread: '',
            user: [],
            vcard: 0
        },

        initialize: function () {
            var list = this.get('attachments');
            if (_.isArray(list)) {
                list = this.set('attachments', new attachments.model.Attachments(list), {silent: true});
            }
            if (list.length === 0) {
                list.add({
                    content: '',
                    content_type: this.getContentType()
                }, {silent: true});
            }
        },

        getContentType: function () {
            if (this.get('editorMode') === 'text') {
                return 'text/plain';
            } else {
                return this.get('editorMode') === 'html' ? 'text/html' : 'alternative';
            }
        },
        parse: function (list) {
            return _(mailUtil.parseRecipients([].concat(list).join(', ')))
                .map(function (recipient) {
                    var typesuffix = mailUtil.getChannel(recipient[1]) === 'email' ? '' : mailUtil.getChannelSuffixes().msisdn;
                    return ['"' + recipient[0] + '"', recipient[1], typesuffix];
                });
        },

        setTokens: function (type, tokens) {
            this.set(type, _.map(tokens, function (o) { return [o.label, o.value]; }));
        },

        getTokens: function (type) {
            return this.get(type, []).map(function (o) { return { label: o[0] || '', value: o[1] || '' }; });
        },

        getMail: function() {
            return _(this.toJSON()).pick(
                'from',
                'to',
                'cc',
                'bcc',
                'headers',
                'reply_to',
                'subject',
                'priority',
                'vcard',
                'attachments',
                'nested_msgs'
            );
        },
        convertAllToUnified: emoji.converterFor({
            from: 'all',
            to: 'unified'
        }),
        attachFiles: function attachFiles(files) {
            this.get('attachments').add(files);
        }
    });

    return MailModel;
});
