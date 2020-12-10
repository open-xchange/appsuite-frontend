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
    'io.ox/core/extensions',
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/core/attachments/backbone',
    'io.ox/backbone/views/modal',
    'io.ox/mail/compose/signatures',
    'io.ox/mail/sanitizer',
    'io.ox/mail/compose/util',
    'io.ox/backbone/mini-views/common',
    'less!io.ox/mail/style',
    'less!io.ox/mail/compose/style',
    'io.ox/mail/compose/actions/send',
    'io.ox/mail/compose/actions/save'
], function (extensions, ext, composeAPI, mailAPI, mailUtil, settings, notifications, gt, Attachments, ModalDialog, signatureUtil, sanitizer, composeUtil, mini) {

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
            index: 300,
            id: 'discard',
            draw: extensions.buttons.discard
        },
        {
            index: 400,
            id: 'composetoolbar',
            draw: function (baton) {
                if (_.device('smartphone')) return;
                var node = $('<ul data-extension-id="composetoolbar" class="composetoolbar list-unstyled list-inline">')
                    .attr({
                        'aria-label': gt('Actions. Use cursor keys to navigate.'),
                        'role': 'toolbar'
                    });
                ext.point(POINT + '/composetoolbar').invoke('draw', node, baton);
                this.append(node);
            },
            redraw: function (baton) {
                if (_.device('smartphone')) return;
                var node = baton.app.getWindow().nodes.footer.find('.composetoolbar').empty();
                ext.point(POINT + '/composetoolbar').invoke('draw', node, baton);
            }
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
            id: 'composetoolbar-mobile',
            index: INDEX += 100,
            draw: function (baton) {
                if (_.device('!smartphone')) return;
                var node = $('<div data-extension-id="composetoolbar-mobile" class="composetoolbar-mobile">');
                ext.point(POINT + '/composetoolbar-mobile').invoke('draw', node, baton);
                this.append(node);
            },
            redraw: function (baton) {
                if (_.device('!smartphone')) return;
                var node = this.find('.row.composetoolbar');
                ext.point(POINT + '/composetoolbar-mobile').invoke('redraw', node, baton);
            }
        },
        {
            id: 'attachments',
            index: INDEX += 100,
            draw: function (baton) {
                var node = $('<div data-extension-id="attachments" class="attachments">');
                ext.point(POINT + '/attachments').invoke('draw', node, baton);
                this.append(node);

                // toggle visibility of row
                var collection = baton.model.get('attachments');
                collection.on('add remove reset', toggle);
                toggle();
                function toggle() {
                    node.toggleClass('empty', !collection.fileAttachments().length);
                }
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

    ext.point(POINT + '/recipientActions').extend({
        id: 'recipientActions',
        index: 100,
        draw: extensions.recipientActions
    });

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

    ext.point(POINT + '/recipientActionsMobile').extend({
        id: 'recipientActionsMobile',
        index: 100,
        draw: extensions.recipientActionsMobile
    });

    ext.point(POINT + '/recipientActionLinkMobile').extend({
        id: 'mobile',
        index: 100,
        draw: extensions.recipientActionLinkMobile
    });

    ext.point(POINT + '/menu-mobile').extend(
        {
            id: 'security',
            index: 100,
            draw: extensions.security
        },
        {
            id: 'signatures',
            index: 200,
            draw: signatureUtil.extensions.menu
        },
        {
            id: 'options',
            index: 300,
            draw: extensions.optionsmenumobile
        }
    );

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
            id: 'signatures',
            index: 100,
            draw: signatureUtil.extensions.options
        },
        {
            id: 'priority',
            index: 200,
            draw: function () {
                this.data('view')
                    .divider()
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
                    .divider()
                    .header(gt('Options'))
                    .option('vcard', 1, gt('Attach Vcard'), { prefix: gt('Options'), toggleValue: 0 })
                    .option('requestReadReceipt', true, gt('Request read receipt'), { prefix: gt('Options') });
            }
        },
        // guard: index 400
        {
            id: 'editor',
            index: 500,
            draw: function () {
                if (_.device('smartphone')) return;
                var menu = this.data('view')
                    .divider()
                    .header(gt('Editor'));

                ext.point(POINT + '/editors').each(function (point) {
                    if (!point.mode && !point.label) return;
                    menu.option('editorMode', point.mode, point.label, { prefix: gt('Editor'), radio: true });
                });
            }
        },
        {
            id: 'saveAndClose',
            index: 600,
            draw: function (baton) {
                var saveAndClose = function () {
                    baton.view.saveDraft().then(function () {
                        // to prevent "do you want to save" dialog on quit. We just saved the data so that would be pointless
                        baton.config.set('autoDismiss', true);
                        baton.app.quit();
                    });
                };

                this.data('view').divider().link('settings', gt('Save draft and close'), function () {

                    // 2 settings:
                    // saveOnCloseDontShowAgain, user setting, determines if user wants to be reminded again
                    // saveOnCloseShow, server setting, determines if the dialog should show up at all
                    if (!settings.get('didYouKnow/saveOnCloseDontShowAgain', false) && settings.get('didYouKnow/saveOnCloseShow', true)) {
                        new ModalDialog({ title: gt('Did you know?'), description: gt('Your changes are automatically saved while you compose your email until you finally send it.') })
                            .build(function () {
                                this.$el.find('.modal-footer').prepend(new mini.CustomCheckboxView(
                                    {
                                        model: settings,
                                        label: gt('Do not show again.'),
                                        defaultVal: false,
                                        name: 'didYouKnow/saveOnCloseDontShowAgain'
                                    }
                                ).render().$el.addClass('pull-left'));

                                settings.once('changed:didYouKnow/saveOnCloseDontShowAgain', function () {
                                    settings.save();
                                });
                            })
                            .addButton({ label: gt('OK'), action: 'ok' })
                            .on('ok', saveAndClose)
                            .open();
                        return;
                    }

                    saveAndClose();
                });
            }
        }
    );

    ext.point(POINT + '/composetoolbar-mobile').extend(
        {
            id: 'add_attachments',
            index: 100,
            draw: function (baton) {
                var node = $('<div data-extension-id="add_attachments" class="mail-input">');
                extensions.attachmentmobile.call(node, baton);
                this.append(node);
            }
        },
        {
            id: 'menus',
            index: 200,
            draw: function (baton) {
                var node = $('<div class="pull-right text-right">');

                ext.point(POINT + '/menu-mobile').invoke('draw', node, baton);
                this.append(
                    $('<div data-extension-id="composetoolbar-menu">').append(node)
                );
            }
        }
    );

    ext.point(POINT + '/composetoolbar').extend(
        {
            id: 'toggle-toolbar',
            index: 50,
            draw: function (baton) {
                var node = $('<li role="presentation" data-extension-id="toggle-toolbar" class="toggle">');
                extensions.toggleToolbar.call(node, baton);
                this.append(node);
            }
        },
        {
            id: 'add_attachments',
            index: 100,
            draw: function (baton) {
                var node = $('<li role="presentation" data-extension-id="add_attachments">');
                // dont use col-xs and col-sm here, breaks style in landscape mode
                node.addClass(_.device('smartphone') ? 'col-xs-5' : '');

                extensions.attachment.call(node, baton);
                this.append(node);
            }
        },
        {
            id: 'add_attachments_drive',
            index: 300,
            draw: function (baton) {
                var node = $('<li role="presentation" data-extension-id="add_attachments_drive">');
                // dont use col-xs and col-sm here, breaks style in landscape mode
                node.addClass(_.device('smartphone') ? 'col-xs-5' : '');

                extensions.attachmentdrive.call(node, baton);
                this.append(node);
            }
        },
        {
            id: 'security',
            index: 100,
            draw: extensions.security
        },
        {
            id: 'menus',
            index: 1000,
            draw: extensions.optionsmenu
        }
    );

    ext.point(POINT + '/attachments').extend({
        id: 'attachmentPreview',
        index: 100,
        draw: function (baton) {
            var node = $('<div data-extension-id="attachmentPreview">');

            extensions.attachmentPreviewList.call(node, baton);
            extensions.attachmentSharing.call(node, baton);
            extensions.mailSize.call(node, baton);
            extensions.imageResizeOption.call(node, baton);

            node.appendTo(this);
        }
    });

    // disable attachmentList by default
    ext.point(POINT + '/attachments').disable('attachmentList');

    // via ext.cascade
    ext.point(POINT + '/editor/load').extend({
        id: 'options',
        index: 100,
        perform: function (baton) {
            // stop cascade flow on app quit
            this.on('quit', baton.stopPropagation.bind(baton));

            baton.options = {
                useFixedWithFont: settings.get('useFixedWithFont'),
                app: this,
                config: baton.config,
                view: baton.view,
                model:  baton.model,
                oxContext: { view: baton.view }
            };
        }
    }, {
        id: 'image-loader',
        index: 200,
        perform: function (baton) {
            var self = this;
            if (this.config.get('editorMode') !== 'html') return;
            baton.options.imageLoader = {
                upload: function (file) {
                    var attachment = new Attachments.Model({ filename: file.name, uploaded: 0, contentDisposition: 'INLINE' }),
                        def = new $.Deferred();
                    composeUtil.uploadAttachment({
                        model: self.model,
                        filename: file.name,
                        origin: { file: file },
                        attachment: attachment,
                        contentDisposition: 'inline'
                    });
                    attachment.once('upload:complete', def.resolve);
                    self.model.attachFiles([attachment]);
                    return def;
                },
                getUrl: function (response) {
                    return mailAPI.getUrl(_.extend({ space: self.model.get('id') }, response), 'view', { session: false });
                }
            };
        }
    }, {
        id: 'editor',
        index: 300,
        perform: function (baton) {
            var def = $.Deferred();
            ox.manifests.loadPluginsFor('io.ox/mail/compose/editor/' + baton.config.get('editorMode')).then(function (Editor) {
                new Editor(baton.view.editorContainer, baton.options).done(function (editor) {
                    baton.editor = editor;
                    def.resolve();
                });
            }, function () {
                // something went wrong
                def.reject({ error: gt("Couldn't load editor") });
            });
            return def;
        }
    }, {
        id: 'pick',
        index: 400,
        perform: function (baton) {
            return baton.editor;
        }
    });

    // via ext.cascade
    ext.point(POINT + '/editor/use').extend({
        id: 'register',
        index: 100,
        perform: function (baton) {
            var view = baton.view;
            if (view.editor) view.stopListening(view.editor);
            view.listenTo(baton.editor, 'change', view.syncMail);
            view.listenTo(baton.config, 'change:signature', view.syncMail);
            // stop cascade flow on app quit
            this.on('quit', baton.stopPropagation.bind(baton));
            // store tinymce's device detection
            baton.editor.once('device:non-desktop', function () {
                baton.config.set('desktop', false);
                baton.config.set('toolbar', false);
            });
        }
    }, {
        id: 'content',
        index: 200,
        perform: function (baton) {
            var model = baton.model,
                editor = baton.editor,
                htmlToText = model.get('contentType') === 'text/html' && editor.getMode() === 'text',
                textToHTML = model.get('contentType') === 'text/plain' && editor.getMode() === 'html',
                setMethod = htmlToText || textToHTML ? 'setPlainText' : 'setContent';
            return $.when(editor[setMethod](baton.content));
        }
    }, {
        id: 'model',
        index: 300,
        perform: function (baton) {
            var contentType = baton.editor.content_type;
            if (contentType.toLowerCase() === 'alternative') contentType = 'multipart/alternative';
            baton.model.set({
                content: baton.editor.getContent(),
                contentType: contentType
            });
        }
    }, {
        id: 'show',
        index: 400,
        perform: function (baton) {
            var editor = baton.editor;
            editor.show();
            baton.view.editor = editor;
        }
    }, {
        id: 'pick',
        index: 500,
        perform: function (baton) {
            return baton.editor;
        }
    });

    var MailComposeView = Backbone.View.extend({

        //className: 'io-ox-mail-compose container f6-target',
        className: 'io-ox-mail-compose f6-target',

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
            this.messageFormat = options.messageFormat || settings.get('messageFormat', 'html');

            this.editor = null;
            this.composeMode = 'compose';
            this.editorId = _.uniqueId('editor-');
            this.editorContainer = $('<div class="editor">').attr({
                'data-editor-id': this.editorId
            });
            this.toolbarContainer = $('<div class="tinymce-toolbar">').attr({
                'data-editor-id': this.editorId
            });

            this.baton = ext.Baton({
                model: this.model,
                config: this.config,
                view: this,
                app: this.app
            });

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));

            // see Bug 67872
            // fixes ios iframe focus bug
            if (_.device('tablet && ios < 13')) {
                $(document.body).on('touchstart', this.onTouchStart);
            }
            this.listenTo(this.model, 'keyup:subject change:subject', this.setTitle);
            this.listenTo(this.model, 'change', _.throttle(this.onChangeSaved.bind(this, 'dirty'), 100));
            this.listenTo(this.model, 'before:save', this.onChangeSaved.bind(this, 'saving'));
            this.listenTo(this.model, 'success:save', this.onChangeSaved.bind(this, 'saved'));
            this.listenTo(this.model, 'change:content', this.onChangeContent);
            this.listenTo(this.model, 'error', this.onError);

            this.listenTo(this.config, 'change:editorMode', this.toggleEditorMode);
            this.listenTo(this.config, 'change:vcard', this.onAttachVcard);

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
                    if (self.model.paused) return $.when();
                    return self.model.save();
                }
            });
        },

        onSendProgress: function (model, value) {
            var id = this.model.get('id');
            if (id !== model.get('id')) return;
            if (value >= 0) this.app.getWindow().busy(value);
        },

        onChangeContent: function (model, value) {
            // easy one: when content get's removed completely set signature to 'no signature'
            if (value && value !== '<div style="" class="default-style"><br></div>') return;
            this.config.set('signatureId', '');
        },

        onError: function (e) {
            this.app.onError(e);
        },

        ariaLiveUpdate: function (e, msg) {
            this.$('[data-extension-id="arialive"]').text(msg);
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
            // silent: true is needed only for safari - see bugs 35053 and 65438
            this.model.set('subject', value, { silent: _.device('safari') }).trigger('keyup:subject', value);
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
                    view: view,
                    catchErrors: true
                });

            var def = $.Deferred();
            ext.point('io.ox/mail/compose/actions/save').cascade(this, baton).then(function (res) {
                // reject if something went wrong
                if (baton.rejected) {
                    def.reject(baton.error);
                    return res;
                }
                def.resolve(res);
            }, def.reject).always(function () {
                if (win) win.idle();
            });
            return def;
        },

        // has three states, dirty, saving, saved
        onChangeSaved: function (state) {
            // just return when dirty and keep showing last saved date
            if (this.autoSaveState === state || state === 'dirty') return;
            else if (state === 'saving') this.inlineYell(gt('Saving...'));
            //#. %s is a relative date from now, examples: 5 seconds ago, 5 minutes ago etc
            else if (state === 'saved' && this.autoSaveState === 'saving') {
                var lastSave = moment();
                this.inlineYell(function () { return gt('Saved %s', lastSave.fromNow()); });
            }
            this.autoSaveState = state;
        },

        inlineYell: function (text) {
            // clear timer if it's there
            clearInterval(this.inlineYellTimer);
            if (!this.$el.is(':visible')) return;
            if (_.device('smartphone')) return;
            var node = this.$el.closest('.io-ox-mail-compose-window').find('.inline-yell');

            if (typeof text === 'function') {
                node.text(text());
                this.inlineYellTimer = setInterval(function () {
                    var txt = text();
                    if (node.text() !== txt) {
                        node.text(txt);
                    }
                }, 10000);
            } else {
                node.text(text);
            }
            // only fade in once, then leave it there
            if (node.is(':visible')) return;
            node.fadeIn();
        },

        dirty: function (state) {
            if (state === false) {
                // update content here as the update events from the editor might be throttled
                if (this.editor) this.model.set('content', this.editor.getContent());
                this.initialModel = this.model.toJSON();
            } else if (state === true) {
                this.initialModel = {};
            } else {
                return !_.isEmpty(this.model.deepDiff(this.initialModel));
            }
        },

        clean: function () {
            // mark as not dirty
            this.dirty(false);
            clearInterval(this.inlineYellTimer);
            // clean up editors
            for (var id in this.editorHash) {
                this.editorHash[id].then(function (editor) {
                    editor.setContent('');
                    editor.destroy();
                });
                delete this.editorHash[id];
            }
        },

        removeLogoutPoint: function () {
            ext.point('io.ox/core/logout').disable(this.logoutPointId);
        },

        dispose: function () {
            // remove from queue, to prevent zombies when mail is currently sent
            composeAPI.queue.remove(this.model.get('id'));
            // disable dynamic extensionpoint to trigger saveAsDraft on logout
            this.removeLogoutPoint();
            this.stopListening();
            this.model = null;
            $(document.body).off('touchstart', this.onTouchStart);
            delete this.editor;
        },

        discard: function () {
            if (this.model.paused) return $.when();

            var self = this,
                def = $.when(),
                isDraft = this.model.keepDraftOnClose(),
                mailPath = this.model.get('mailPath');

            // workaround
            (function () {
                //#. When closing compose the user decides to keep the related draft or delete it as well.
                gt('You are about to discard this message. Do you want to delete the related draft?');
            }());

            // TODO-859: smarter decisions for mailPath scenario needed
            // This dialog gets automatically dismissed
            if ((this.dirty() || isDraft || mailPath) && !this.config.get('autoDismiss')) {
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
                def = $.Deferred();

                var dialogOptions = { title: discardText, description: modalText };
                // up to 540px because of 3 buttons, french needs this for example
                if (!_.device('smartphone')) dialogOptions.width = '560px';

                new ModalDialog(dialogOptions)
                    .addCancelButton()
                    .addButton({ label: saveText, action: 'savedraft', placement: 'left', className: 'btn-default' })
                    .addButton({ label: discardText, action: 'delete' })
                    .on('savedraft', function () {
                        self.saveDraft().then(def.resolve, def.reject);
                    })
                    .on('delete', function () {
                        var isAutoDiscard = self.config.get('autoDiscard'),
                            editFor = self.model.get('meta').editFor;
                        def.resolve();
                        // TODO-859: check if this matches mailPath scenario
                        if (!isDraft || !isAutoDiscard || !editFor) return;
                        // only delete autosaved drafts that are not saved manually and have a msgref
                        mailAPI.remove([{ id: editFor.originalId, folder_id: editFor.originalFolderId }]);
                    })
                    .open();
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
                    view: view,
                    catchErrors: true
                }),
                win = this.app.getWindow(),
                point = ext.point('io.ox/mail/compose/actions/send');

            win.busy();
            this.model.saving = true;

            return point.cascade(this, baton).then(function () {
            }).always(function () {
                // a check/user intaction aborted the flow or app is re-opened after a request error; we want to be asked before any unsaved data is discarded again
                if (baton.rejected || baton.error) baton.config.set('autoDismiss', false);
                if (this.model) this.model.saving = false;
                win.idle();
            }.bind(this));
        },

        onTouchStart: function () {
            if ($(document.activeElement).is('iframe')) $(document.activeElement).blur();
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
            var mode = this.config.get('editorMode'),
                baton = new ext.Baton({ view: this, model: this.model, config: this.config, content: content }),
                def = this.editorHash[mode] = this.editorHash[mode] || ext.point(POINT + '/editor/load').cascade(this.app, baton);
            // load or reuse editor
            return def.then(function (editor) {
                baton.editor = editor;
                // returns editor
                return ext.point(POINT + '/editor/use').cascade(this.app, baton);
            }.bind(this));
        },

        // metrics
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

            var self = this, content,
                signature = this.config.get('signature');

            if (signature) {
                this.config.set('signatureId', '');
            }
            if (this.editor) {
                // this.removeSignature();
                content = this.editor.getPlainText();
                this.editor.hide();
            } else if (this.model.get('contentType') === 'text/html' && this.config.get('editorMode') === 'text') {
                // intial set, transfrom html to text
                content = require(['io.ox/core/tk/textproc']).then(function (textproc) {
                    return textproc.htmltotext(self.model.get('content'));
                });
            } else {
                content = this.model.get('content');
            }

            this.editorContainer.busy();
            return $.when(content).then(function (content) {
                return self.loadEditor(content);
            }).then(function () {
                // TOOO-784: streamline
                if (this.app.get('window') && this.app.get('window').floating) {
                    this.app.get('window').floating.$el.toggleClass('text-editor', this.config.get('editorMode') === 'text');
                    this.app.get('window').floating.$el.toggleClass('html-editor', this.config.get('editorMode') !== 'text');
                    this.app.getWindowNode().trigger('scroll');
                }
                if (signature) this.config.set('signatureId', signature.id);
                this.editorContainer.idle();
                // reset tinyMCE's undo stack
                if (!_.isFunction(this.editor.tinymce)) return;
                this.editor.tinymce().undoManager.clear();
            }.bind(this));
        },

        onAttachVcard: function () {
            if (this.config.get('vcard') === 1) this.model.attachVCard();
            this.config.set('vcard', 0);
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
            if (this.config.get('type') === 'edit') return;
            var content = this.editor.getContent().replace(/^\n+/, '').replace(/^(<div[^>]*class="default-style"[^>]*><br><\/div>)+/, '');
            var nl = this.config.get('editorMode') === 'html' ? mailUtil.getDefaultStyle().node.get(0).outerHTML : '\n';
            this.editor.setContent(nl + content);
        },

        setMail: function () {
            var self = this,
                model = this.model,
                config = this.config;

            return this.toggleEditorMode().then(function () {
                return self.signaturesLoading;
            })
            .done(function () {
                var target;
                // set focus in compose and forward mode to recipient tokenfield
                if (_.device('!ios')) target = config.is('new|forward') ? self.$('.tokenfield:first .token-input') : self.editor;

                if (config.is('replyall|edit')) {
                    if (!_.isEmpty(model.get('cc'))) self.toggleTokenfield('cc');
                }
                if (!_.isEmpty(model.get('bcc'))) self.toggleTokenfield('bcc');

                self.setBody(model.get('content'));

                if (_.device('!ios') && self.editor.tinymce) {
                    var defaultFontStyle = settings.get('defaultFontStyle', {}),
                        family = (defaultFontStyle.family || '').split(',')[0];
                    if (!_.isEmpty(defaultFontStyle)) {
                        if (family && family !== 'browser-default') self.editor.tinymce().execCommand('fontName', false, family);
                        if (defaultFontStyle.size && defaultFontStyle.size !== 'browser-default') self.editor.tinymce().execCommand('fontSize', false, defaultFontStyle.size);
                    }
                }

                if (target) target.focus();
            });
        },

        setSimpleMail: function (content) {
            if (this.config.get('editorMode') === 'text') return;
            if (!/<table/.test(content)) this.editorContainer.find('.editable.mce-content-body').addClass('simple-mail');
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

        onChangeSignatures: function () {
            // redraw composetoolbar
            ext.point(POINT + '/buttons').invoke('redraw', undefined, this.baton);
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
