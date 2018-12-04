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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/compose/model', [
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/capabilities',
    'io.ox/core/api/account',
    'io.ox/core/attachments/backbone',
    'io.ox/mail/compose/signatures',
    'io.ox/core/strings',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (composeAPI, mailAPI, mailUtil, capabilities, accountAPI, Attachments, signatureUtil, strings, settings, gt) {

    'use strict';

    // var MailModel = Backbone.Model.extend({

    //     defaults: function () {
    //         return {
    //             autosavedAsDraft: false,
    //             // Autodismiss confirmation dialog
    //             autoDismiss: false,
    //             // enable auto-remove on "discard"
    //             autoDiscard: true,
    //             preferredEditorMode: _.device('smartphone') ? 'html' : settings.get('messageFormat', 'html'),
    //             editorMode: _.device('smartphone') ? 'html' : settings.get('messageFormat', 'html'),
    //             attachments: new Attachments.Collection(),
    //             folder_id: 'default0/INBOX',
    //             initial: true,
    //             priority: 3,
    //             sendDisplayName: !!settings.get('sendDisplayName', true),
    //             sendtype: composeAPI.SENDTYPE.NORMAL,
    //             defaultSignatureId: mailUtil.getDefaultSignature('compose'),
    //             // identifier for empty signature (dropdown)
    //             signatureId: '',
    //             imageResizeOption: 'original',
    //             csid: composeAPI.csid(),
    //             vcard: settings.get('appendVcard', false) ? 1 : 0,
    //             infostore_ids_saved: [],
    //             security: {
    //                 encrypt: settings.get('defaultEncrypt', false)
    //             }
    //         };
    //     },

    //     initialize: function () {
    //         _.extend(this, signatureUtil.model, this);
    //         var self = this,
    //             attachmentsCollection = this.get('attachments');

    //         // Legacy support
    //         // Todo: This should be removed soon
    //         // TODO: clarify (legacy)
    //         // if (_.isObject(attachmentsCollection) && !_.isEmpty(attachmentsCollection)) {
    //         //     var editorMode = this.get('editorMode') === 'text' ? 'text' : 'html';
    //         //     if (editorMode in attachmentsCollection) {
    //         //         attachmentsCollection = [{
    //         //             content: attachmentsCollection[editorMode][0].content,
    //         //             content_type: this.getContentType(),
    //         //             disp: 'inline'
    //         //         }];
    //         //     }
    //         // }
    //         if (_.isArray(attachmentsCollection)) {
    //             var c = new Attachments.Collection();
    //             c.add(attachmentsCollection);
    //             this.set('attachments', c);
    //             attachmentsCollection = c;
    //         }

    //         if (!window.new) {
    //             var content = attachmentsCollection.at(0);
    //             if (!content || content.get('disp') !== 'inline' || !_.isString(content.get('content'))) {
    //                 attachmentsCollection.add({
    //                     content: '',
    //                     content_type: this.getContentType(),
    //                     disp: 'inline'
    //                 }, { at: 0, silent: true });
    //             }
    //         }

    //         _.mapObject({ contacts_ids: 'contact', infostore_ids: 'file', nested_msgs: 'nested' }, function (v, k) {
    //             if (self.get(k)) {
    //                 attachmentsCollection.add(self.get(k).map(function (o) { o.group = v; return o; }), { silent: true });
    //             }
    //         });

    //         if (!this.get('from') || this.get('from').length === 0) {
    //             accountAPI.getPrimaryAddressFromFolder(this.get('folder_id')).then(function (address) {
    //                 // ensure defaultName is set (bug 56342)
    //                 settings.set(['customDisplayNames', address[1], 'defaultName'], address[0]);
    //                 // custom display names
    //                 if (settings.get(['customDisplayNames', address[1], 'overwrite'])) {
    //                     address[0] = settings.get(['customDisplayNames', address[1], 'name'], '');
    //                 }
    //                 if (!settings.get('sendDisplayName', true)) {
    //                     address[0] = null;
    //                 }
    //                 this.set('from', [address]);
    //             }.bind(this));
    //         }

    //         // disable auto remove on discard for draft mails
    //         this.set('autoDiscard', this.get('mode') !== 'edit');

    //         if (!this.get('signatures')) this.set('signatures', this.getSignatures());

    //         // update from when custom displayname changes
    //         this.updateDisplayName();
    //         this.on('change:sendDisplayName', this.updateDisplayName);
    //         ox.on('change:customDisplayNames', this.updateDisplayName.bind(this));

    //         this.updateShadow();
    //     },

    //     setAutoBCC: function () {
    //         if (settings.get('autobcc') && this.get('mode') !== 'edit') {
    //             this.set('bcc', mailUtil.parseRecipients(settings.get('autobcc'), { localpart: false }));
    //         }
    //     },

    //     getCopy: function () {
    //         var ret = _.clone(this.toJSON());
    //         ret.attachments = _.clone(this.attributes.attachments.toJSON());
    //         return ret;
    //     },

    //     updateDisplayName: function () {
    //         // fix current value
    //         var from = this.get('from');
    //         if (!from) return;
    //         this.set('from', [mailUtil.getSender(from[0], this.get('sendDisplayName'))]);
    //     },

    //     updateShadow: function () {
    //         this._shadowAttributes = this.getCopy();
    //     },

    //     dirty: function (flag) {
    //         var previous = !_.isEqual(this._shadowAttributes, this.getCopy()),
    //             current;
    //         // sync mail editor content to model
    //         this.trigger('needsync');
    //         if (flag === true) {
    //             // always dirty this way
    //             this._shadowAttributes = {};
    //         } else if (flag === false) {
    //             this.updateShadow();
    //         }
    //         current = !_.isEqual(this._shadowAttributes, this.getCopy());
    //         if (!current && previous) {
    //             // model changed to not dirty force next restorepoint save to have up to date data
    //             this.forceNextFailSave = true;
    //         }
    //         previous = null;
    //         return current;
    //     },

    //     getContentType: function () {
    //         if (this.get('editorMode') === 'text') {
    //             return 'text/plain';
    //         }
    //         return this.get('editorMode') === 'html' ? 'text/html' : 'alternative';
    //     },

    //     setInitialMailContentType: function () {
    //         if (this.get('editorMode') === 'alternative') {
    //             var content_type = window.new ? this.get('content_type') : this.get('attachments').at(0).get('content_type'),
    //                 ret = 'html';
    //             if (content_type === 'text/plain') {
    //                 ret = 'text';
    //             }
    //             this.set('editorMode', ret, { silent: true });
    //         }
    //     },

    //     setMailContentType: function (type) {
    //         if (window.new) {
    //             this.set('content_type', type, { silent: true });
    //         } else {
    //             this.get('attachments').at(0).set('content_type', type, { silent: true });
    //         }
    //     },

    //     setContent: function (content) {
    //         if (window.new) {
    //             this.set('content', content);
    //         } else {
    //             var model = this.get('attachments').at(0);
    //             model.set('content', content);
    //         }
    //     },

    //     getContent: function () {
    //         var content,
    //             mode = this.get('editorMode');
    //         if (window.new) {
    //             content = this.get('content');
    //         } else {
    //             content = this.get('attachments').at(0).get('content') || '';
    //         }

    //         if (mode === 'text') {
    //             content = _.unescapeHTML(content.replace(/<br\s*\/?>/g, '\n'));
    //         }

    //         // image URL fix
    //         if (mode === 'html') {
    //             // look if prefix needs do be replaced
    //             content = mailUtil.replaceImagePrefix(content);
    //             // Remove wrapping div
    //             content = content.replace(/^<div\sid="ox-\S+">/, '').replace(/<\/div>$/, '');
    //         }

    //         return content;
    //     },

    //     parse: function (list) {
    //         return _(mailUtil.parseRecipients([].concat(list).join(', ')))
    //             .map(function (recipient) {
    //                 var typesuffix = mailUtil.getChannel(recipient[1]) === 'email' ? '' : mailUtil.getChannelSuffixes().msisdn;
    //                 return ['"' + recipient[0] + '"', recipient[1], typesuffix];
    //             });
    //     },

    //     getFailSave: function () {
    //         // a model may not be dirty anymore but still needs currenct data for the restore point (happens on autosave/save as draft)
    //         if (!this.forceNextFailSave && !this.dirty()) return false;
    //         this.forceNextFailSave = false;
    //         var content;
    //         if (window.new) {
    //             content = this.get('content');
    //         } else {
    //             content = this.get('attachments').at(0).get('content');
    //         }

    //         // Fails silently if content size is over 512kb
    //         if (strings.size(content) > 524288) return false;
    //         this.trigger('needsync');
    //         var mail = this.toJSON();

    //         //remove share attachments, since they can not be restored
    //         delete mail.share_attachments;
    //         //remove local files, since they can not be restored
    //         delete mail.files;

    //         // Get flat attachments
    //         mail.attachments = this.attributes.attachments.toJSON();
    //         mail.attachments = _.filter(mail.attachments, function (attachment) {
    //             return attachment.group !== 'localFile';
    //         });

    //         _(mail.attachments).each(function (attachment) {
    //             if (attachment.content) {
    //                 attachment.content = attachment.content.replace(/<img[^>]*src=\\?"data:[^>]*>/gi, '');
    //             }
    //         });

    //         // special case #1: 'alternative'
    //         if (mail.preferredEditorMode === 'alternative') mail.content_type = mail.editorMode === 'html' ? 'text/html' : 'text/plain';

    //         return {
    //             description: gt('Mail') + ': ' + (mail.subject || gt('No subject')),
    //             point: mail
    //         };
    //     },

    //     getMail: function () {
    //         this.trigger('needsync');
    //         var result,
    //             attachmentCollection = this.get('attachments'),
    //             mailAttachments = attachmentCollection.mailAttachments(),
    //             content = window.new ? this.get('content') : attachmentCollection.at(0).get('content');

    //         // fix inline images
    //         content = mailUtil.fixInlineImages(content);

    //         if (window.new) {
    //             this.set('content', content, { silent: true });
    //         } else {
    //             attachmentCollection.at(0).set('content', content, { silent: true });
    //         }

    //         result = this.pick(
    //             'from',
    //             'to',
    //             'cc',
    //             'bcc',
    //             'headers',
    //             'reply_to',
    //             'subject',
    //             'priority',
    //             'vcard',
    //             'nested_msgs',
    //             'sendtype',
    //             'csid',
    //             'initial',
    //             'msgref',
    //             'disp_notification_to',
    //             'share_attachments',
    //             'security'
    //         );

    //         // do some cleanup on attachments
    //         // remove meta from local files
    //         // remove drive attachments from collection
    //         var attachments = _.chain(mailAttachments)
    //             .map(function (a) {
    //                 return _.omit(a, 'meta');
    //             })
    //             .reject(function (a) {
    //                 return a.source === 'drive';
    //             })
    //             .value();

    //         result = _.extend(result, {
    //             attachments:    attachments,
    //             contacts_ids:   attachmentCollection.contactsIds(),      // flat cids for contacts_ids
    //             infostore_ids:  attachmentCollection.driveFiles(),       // get ids only for infostore_ids
    //             files:          attachmentCollection.localFiles()        // get fileObjs for locally attached files
    //         });

    //         // Drop empty values except for subject (may be empty), Numbers (priority, vcard) or Booleans (disp_notification_to)
    //         result = _.omit(result, function (value, key) {
    //             if (key === 'subject' || _.isNumber(value) || _.isBoolean(value)) return false;
    //             return _.isEmpty(value);
    //         });

    //         // remove display name from sender if necessary
    //         if (this.get('sendDisplayName') === false) {
    //             result.from[0][0] = null;
    //         }

    //         return result;

    //     },

    //     getMailForDraft: function () {
    //         var mail = this.getMail();

    //         if (_(mail.flags).isUndefined()) {
    //             mail.flags = mailAPI.FLAGS.DRAFT;
    //         } else if ((mail.data.flags & 4) === 0) {
    //             mail.flags += mailAPI.FLAGS.DRAFT;
    //         }

    //         return mail;
    //     },

    //     getMailForAutosave: function () {

    //         var mail = this.getMailForDraft();

    //         // Infostore attachments are not saved upon autosave anymore as we can't remove them properly later on
    //         // See Bug 54586
    //         if (mail.infostore_ids) delete mail.infostore_ids;

    //         return mail;
    //     },

    //     discard: function () {
    //         if (!this.get('autoDiscard')) return;
    //         // only delete autosaved drafts that are not saved manually and have a msgref
    //         if (this.get('autosavedAsDraft') && this.get('msgref')) mailAPI.remove([mailUtil.parseMsgref(mailAPI.separator, this.get('msgref'))]);
    //     },

    //     attachFiles: function attachFiles(files) {
    //         this.get('attachments').add(files);
    //     },

    //     keepDraftOnClose: function () {
    //         if (settings.get('features/deleteDraftOnClose') !== true) return false;
    //         return this.get('sendtype') === composeAPI.SENDTYPE.EDIT_DRAFT || (this.get('flags') & 4) > 0;
    //     }
    // });

    console.log(gt);

    var AttachmentCollection = Attachments.Collection.extend({
        sync: function (method, model, options) {
            switch (method) {
                case 'create':
                    composeAPI.space.attachments.add(model.get('type'), model.toJSON()).then(options.success, options.error);
                    break;
                case 'read':
                    composeAPI.space.attachments.get(model.get('id')).then(options.success, options.error);
                    break;
                case 'update':
                    composeAPI.space.attachments.update(model.get('id'), model.toJSON()).then(options.success, options.error);
                    break;
                case 'delete':
                    composeAPI.space.attachments.remove(model.get('id')).then(options.success, options.error);
                    break;
                default: // nothing
            }
            return model;
        }
    });

    var MailModel = Backbone.Model.extend({

        defaults: {
            content: ''
        },

        initialize: function () {
            this.set('attachments', new AttachmentCollection());
            this.initialized = this.save().then(function () {
                this.get('attachments').space = this.get('id');

            }.bind(this));
        },

        getContent: function () {
            return this.get('content');
        },

        sync: function (method, model, options) {
            switch (method) {
                case 'create': return composeAPI.space.add(model.get('type'), model.toJSON(), { vcard: settings.get('appendVcard', false) }).then(options.success, options.error);
                case 'read': return composeAPI.space.get(model.get('id')).then(options.success, options.error);
                case 'update': return composeAPI.space.update(model.get('id'), model.toJSON()).then(options.success, options.error);
                case 'delete': return composeAPI.space.remove(model.get('id')).then(options.success, options.error);
                default: // nothing
            }
            return model;
        },

        toJSON: function () {
            var data = Backbone.Model.prototype.toJSON.call(this);
            data.attachments = this.get('attachments').toJSON();
            return data;
        },
        keepDraftOnClose: $.noop,
        initializeSignatures: $.noop,
        setInitialSignature: $.noop,
        setMailContentType: $.noop,
        setAutoBCC: $.noop,
        dirty: $.noop,
        setInitialMailContentType: $.noop
    });

    return MailModel;
});
