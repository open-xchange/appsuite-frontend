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
    'io.ox/core/attachments/backbone',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/mail/sanitizer'
], function (composeAPI, mailAPI, Attachments, settings, gt, sanitizer) {

    'use strict';

    var attachmentsAPI = composeAPI.space.attachments;

    return Backbone.Model.extend({

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
                    //new/reply/reply_all/forward_inline/forward_attachment/resend
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
                // adjust data
                data.to = (data.to || []).concat(this.get('to'));
                data.cc = (data.cc || []).concat(this.get('cc'));
                data.bcc = (data.bcc || []).concat(this.get('bcc'));

                var collection = new Attachments.Collection();
                collection.space = data.id;
                collection.reset(_(data.attachments).map(function (attachment) {
                    return new Attachments.Model(_.extend({}, attachment, { group: 'mail', space: collection.space }));
                }));
                data.attachments = collection;
                return data;
            }.bind(this)).then(function (data) {
                this.set(data);
                if (!this.prevAttributes) this.prevAttributes = data;
                this.listenTo(data.attachments, 'remove', this.onRemoveAttachment);
            }.bind(this));
        },

        initialPatch: function () {
            this.requestSave = _.throttle(this.save.bind(this), settings.get('autoSaveAfter', 15000), { leading: false });
            this.on('change', this.requestSave);

            // explicitedly call save here to push the initial changes of the ui (quoting/from/bcc) to the composition space
            return this.save();
        },

        send: function () {
            this.destroyed = true;
            return composeAPI.space.send(this.get('id'), this.toJSON()).fail(function () {
                this.destroyed = false;
            }.bind(this));
        },

        saveDraft: function () {
            this.destroyed = true;
            return composeAPI.space.save(this.get('id'), this.toJSON()).fail(function () {
                this.destroyed = false;
            }.bind(this));
        },

        attachFiles: function (files) {
            this.get('attachments').add(files);
        },

        attachVCard: function () {
            composeAPI.space.attachments.vcard(this.get('id')).then(function (vcard) {
                this.get('attachments').add(vcard);
            }.bind(this));
        },

        onRemoveAttachment: function (model) {
            if (this.destroyed) return;

            model.trigger('destroy');
            if (model.get('id')) attachmentsAPI.remove(this.get('id'), model.get('id'));
        },

        quoteMessage: (function () {
            function mailAddress(item) {
                if (item.length < 2) return item[0] || '';
                return item[0] + ' <' + item[1] + '>';
            }
            return function (data) {
                var meta = data.meta,
                    original = meta.replyFor || meta.forwardsFor;

                // get the content inside the body of the mail
                if (data.contentType === 'text/html') {
                    data.content = data.content.replace(/^[\s\S]*?<body[^>]*>([\s\S]*?)<\/body>[\s\S]*?$/i, '$1').trim();
                    data.content = sanitizer.simpleSanitize(data.content);
                }

                original = [].concat(original)[0];
                if (!original) return data;

                return mailAPI.get({ id: original.originalId, folder: original.originalFolderId }, { cache: !settings.get('features/fixContentType', false) }).then(function (mail) {
                    var header = [];

                    if (/^(REPLY|REPLY_ALL)$/.test(data.meta.type)) {
                        //#. %1$s A date
                        //#. %2$s An email address
                        //#. Example: On January 8, 2019 2:23 PM richard@open-xchange.com wrote:
                        header.push(gt('On %1$s %2$s wrote:', moment(data.meta.date).format('LLL'), mail.from.map(mailAddress).join(', ')));
                    } else if (/^FORWARD_INLINE$/.test(data.meta.type)) {
                        header.push(
                            gt('---------- Original Message ----------'),
                            //#. %1$s An email address
                            //#. Example: From: richard@open-xchange.com
                            gt('From: %1$s', mail.from.map(mailAddress).join(', ')),
                            //#. %1$s An email address or a comma separated list of mail addresses
                            gt('To: %1$s', mail.to.map(mailAddress).join(', ')),
                            gt('Date: %1$s', moment(data.meta.date).format('LLL')),
                            //#. %1$s The subject of an email
                            gt('Subject: %1$s', mail.subject)
                        );
                    }

                    // append two empty lines
                    header.push('', '');

                    if (data.contentType === 'text/html') {
                        data.content = '<div><br></div>' + $('<blockquote type="cite">').append(
                            header.map(function (line) {
                                if (!line) return '<div><br></div>';
                                return $('<div>').text(line);
                            }),
                            data.content
                        ).prop('outerHTML');
                    } else if (data.contentType === 'text/plain') {
                        data.content = '\n' +
                            header.map(function (line) { return '> ' + line; }).join('\n') +
                            ' \n' +
                            data.content.trim().split('\n').map(function (l) { return '> ' + l; }).join('\n');
                    }

                    return data;
                });
            };
        }()),

        create: function () {
            if (this.has('id')) return composeAPI.space.get(this.get('id'));

            //new/reply/replyall/forward/resend/edit/copy
            var type = this.get('type') || 'new',
                original = this.get('original'),
                opt = {
                    vcard: !/(edit|copy)/.test(type) && settings.get('appendVcard', false)
                };
            // unset type and original since both are only used on creation of a model
            this.type = type;
            this.unset('type');
            this.unset('original');
            return composeAPI.space.add({ type: type, original: original }, opt).then(function (data) {
                this.prevAttributes = data;
                return data.content ? this.quoteMessage(data) : data;
            }.bind(this)).then(function (data) {
                if (!this.get('attachments') || !this.get('attachments').length) return data;

                return $.when.apply($, this.get('attachments').map(function (attachment) {
                    return attachmentsAPI.add(data.id, attachment);
                })).then(function () {
                    data.attachments = (data.attachments || []).concat(_.toArray(arguments));
                    return data;
                }).catch(function (err) {
                    if (ox.debug) console.warn('Could not load initial attachments', err);
                    return data;
                });
            }.bind(this));
        },

        /**
         * Traverses the two given objects and only return attributes (and sub attributes) which has been changed.
         * Used to only update necessary parts of the mail model
         */
        deepDiff: function (old, current) {
            if (_.isUndefined(old)) return current;

            var self = this;

            current = current || this.attributes;

            return _(current)
                .chain()
                .mapObject(function (value, key) {
                    if (value instanceof Backbone.Model || value instanceof Backbone.Collection) value = value.toJSON();
                    if (_.isObject(value) && !_.isArray(value)) {
                        var sub = self.deepDiff(old[key], value);
                        if (_.isEmpty(sub)) return;
                        return sub;
                    }
                    if (_.isEqual(old[key], value)) return;
                    return _.isUndefined(value) ? null : value;
                })
                .omit(function (value) {
                    return _.isUndefined(value);
                })
                .value();
        },

        save: function () {
            if (this.destroyed) return $.when();
            var prevAttributes = this.prevAttributes,
                attributes = this.toJSON();
            // remove pending inline images from content
            attributes.content = attributes.content.replace(/<img[^>]*data-pending="true"[^>]*>/g, '');

            var diff = this.deepDiff(prevAttributes, attributes);
            // do not upload attachments on save
            delete diff.attachments;

            if (_.isEmpty(diff)) return $.when();

            this.prevAttributes = this.toJSON();

            this.trigger('before:save');
            return composeAPI.space.update(this.get('id'), diff).then(function success() {
                this.trigger('success:save');
            }.bind(this), function fail() {
                this.prevAttributes = prevAttributes;
                if (ox.debug) console.warn('Update composition space failed', this.get('id'));
                this.trigger('fail:save');
            }.bind(this));
        },

        destroy: function () {
            if (this.destroyed) return;
            if (!this.get('id')) return;
            this.destroyed = true;
            this.get('attachments').each(function (model) { model.trigger('destroy'); });
            return composeAPI.space.remove(this.get('id'));
        },

        toJSON: function () {
            var data = Backbone.Model.prototype.toJSON.call(this),
                attachments = this.get('attachments');
            if (attachments && attachments.toJSON) data.attachments = attachments.toJSON();
            return data;
        },

        keepDraftOnClose: function () {
            if (settings.get('features/deleteDraftOnClose') !== true) return false;
            return !!this.get('meta').editFor;
        }

    });
});
