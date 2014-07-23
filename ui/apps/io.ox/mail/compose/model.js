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

        defaults: function () {
            return {
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
            };
        },

        initialize: function () {
            var list = this.get('attachments');
            if (_.isArray(list)) {
                this.set('attachments', new attachments.model.Attachments(list), {silent: true});
                list = this.get('attachments');
            }
            if (list.length === 0) {
                list.add({
                    content: '',
                    content_type: this.getContentType(),
                    disp: 'inline'
                }, {silent: true});
            }
            this.updateShadow();
        },

        getCopy: function () {
            var ret = _.clone(this.attributes);
            ret.attachments = _.clone(this.attributes.attachments.toJSON());
            return ret;
        },

        updateShadow: function () {
            this._shadowAttributes = this.getCopy();
        },

        dirty: function (flag) {
            // sync mail editor content to model
            this.trigger('needsync');
            if (flag === true) {
                this._shadowAttributes = {}; // always dirty this way
            } else if (flag === false) {
                this.updateShadow();
            } else {
                return !_.isEqual(this._shadowAttributes, this.getCopy());
            }
        },

        getContentType: function () {
            if (this.get('editorMode') === 'text') {
                return 'text/plain';
            } else {
                return this.get('editorMode') === 'html' ? 'text/html' : 'alternative';
            }
        },

        setContent: function (content) {
            var model = this.get('attachments').at(0);
            model.set('content', content);
        },

        getContent: function () {
            var content = this.get('attachments').at(0).get('content'),
                mode = this.get('editorMode');

            if (mode === 'text') {
                content = _.unescapeHTML(content.replace(/<br\s*\/?>/g, '\n'));
            }

            // image URL fix
            if (mode === 'html') {
                content = content.replace(/(<img[^>]+src=")\/ajax/g, '$1' + ox.apiRoot);
            }

            // convert different emoji encodings to unified
            content = this.convertAllToUnified(content);

            return content;
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
            this.trigger('needsync');
            var result;
            var convert = emoji.converterFor({to: emoji.sendEncoding()});
            var content = this.get('attachments').at(0).get('content');
            // get flat ids for data.infostore_ids
            /*if (mail.data.infostore_ids) {
                mail.data.infostore_ids = _(mail.data.infostore_ids).pluck('id');
            }
            // get flat cids for data.contacts_ids
            if (mail.data.contacts_ids) {
                mail.data.contacts_ids = _(mail.data.contacts_ids).map(function (o) { return _.pick(o, 'folder_id', 'id'); });
            }
            // move nested messages into attachment array
            _(mail.data.nested_msgs).each(function (obj) {
                mail.data.attachments.push({
                    id: mail.data.attachments.length + 1,
                    filemname: obj.subject,
                    content_type: 'message/rfc822',
                    msgref: obj.msgref
                });
            });
            delete mail.data.nested_msgs;
            */


            //convert to target emoji send encoding
            if (convert && emoji.sendEncoding() !== 'unified') {
                //convert to send encoding (NOOP, if target encoding is 'unified')
                this.set('subject', convert(this.get('subject')), {silent: true});

                content = convert(content, this.get('editorMode'));
            }

            // fix inline images
            content = mailUtil.fixInlineImages(content);

            this.get('attachments').at(0).set('content', content, {silent: true});

            result = this.pick(
                'from',
                'to',
                'cc',
                'bcc',
                'headers',
                'reply_to',
                'subject',
                'priority',
                'vcard',
                'nested_msgs'
            );

            if (this.get('msgref')) {
                result.msgref = this.get('msgref');
            }

            if (this.get('contacts_ids')) {
                // get flat cids for data.contacts_ids
                result.contacts_ids = _(this.get('contacts_ids')).map(function (o) { return _.pick(o, 'folder_id', 'id'); });
            }

            result.attachments = this.get('attachments').filter(function (a) {
                return !!a.get('content');
            }).map(function (m) {
                return m.attributes;
            });

            result.infostore_ids = this.get('attachments').filter(function (a) {
                return a.get('group') === 'file' && !a.needsUpload();
            }).map(function (m) {
                return m.get('id');
            });

            result.files = this.get('attachments').filter(function (a) {
                return a.needsUpload();
            }).map(function (m) {
                return m.fileObj;
            });

            return result;
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
