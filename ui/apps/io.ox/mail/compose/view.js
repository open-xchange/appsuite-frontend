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

define('io.ox/mail/compose/view', [
    'io.ox/mail/compose/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/core/tk/textproc',
    'settings!io.ox/mail',
    'settings!io.ox/core',
    'io.ox/core/notifications',
    'io.ox/core/api/snippets',
    'io.ox/core/api/account',
    'gettext!io.ox/mail',
    'io.ox/mail/actions/attachmentEmpty',
    'io.ox/mail/actions/attachmentQuota',
    'io.ox/core/attachments/backbone',
    'io.ox/core/tk/dialogs',
    'io.ox/mail/compose/signatures',
    'io.ox/mail/sanitizer',
    'io.ox/core/attachments/backbone',
    'less!io.ox/mail/style',
    'less!io.ox/mail/compose/style',
    'io.ox/mail/compose/actions/send',
    'io.ox/mail/compose/actions/save'
], function (extensions, Dropdown, ext, mailAPI, mailUtil, textproc, settings, coreSettings, notifications, snippetAPI, accountAPI, gt, attachmentEmpty, attachmentQuota, Attachments, dialogs, signatureUtil, sanitizer, attachmentModel) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/mail/compose';

    ext.point(POINT + '/buttons').extend(
        {
            index: 100,
            id: 'send',
            draw: extensions.buttons.send
        },
        {
            index: 200,
            id: 'save',
            draw: extensions.buttons.save
        },
        {
            index: 300,
            id: 'discard',
            draw: extensions.buttons.discard
        }
    );

    ext.point(POINT + '/mailto').extend({
        id: 'mailto',
        index: 100,
        setup: extensions.mailto
    });

    ext.point(POINT + '/header').extend(
        {
            index: 100,
            id: 'title',
            draw: extensions.title
        },
        {
            index: 200,
            id: 'buttons',
            draw: function (baton) {
                ext.point(POINT + '/buttons').invoke('draw', this, baton);
            }
        },
        {
            index: 200,
            id: 'inlineYell',
            draw: extensions.inlineYell
        }
    );

    ext.point(POINT + '/fields').extend(
        {
            id: 'header',
            index: INDEX += 100,
            draw: extensions.header
        },
        {
            id: 'sender',
            index: INDEX += 100,
            draw: extensions.sender
        },
        {
            id: 'sender-realname',
            index: INDEX += 100,
            draw: extensions.senderRealName
        },
        {
            id: 'to',
            index: INDEX += 100,
            draw: extensions.tokenfield('to')
        },
        {
            id: 'cc',
            index: INDEX += 100,
            draw: extensions.tokenfield('cc')
        },
        {
            id: 'bcc',
            index: INDEX += 100,
            draw: extensions.tokenfield('bcc')
        },
        {
            id: 'replyto',
            index: INDEX += 100,
            draw: extensions.tokenfield('reply_to')
        },
        {
            id: 'subject',
            index: INDEX += 100,
            draw: extensions.subject
        },
        {
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
        },
        {
            id: 'attachments',
            index: INDEX += 100,
            draw: function (baton) {
                var node = $('<div data-extension-id="attachments" class="row attachments">');
                ext.point(POINT + '/attachments').invoke('draw', node, baton);
                this.append(node);
            }
        },
        {
            id: 'arialive',
            index: INDEX += 100,
            draw: function () {
                var node = $('<div data-extension-id="arialive" class="sr-only" role="alert" aria-live="assertive">');
                this.append(node);
            }
        }
    );

    ext.point(POINT + '/recipientActionLink').extend(
        {
            id: 'cc',
            index: 100,
            draw: extensions.recipientActionLink('cc')
        },
        {
            id: 'bcc',
            index: 200,
            draw: extensions.recipientActionLink('bcc')
        }
    );

    ext.point(POINT + '/recipientActionLinkMobile').extend({
        id: 'mobile',
        index: 100,
        draw: extensions.recipientActionLinkMobile
    });

    ext.point(POINT + '/recipientActions').extend({
        id: 'recipientActions',
        index: 100,
        draw: extensions.recipientActions
    });

    ext.point(POINT + '/menu').extend(
        {
            id: 'security',
            index: 100,
            draw: extensions.security
        },
        {
            id: 'signatures',
            index: 200,
            draw: extensions.signaturemenu
        },
        {
            id: 'options',
            index: 300,
            draw: extensions.optionsmenu
        }
    );

    ext.point(POINT + '/signatures').extend({
        id: 'signature',
        index: 100,
        draw: extensions.signature
    });

    ext.point(POINT + '/editors').extend(
        {
            id: 'plain-text',
            label: gt('Plain Text'),
            mode: 'text'
        },
        {
            id: 'tinymce',
            label: gt('HTML'),
            mode: 'html'
        }
    );

    ext.point(POINT + '/menuoptions').extend(
        {
            id: 'editor',
            index: 100,
            draw: function () {
                if (_.device('smartphone')) return;
                var menu = this.data('view')
                    .header(gt('Editor'));

                ext.point(POINT + '/editors').each(function (point) {
                    if (!point.mode && !point.label) return;
                    menu.option('editorMode', point.mode, point.label, { prefix: gt('Editor'), radio: true });
                });
            }
        },
        {
            id: 'priority',
            index: 200,
            draw: function () {
                this.data('view')
                    .header(gt.pgettext('E-Mail', 'Priority'))
                    //#. E-Mail priority
                    .option('priority', 1, gt.pgettext('E-Mail priority', 'High'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true })
                    //#. E-Mail priority
                    .option('priority', 3, gt.pgettext('E-Mail priority', 'Normal'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true })
                    //#. E-Mail priority
                    .option('priority', 5, gt.pgettext('E-Mail priority', 'Low'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true });
            }
        },
        {
            id: 'options',
            index: 300,
            draw: function () {
                this.data('view')
                    .header(gt('Options'))
                    .option('vcard', 1, gt('Attach Vcard'), { prefix: gt('Options'), toggleValue: 0 })
                    .option('disp_notification_to', true, gt('Request read receipt'), { prefix: gt('Options') });
            }
        }
    );

    ext.point(POINT + '/composetoolbar').extend(
        {
            id: 'add_attachments',
            index: 100,
            draw: function (baton) {
                var node = $('<div data-extension-id="add_attachments" class="mail-input col-xs-3">');
                if (_.device('!smartphone')) node.addClass('col-xs-offset-2');
                extensions.attachment.call(node, baton);
                this.append(node);
            }
        },
        {
            id: 'menus',
            index: 200,
            draw: function (baton) {
                var node = $('<div class="pull-right text-right">');

                ext.point(POINT + '/menu').invoke('draw', node, baton);

                this.append(
                    $('<div data-extension-id="composetoolbar-menu" class="col-xs-7">').append(node)
                );
            }
        }
    );

    ext.point(POINT + '/attachments').extend({
        id: 'attachmentPreview',
        index: 100,
        draw: function (baton) {
            var node = $('<div data-extension-id="attachmentPreview" class="col-xs-12">');
            extensions.attachmentPreviewList.call(node, baton);
            extensions.attachmentSharing.call(node, baton);
            node.appendTo(this);
        }
    });

    ext.point(POINT + '/autosave/error').extend({
        id: 'default',
        handler: function (baton) {
            if (!baton.isLogout && !ox.handleLogoutError) {
                notifications.yell('error', baton.error);
            }
            baton.returnValue.reject(baton.error);
        }
    });

    // invoke extensions as a waterfall, but jQuery deferreds don't have an API for this
    // TODO: at the moment, this resolves with the result of the last extension point.
    // not sure if this is desired.
    // TODO: factor this out into a library or util class
    function extensionCascade(point, baton) {
        return point.reduce(function (def, p) {
            if (!def || !def.then) def = $.when(def);
            return def.then(function (result, newData) {
                if (result && result.data) baton.resultData = result.data;
                if (newData) baton.newData = newData;
                return $.when();
            }, function (result) {
                //TODO: think about the naming, here
                if (result) baton.result = result;
                //handle errors/warnings in reject case
                if (result && result.error) baton.error = result.error;
                if (result && result.warnings) baton.warning = result.warnings;
                return $.when();
            }).then(function () {
                if (baton.isPropagationStopped()) return;
                if (baton.isDisabled(point.id, p.id)) return;
                return p.perform.apply(undefined, [baton]);
            });
        }, $.when());
    }

    // disable attachmentList by default
    ext.point(POINT + '/attachments').disable('attachmentList');

    var MailComposeView = Backbone.View.extend({

        className: 'io-ox-mail-compose container f6-target',

        events: {
            'click [data-action="add"]': 'toggleTokenfield',
            'keydown [data-extension-id="subject"]': 'flagSubjectField',
            'keyup [data-extension-id="subject"] input': 'setSubject',
            'keydown': 'focusSendButton',
            'aria-live-update': 'ariaLiveUpdate'
        },

        initialize: function (options) {
            _.extend(this, signatureUtil.view, this);
            this.app = options.app;
            this.editorHash = {};
            this.autosave = {};
            this.blocked = [];
            this.messageFormat = options.messageFormat || settings.get('messageFormat', 'html');

            // Open Drafts in HTML mode if content type is html even if text-editor is default
            if (this.model.get('mode') === 'edit' && this.model.get('content_type') === 'text/html' && settings.get('messageFormat', 'html') === 'text') {
                this.messageFormat = 'html';
            }
            this.editor = null;
            this.composeMode = 'compose';
            this.editorId = _.uniqueId('editor-');
            this.editorContainer = $('<div class="editor">').attr({
                'data-editor-id': this.editorId
            });

            this.baton = ext.Baton({
                model: this.model,
                view: this
            });

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));

            this.listenTo(this.model, 'keyup:subject change:subject', this.setTitle);
            this.listenTo(this.model, 'change:editorMode', this.toggleEditorMode);
            this.listenTo(this.model, 'needsync', this.syncMail);
            // handler can be found in signatures.js
            this.listenTo(this.model, 'change:signatureId', this.setSignature);
            this.listenTo(this.model, 'change:signatures', this.updateSignatures);
            this.listenTo(this.model, 'change:signature', this.redrawSignature);

            var mailto, params, self = this;
            // triggered by mailto?
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
                var to = decodeURIComponent(tmp[0]);
                params = _.deserialize(tmp[1]);
                // see Bug 31345 - [L3] Case sensitivity issue with Richmail while rendering Mailto: link parameters
                for (var key in params) params[key.toLowerCase()] = params[key];
                // save data
                if (to) { this.model.set('to', parseRecipients(to), { silent: true }); }
                if (params.cc) { this.model.set('cc', parseRecipients(params.cc), { silent: true }); }
                if (params.bcc) { this.model.set('bcc', parseRecipients(params.bcc), { silent: true }); }

                params.body = sanitizer.sanitize({ content: params.body, content_type: 'text/html' }, { WHOLE_DOCUMENT: false }).content;
                this.setSubject(params.subject || '');
                this.model.setContent(params.body || '');
                // clear hash
                _.url.hash('mailto', null);
            }

            this.listenTo(mailAPI.queue.collection, 'change:pct', this.onSendProgress);

            ext.point(POINT + '/mailto').invoke('setup');

            // add dynamic extensionpoint to trigger saveAsDraft on logout
            this.logoutPointId = 'saveMailOnDraft_' + this.app.id;

            ext.point('io.ox/core/logout').extend({
                id: this.logoutPointId,
                index: 1000 + this.app.guid,
                logout: function () {
                    return self.autoSaveDraft({ isLogout: true }).then(function (result) {
                        var base = _(result.split(mailAPI.separator)),
                            id = base.last(),
                            folder = base.without(id).join(mailAPI.separator),
                            // use JSlob to save the draft ID so it can be used as a restore point.
                            idSavePoints = coreSettings.get('savepoints', []);

                        idSavePoints.push({
                            module: 'io.ox/mail/compose',
                            // flag to indicate that this savepoint is non default but uses cid to restore the application
                            restoreById: true,
                            id: self.app.get('uniqueID'),
                            version: ox.version,
                            description: gt('Mail') + ': ' + (self.model.get('subject') || gt('No subject')),
                            // data that is send to restore function. Also include flag so it can detect the non default savepoint
                            point: { id: id, folder_id: folder, restoreById: true }
                        });

                        return coreSettings.set('savepoints', idSavePoints).save();
                    });
                }
            });
        },

        onSendProgress: function (model, value) {
            var csid = this.model.get('csid');
            if (csid !== model.get('id')) return;
            if (value >= 0) this.app.getWindow().busy(value);
        },

        ariaLiveUpdate: function (e, msg) {
            this.$('[data-extension-id="arialive"]').text(msg);
        },

        fetchMail: function (obj) {
            // Empty compose (early exit)
            if (obj.mode === 'compose') return $.when();

            // keep attachments (mail body) for restored reply
            if (obj.restored) return $.when();

            var self = this,
                mode = obj.mode,
                mailReference = _(obj).pick('id', 'folder_id');

            delete obj.mode;

            if (obj.initial === false) {
                obj.attachments = new Attachments.Collection(_.clone(obj.attachments));
                this.model.set(obj);
                obj = null;
                return $.when();
            } else if (mode === 'forward' && !obj.id) {
                obj = _(obj).map(function (o) {
                    return _.pick(o, 'id', 'folder_id', 'csid', 'security');
                });
            } else {
                obj = _.pick(obj, 'id', 'folder_id', 'csid', 'content_type', 'security');
            }

            // use CSS sanitizing and size limit (large than detail view)
            obj.embedded = true;
            obj.max_size = settings.get('maxSize/compose', 1024 * 512);

            return mailAPI[mode](obj, this.messageFormat)
                .then(accountAPI.getValidAddress)
                .then(function checkTruncated(data) {
                    //check for truncated message content, warn the user, provide alternative
                    if (data.attachments[0].truncated) {
                        //only truncated if forwarded inline and too large
                        var dialog = new dialogs.ModalDialog(),
                            def = $.Deferred();

                        dialog
                            .header($('<h4>').text(gt('This message has been truncated due to size limitations.')))
                            .append(gt('Loading the full mail might lead to performance problems.'))
                            .addPrimaryButton('useInline', gt('Continue'), 'useInline')
                            .addButton('useInlineComplete', gt('Load full mail'), 'useInlineComplete')
                            .addButton('useAttachment', gt('Add original message as attachment'), 'useAttachment')
                            .on('useAttachment', function () {
                                obj.attachOriginalMessage = true;
                                def.resolve(obj);
                            })
                            .on('useInline', def.reject)
                            .on('useInlineComplete', function () {
                                delete obj.max_size;
                                def.resolve(obj);
                            })
                            .show();
                        return def.always(function () {
                            dialog.close();
                        }).then(function (obj) {
                            return mailAPI[mode](obj, this.messageFormat);
                        }, function () {
                            return $.when(data);
                        });
                    }
                    return data;
                })
                .then(function (data) {
                    if (mode !== 'edit') {
                        data.sendtype = mode === 'forward' ? mailAPI.SENDTYPE.FORWARD : mailAPI.SENDTYPE.REPLY;
                    } else {
                        data.sendtype = mailAPI.SENDTYPE.EDIT_DRAFT;
                    }
                    data.mode = mode;

                    var attachments = _.clone(data.attachments);
                    // to keep the previews working we copy data from the original mail
                    if (mode === 'forward' || mode === 'edit') {
                        attachments.forEach(function (file) {
                            _.extend(file, { group: 'mail', mail: mailReference, security: obj.security });
                        });
                    }

                    delete data.attachments;

                    //FIXME: remove this if statement? Should still work without it
                    if (mode === 'forward' || mode === 'edit' || mode === 'reply' || mode === 'replyall') {
                        // move nested messages into attachment array
                        _(data.nested_msgs).each(function (obj) {
                            attachments.push({
                                id: obj.id,
                                filename: obj.subject + '.eml',
                                content_type: 'message/rfc822',
                                msgref: obj.msgref
                            });
                        });
                        delete data.nested_msgs;
                    }

                    // custom display names
                    var address = _.first(data.from);
                    if (_.isArray(address) && settings.get(['customDisplayNames', address[1], 'overwrite'])) {
                        address[0] = settings.get(['customDisplayNames', address[1], 'name'], address[0]);
                    }

                    // recover notification option (boolean)
                    if (mode === 'edit') data.disp_notification_to = !!data.disp_notification_to;

                    self.model.set(data);

                    var attachmentCollection = self.model.get('attachments');
                    attachmentCollection.reset(_(attachments).map(function (attachment) {
                        return new attachmentModel.Model(attachment);
                    }));
                    var content = attachmentCollection.at(0).get('content'),
                        content_type = attachmentCollection.at(0).get('content_type');

                    // Force text edit mode when alternative editorMode and text/plain mail
                    if (mode === 'edit' && self.model.get('editorMode') === 'alternative' && content_type === 'text/plain') {
                        self.model.set('editorMode', 'text', { silent: true });
                    }

                    var def = $.Deferred();
                    if (content_type === 'text/plain' && self.model.get('editorMode') === 'html') {
                        require(['io.ox/mail/detail/content'], function (proc) {
                            var html = proc.transformForHTMLEditor(content);
                            attachmentCollection.at(0).set('content_type', 'text/html');
                            content = html;
                            def.resolve();
                        });
                    } else {
                        // TODO
                        // In e.g. edit mode middleware wraps content in a div this should be solved in middleware!
                        if (/^<div id="ox-\w+"[^>]*>/.test(content.trim())) {
                            content = content.trim().replace(/^<div id="ox-\w+"[^>]*>/, '').replace(/<\/div>$/, '');
                        }
                        def.resolve();
                    }
                    return $.when(def).then(function () {
                        attachmentCollection.at(0).set('content', content);
                        self.model.unset('attachments');
                        self.model.set('attachments', attachmentCollection);
                        obj = data = attachmentCollection = null;
                    });
                })
                .fail(function () {
                    // Mark model as clean to prevent save/discard dialog when server side error occurs
                    self.clean();
                });
        },

        setSubject: function (e) {
            var node = e.target ? $(e.target) : undefined,
                value = node ? node.val() : e;
            // A11y: focus mailbody on enter in subject field
            // 'data-enter-keydown' indicates that enter was pressed when subject had focus
            if (e.which && e.which === 13 && node.attr('data-enter-keydown')) {
                e.preventDefault();
                this.editor.focus();
                node.removeAttr('data-enter-keydown');
            }
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
            var win = this.app.getWindow();
            // make sure the tokenfields have created all tokens and updated the to cc, bcc attributes
            this.trigger('updateTokens');
            if (win) win.busy();
            // get mail
            var mail = this.model.getMailForDraft();

            // disabled for fix of bug 56704
            //delete mail.vcard;

            var view = this,
                baton = new ext.Baton({
                    mail: mail,
                    model: this.model,
                    app: this.app,
                    view: view
                });

            var point = ext.point('io.ox/mail/compose/actions/save');

            return extensionCascade(point, baton).always(function () {
                if (win) win.idle();
            });
        },

        autoSaveDraft: function (options) {
            options = options || {};
            var def = new $.Deferred(),
                model = this.model,
                self = this,
                mail = this.model.getMailForAutosave();

            mailAPI.autosave(mail).always(function (result) {
                if (result.error) {
                    var baton = new ext.Baton(result);
                    baton.model = model;
                    baton.view = self;
                    baton.isLogout = options.isLogout;
                    baton.returnValue = def;
                    ext.point('io.ox/mail/compose/autosave/error').invoke('handler', self, baton);
                    def = baton.returnValue;
                } else {
                    model.set({
                        'autosavedAsDraft': true,
                        'msgref': result,
                        'sendtype': mailAPI.SENDTYPE.EDIT_DRAFT,
                        'infostore_ids_saved': [].concat(model.get('infostore_ids_saved'), mail.infostore_ids || [])
                    });
                    model.dirty(model.previous('sendtype') !== mailAPI.SENDTYPE.EDIT_DRAFT);
                    //#. %1$s is the time, the draft was saved
                    //#, c-format
                    self.inlineYell(gt('Draft saved at %1$s', moment().format('LT')));
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
                    seconds: 1000,
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

        inlineYell: function (text) {
            // no inline yell on smartphones, use default yell as fallback
            if (_.device('smartphone')) {
                notifications.yell('success', text);
                return;
            }
            // only fade in once, then leave it there
            this.$el.closest('.io-ox-mail-compose-window').find('.inline-yell').text(text).fadeIn();
        },

        clean: function () {
            // mark as not dirty
            this.model.dirty(false);
            // clean up editors
            for (var id in this.editorHash) {
                this.editorHash[id].destroy();
                delete this.editorHash[id];
            }
            // clear timer for autosave
            this.stopAutoSave();
        },

        removeLogoutPoint: function () {
            ext.point('io.ox/core/logout').disable(this.logoutPointId);
        },

        dispose: function () {
            // disable dynamic extensionpoint to trigger saveAsDraft on logout
            this.removeLogoutPoint();
            this.stopListening();
            this.model = null;
            delete this.editor;
        },

        discard: function () {
            var self = this,
                def = $.when(),
                isDraft = this.model.keepDraftOnClose();

            // This dialog gets automatically dismissed
            if ((this.model.dirty() || this.model.get('autosavedAsDraft') || isDraft) && !this.model.get('autoDismiss')) {
                var discardText = isDraft ? gt.pgettext('dialog', 'Delete draft') : gt.pgettext('dialog', 'Discard message'),
                    saveText = isDraft ? gt('Keep draft') : gt('Save as draft'),
                    modalText = isDraft ? gt('Do you really want to delete this draft?') : gt('Do you really want to discard your message?');

                if (this.app.getWindow && this.app.getWindow().floating) {
                    this.app.getWindow().floating.toggle(true);
                } else if (_.device('smartphone')) {
                    this.app.getWindow().resume();
                }
                // button texts may become quite large in some languages (e. g. french, see Bug 35581)
                // add some extra space
                // TODO maybe we could use a more dynamical approach
                def = new dialogs.ModalDialog({ width: 550, container: _.device('smartphone') ? self.$el.closest('.window-container-center') : $('#io-ox-core') })
                    .text(modalText)
                    //#. "Discard message" appears in combination with "Cancel" (this action)
                    //#. Translation should be distinguishable for the user
                    .addPrimaryButton('delete', discardText, 'delete')
                    .addAlternativeButton('savedraft', saveText, 'savedraft')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .then(function (action) {
                        if (action === 'delete') {
                            if (isDraft) mailAPI.remove([self.parseMsgref(self.model.get('msgref'))]);
                            self.model.discard();
                        } else if (action === 'savedraft') {
                            return self.saveDraft();
                        } else {
                            return $.Deferred().reject();
                        }
                    });
            }

            return def.then(function () {
                self.clean();
            });
        },

        send: function () {


            //#. This is a prefix of a copied draft and will be removed
            //#. This string must equal the prefix, which is prepended before the subject on copy
            //#. It is important, that the space is also translated, as the space will also be removed
            var str = gt('[Copy] ');
            if ((this.model.get('subject') || '').indexOf(str) === 0) {
                var subject = this.model.get('subject');
                subject = subject.replace(str, '');
                this.model.set('subject', subject);
            }
            // make sure the tokenfields have created all tokens and updated the to cc, bcc attributes
            this.trigger('updateTokens');
            var mail = this.model.getMail(),
                view = this,
                baton = new ext.Baton({
                    mail: mail,
                    model: this.model,
                    app: this.app,
                    view: view
                }),
                point = ext.point('io.ox/mail/compose/actions/send');

            // don't ask wether the app can be closed if we have unsaved data, we just want to send
            baton.model.set('autoDismiss', true);

            return extensionCascade(point, baton).then(function () {
                //app is re-opened; we want to be asked before any unsaved data is discarded
                if (baton.error) baton.model.set('autoDismiss', false);
            });
        },

        toggleTokenfield: function (e) {
            var isString = typeof e === 'string',
                type = isString ? e : $(e.target).attr('data-type'),
                input;

            if (_.device('smartphone')) {
                if (!isString) e.preventDefault();
                input = this.$el.find('[data-extension-id="cc"], [data-extension-id="bcc"]');
                if (input.hasClass('hidden')) {
                    input.removeClass('hidden');
                    this.$el.find('[data-action="add"] span').removeClass('fa-angle-right').addClass('fa-angle-down');
                } else if (_.isEmpty(this.model.attributes.cc) && _.isEmpty(this.model.attributes.bcc)) {
                    this.model.set('cc', []);
                    this.model.set('bcc', []);
                    input.addClass('hidden');
                    this.$el.find('[data-action="add"] span').removeClass('fa-angle-down').addClass('fa-angle-right');
                }
                return input;
            }

            var button = this.$el.find('[data-type="' + type + '"]');
            input = this.$el.find('[data-extension-id="' + type + '"]');
            if (!isString) e.preventDefault();
            if (input.hasClass('hidden') || isString) {
                input.removeClass('hidden');
                button.addClass('active').attr('aria-checked', true);
            } else if (!this.model.has(type) || _.isEmpty(this.model.get(type))) {
                //We don't want to close it automatically! Bug: 35730
                this.model.set(type, []);
                input.addClass('hidden');
                $(window).trigger('resize.tinymce');
                button.removeClass('active').attr('aria-checked', false);
            }
            return input;
        },

        loadEditor: function (content) {
            if (this.editorHash[this.model.get('editorMode')]) {
                return this.reuseEditor(content);
            }
            var self = this,
                def = $.Deferred(),
                options = {};

            options.useFixedWithFont = settings.get('useFixedWithFont');
            options.app = this.app;
            options.view = this;
            options.model = this.model;
            options.oxContext = { view: this };

            ox.manifests.loadPluginsFor('io.ox/mail/compose/editor/' + this.model.get('editorMode')).then(function (Editor) {
                new Editor(self.editorContainer, options).done(function (editor) {
                    def.resolve(editor);
                });
            }, function () {
                // something went wrong
                def.reject({ error: gt("Couldn't load editor") });
            });
            return def.then(function (editor) {
                self.editorHash[self.model.get('editorMode')] = editor;
                // maybe there will be a better place for the following line in the future, but until then it will stay here
                // attaches listeners to the tinymce instance
                if (editor.tinymce) $(editor.tinymce().getElement()).on('removeInlineImage', self.onRemoveInlineImage.bind(self));
                return self.reuseEditor(content);
            });
        },

        reuseEditor: function (content) {
            var self = this;
            this.editor = this.editorHash[this.model.get('editorMode')];
            return $.when(this.editor.setPlainText(content)).then(function () {
                self.editor.show();
                return self.editor;
            });
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

        toggleEditorMode: function () {

            var content;

            if (this.editor) {
                // this.removeSignature();
                content = this.editor.getPlainText();
                this.editor.hide();
            }

            this.editorContainer.busy();

            return this.loadEditor(content).then(function () {
                this.editorContainer.idle();
                // update the content type of the mail
                // FIXME: may be, do this somewhere else? in the model?
                this.model.setMailContentType(this.editor.content_type);
                // reset tinyMCE's undo stack
                if (!_.isFunction(this.editor.tinymce)) return;
                this.editor.tinymce().undoManager.clear();
            }.bind(this));
        },

        onRemoveInlineImage: function (e, id) {
            var attachments = this.model.get('attachments'),
                image = attachments.findWhere({ cid: '<' + id + '>' });
            if (image) attachments.remove(image);
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

            if (this.model.get('mode') !== 'compose') {
                // Remove extranous <br>
                content = content.replace(/\n<br>&nbsp;$/, '\n');
            }

            this.setSimpleMail(content);

            this.editor.setContent(content);

            if (this.model.get('initial')) {
                this.prependNewLine();
            }
        },

        getParagraph: function (text, isHTML) {
            var node = $('<div class="io-ox-signature">').append(!!isHTML ? text : this.editor.ln2br(text));
            return $('<div>').append(node).html();
        },

        prependNewLine: function () {
            // Prepend newline in all modes except when editing draft
            if (this.model.get('mode') === 'edit') return;
            var content = this.editor.getContent().replace(/^\n+/, '').replace(/^(<div[^>]*class="default-style"[^>]*><br><\/div>)+/, '');
            var nl = this.model.get('editorMode') === 'html' ? mailUtil.getDefaultStyle().node.get(0).outerHTML : '\n';
            this.editor.setContent(nl + content);
        },

        setMail: function () {
            var self = this;

            this.model.setInitialMailContentType();

            return this.toggleEditorMode().then(function () {
                return self.signaturesLoading;
            })
            .done(function () {
                var target, mode = self.model.get('mode');
                // set focus in compose and forward mode to recipient tokenfield
                if (_.device('!ios')) {
                    if (/(compose|forward)/.test(mode)) {
                        target = self.$('.tokenfield:first .token-input');
                    } else {
                        target = self.editor;
                    }
                    if (self.editor.tinymce) {
                        var defaultFontStyle = settings.get('defaultFontStyle', {}),
                            family = (defaultFontStyle.family || '').split(',')[0];
                        if (!_.isEmpty(defaultFontStyle)) {
                            if (family && family !== 'browser-default') self.editor.tinymce().execCommand('fontName', false, family);
                            if (defaultFontStyle.size && defaultFontStyle.size !== 'browser-default') self.editor.tinymce().execCommand('fontSize', false, defaultFontStyle.size);
                        }
                    }
                    target.focus();
                }
                self.model.setAutoBCC();
                if (mode === 'replyall' || mode === 'edit') {
                    if (!_.isEmpty(self.model.get('cc'))) self.toggleTokenfield('cc');
                }
                if (!_.isEmpty(self.model.get('bcc'))) self.toggleTokenfield('bcc');
                self.setBody(self.model.getContent());
                // Set model as dirty only when attaching infostore ids initially (Send as pdf from text)
                self.model.dirty(self.model.get('mode') === 'compose' && !_.isEmpty(self.model.get('infostore_ids')));
                // compose vs. edit
                self.model.setInitialSignature();
            });
        },

        setSimpleMail: function (content) {
            if (this.model.get('editorMode') === 'text') return;
            if (!/<table/.test(content)) this.editorContainer.find('.editable.mce-content-body').addClass('simple-mail');
        },

        blockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) + 1;
        },

        unblockReuse: function (sendtype) {
            this.blocked[sendtype] = (this.blocked[sendtype] || 0) - 1;
            if (this.blocked[sendtype] <= 0) delete this.blocked[sendtype];
        },

        focusEditor: function () {
            this.editor.focus();
        },

        flagSubjectField: function (e) {
            var node = $(e.target);
            // required for custom focus handling within inputs on enter
            if (e.which === 13) return node.attr('data-enter-keydown', true);
        },

        focusSendButton: function (e) {
            // Focus send button on ctrl || meta + Enter (a11y + keyboardsupport)
            if ((e.metaKey || e.ctrlKey) && e.which === 13) {
                e.preventDefault();
                this.$el.parents().find('button[data-action="send"]').focus();
            }
        },

        render: function () {
            var self = this;

            var node = $('<div class="mail-compose-fields">');

            // draw all extensionpoints
            ext.point(POINT + '/fields').invoke('draw', node, this.baton);

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
                        // clear tokenfield input
                        if (e.which === 13 && $(this).attr('data-ime') !== 'active') $(this).val('');
                    },
                    // shortcuts (to/cc/bcc)
                    keyup: function (e) {
                        if (e.which === 13) return;
                        if (_.device('smartphone')) return;
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

            this.$el.append(this.editorContainer);

            this.initAutoSaveAsDraft();

            return this;
        }

    });

    return MailComposeView;
});
