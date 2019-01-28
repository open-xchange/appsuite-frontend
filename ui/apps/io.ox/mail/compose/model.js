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
    'io.ox/core/attachments/backbone',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/mail/sanitizer'
], function (composeAPI, mailAPI, mailUtil, Attachments, settings, gt, sanitizer) {

    'use strict';

    var attachmentsAPI = composeAPI.space.attachments;

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
                    // new/reply/replyall/forward/resend/edit/copy
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
                var collection = new Attachments.Collection();
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

            this.requestSave = _.throttle(this.save.bind(this), 15000);
        },

        getFixedContent: function () {
            var content = this.get('content'),
                type = this.get('contentType');
            //TODO: outdated? (introduced with b6be5517159c76b0597fdf9debeed9928e9799ba)
            if (type === 'text/plain') {
                content = _.unescapeHTML(content.replace(/<br\s*\/?>/g, '\n'));
            } else if (type === 'text/html') {
                //TODO: outdated? (introduced with 605da1af76716a3e4a505fd8287fa2b39bb4d574)
                content = mailUtil.replaceImagePrefix(content);
                //TODO: outdated? (introduce with bfc365096f7c19c6e73fc03057bdf8fd9b22d5c1)
                content = content.replace(/^<div\sid="ox-\S+">/, '').replace(/<\/div>$/, '');
            }
            return content;
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

        attachFiles: function attachFiles(files) {
            // TODO: mapping?!
            this.get('attachments').add(files);
        },

        attachVCard: function attachVCard() {
            composeAPI.space.attachments.vcard(this.get('id')).then(function (vcard) {
                this.get('attachments').add(vcard);
            }.bind(this));
        },

        onRemoveAttachment: function (model) {
            if (this.destroyed) return;

            if (model.get('id')) attachmentsAPI.remove(this.get('id'), model.get('id'));
            else model.trigger('abort:upload');
        },

        quoteMessage: (function () {
            function mailAddress(item) {
                if (item.length < 2) return item[0] || '';
                return item[0] + ' <' + item[1] + '>';
            }
            return function (data) {
                var meta = data.meta,
                    original = meta.replyFor || meta.forwardsFor;
                original = [].concat(original)[0];
                if (!original) return data;
                return mailAPI.get({ id: original.originalId, folder: original.originalFolderId }).then(function (mail) {
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
                        // get the content inside the body of the mail
                        var content = data.content.replace(/^[\s\S]*?<body[^>]*>([\s\S]*?)<\/body>[\s\S]*?$/i, '$1').trim();
                        content = sanitizer.simpleSanitize(content);
                        data.content = '<div><br></div>' + $('<blockquote type="cite">').append(
                            header.map(function (line) {
                                if (!line) return '<div><br></div>';
                                return $('<div>').text(line);
                            }),
                            content
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
            var type = this.get('type') || 'new',
                isReply = /(reply|replyall)/.test(type),
                original = this.get('original'),
                opt = {
                    // add original attachments
                    attachments: /(reply|replyall|forward)/.test(type),
                    quote: !isReply || settings.get('appendMailTextOnReply', true),
                    vcard: !/(edit|copy)/.test(type) && settings.get('appendVcard', false)
                };
            // unset type and original since both are only used on creation of a model
            this.unset('type');
            this.unset('original');
            return composeAPI.create({ type: type, original: original }, opt).then(function (data) {
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
            var diff = this.deepDiff(this.prevAttributes);
            if (_.isEmpty(diff)) return $.when();
            this.trigger('before:save');
            return composeAPI.space.update(this.get('id'), diff).then(function success() {
                this.prevAttributes = this.toJSON();
                this.trigger('success:save');
            }.bind(this), function fail() {
                if (ox.debug) console.warn('Update composition space failed', this.get('id'));
                this.trigger('fail:save');
            }.bind(this));
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
        setMailContentType: $.noop
    });

    return MailModel;
});
