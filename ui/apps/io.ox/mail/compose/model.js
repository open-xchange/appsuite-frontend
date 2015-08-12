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
                attachments: new Attachments.Collection(),
                folder_id: 'default0/INBOX',
                initial: true,
                priority: 3,
                sendDisplayName: !!settings.get('sendDisplayName', true),
                sendtype: mailAPI.SENDTYPE.NORMAL,
                defaultSignatureId: settings.get('defaultSignature'),
                csid: mailAPI.csid(),
                vcard: settings.get('appendVcard', false) ? 1 : 0,
                infostore_ids_saved: []
            };
        },

        initialize: function () {
            var self = this,
                attachmentsCollection = this.get('attachments');

            // Legacy support
            // Todo: This should be removed soon
            if (_.isObject(attachmentsCollection) && !_.isEmpty(attachmentsCollection)) {
                var editorMode = this.get('editorMode') === 'text' ? 'text' : 'html';
                if (editorMode in attachmentsCollection) {
                    attachmentsCollection = [{
                        content: attachmentsCollection[editorMode][0].content,
                        content_type: this.getContentType(),
                        disp: 'inline'
                    }];
                }
            }

            if (_.isArray(attachmentsCollection)) {
                this.set('attachments', new Attachments.Collection(attachmentsCollection), { silent: true });
                attachmentsCollection = this.get('attachments');
            }

            var content = attachmentsCollection.at(0);
            if (!content || content.get('disp') !== 'inline' || !_.isString(content.get('content'))) {
                attachmentsCollection.add({
                    content: '',
                    content_type: this.getContentType(),
                    disp: 'inline'
                }, { at: 0, silent: true });
            }

            _.mapObject({ contacts_ids: 'contact', infostore_ids: 'file', nested_msgs: 'nested' }, function (v, k) {
                if (self.get(k)) {
                    attachmentsCollection.add(self.get(k).map(function (o) { o.group = v; return o; }), { silent: true });
                }
            });

            if (this.get('preferredEditorMode') === 'alternative') {
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

            if (!this.get('signatures')) this.getSignatures();

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
            this.get('attachments').at(0).set('content_type', type, { silent: true });
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

        getSignatures: function () {
            if (this.get('mode') === 'edit') {
                this.set('defaultSignatureId', '', { silent: true });
            }

            if (_.device('!smartphone') || this.get('mode') === 'edit') return [];

            if (settings.get('mobileSignatureType') === 'custom') {
                this.set('defaultSignatureId', '0', { silent: true });
            } else {
                this.set('defaultSignatureId', '1', { silent: true });
            }

            var value = settings.get('mobileSignature');

            if (value === undefined) {
                value =
                    //#. %s is the product name
                    gt('Sent from %s via mobile', ox.serverConfig.productName);
            }

            return [{ id: '0', content: value, misc: { insertion: 'below' } }];
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
            _(mail.attachments).each(function (attachment) {
                if (attachment.get('content')) {
                    attachment.set('content', attachment.get('content').replace(/<img[^>]*src=\\?"data:[^>]*>/gi, ''));
                }
            });
            return {
                description: gt('Mail') + ': ' + (mail.subject || gt('No subject')),
                point: mail
            };
        },

        getMail: function () {
            this.trigger('needsync');
            var result,
                attachmentCollection = this.get('attachments'),
                convert = emoji.converterFor({ to: emoji.sendEncoding() }),
                content = attachmentCollection.at(0).get('content');

            //convert to target emoji send encoding
            if (convert && emoji.sendEncoding() !== 'unified') {
                //convert to send encoding (NOOP, if target encoding is 'unified')
                this.set('subject', convert(this.get('subject')), { silent: true });

                content = convert(content, this.get('editorMode'));
            }

            // fix inline images
            content = mailUtil.fixInlineImages(content);

            attachmentCollection.at(0).set('content', content, { silent: true });

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
                'initial',
                'msgref',
                'disp_notification_to'
            );

            result = _.extend(result, {
                attachments:    _(attachmentCollection.mailAttachments()).reject(function (o) { return o.source === 'drive'; }),  // get all attachments without files from drive
                contacts_ids:   attachmentCollection.contactsIds(),      // flat cids for contacts_ids
                infostore_ids:  attachmentCollection.driveFiles(),       // get ids only for infostore_ids
                files:          attachmentCollection.localFiles()        // get fileObjs for locally attached files
            });

            // Drop empty values except for subject (may be empty), Numbers (priority, vcard) or Booleans (disp_notification_to)
            result = _.omit(result, function (value, key) {
                if (key === 'subject' || _.isNumber(value) || _.isBoolean(value)) return false;
                return _.isEmpty(value);
            });

            // remove display name from sender if necessary
            if (this.get('sendDisplayName') === false) {
                result.from[0][0] = null;
            }

            return result;

        },

        getMailForAutosave: function () {
            var mail = this.getMail();

            if (mail.msgref && mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                delete mail.msgref;
            }
            if (mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                mail.sendtype = mailAPI.SENDTYPE.EDIT_DRAFT;
                this.set('sendtype', mail.sendtype, { silent: true });
            }

            // delete mail.infostore_ids;
            if (mail.infostore_ids) {
                // Reject files from drive to avoid duplicates
                var saved = this.get('infostore_ids_saved');
                mail.infostore_ids = _(mail.infostore_ids).reject(function (id) {
                    return _(saved).indexOf(id) > -1;
                });
            }

            if (_(mail.flags).isUndefined()) {
                mail.flags = mailAPI.FLAGS.DRAFT;
            } else if ((mail.data.flags & 4) === 0) {
                mail.flags += mailAPI.FLAGS.DRAFT;
            }
            return mail;
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
