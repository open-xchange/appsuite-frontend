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
    'io.ox/mail/compose/api',
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
    'less!io.ox/mail/style',
    'less!io.ox/mail/compose/style',
    'io.ox/mail/compose/actions/send',
    'io.ox/mail/compose/actions/save'
], function (extensions, Dropdown, ext, composeAPI, mailAPI, mailUtil, textproc, settings, coreSettings, notifications, snippetAPI, accountAPI, gt, attachmentEmpty, attachmentQuota, Attachments, dialogs, signatureUtil, sanitizer) {

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
                    .option('priority', 'high', gt.pgettext('E-Mail priority', 'High'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true })
                    //#. E-Mail priority
                    .option('priority', 'normal', gt.pgettext('E-Mail priority', 'Normal'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true })
                    //#. E-Mail priority
                    .option('priority', 'low', gt.pgettext('E-Mail priority', 'Low'), { prefix: gt.pgettext('E-Mail', 'Priority'), radio: true });
            }
        },
        {
            id: 'options',
            index: 300,
            draw: function () {
                this.data('view')
                    .header(gt('Options'))
                    .option('vcard', 1, gt('Attach Vcard'), { prefix: gt('Options'), toggleValue: 0 })
                    .option('requestReadReceipt', true, gt('Request read receipt'), { prefix: gt('Options') });
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
                    // $('<div data-extension-id="composetoolbar-menu" class="col-xs-7">').append(node)
                    $('<div data-extension-id="composetoolbar-menu">')
                        .addClass(_.device('smartphone') ? 'col-xs-9' : 'col-xs-7')
                        .append(node)
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
            extensions.imageResizeOption.call(node, baton);
            node.appendTo(this);
        }
    });

    // invoke extensions as a waterfall, but jQuery deferreds don't have an API for this
    // TODO: at the moment, this resolves with the result of the last extension point.
    // not sure if this is desired.
    // TODO: factor this out into a library or util class
    // TODO this was alread done... see how we can use ext.point(...).cascade but need to compare error cases
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
                baton.rejected = true;
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
            this.config = options.config;
            this.editorHash = {};
            this.blocked = [];
            this.messageFormat = options.messageFormat || settings.get('messageFormat', 'html');

            // Open Drafts in HTML mode if content type is html even if text-editor is default
            // TODO this seems to be duplicate code. See boot process of the app. This should not be handled by the view
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
                config: this.config,
                view: this
            });

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));

            this.listenTo(this.model, 'keyup:subject change:subject', this.setTitle);
            this.listenTo(this.model, 'change', _.throttle(this.onChangeSaved.bind(this, 'dirty'), 100));
            this.listenTo(this.model, 'before:save', this.onChangeSaved.bind(this, 'saving'));
            this.listenTo(this.model, 'success:save', this.onChangeSaved.bind(this, 'saved'));
            this.listenTo(this.config, 'change:editorMode', this.toggleEditorMode);
            this.listenTo(this.config, 'change:vcard', this.onAttachVcard);
            this.listenTo(this.model, 'change:content', this.onChangeContent);

            // handler can be found in signatures.js
            this.listenTo(this.config, 'change:signatureId', this.setSignature);
            this.listenTo(this.config, 'change:signatures', this.updateSignatures);
            this.listenTo(this.config, 'change:signature', this.redrawSignature);

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
                this.model.set('content', params.body || '');
                // clear hash
                _.url.hash('mailto', null);
            }

            this.listenTo(composeAPI.queue.collection, 'change:pct', this.onSendProgress);

            ext.point(POINT + '/mailto').invoke('setup');

            // add dynamic extensionpoint to trigger saveAsDraft on logout
            this.logoutPointId = 'saveMailOnDraft_' + this.app.id;

            ext.point('io.ox/core/logout').extend({
                id: this.logoutPointId,
                index: 1000 + this.app.guid,
                logout: function () {
                    return self.model.save();
                }
            });
        },

        onSendProgress: function (model, value) {
            // TODO what exactly is happening here?
            var csid = this.model.get('csid');
            if (csid !== model.get('id')) return;
            if (value >= 0) this.app.getWindow().busy(value);
        },

        onChangeContent: function (model, value) {
            // easy one: when content get's removed completely set signature to 'no signature'
            if (value && value !== '<div style="" class="default-style"><br></div>') return;
            this.config.set('signatureId', '');
        },

        ariaLiveUpdate: function (e, msg) {
            this.$('[data-extension-id="arialive"]').text(msg);
        },

        // TODO fetchMail is not used anymore. Has been moved to the compose model initialization process.
        // TODO we need to check what may be moved there
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

            return composeAPI[mode](obj, this.messageFormat)
                .then(accountAPI.getValidAddress)
                // TOOD: clarifiy (trun)
                // .then(function checkTruncated(data) {
                //     //check for truncated message content, warn the user, provide alternative
                //     if (data.attachments[0] && data.attachments[0].truncated) {
                //         //only truncated if forwarded inline and too large
                //         var dialog = new dialogs.ModalDialog(),
                //             def = $.Deferred();
                //         dialog
                //             .header($('<h4>').text(gt('This message has been truncated due to size limitations.')))
                //             .append(gt('Loading the full mail might lead to performance problems.'))
                //             .addPrimaryButton('useInline', gt('Continue'), 'useInline')
                //             .addButton('useInlineComplete', gt('Load full mail'), 'useInlineComplete')
                //             .addButton('useAttachment', gt('Add original message as attachment'), 'useAttachment')
                //             .on('useAttachment', function () {
                //                 obj.attachOriginalMessage = true;
                //                 def.resolve(obj);
                //             })
                //             .on('useInline', def.reject)
                //             .on('useInlineComplete', function () {
                //                 delete obj.max_size;
                //                 def.resolve(obj);
                //             })
                //             .show();
                //         return def.always(function () {
                //             dialog.close();
                //         }).then(function (obj) {
                //             return composeAPI[mode](obj, this.messageFormat);
                //         }, function () {
                //             return $.when(data);
                //         });
                //     }
                //     return data;
                // })
                .then(function (data) {
                    if (mode !== 'edit') {
                        data.sendtype = mode === 'forward' ? composeAPI.SENDTYPE.FORWARD : composeAPI.SENDTYPE.REPLY;
                    } else {
                        data.sendtype = composeAPI.SENDTYPE.EDIT_DRAFT;
                    }
                    data.mode = mode;

                    var attachments = _.clone(data.attachments);
                    // to keep the previews working we copy data from the original mail
                    if (/^(forward|edit)$/.test(mode)) {
                        attachments.forEach(function (file) {
                            _.extend(file, { group: 'mail', mail: mailReference, security: obj.security });
                        });
                    }

                    delete data.attachments;

                    //FIXME: remove this if statement? Should still work without it
                    if (/^(forward|edit|reply|replyall)$/.test(mode)) {
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
                    var address = data.from;
                    if (_.isArray(address) && settings.get(['customDisplayNames', address[1], 'overwrite'])) {
                        address[0] = settings.get(['customDisplayNames', address[1], 'name'], address[0]);
                    }

                    // recover notification option (boolean)
                    if (mode === 'edit') data.disp_notification_to = !!data.disp_notification_to;

                    self.model.set(data);
                    // > model > initialized
                    var attachmentCollection = self.model.get('attachments');
                    // attachmentCollection.reset(_(attachments).map(function (attachment) {
                    //     return new Attachments.Model(_.extend({}, attachment, { group: 'mail', space: self.model.get('id') }));
                    // }));

                    var content = data.content,
                        content_type = data.contentType;

                    // Force text edit mode when alternative editorMode and text/plain mail
                    if (mode === 'edit' && self.config.get('editorMode') === 'alternative' && content_type === 'text/plain') {
                        self.model.set('editorMode', 'text', { silent: true });
                    }

                    var def = $.Deferred();
                    if (content_type === 'text/plain' && self.config.get('editorMode') === 'html') {
                        require(['io.ox/mail/detail/content'], function (proc) {
                            var html = proc.transformForHTMLEditor(content);
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
                        self.model.set('content', content);
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

        saveDraft: function () {
            var win = this.app.getWindow();
            // make sure the tokenfields have created all tokens and updated the to cc, bcc attributes
            this.trigger('updateTokens');
            if (win) win.busy();

            var view = this,
                baton = new ext.Baton({
                    model: this.model,
                    config: this.config,
                    app: this.app,
                    view: view
                });

            var point = ext.point('io.ox/mail/compose/actions/save');

            return extensionCascade(point, baton).always(function () {
                if (win) win.idle();
            });
        },

        // has three states, dirty, saving, saved
        onChangeSaved: function (state) {
            if (this.autoSaveState === state) return;
            if (state === 'dirty') this.inlineYell('');
            else if (state === 'saving') this.inlineYell('Saving...');
            else if (state === 'saved' && this.autoSaveState === 'saving') this.inlineYell('Saved');
            this.autoSaveState = state;
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

        dirty: function (state) {
            if (state === false) this.initialModel = this.model.toJSON();
            else if (state === true) this.initialModel = {};
            else return !_.isEmpty(this.model.deepDiff(this.initialModel));
        },

        clean: function () {
            // mark as not dirty
            this.dirty(false);
            // clean up editors
            for (var id in this.editorHash) {
                this.editorHash[id].destroy();
                delete this.editorHash[id];
            }
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
            if ((this.dirty() || isDraft) && !this.config.get('autoDismiss')) {
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
                            var isAutoDiscard = self.config.get('autoDiscard') && self.model.get('msgref');
                            if (!isDraft && !isAutoDiscard) return;
                            // only delete autosaved drafts that are not saved manually and have a msgref
                            mailAPI.remove([mailUtil.parseMsgref(mailAPI.separator, self.model.get('msgref'))]);
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
            var view = this,
                baton = new ext.Baton({
                    model: this.model,
                    config: this.config,
                    app: this.app,
                    view: view
                }),
                win = this.app.getWindow(),
                point = ext.point('io.ox/mail/compose/actions/send');

            // don't ask wether the app can be closed if we have unsaved data, we just want to send
            baton.config.set('autoDismiss', true);

            win.busy();
            return extensionCascade(point, baton).then(function () {
                // a check/user intaction aborted the flow or app is re-opened after a request error; we want to be asked before any unsaved data is discarded again
                if (baton.rejected || baton.error) baton.config.set('autoDismiss', false);
            }).always(win.idle.bind(win));
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
                button.addClass('active');
                if (type === 'cc') button.attr('title', gt('Hide carbon copy input field'));
                if (type === 'bcc') button.attr('title', gt('Hide blind carbon copy input field'));
            } else if (!this.model.has(type) || _.isEmpty(this.model.get(type))) {
                //We don't want to close it automatically! Bug: 35730
                this.model.set(type, []);
                input.addClass('hidden');
                button.removeClass('active');
                if (type === 'cc') button.attr('title', gt('Show carbon copy input field'));
                if (type === 'bcc') button.attr('title', gt('Show blind carbon copy input field'));
            }
            $(window).trigger('resize');
            return input;
        },

        loadEditor: function (content) {
            if (this.editorHash[this.config.get('editorMode')]) {
                return this.reuseEditor(content);
            }
            var self = this,
                def = $.Deferred(),
                options = {};

            options.useFixedWithFont = settings.get('useFixedWithFont');
            options.app = this.app;
            options.config = this.config;
            options.view = this;
            options.model = this.model;
            options.oxContext = { view: this };
            ox.manifests.loadPluginsFor('io.ox/mail/compose/editor/' + this.config.get('editorMode')).then(function (Editor) {
                new Editor(self.editorContainer, options).done(function (editor) {
                    def.resolve(editor);
                });
            }, function () {
                // something went wrong
                def.reject({ error: gt("Couldn't load editor") });
            });
            return def.then(function (editor) {
                self.editorHash[self.config.get('editorMode')] = editor;
                // maybe there will be a better place for the following line in the future, but until then it will stay here
                // attaches listeners to the tinymce instance
                if (editor.tinymce) $(editor.tinymce().getElement()).on('removeInlineImage', self.onRemoveInlineImage.bind(self));
                return self.reuseEditor(content);
            });
        },

        reuseEditor: function (content) {
            var self = this;
            if (this.editor) this.stopListening(this.editor);
            this.editor = this.editorHash[this.config.get('editorMode')];
            this.listenTo(this.editor, 'change', this.syncMail);
            // if contentType already matches editor (e.g. while startup), content can be set explicitedly
            var bothText = this.editor.getMode() === 'text' && this.model.get('contentType') === 'text/plain',
                bothHTML = this.editor.getMode() === 'html' && this.model.get('contentType') === 'text/html',
                setMethod = bothText || bothHTML ? 'setContent' : 'setPlainText';
            console.log('setMethod', setMethod, this.editor.getMode());
            return $.when(this.editor[setMethod](content)).then(function () {
                self.model.set({
                    content: self.editor.getContent(),
                    contentType: self.editor.content_type
                });
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
            } else {
                // initial, use existing content of composition space
                content = this.model.get('content');
                if (this.model.get('contentType') === 'text/html' && this.config.get('editorMode') === 'text') content = textproc.htmltotext(content);
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

        onAttachVcard: function () {
            if (this.config.get('vcard') === 1) this.model.attachVCard();
            this.config.set('vcard', 0);
        },

        onRemoveInlineImage: function (e, id) {
            var attachments = this.model.get('attachments'),
                image = attachments.findWhere({ cid: '<' + id + '>' });
            if (image) attachments.remove(image);
        },

        syncMail: function () {
            if (!this.editor) return;
            this.model.set('content', this.editor.getContent());
        },

        setBody: function (content) {
            if (this.model.get('initial')) {
                // remove white-space at beginning except in first-line
                content = String(content || '').replace(/^[\s\xA0]*\n([\s\xA0]*\S)/, '$1');
                // remove white-space at end
                content = content.replace(/[\s\uFEFF\xA0]+$/, '');
            }

            if (this.model.get('meta').type !== 'new') {
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
            var nl = this.config.get('editorMode') === 'html' ? mailUtil.getDefaultStyle().node.get(0).outerHTML : '\n';
            this.editor.setContent(nl + content);
        },

        setMail: function () {
            var self = this;

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

                if (mode === 'replyall' || mode === 'edit') {
                    if (!_.isEmpty(self.model.get('cc'))) self.toggleTokenfield('cc');
                }
                if (!_.isEmpty(self.model.get('bcc'))) self.toggleTokenfield('bcc');

                self.setBody(self.model.getContent());
                // TODO double check this, especially the dirty setting
                // Set model as dirty only when attaching infostore ids initially (Send as pdf from text)
                self.dirty(self.model.get('mode') === 'compose' && !_.isEmpty(self.model.get('infostore_ids')));
            });
        },

        setSimpleMail: function (content) {
            if (this.config.get('editorMode') === 'text') return;
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

            return this;
        }

    });


    return MailComposeView;
});
