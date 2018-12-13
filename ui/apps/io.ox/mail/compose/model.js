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

    //         if (!this.get('signatures')) this.set('signatures', this.getSignatures());

    //         this.updateShadow();
    //     },

    //     getCopy: function () {
    //         var ret = _.clone(this.toJSON());
    //         ret.attachments = _.clone(this.attributes.attachments.toJSON());
    //         return ret;
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

    //     setMailContentType: function (type) {
    //         this.set('content_type', type, { silent: true });
    //     },

    //     setContent: function (content) {
    //         this.set('content', content);
    //     },

    //     getFailSave: function () {
    //         // a model may not be dirty anymore but still needs currenct data for the restore point (happens on autosave/save as draft)
    //         if (!this.forceNextFailSave && !this.dirty()) return false;
    //         this.forceNextFailSave = false;
    //         var content = this.get('content');

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
    //             content = this.get('content') ;

    //         // fix inline images
    //         content = mailUtil.fixInlineImages(content);

    //         this.set('content', content, { silent: true });

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
    //             result.from[0] = null;
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
                    return composeAPI.space.attachments.add(model.get('type'), model.toJSON()).then(options.success, options.error);
                case 'read':
                    return composeAPI.space.attachments.get(model.get('id')).then(options.success, options.error);
                case 'update':
                    return composeAPI.space.attachments.update(model.get('id'), model.toJSON()).then(options.success, options.error);
                case 'delete':
                    return composeAPI.space.attachments.remove(model.get('id')).then(options.success, options.error);
                default:
                    return $.when(model);
            }
        }
    });

    var MailModel = Backbone.Model.extend({

        defaults: function () {
            return {
                //from: '',
                to:  [],
                cc:  [],
                bcc: [],
                subject: '',
                content: '',
                contentType: '',
                attachments: [],
                meta: {
                    // new/reply/replyall/forward/resend
                    type: 'new',
                    date: '',
                    originalId: '',
                    originalFolderId: '',
                    security: {
                        encrypt: false,
                        pgpInline: false,
                        sign: false
                    },
                    sharedAttachments: {
                        language: '',
                        enabled: false,
                        autodelete: false,
                        expiryDate: '',
                        password: ''
                    }
                },
                requestReadReceipt: false,
                priority: 'normal'
            };
        },

        initialize: function () {
            this.initialized = this.create().then(function (data) {
                // fix previewUrl
                var collection = new AttachmentCollection();
                collection.space = data.id;
                collection.reset(_(data.attachments).map(function (attachment) {
                    return new Attachments.Model(_.extend({}, attachment, { group: 'mail', space: collection.space }));
                }));
                // TODO can we generalize this?!?
                data.to = (data.to || []).concat(this.get('to'));
                data.cc = (data.cc || []).concat(this.get('cc'));
                data.bcc = (data.bcc || []).concat(this.get('bcc'));
                data.attachments = collection;
                this.set(data);

                this.prevAttributes = data;
                this.on('change', this.requestSave);
                this.listenTo(collection, 'remove', this.onRemoveAttachment);
            }.bind(this));

            this.requestSave = _.debounce(this.save.bind(this), 5000);
        },

        getContent: function () {
            var content = this.get('content');

            // var mode = this.get('editorMode');
            // if (mode === 'text') {
            //     content = _.unescapeHTML(content.replace(/<br\s*\/?>/g, '\n'));
            // }
            // // image URL fix
            // if (mode === 'html') {
            //     // look if prefix needs do be replaced
            //     content = mailUtil.replaceImagePrefix(content);
            //     // Remove wrapping div
            //     content = content.replace(/^<div\sid="ox-\S+">/, '').replace(/<\/div>$/, '');
            // }

            return content;
        },

        send: function () {
            this.destroyed = true;
            return composeAPI.space.send(this.get('id'), this.toJSON());
        },

        attachFiles: function attachFiles(files) {
            // TODO: mapping?!
            this.get('attachments').add(files);
        },

        onRemoveAttachment: function (model) {
            if (this.destroyed) return;
            composeAPI.space.attachments.remove(this.get('id'), model.get('id'));
        },

        create: function () {
            if (this.has('id')) return composeAPI.space.get(this.get('id'));
            var meta = this.get('meta'),
                opt = {};
            opt.vcard = /(new|reply|replayall|forward|resend)/.test(meta.type) && settings.get('appendVcard', false);
            opt.original = /(reply|replayall)/.test(meta.type);
            return composeAPI.spaced(meta, opt).then(function (data) {
                if (!this.get('attachments') || !this.get('attachments').length) return data;

                return $.when.apply($, this.get('attachments').map(function (attachment) {
                    return composeAPI.space.attachments.add(data.id, attachment);
                })).then(function (attachments) {
                    data.attachments = (data.attachments || []).concat(attachments);
                    return data;
                });
            }.bind(this));
        },

        /**
         * Traverses the two given objects and only return attributes (and sub attributes) which has been changed.
         * Used to only update necessary parts of the mail model
         */
        deepDiff: function (old, current) {
            var self = this;

            current = current || this.attributes;

            return _(current)
                .chain()
                .mapObject(function (value, key) {
                    if (value instanceof Backbone.Model || value instanceof Backbone.Collection) return;
                    if (_.isObject(value) && !_.isArray(value)) {
                        var sub = self.deepDiff(old[key], value);
                        if (_.isEmpty(sub)) return;
                        return sub;
                    }
                    if (_.isEqual(old[key], value)) return;
                    return value;
                })
                .omit(function (value) {
                    return !value;
                })
                .value();
        },

        save: function () {
            if (this.destroyed) return;
            var diff = this.deepDiff(this.prevAttributes);
            if (_.isEmpty(diff)) return;
            return composeAPI.space.update(this.get('id'), diff);
        },

        destroy: function () {
            if (this.destroyed) return;
            this.destroyed = true;
            return composeAPI.space.remove(this.get('id'));
        },

        toJSON: function () {
            var data = Backbone.Model.prototype.toJSON.call(this);
            data.attachments = this.get('attachments').toJSON();
            return data;
        },
        keepDraftOnClose: $.noop,
        setMailContentType: $.noop,
        dirty: $.noop
    });

    return MailModel;
});
