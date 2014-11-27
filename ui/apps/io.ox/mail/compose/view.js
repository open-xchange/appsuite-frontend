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

define('io.ox/mail/compose/view',
    ['io.ox/mail/compose/extensions',
     'io.ox/mail/compose/model',
     'io.ox/backbone/mini-views/dropdown',
     'io.ox/core/extensions',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'settings!io.ox/mail',
     'settings!io.ox/core',
     'io.ox/core/notifications',
     'io.ox/core/api/snippets',
     'gettext!io.ox/mail',
     'io.ox/mail/actions/attachmentEmpty',
     'less!io.ox/mail/style',
     'less!io.ox/mail/compose/style'
    ], function (extensions, MailModel, Dropdown, ext, mailAPI, mailUtil, contactsAPI, contactsUtil, settings, coreSettings, notifications, snippetAPI, gt, attachmentEmpty) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/mail/compose';

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
        draw: extensions.tokenfield('To', true)
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
            var node = $('<div data-extension-id="add_attachments" class="col-xs-12 col-md-5 col-md-offset-1">');
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

            this.append(
                $('<div data-extension-id="composetoolbar-menu" class="col-xs-12 col-md-6">').append(
                    $('<div class="pull-right text-right">').append(
                        signatureDropdown.render().$el.addClass('signatures text-left'),
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

    /**
     * mapping for getFieldLabel()
     * @type {object}
     */
    var mapping = {
        telephone_business1: gt('Phone (business)'),
        telephone_business2: gt('Phone (business)'),
        telephone_home1: gt('Phone (private)'),
        telephone_home2: gt('Phone (private)'),
        cellular_telephone1: gt('Mobile'),
        cellular_telephone2: gt('Mobile')
    };

    /**
     * fieldname to fieldlabel
     * @param  {string} field
     * @return {string} label
     */
    function getFieldLabel(field) {
        return mapping[field] || '';
    }

    /*
     * extension point for contact picture
     */
    ext.point(POINT +  '/contactPicture').extend({
        id: 'contactPicture',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="contact-image">')
                    .attr('data-original', contactsAPI.pictureHalo($.extend(baton.data , { width: 42, height: 42, scaleType: 'contain' })))
                    .css('background-image', 'url(' + ox.base + '/apps/themes/default/dummypicture.png)')
                    .lazyload({
                        effect: 'fadeIn',
                        container: this
                    })
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
                $('<div class="recipient-name">').text(contactsUtil.getMailFullName(baton.data))
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
            var data = baton.data;
            if (baton.autocomplete) {
                this.append(
                    $('<div class="ellipsis email">').append(
                        $.txt(baton.data.email + (baton.data.phone || '') + ' '),
                        getFieldLabel(baton.data.field) !== '' ?
                            $('<span style="color: #888;">').text('(' + getFieldLabel(baton.data.field) + ')') : []
                    )
                );
            } else {
                this.append(
                    $('<div>').append(
                        data.email ?
                            $('<a href="#" class="halo-link">')
                            .data({ email1: data.email })
                            .text(_.noI18n(String(data.email).toLowerCase())) :
                            $('<span>').text(_.noI18n(data.phone || ''))
                    )
                );
            }
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
            baton.autocomplete = true;
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
            'click [data-action="add-cc"]':     'toggleCC',
            'click [data-action="add-bcc"]':    'toggleBCC',
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
            });

            this.baton = ext.Baton({
                model: this.model,
                view: this
            });

            this.contentEditable.on('addInlineImage', function (e, id) { this.addKeepalive(id); }.bind(this));

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));

            this.listenTo(this.model, 'change:editorMode', this.changeEditorMode);
            this.listenTo(this.model, 'change:signature', this.setSelectedSignature);
            this.listenTo(this.model, 'needsync', this.syncMail);

            this.signatures = _.device('smartphone') ? [{ id: 0, content: this.getMobileSignature(), misc: { insertion: 'below' } }] : [];
        },

        filterData: function (data) {
            if(/(compose|edit)/.test(data.mode)) return data;
            return _.pick(data, 'id', 'folder_id', 'mode');
        },

        fetchMail: function (obj) {
            var self = this;
            if (/(compose|edit)/.test(obj.mode)) {
                return $.when();
            } else {
                obj = _.pick(obj, 'id', 'folder_id', 'mode');
            }
            return mailAPI[obj.mode](obj, settings.get('messageFormat', 'html')).then(function (data) {
                data.sendtype = obj.mode === 'forward' ? mailAPI.SENDTYPE.FORWARD : mailAPI.SENDTYPE.REPLY;
                data.mode = obj.mode;
                self.model.set(data);
                self.model.initialize();
            });
        },

        setSubject: function (e) {
            var value = e.target ? $(e.target).val() : e;
            this.model.set('subject', value);
            this.app.setTitle(value || gt('Compose'));
        },

        setTitle: function () {
            this.app.setTitle(this.model.get('subject') || gt('Compose'));
        },

        saveDraft: function () {
            // get mail
            var self = this,
                mail = this.model.getMail(),
                def = new $.Deferred(),
                old_vcard_flag;

            if (mail.msgref) {
                mail.sendtype = mailAPI.SENDTYPE.EDIT_DRAFT;
            }

            if (mail.sendtype !== mailAPI.SENDTYPE.EDIT_DRAFT) {
                mail.sendtype = mailAPI.SENDTYPE.DRAFT;
            }

            if (_(mail.flags).isUndefined()) {
                mail.flags = mailAPI.FLAGS.DRAFT;
            } else if (mail.data.flags & 4 === 0) {
                mail.flags += mailAPI.FLAGS.DRAFT;
            }

            // never append vcard when saving as draft
            // backend will append vcard for every send operation (which save as draft is)
            old_vcard_flag = mail.vcard;
            delete mail.vcard;

            // fix inline images
            //mail.data.attachments[0].content = mailUtil.fixInlineImages(mail.data.attachments[0].content);

            var defSend = attachmentEmpty.emptinessCheck(mail.files).done(function () {
                return mailAPI.send(mail, mail.files).always(function (result) {
                    if (result.error) {
                        notifications.yell(result);
                        def.reject(result);
                    } else {
                        self.model.set('msgref', result.data, { silent: true });
                        self.model.dirty(false);
                        notifications.yell('success', gt('Mail saved as draft'));
                        def.resolve(result);
                    }
                });
            });

            return $.when.apply($, [def, defSend]);

        },

        autoSaveDraft: function () {

            var mail = this.model.getMail(),
                def = new $.Deferred(),
                self = this;

            mailAPI.autosave(mail, mail.files).always(function (result) {
                if (result.error) {
                    notifications.yell(result);
                    def.reject(result);
                } else {
                    self.model.set('msgref', result, { silent: true });
                    notifications.yell('success', gt('Mail saved as draft'));
                    def.resolve(result);
                }
            });

            this.initAutoSaveAsDraft();

            return def;
        },

        stopAutoSave: function() {
            if (this.autosave) {
                window.clearTimeout(this.autosave.timer);
            }
        },

        initAutoSaveAsDraft: function () {

            var timeout = settings.get('autoSaveDraftsAfter', false),
                timerScale = {
                    minute: 60000, //60s
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

            if (!timeout || !scale) return; // settings not parsable

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
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your message?'))
                        //#. "Discard message" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard message'), 'delete', {tabIndex: '1'})
                        .addAlternativeButton('savedraft', gt('Save as draft'), 'savedraft', {tabIndex: '1'})
                        .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                self.clean(); // clean before resolve, otherwise tinymce gets half-destroyed (ugly timing)
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
                        notifications.yell(result); // TODO: check if backend just says "A severe error occurred"
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
            if ($.trim(mail.subject) === '' || noRecipient) {
                if (noRecipient) {
                    notifications.yell('error', gt('Mail has no recipient.'));
                    focus('to');
                    def.reject();
                } else if ($.trim(mail.subject) === '') {
                    // show dialog
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Mail has empty subject. Send it anyway?'))
                            .addPrimaryButton('send', gt('Yes, send without subject'), 'send', {tabIndex: '1'})
                            .addButton('subject', gt('Add subject'), 'subject', {tabIndex: '1'})
                            .show(function () {
                                def.notify('empty subject');
                            })
                            .done(function (action) {
                                if (action === 'send') {
                                    attachmentEmpty.emptinessCheck(mail.files).done(function () {
                                        cont();
                                    });
                                } else {
                                    focus('subject');
                                    def.reject();
                                }
                            });
                    });
                }

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

        toggleCC: function () {
            return this.toggleInput('cc');
        },

        toggleBCC: function () {
            return this.toggleInput('bcc');
        },

        toggleInput: function (type, show) {
            var button = $('[data-action="add-' + type + '"]'),
                input = this.$el.find('[data-extension-id="' + type + '"]');
            if (input.hasClass('hidden') || show) {
                this.showInput(type, input);
                button.addClass('active').attr('aria-checked', true);
            } else {
                this.closeInput(type, input);
                button.removeClass('active').attr('aria-checked', false);
            }
            return input;
        },

        showInput: function (type, input) {
            var type = type || 'cc',
                input = input || this.$el.find('[data-extension-id="' + type + '"]');
            input.removeClass('hidden');
        },

        closeInput: function (type, input) {
            var type = type || 'cc',
                input = input || this.$el.find('[data-extension-id="' + type + '"]');

            this.model.set(type, []);
            input.addClass('hidden');
            $(window).trigger('resize.tinymce');
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
            this.setSelectedSignature();
            this.prependNewLine();

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

        setSelectedSignature: function () {
            var ds = _.where(this.signatures, { id: String(this.model.get('signature')) })[0];
            if (ds) {
                ds.misc = _.isString(ds.misc) ? JSON.parse(ds.misc) : ds.misc;
                this.setSignature(ds);
            } else {
                this.removeSignature();
            }
        },

        removeSignature: function () {
            var self = this,
                isHTML = !!this.editor.find,
                currentSignature = this.model.get('currentSignature');

            // remove current signature from editor

            if (isHTML) {
                this.editor.find('.io-ox-signature').each(function () {
                    var node = $(this),
                        text = node.html()
                            //remove added image urls(tiny adds them automatically)
                            .replace(/ data-mce-src="[^"]+"\s?/, '')
                            //remove empty alt attribute(added by tiny)
                            .replace(/ alt=""/, '');

                    if (self.isSignature(text)) {
                        // remove entire node
                        node.remove();
                    } else {
                        // was modified so remove class
                        node.removeClass('io-ox-signature');
                    }
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

            this.removeSignature();

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
                this.model.set('currentSignature', text);
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

            return this.changeEditorMode().done(function () {
                if (data.replaceBody !== 'no') {
                    // control focus in compose mode
                    if (self.model.get('mode') === 'compose') {
                        self.$el.find('.tokenfield:first .token-input').focus();
                    } else {
                        self.editor.focus();
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
                            self.toggleInput('cc', true).find('.token-input').focus();
                        } else if ((/^bcc:?\s/i).test(val)) {
                            $(this).typeahead('val', '');
                            self.toggleInput('bcc', true).find('.token-input').focus();
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
                }
                else if (fixed) {
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
