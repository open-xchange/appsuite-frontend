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

define('io.ox/mail/compose/view', [
    'io.ox/mail/compose/extensions',
    'io.ox/mail/compose/model',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'settings!io.ox/core',
    'io.ox/core/notifications',
    'io.ox/core/api/snippets',
    'io.ox/core/api/account',
    'gettext!io.ox/mail',
    'io.ox/mail/actions/attachmentEmpty',
    'less!io.ox/mail/style',
    'less!io.ox/mail/compose/style'
], function (extensions, MailModel, Dropdown, ext, contactAPI, mailAPI, mailUtil, settings, coreSettings, notifications, snippetAPI, accountAPI, gt, attachmentEmpty) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/mail/compose';

    ext.point(POINT + '/mailto').extend({
        id: 'mailto',
        index: 100,
        setup: extensions.mailto
    });

    ext.point(POINT + '/fields').extend({
        id: 'header',
        index: INDEX += 100,
        draw: extensions.header
    });

    ext.point(POINT + '/fields').extend({
        id: 'sender',
        index: INDEX += 100,
        draw: extensions.sender
    });

    ext.point(POINT + '/fields').extend({
        id: 'to',
        index: INDEX += 100,
        draw: extensions.tokenfield('To')
    });

    ext.point(POINT + '/fields').extend({
        id: 'cc',
        index: INDEX += 100,
        draw: extensions.tokenfield('CC')
    });

    ext.point(POINT + '/fields').extend({
        id: 'bcc',
        index: INDEX += 100,
        draw: extensions.tokenfield('BCC')
    });

    ext.point(POINT + '/fields').extend({
        id: 'subject',
        index: INDEX += 100,
        draw: extensions.subject
    });

    ext.point(POINT + '/header').extend({
        draw: function (baton) {
            ext.point(POINT + '/header/title').invoke('draw', this, baton);
            ext.point(POINT + '/header/buttons').invoke('draw', this, baton);
        }
    });

    ext.point(POINT + '/header/title').extend({
        index: 100,
        id: 'title',
        draw: extensions.title
    });

    ext.point(POINT + '/header/buttons').extend({
        index: 200,
        id: 'buttons',
        draw: extensions.buttons
    });

    ext.point(POINT + '/composetoolbar').extend({
        id: 'add_attachments',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<div data-extension-id="add_attachments" class="col-xs-4 col-md-5 col-md-offset-1">');
            extensions.attachment.call(node, baton);
            this.append(node);
        }
    });

    ext.point(POINT + '/signatures').extend({
        id: 'signature',
        index: INDEX += 100,
        draw: extensions.signature
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'editor',
        index: 100,
        draw: function () {
            this.data('view')
                .header(gt('Editor'))
                .option('editorMode', 'text', gt('Plain Text'))
                .option('editorMode', 'html', gt('HTML'));
        }
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'priority',
        index: 200,
        draw: function () {
            this.data('view')
                .header(gt('Priority'))
                .option('priority', 0, gt('High'))
                .option('priority', 3, gt('Normal'))
                .option('priority', 5, gt('Low'));
        }
    });

    ext.point(POINT + '/menuoptions').extend({
        id: 'options',
        index: 300,
        draw: function () {
            this.data('view')
                .header(gt('Options'))
                .option('vcard', 1, gt('Attach Vcard'))
                .option('disp_notification_to', true, gt('Request read receipt'));
        }
    });

    ext.point(POINT + '/composetoolbar').extend({
        id: 'menu',
        index: INDEX += 100,
        draw: function (baton) {
            var optionDropdown    = new Dropdown({ model: baton.model, label: gt('Options'), caret: true }),
                signatureDropdown = new Dropdown({ model: baton.model, label: gt('Signatures'), caret: true })
                .option('signature', '', gt('No signature'));

            ext.point(POINT + '/menuoptions').invoke('draw', optionDropdown.$el, baton);
            ext.point(POINT + '/signatures').invoke('draw', signatureDropdown.$el, baton);

            optionDropdown.$ul.addClass('pull-right');
            signatureDropdown.$ul.addClass('pull-right');

            baton.view.signaturesLoading.done(function (sig) {
                if (sig.length > 0) {
                    signatureDropdown.$ul.addClass('pull-right');
                    optionDropdown.$el.before(signatureDropdown.render().$el.addClass('signatures text-left'));
                }
            });

            this.append(
                $('<div data-extension-id="composetoolbar-menu" class="col-xs-8 col-md-6">').append(
                    $('<div class="pull-right text-right">').append(
                        optionDropdown.render().$el.addClass('text-left')
                    )
                )
            );
        }
    });

    ext.point(POINT + '/fields').extend({
        id: 'composetoolbar',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<div data-extension-id="composetoolbar" class="row composetoolbar">');
            ext.point(POINT + '/composetoolbar').invoke('draw', node, baton);
            this.append(node);
        },
        redraw: function (baton) {
            var node = this.find('.row.composetoolbar');
            ext.point(POINT + '/composetoolbar').invoke('redraw', node, baton);
        }
    });

    ext.point(POINT + '/fields').extend({
        id: 'attachments',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<div class="row attachments">');
            ext.point(POINT + '/attachments').invoke('draw', node, baton);
            this.append(node);
        }
    });

    ext.point(POINT + '/attachments').extend({
        id: 'attachmentPreview',
        index: 200,
        draw: function (baton) {
            var node = $('<div class="col-xs-12">');
            extensions.attachmentPreviewList.call(node, baton);
            node.appendTo(this);
        }
    });

    // disable attachmentList by default
    ext.point(POINT + '/attachments').disable('attachmentList');

    /*
     * extension point for contact picture
     */
    ext.point(POINT +  '/contactPicture').extend({
        id: 'contactPicture',
        index: 100,
        draw: function (baton) {
            var node;
            this.append(
                node = $('<div class="contact-image lazyload">')
                    .css('background-image', 'url(' + ox.base + '/apps/themes/default/dummypicture.png)')
            );
            // apply picture halo lazy load
            contactAPI.pictureHalo(
                node,
                baton.participantModel.toJSON(),
                { width: 42, height: 42 }
            );
        }
    });

    /*
     * extension point for display name
     */
    ext.point(POINT +  '/displayName').extend({
        id: 'displayName',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="recipient-name">').text(baton.participantModel.getDisplayName())
            );
        }
    });

    // /*
    //  * extension point for halo link
    //  */
    ext.point(POINT +  '/emailAddress').extend({
        id: 'emailAddress',
        index: 100,
        draw: function (baton) {
            var model = baton.participantModel;
            this.append(
                $('<div class="ellipsis email">').append(
                    $.txt(model.getTarget() + ' '),
                    model.getFieldName() !== '' ?
                        $('<span style="color: #888;">').text('(' + model.getFieldName() + ')') : model.getTypeString()
                )
            );
        }
    });

    /*
     * extension point for autocomplete item
     */
    ext.point(POINT +  '/autoCompleteItem').extend({
        id: 'autoCompleteItem',
        index: 100,
        draw: function (baton) {
            this.addClass('io-ox-mail-compose-contact');
            // contact picture
            ext.point(POINT + '/contactPicture').invoke('draw', this, baton);
            // display name
            ext.point(POINT + '/displayName').invoke('draw', this, baton);
            // email address
            ext.point(POINT + '/emailAddress').invoke('draw', this, baton);
        }
    });

    var MailComposeView = Backbone.View.extend({

        className: 'io-ox-mail-compose container default-content-padding',

        events: {
            'click [data-action="add"]': 'toggleTokenfield',
            'keyup [data-extension-id="subject"] input': 'setSubject'
        },

        initialize: function (options) {
            this.app = options.app;
            this.model = new MailModel(this.filterData(options.data));
            this.editorHash = {};
            this.autosave = {};
            this.intervals = [];
            this.blocked = [];
            this.editorMode = this.model.get('editorMode');
            this.messageFormat = settings.get('messageFormat', 'html');
            this.editor = null;
            this.composeMode = 'compose';
            this.editorId = _.uniqueId('editor-');
            this.contentEditable = $('<div class="editable">').attr({
                'data-editor-id': this.editorId,
                'tabindex': 1
            });
            this.textarea = $('<textarea class="plain-text">').attr({
                'data-editor-id': this.editorId,
                'tabindex': 1
            }).addClass(settings.get('useFixedWidthFont') ? 'monospace' : '');

            this.baton = ext.Baton({
                model: this.model,
                view: this
            });

            this.contentEditable.on('addInlineImage', function (e, id) { this.addKeepalive(id); }.bind(this));

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));

            this.listenTo(this.model, 'keyup:subject change:subject', this.setTitle);
            this.listenTo(this.model, 'change:editorMode', this.changeEditorMode);
            this.listenTo(this.model, 'change:signature', this.setSelectedSignature);
            this.listenTo(this.model, 'needsync', this.syncMail);

            this.signatures = _.device('smartphone') ? [{ id: 0, content: this.getMobileSignature(), misc: { insertion: 'below' } }] : [];

            var mailto, params;
            // triggerd by mailto?
            if (mailto = _.url.hash('mailto')) {

                var parseRecipients = function (recipients) {
                    return recipients.split(',').map(function (recipient) {
                        var parts = _.compact(
                            recipient.replace(/^("([^"]*)"|([^<>]*))?\s*(<(\s*(.*?)\s*)>)?/, '$2//$3//$5').split('//')
                        ).map(function (str) { return str.trim(); });
                        return (parts.length === 1) ? [parts[0], parts[0]] : parts;
                    });
                };
                // remove 'mailto:'' prefix and split at '?''
                var tmp = mailto.replace(/^mailto:/, '').split(/\?/, 2);
                var to = unescape(tmp[0]), params = _.deserialize(tmp[1]);
                // see Bug 31345 - [L3] Case sensitivity issue with Richmail while rendering Mailto: link parameters
                for (var key in params) params[key.toLowerCase()] = params[key];
                // save data
                if (to)         { this.model.set('to',  parseRecipients(to),         { silent: true }); }
                if (params.cc)  { this.model.set('cc',  parseRecipients(params.cc),  { silent: true }); }
                if (params.bcc) { this.model.set('bcc', parseRecipients(params.bcc), { silent: true }); }

                this.setSubject(params.subject || '');
                this.model.setContent(params.body || '');
                // clear hash
                _.url.hash('mailto', null);
            }

            ext.point(POINT + '/mailto').invoke('setup');
        },

        filterData: function (data) {
            if (/(compose|edit)/.test(data.mode)) return data;
            return _.pick(data, 'id', 'folder_id', 'mode', 'csid', 'content_type');
        },

        fetchMail: function (obj) {

            var self = this,
            mode = obj.mode;
            delete obj.mode;

            if (/(compose|edit)/.test(mode)) {
                return $.when();
            } else if (mode === 'forward' && !obj.id) {
                obj = _(obj).map(function (o) {
                    return _.pick(o, 'id', 'folder_id', 'csid');
                });
            } else {
                obj = _.pick(obj, 'id', 'folder_id', 'csid', 'content_type');
            }

            var content_type = this.messageFormat;

            if (content_type === 'alternative') {
                content_type = obj.content_type === 'text/plain' ? 'text' : 'html';
            }

            // use CSS sanitizing and size limit (large than detail view)
            obj.embedded = true;
            obj.max_size = settings.get('maxSize/compose', 1024 * 512);

            return mailAPI[mode](obj, content_type).then(function (data) {
                data.sendtype = mode === 'forward' ? mailAPI.SENDTYPE.FORWARD : mailAPI.SENDTYPE.REPLY;
                data.mode = mode;
                var attachments = _.clone(data.attachments);
                delete data.attachments;
                if (!_.isEmpty(data.from)) {
                    accountAPI.getAllSenderAddresses().then(function (a) {
                        if (_.isEmpty(a)) return;
                        data.from = a.filter(function (from) { return from[1] === data.from[0][1]; });
                    });
                }
                if (mode === 'forward') {
                    // move nested messages into attachment array
                    _(data.nested_msgs).each(function (obj) {
                        attachments.push({
                            id: attachments.length + 1,
                            filename: obj.subject,
                            content_type: 'message/rfc822',
                            msgref: obj.msgref
                        });
                    });
                    delete data.nested_msgs;
                }
                self.model.set(data);
                var attachmentCollection = self.model.get('attachments');
                attachmentCollection.reset(attachments);
                self.model.set('attachments', attachmentCollection);
            });
        },

        setSubject: function (e) {
            var value = e.target ? $(e.target).val() : e;
            this.model.set('subject', value, { silent: true }).trigger('keyup:subject', value);
        },

        setTitle: function () {
            this.app.setTitle(this.model.get('subject') || gt('Compose'));
        },

        parseMsgref: function (msgref) {
            var base = _(msgref.toString().split(mailAPI.separator)),
                id = base.last(),
                folder = base.without(id).join(mailAPI.separator);
            return { folder_id: folder, id: id };
        },

        saveDraft: function () {
            // get mail
            var self = this,
                mail = this.model.getMail(),
                def = new $.Deferred(),
                old_vcard_flag;

            if (mail.msgref && mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                delete mail.msgref;
            }

            if (mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                mail.sendtype = mailAPI.SENDTYPE.EDIT_DRAFT;
                this.model.set('sendtype', mail.sendtype, { silent: true });
            }

            if (_(mail.flags).isUndefined()) {
                mail.flags = mailAPI.FLAGS.DRAFT;
            } else if ((mail.data.flags & 4) === 0) {
                mail.flags += mailAPI.FLAGS.DRAFT;
            }

            // never append vcard when saving as draft
            // backend will append vcard for every send operation (which save as draft is)
            old_vcard_flag = mail.vcard;
            delete mail.vcard;

            return attachmentEmpty.emptinessCheck(mail.files).then(function () {
                return mailAPI.send(mail, mail.files);
            }).then(function (result) {
                return $.when(
                    result,
                    mailAPI.get(self.parseMsgref(result.data))
                );
            }, function (result) {
                if (result.error) {
                    notifications.yell(result);
                    return def.reject(result);
                }
            }).then(function (result, data) {
                // Replace inline images in contenteditable with links from draft response
                $(data.attachments[0].content).find('img:not(.emoji)').each(function (index, el) {
                    $('img:not(.emoji):eq(' + index + ')', self.contentEditable).attr('src', $(el).attr('src'));
                });
                self.model.set('msgref', result.data, { silent: true });
                self.model.dirty(false);
                notifications.yell('success', gt('Mail saved as draft'));
                return result;
            });
        },

        autoSaveDraft: function () {

            var mail = this.model.getMail(),
                def = new $.Deferred(),
                self = this;

            if (mail.msgref && mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                delete mail.msgref;
            }
            if (mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                mail.sendtype = mailAPI.SENDTYPE.EDIT_DRAFT;
                this.model.set('sendtype', mail.sendtype, { silent: true });
            }

            if (_(mail.flags).isUndefined()) {
                mail.flags = mailAPI.FLAGS.DRAFT;
            } else if ((mail.data.flags & 4) === 0) {
                mail.flags += mailAPI.FLAGS.DRAFT;
            }

            mailAPI.autosave(mail).always(function (result) {
                if (result.error) {
                    notifications.yell(result);
                    def.reject(result);
                } else {

                    if (mail.sendtype === mailAPI.SENDTYPE.EDIT_DRAFT) {
                        self.model.set('msgref', result, { silent: true });
                    }

                    notifications.yell('success', gt('Mail saved as draft'));
                    def.resolve(result);
                }
            });

            this.initAutoSaveAsDraft();

            return def;
        },

        stopAutoSave: function () {
            if (this.autosave) {
                window.clearTimeout(this.autosave.timer);
            }
        },

        initAutoSaveAsDraft: function () {

            var timeout = settings.get('autoSaveDraftsAfter', false),
                timerScale = {
                    //60s
                    minute: 60000,
                    minutes: 60000
                },
                scale,
                delay,
                timer,
                self = this;

            if (!timeout) return;

            timeout = timeout.split('_');
            scale = timerScale[timeout[1]];
            timeout = timeout[0];

            // settings not parsable
            if (!timeout || !scale) return;

            this.stopAutoSave();

            delay = function () {
                self.autosave.timer = _.delay(timer, timeout * scale);
            };

            timer = function () {
                // only auto-save if something changed (see Bug #26927)
                if (self.model.dirty()) {
                    self.autoSaveDraft();
                } else {
                    delay();
                }
            };

            this.autosave = {};
            delay();
        },

        addKeepalive: function (id) {
            var timeout = Math.round(settings.get('maxUploadIdleTimeout', 200000) * 0.9);
            this.intervals.push(setInterval(mailAPI.keepalive, timeout, id));
        },

        clearKeepalive: function () {
            _(this.intervals).each(clearInterval);
        },

        clean: function () {
            // mark as not dirty
            this.model.dirty(false);
            // clean up editors
            for (var id in this.editorHash) {
                this.editorHash[id].destroy();
            }
            // clear timer for autosave
            this.stopAutoSave();
        },

        dispose: function () {
            this.clearKeepalive();
            this.stopListening();
            this.model = null;
        },

        discard: function () {
            var self = this,
                def = $.Deferred();

            if (this.model.dirty()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    //button texts may become quite large in some languages (e. g. french, see Bug 35581)
                    //add some extra space
                    //TODO maybe we could use a more dynamical approach
                    new dialogs.ModalDialog({ width: 550 })
                        .text(gt('Do you really want to discard your message?'))
                        //#. "Discard message" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard message'), 'delete', { tabIndex: 1 })
                        .addAlternativeButton('savedraft', gt('Save as draft'), 'savedraft', { tabIndex: 1 })
                        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                // clean before resolve, otherwise tinymce gets half-destroyed (ugly timing)
                                self.clean();
                                def.resolve();
                            } else if (action === 'savedraft') {
                                self.saveDraft().done(function () {
                                    //clean();
                                    def.resolve();
                                }).fail(function (e) {
                                    def.reject(e);
                                });
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                this.clean();
                def.resolve();
            }

            return def;
        },

        send: function () {
            // get mail
            var self = this,
                mail = this.model.getMail(),
                def = $.Deferred();

            this.blockReuse(mail.sendtype);

            function cont() {
                var win = self.app.getWindow();
                // start being busy
                if (win) {
                    win.busy();
                    // close window now (!= quit / might be reopened)
                    win.preQuit();
                }
                /*if (self.attachmentsExceedQouta(mail)) {
                    notifications.yell({
                        type: 'info',
                        message: gt(
                            'One or more attached files exceed the size limit per email. ' +
                            'Therefore, the files are not sent as attachments but kept on the server. ' +
                            'The email you have sent just contains links to download these files.'
                        ),
                        duration: 30000
                    });
                }*/

                if (mail.sendtype === mailAPI.SENDTYPE.EDIT_DRAFT) {
                    mail.sendtype = mailAPI.SENDTYPE.DRAFT;
                }

                // send!
                mailAPI.send(mail, mail.files /*view.form.find('.oldschool') */)
                .always(function (result) {

                    if (result.error && !result.warnings) {
                        if (win) { win.idle().show(); }
                        self.app.launch();
                        // TODO: check if backend just says "A severe error occurred"
                        notifications.yell(result);
                        return;
                    }

                    if (result.warnings) {
                        notifications.yell('warning', result.warnings.error);
                    } else {
                        // success - some want to be notified, other's not
                        if (settings.get('features/notifyOnSent', false)) {
                            notifications.yell('success', gt('The email has been sent'));
                        }
                    }

                    // update base mail
                    var isReply = mail.sendtype === mailAPI.SENDTYPE.REPLY,
                        isForward = mail.sendtype === mailAPI.SENDTYPE.FORWARD,
                        sep = mailAPI.separator,
                        base, folder, id, msgrefs, ids;

                    if (isReply || isForward) {
                        //single vs. multiple
                        if (mail.msgref) {
                            msgrefs = [ mail.msgref ];
                        } else {
                            msgrefs = _.chain(mail.attachments)
                                .filter(function (attachment) {
                                    return attachment.content_type === 'message/rfc822';
                                })
                                .map(function (attachment) { return attachment.msgref; })
                                .value();
                        }
                        //prepare
                        ids = _.map(msgrefs, function (obj) {
                            base = _(obj.split(sep));
                            folder = base.initial().join(sep);
                            id = base.last();
                            return { folder_id: folder, id: id };
                        });
                        // update cache
                        mailAPI.getList(ids).pipe(function (data) {
                            // update answered/forwarded flag
                            if (isReply || isForward) {
                                var len = data.length;
                                for (var i = 0; i < len; i++) {
                                    if (isReply) data[i].flags |= 1;
                                    if (isForward) data[i].flags |= 256;
                                }
                            }
                            $.when(mailAPI.caches.list.merge(data), mailAPI.caches.get.merge(data))
                            .done(function () {
                                mailAPI.trigger('refresh.list');
                            });
                        });
                    }

                    //remove sync listener
                    //causes problems with inline images that are already deleted on the backend (see Bug 32599)
                    self.stopListening(self.model, 'needsync', self.syncMail);
                    self.model.dirty(false);
                    self.app.quit();
                })
                .always(function (result) {
                    self.unblockReuse(mail.sendtype);
                    def.resolve(result);
                });
            }

            // ask for empty to,cc,bcc and/or empty subject
            var noRecipient = _.isEmpty(mail.to) && _.isEmpty(mail.cc) && _.isEmpty(mail.bcc);
            if (noRecipient) {
                notifications.yell('error', gt('Mail has no recipient.'));
                self.$el.find('.tokenfield:first .token-input').focus();
                def.reject();
            } else if ($.trim(mail.subject) === '') {
                // show dialog
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({ focus: false })
                        .text(gt('Mail has empty subject. Send it anyway?'))
                        .addPrimaryButton('send', gt('Yes, send without subject'), 'send', { tabIndex: 1 })
                        .addButton('subject', gt('Add subject'), 'subject', { tabIndex: 1 })
                        .show(function () {
                            def.notify('empty subject');
                        })
                        .done(function (action) {
                            if (action === 'send') {
                                attachmentEmpty.emptinessCheck(mail.files).done(function () {
                                    cont();
                                });
                            } else {
                                self.$el.find('input[name="subject"]').focus();
                                def.reject();
                            }
                        });
                });
            } else {
                attachmentEmpty.emptinessCheck(mail.files).done(function () {
                    cont();
                });
            }

            return def;
        },

        attachmentsExceedQuota: function (mail) {

            var allAttachmentsSizes = [].concat(mail.files).concat(mail.attachments)
                    .map(function (m) {
                        return m.size || 0;
                    }),
                quota = coreSettings.get('properties/attachmentQuota', 0),
                accumulatedSize = allAttachmentsSizes
                    .reduce(function (acc, size) {
                        return acc + size;
                    }, 0),
                singleFileExceedsQuota = allAttachmentsSizes
                    .reduce(function (acc, size) {
                        var quotaPerFile = coreSettings.get('properties/attachmentQuotaPerFile', 0);
                        return acc || (quotaPerFile > 0 && size > quotaPerFile);
                    }, false);

            return singleFileExceedsQuota || (quota > 0 && accumulatedSize > quota);
        },

        toggleTokenfield: function (e) {
            var isString = typeof e === 'string',
                type = isString ? e : $(e.target).attr('data-type'),
                button = this.$el.find('[data-type="' + type + '"]'),
                input = this.$el.find('[data-extension-id="' + type + '"]');
            if (!isString) e.preventDefault();
            if (input.hasClass('hidden') || isString) {
                input.removeClass('hidden');
                button.addClass('active').attr('aria-checked', true);
            } else if (this.model.get(type).length === 0) {
                //We don't want to close it automatically! Bug: 35730
                this.model.set(type, []);
                input.addClass('hidden');
                $(window).trigger('resize.tinymce');
                button.removeClass('active').attr('aria-checked', false);
            }
            return input;
        },

        loadEditor: function (content) {

            var self = this,
                editorSrc = 'io.ox/core/tk/' + (this.editorMode === 'text' ? 'text-editor' : 'contenteditable-editor');

            return require([editorSrc]).then(function (Editor) {
                return (self.editorHash[self.editorMode] = new Editor(self.editorMode === 'text' ? self.textarea : self.contentEditable))
                    .done(function () {
                        self.editor = self.editorHash[self.editorMode];
                        self.editor.setPlainText(content);
                        self.editor.handleShow(true);
                        if (self.model.get('mode') !== 'compose') {
                            self.editor.focus();
                        }
                    });
            });
        },

        reuseEditor: function (content) {
            this.editor = this.editorHash[this.editorMode];
            this.editor.setPlainText(content);
            this.editor.handleShow(true);
            return $.when();
        },

        getEditor: function () {
            var def = $.Deferred();
            if (this.editor) {
                def.resolve(this.editor);
            } else {
                return this.loadEditor();
            }
            return def;
        },

        changeEditorMode: function () {
            // be busy
            this.contentEditable.busy();
            this.textarea.prop('disabled', true).busy();

            if (this.editor) {
                var content = this.editor.getPlainText();
                this.editor.clear();
                this.editor.handleHide();

                // toggle editor
                this.editorMode = this.editorMode === 'html' ? 'text' : 'html';
                this.model.setMailContentType(this.editorMode);

                // load TEXT/HTML editor for the first time or reuse TEXT/HTML editor
                return !this.editorHash[this.editorMode] ? this.loadEditor(content) : this.reuseEditor(content);

            } else {
                this.editorMode = this.model.get('editorMode');
                // initial editor
                return this.loadEditor();
            }
        },

        syncMail: function () {
            if (this.editor) {
                this.model.setContent(this.editor.getContent());
            }
        },

        setBody: function (content) {

            if (this.model.get('initial')) {
                // remove white-space at beginning except in first-line
                content = String(content || '').replace(/^[\s\xA0]*\n([\s\xA0]*\S)/, '$1');
                // remove white-space at end
                content = content.replace(/[\s\uFEFF\xA0]+$/, '');
            }

            this.editor.setContent(content);
            this.setSelectedSignature(this.model.get('signature'));
        },

        getMobileSignature: function () {
            var value = settings.get('mobileSignature');
            if (value === undefined) {
                value =
                    //#. %s is the product name
                    gt('Sent from %s via mobile', ox.serverConfig.productName);
            }
            return value;
        },

        setSelectedSignature: function (model, id) {

            if (_.isString(model)) id = model;

            var newSignature = _.where(this.signatures, { id: String(id) })[0],
                prevSignature = _.where(this.signatures, { id: _.isObject(model) ? model.previous('signature') : '' })[0];

            if (prevSignature) {
                this.removeSignature(prevSignature);
            }
            if (newSignature) {
                var ds = newSignature;
                ds.misc = _.isString(ds.misc) ? JSON.parse(ds.misc) : ds.misc;
                this.setSignature(ds);
            }
            this.prependNewLine();
        },

        removeSignature: function (signature) {

            var self = this,
                isHTML = !!this.editor.find,
                currentSignature = mailUtil.signatures.cleanAdd(signature.content, isHTML);

            // remove current signature from editor
            if (isHTML) {
                this.editor.find('.io-ox-signature').each(function () {

                    var node = $(this),
                        text = node.text(),
                        unchanged = _(self.signatures).find(function (signature) {
                            return $('<div>').html(signature.content).text().replace(/\s+/g, '') === text.replace(/\s+/g, '');
                        });

                    // remove entire block unless it seems edited
                    if (unchanged) node.remove(); else node.removeClass('io-ox-signature');
                });
            } else {
                if (currentSignature) {
                    this.editor.replaceParagraph(currentSignature, '');
                }
            }
        },

        isSignature: function (text) {
            var isHTML = !!this.editor.find;
            return mailUtil.signatures.is(text, this.signatures, isHTML);
        },

        setSignature: function (signature) {

            var text,
                isHTML = !!this.editor.find;

            // add signature?
            if (this.signatures.length > 0) {
                text = mailUtil.signatures.cleanAdd(signature.content, isHTML);
                if (isHTML) text = this.getParagraph(text);
                if (_.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }
                if (signature.misc && signature.misc.insertion === 'below') {
                    this.editor.appendContent(text);
                    this.editor.scrollTop('bottom');
                } else {
                    this.editor.prependContent(text);
                    this.editor.scrollTop('top');
                }
            }
        },

        getParagraph: function (text) {
            //use div for html cause innerHTML for p tags with nested tags fail
            var node = (/(<([^>]+)>)/ig).test(text) ? $('<div>') : $('<p>');
            node.addClass('io-ox-signature')
                .append(this.editor.ln2br(text));
            return $('<div>').append(node).html();
        },

        prependNewLine: function (content) {
            var content = this.editor.getContent(),
                nl = this.editorMode === 'html' ? '<p><br></p>' : '\n\n';
            if (content !== '' && content.indexOf(nl) !== 0 && content.indexOf('<br>') !== 0) {
                this.editor.setContent(nl + content);
            }
        },

        setMail: function () {

            var self = this,
                data = this.model.toJSON();

            this.model.setInitialMailContentType();

            return this.changeEditorMode().then(function () {
                return self.signaturesLoading;
            }).done(function () {
                if (data.replaceBody !== 'no') {
                    var mode = self.model.get('mode');
                    // set focus in compose and forward mode to recipient tokenfield
                    if (/(compose|forward)/.test(mode)) {
                        self.$el.find('.tokenfield:first .token-input').focus();
                    } else {
                        self.editor.focus();
                    }
                    if (mode === 'replyall' && !_.isEmpty(self.model.get('cc'))) {
                        self.toggleTokenfield('cc');
                    }
                    self.setBody(self.model.getContent());
                    self.model.dirty(false);
                }
            });
        },

        blockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) + 1;
        },

        unblockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) - 1;
            if (this.blocked[sendtype] <= 0)
                delete this.blocked[sendtype];
        },

        render: function () {
            var self = this;

            var node = $('<div class="mail-compose-fields">');

            // draw all extensionpoints
            ext.point('io.ox/mail/compose/fields').invoke('draw', node, this.baton);

            this.$el.append(node);

            // add subject to app title
            this.setTitle();

            // add view specific event handling to tokenfields
            this.$el.find('input.tokenfield').each(function () {
                // get original input field from token plugin
                var input = $(this).data('bs.tokenfield').$input;
                input.on({
                    // IME support (e.g. for Japanese)
                    compositionstart: function () {
                        $(this).attr('data-ime', 'active');
                    },
                    compositionend: function () {
                        $(this).attr('data-ime', 'inactive');
                    },
                    keydown: function (e) {
                        if (e.which === 13 && $(this).attr('data-ime') !== 'active') {
                            // clear tokenfield input
                            $(this).val('');
                        }
                    },
                    // shortcuts (to/cc/bcc)
                    keyup: function (e) {
                        if (e.which === 13) return;
                        // look for special prefixes
                        var val = $(this).val();
                        if ((/^to:?\s/i).test(val)) {
                            $(this).typeahead('val', '');
                        } else if ((/^cc:?\s/i).test(val)) {
                            $(this).typeahead('val', '');
                            self.toggleTokenfield('cc').find('.token-input').focus();
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).typeahead('val', '');
                            self.toggleTokenfield('bcc').find('.token-input').focus();
                        }
                    }
                });
            });

            this.$el.append(
                this.mcetoolbar = $('<div class="editable-toolbar">').attr('data-editor-id', this.editorId),
                this.contentEditable,
                this.textarea
            );

            var scrollPane = this.app.getWindowNode(),
                toolbar = this.mcetoolbar,
                editor = this.contentEditable,
                fixed = false,
                top = 0;

            // get top position
            scrollPane.on('scroll', _.debounce(function () {
                // could also use: toolbar.get(0).offsetTop (need to check all browsers)
                if (!fixed) top = toolbar.position().top + scrollPane.scrollTop();
            }, 50, true));

            scrollPane.on('scroll', function () {

                if (top < scrollPane.scrollTop()) {
                    // toolbar leaves viewport
                    if (!fixed) {
                        toolbar.addClass('fixed').css('width', editor.outerWidth());
                        editor.css('margin-top', toolbar.height());
                        $(window).trigger('resize.tinymce');
                        fixed = true;
                    }
                } else if (fixed) {
                    toolbar.removeClass('fixed');
                    editor.css('margin-top', 0);
                    fixed = false;
                }
            });

            this.initAutoSaveAsDraft();

            return this;
        }

    });

    return MailComposeView;
});
