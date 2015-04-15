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

define('io.ox/mail/compose/model', [
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/api/account',
    'io.ox/emoji/main',
    'io.ox/core/attachments/backbone',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (mailAPI, mailUtil, accountAPI, emoji, Attachments, settings, gt) {

    'use strict';

    var MailModel = Backbone.Model.extend({

        defaults: function () {
            return {
                preferredEditorMode: settings.get('messageFormat', 'html'),
                editorMode: settings.get('messageFormat', 'html'),
                account_name: '',
                attachment: '',
                attachments: new Attachments.Collection(),
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
                sendDisplayName: !!settings.get('sendDisplayName', true),
                sendtype: mailAPI.SENDTYPE.NORMAL,
                sent_date: '',
                signature: _.device('smartphone') ? (settings.get('mobileSignatureType') === 'custom' ? 0 : 1) : settings.get('defaultSignature'),
                currentSignature: '',
                csid: mailAPI.csid(),
                size: '',
                subject: '',
                to: [],
                unread: '',
                user: [],
                vcard: settings.get('appendVcard', false) ? 1 : 0
            };
        },

        initialize: function () {
            var list = this.get('attachments');
            if (_.isObject(list) && !_.isEmpty(list)) {
                var editorMode = this.get('editorMode') === 'text' ? 'text' : 'html';
                if (editorMode in list) {
                    list = [{
                        content: list[editorMode][0].content,
                        content_type: this.getContentType(),
                        disp: 'inline'
                    }];
                }
            }

            if (_.isArray(list)) {
                this.set('attachments', new Attachments.Collection(list), { silent: true });
                list = this.get('attachments');
            }
            var content = list.at(0);
            if (!content || content.get('disp') !== 'inline' || !_.isString(content.get('content'))) {
                list.add({
                    content: '',
                    content_type: this.getContentType(),
                    disp: 'inline'
                }, { at: 0, silent: true });
            }

            if (this.get('contacts_ids')) {
                list.add(this.get('contacts_ids').map(function (o) {
                    o.group = 'contact';
                    return o;
                }), { silent: true });
            }

            if (this.get('infostore_ids')) {
                list.add(this.get('infostore_ids').map(function (o) {
                    o.group = 'file';
                    return o;
                }), { silent: true });
            }

            if (this.get('nested_msgs')) {
                list.add(this.get('nested_msgs').map(function (o) {
                    o.group = 'nested';
                    return o;
                }), { silent: true });
            }

            if (this.preferredEditorMode === 'alternative') {
                this.set('editorMode', 'html', { silent: true });
                if (this.get('content_type') === 'text/plain') {
                    this.set('editorMode', 'text', { silent: true });
                }
            }

            if (!this.get('from') || this.get('from').length === 0) {
                accountAPI.getPrimaryAddressFromFolder(this.get('folder_id')).then(function (address) {
                    this.set('from', [address]);
                }.bind(this));
            }

            if (this.get('mode') === 'edit') {
                this.set({ 'signature': '' });
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
                // always dirty this way
                this._shadowAttributes = {};
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

        setInitialMailContentType: function () {
            if (this.get('editorMode') === 'alternative') {
                var content_type = this.get('attachments').at(0).get('content_type'),
                    ret = 'html';
                if (content_type === 'text/plain') {
                    ret = 'text';
                }
                this.set('editorMode', ret, { silent: true });
            }
        },

        setMailContentType: function (type) {
            type = (type === 'text' ? 'plain' : type);
            this.get('attachments').at(0).set('content_type', 'text/' + type, { silent: true });
        },

        setContent: function (content) {
            var model = this.get('attachments').at(0);
            model.set('content', content);
        },

        getContent: function () {
            var content = this.get('attachments').at(0).get('content') || '',
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

        getFailSave: function () {
            this.trigger('needsync');
            var mail = this.toJSON();
            //remove local files, since they can not be restored
            delete mail.files;
            mail.attachments = mail.attachments.filter(function (attachment) {
                return attachment.get('group') !== 'localFile';
            });
            return {
                description: gt('Mail') + ': ' + (mail.subject || gt('No subject')),
                point: mail
            };
        },

        getMail: function () {
            this.trigger('needsync');
            var result;
            var convert = emoji.converterFor({ to: emoji.sendEncoding() });
            var content = this.get('attachments').at(0).get('content');
            // get flat ids for data.infostore_ids
            /*if (mail.data.infostore_ids) {
                mail.data.infostore_ids = _(mail.data.infostore_ids).pluck('id');
            }
            // get flat cids for data.contacts_ids
            if (mail.data.contacts_ids) {
                mail.data.contacts_ids = _(mail.data.contacts_ids).map(function (o) { return _.pick(o, 'folder_id', 'id'); });
            }
            */

            //convert to target emoji send encoding
            if (convert && emoji.sendEncoding() !== 'unified') {
                //convert to send encoding (NOOP, if target encoding is 'unified')
                this.set('subject', convert(this.get('subject')), { silent: true });

                content = convert(content, this.get('editorMode'));
            }

            // fix inline images
            content = mailUtil.fixInlineImages(content);

            this.get('attachments').at(0).set('content', content, { silent: true });

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
                'nested_msgs',
                'sendtype',
                'csid',
                'initial'
            );

            // remove display name from sender if necessary
            if (this.get('sendDisplayName') === false) {
                result.from[0][0] = null;
            }

            if (this.get('msgref')) {
                result.msgref = this.get('msgref');
            }

            if (this.get('disp_notification_to')) {
                result.disp_notification_to = this.get('disp_notification_to');
            }

            // get flat cids for data.contacts_ids
            result.contacts_ids = this.get('attachments').filter(function (a) {
                return a.get('group') === 'contact';
            }).map(function (o) {
                return o.pick('folder_id', 'id');
            });

            result.attachments = this.get('attachments').filter(function (a) {
                return a.get('disp') === 'inline' || a.get('disp') === 'attachment';
            }).map(function (m, i) {
                var attr;
                if (i === 0 && m.attributes.content_type === 'text/plain') {
                    attr = m.pick('content_type', 'content');
                    // For "text/plain" mail bodies, the JSON boolean field "raw" may be specified inside the body's JSON representation to signal that the text content shall be kept as-is; meaning to keep all formatting intact
                    attr.raw = true;
                } else {
                    attr = m.attributes;
                }
                return attr;
            });

            result.infostore_ids = this.get('attachments').filter(function (a) {
                return a.get('group') === 'file';
            }).map(function (m) {
                return m.get('id');
            });

            result.files = this.get('attachments').filter(function (a) {
                return a.get('group') === 'localFile';
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
