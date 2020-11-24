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

define('io.ox/mail/compose/main', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/mail/actions',
    'io.ox/mail/compose/actions'
], function (ext, mailAPI, accountAPI, mailUtil, settings, gt) {

    'use strict';

    // via point.cascade

    var POINT = ext.point('io.ox/mail/compose/boot'),
        INDEX = 0;

    POINT.extend({
        id: 'bundle',
        index: INDEX += 100,
        perform: function (baton) {
            // stop cascade flow on app quit
            this.on('quit', baton.stopPropagation.bind(baton));

            return require(['io.ox/mail/compose/bundle']);
        }
    }, {
        id: 'compose-model',
        index: INDEX += 100,
        perform: function (baton) {
            var self = this;
            return require(['io.ox/mail/compose/model']).then(function (MailComposeModel) {
                self.model = baton.model = new MailComposeModel(baton.data);
                if (baton.data && baton.data.id) baton.model.restored = true;
                return self.model.initialized;
            });
        }
    }, {
        id: 'compose-view',
        index: INDEX += 100,
        perform: function (baton) {
            var self = this;
            return require(['io.ox/mail/compose/config', 'io.ox/mail/compose/view']).then(function (MailComposeConfig, MailComposeView) {
                self.config = new MailComposeConfig(_.extend({}, baton.config, { type: self.model.type }));
                self.view = baton.view = new MailComposeView({ app: self, model: self.model, config: self.config });
                if (_.device('smartphone')) return;
                baton.win.nodes.body.append(self.view.toolbarContainer);
            });
        }
    }, {
        id: 'fix-custom-displayname',
        index: INDEX += 100,
        perform: function () {
            if (settings.get('customDisplayNames')) return;
            return accountAPI.getPrimaryAddressFromFolder(this.config.get('folderId')).catch(function () {
                return accountAPI.getPrimaryAddressFromFolder(mailAPI.getDefaultFolder());
            }).then(function (address) {
                // ensure defaultName is set (bug 56342 and 63891)
                settings.set(['customDisplayNames', address[1], 'defaultName'], address[0]);
            });
        }
    }, {
        id: 'fix-from',
        index: INDEX += 100,
        perform: function () {
            var model = this.model;
            if (model.get('from')) return;
            return accountAPI.getPrimaryAddressFromFolder(this.config.get('folderId')).catch(function () {
                return accountAPI.getPrimaryAddressFromFolder(mailAPI.getDefaultFolder());
            }).then(function (address) {
                // custom display names
                if (settings.get(['customDisplayNames', address[1], 'overwrite'])) {
                    address[0] = settings.get(['customDisplayNames', address[1], 'name'], '');
                }
                if (!settings.get('sendDisplayName', true)) {
                    address[0] = null;
                }
                model.set('from', address);
            });
        }
    }, {
        id: 'fix-displayname',
        index: INDEX += 100,
        perform: function () {
            var model = this.model,
                config = this.config;

            updateDisplayName();
            this.view.listenTo(config, 'change:sendDisplayName', updateDisplayName);
            this.view.listenTo(ox, 'change:customDisplayNames', updateDisplayName);

            // fix current value
            function updateDisplayName() {
                var from = model.get('from');
                if (!from) return;
                model.set('from', mailUtil.getSender(from, config.get('sendDisplayName')));
            }
        }
    }, {
        id: 'load-signature',
        index: INDEX += 100,
        perform: function () {
            var self = this,
                def = this.view.signaturesLoading = $.Deferred();

            if (_.device('smartphone')) {
                //#. %s is the product name
                var value = settings.get('mobileSignature', gt('Sent from %s via mobile', ox.serverConfig.productName)),
                    collection = new Backbone.Collection([{ id: '0', content: value, misc: { insertion: 'below' } }]);
                this.config.set('signatures', collection);
                def.resolve(collection);
            } else {
                require(['io.ox/core/api/snippets'], function (snippetAPI) {
                    var collection = snippetAPI.getCollection();
                    self.config.set('signatures', collection);
                    snippetAPI.getAll().always(function () {
                        def.resolve(collection);
                    });
                });
            }
            return def.then(function (collection) {
                var refresh = _.debounce(this.view.onChangeSignatures.bind(this.view));
                this.view.listenTo(collection, 'add remove reset', refresh, 200);
                return collection;
            }.bind(this));
        }
    }, {
        id: 'render-view',
        index: INDEX += 100,
        perform: function (baton) {
            var win = baton.win;
            win.nodes.main.removeClass('abs').addClass('scrollable').append(this.view.render().$el);
        }
    }, {
        id: 'editor-mode',
        index: INDEX += 100,
        perform: function () {
            // if draft, force editor in the same mode as the draft
            if (this.model.get('meta').editFor) {
                this.config.set('editorMode', this.model.get('contentType') === 'text/plain' ? 'text' : 'html');
            }

            // map 'alternative'
            var isAlternative = this.config.get('preferredEditorMode') === 'alternative' || this.config.get('editorMode') === 'alternative';
            if (!isAlternative) return;
            this.config.set('editorMode', this.model.get('contentType') === 'text/plain' ? 'text' : 'html');
        }
    }, {
        id: 'auto-bcc',
        index: INDEX += 100,
        perform: function () {
            if (!settings.get('autobcc') || this.config.is('edit')) return;
            this.model.set('bcc', mailUtil.parseRecipients(settings.get('autobcc'), { localpart: false }));
        }
    }, {
        id: 'auto-discard',
        index: INDEX += 100,
        perform: function () {
            // disable auto remove on discard for draft mails
            this.config.set('autoDiscard', !this.config.is('edit'));
        }
    }, {
        id: 'set-mail',
        index: INDEX += 100,
        perform: function () {
            return this.view.setMail();
        }
    }, {
        id: 'initial-signature',
        index: INDEX += 100,
        perform: function () {
            return this.view.signaturesLoading.then(function () {
                this.config.setInitialSignature(this.model);
            }.bind(this));
        }
    }, {
        id: 'initial-patch',
        index: INDEX += 100,
        perform: function () {
            this.view.dirty(!!this.model.restored);
            this.model.initialPatch();
        }
    }, {
        id: 'update-cid',
        index: INDEX += 100,
        perform: function () {
            // fallback case: clone of actually deleted space
            this.listenTo(this.model, 'change:id', function () {
                this.cid = getAppCID(this.model.toJSON()) || this.cid;
            }.bind(this));
        }
    }, {
        id: 'finally',
        index: INDEX += 100,
        perform: function (baton) {
            var win = baton.win;
            // calculate right margin for to field (some languages like chinese need extra space for cc bcc fields)
            win.nodes.main.find('.tokenfield').css('padding-right', 14 + win.nodes.main.find('.recipient-actions').width() + win.nodes.main.find('[data-extension-id="to"] .has-picker').length * 20);

            // clear max width for tokenfields to accomodate new max width
            this.view.$el.find('.mail-input>.tokenfield>input.tokenfield').each(function () {
                var tokenfield = $(this).data('bs.tokenfield'),
                    attr = $(this).closest('[data-extension-id]').data('extension-id');
                delete tokenfield.maxTokenWidth;
                // trigger redraw
                baton.model.trigger('change:' + attr, baton.model, baton.model.get(attr));
            });
            // Set window and toolbars visible again
            win.nodes.header.removeClass('sr-only');
            win.nodes.body.removeClass('sr-only').find('.scrollable').scrollTop(0).trigger('scroll');
            win.idle();
            $(window).trigger('resize');  // Needed for proper initial resizing in editors
            win.setTitle(this.model.get('subject') || gt('Compose'));
            // update app cid for proper matching of draft/space
            this.cid = this.model.get('cid');
            this.trigger('ready');
        }
    });

    function getAppCID(data) {
        data = data || {};
        // use space id (restore case)
        var id = data.id, mailref;
        // edit case: prefer "space" instead of "id/folder"
        if (data.type === 'edit' && data.original) {
            mailref = _.cid({ id: data.original.id, folder: data.original.folderId });
            id = ox.ui.spaces[mailref] || mailref;
        }
        // fallback: backbone default
        if (!id) return;
        return 'io.ox/mail/compose:' + id + ':edit';
    }

    // multi instance pattern
    function createInstance() {
        // application object
        var app = ox.ui.createApp({
                name: 'io.ox/mail/compose',
                title: gt('Compose'),
                userContent: true,
                closable: true,
                floating: !_.device('smartphone'),
                size: 'width-xs height-md'
            }),
            win;

        app.setLauncher(function () {
            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/mail/compose',
                chromeless: true,
                // attributes for the floating window
                floating: !_.device('smartphone'),
                closable: true,
                title: gt('Compose')
            }));
        });

        app.failRestore = function (point) {
            var data;
            if (!_.isObject(point)) {
                return app.open(data);
            }

            // duck check: real draft
            if (point.meta) {
                return app.open(_(point).pick('id', 'meta', 'security'));
            }
            // common case: mail is already a draft. So we can just edit it
            if (point.restoreById) {
                return app.open({ type: 'edit', original: { folderId: point.folder_id, id: point.id, security: point.security } });
            }
            // backward compatibility: create composition space from old restore point
            data = _(point).pick('to', 'cc', 'bcc', 'subject');
            if (point.from && point.from[0]) data.from = point.from[0];
            if (point.attachments && point.attachments[0]) {
                data.content = point.attachments[0].content;
                data.contentType = point.attachments[0].content_type;
            }
            data.meta = {};
            data.meta.security = point.security;
            data.requestRqe = point.disp_notification_to;
            data.priority = ['high', 'medium', 'low'][(data.priority || 1) - 1];
            return app.open(data);
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.email.gui.create.html';
        };

        app.pause = function (e) {
            var error = _.extend({ code: 'unknown', error: gt('An error occurred. Please try again.') }, e);
            // custom mappings
            switch (error.code) {
                case 'UI-SPACEMISSING':
                case 'MSGCS-0007':
                    error.message = gt('The mail draft could not be found on the server. It was sent or deleted in the meantime.');
                    break;
                default:
                    break;
            }
            // app is in error state now
            app.error = error;
            if (this.model) this.model.paused = true;
            // reset potential 'Saving...' message
            if (this.view) this.view.inlineYell('');
            // disable floating window and show error message
            var win = this.get('window');
            if (!win) return;
            win.busy(undefined, undefined, function () {
                // prevents busy spinner
                this.idle();
                this.find('.footer')
                    .append($('<div class="message">').text(error.message || error.error));

                // add extra close button for mobile
                if (!_.device('smartphone')) return;
                this.find('.footer').append(
                    $('<button type="button" class="btn btn-default btn-primary">')
                        .text(gt('Close'))
                        .on('click', function () { app.quit(); })
                );
            });
        };

        app.resume = function (data) {
            if (!app.error) return;
            // reset error state
            var failRestore = app.error.failRestore;
            delete app.error;
            if (this.model) delete this.model.paused;
            // window handling
            var win = this.get('window');
            if (!win) return;
            win.idle();
            // failed on app start
            if (!failRestore || !data) return;
            app.failRestore(data.point);
        };

        app.open = function (obj, config) {
            var def = $.Deferred();
            obj = _.extend({}, obj);

            // update app cid
            var customCID = getAppCID(obj);
            app.cid = customCID ? customCID : app.cid;

            // Set window and toolbars invisible initially
            win.nodes.header.addClass('sr-only');
            win.nodes.body.addClass('sr-only');

            // improve title in compose context
            if (win.floating) {
                win.floating.$('.floating-header [data-action="close"]')
                    .attr('aria-label', gt('Save and close'))
                    .find('.fa').attr('title', gt('Save and close'));
            }

            win.busy().show(function () {
                POINT.cascade(app, { data: obj || {}, config: config, win: win }).then(function success() {
                    def.resolve({ app: app });
                    ox.trigger('mail:' + app.model.get('meta').type + ':ready', obj, app);
                }, function fail(e) {
                    console.error('Startup of mail compose failed', e);

                    // to many open spaces
                    if (e.code === 'MSGCS-0011') {
                        var num = e.error_params[0] || 20;
                        e.message = gt('You cannot open more than %1$s drafts at the same time.', num);
                        return this.quit().then(function () {
                            require(['io.ox/core/yell'], function (yell) {
                                yell(e);
                            });
                        });
                    }

                    // custom handlers
                    app.pause(_.extend({ failRestore: true }, e));

                    def.reject(e);
                });
            });
            return def;
        };

        // destroy
        app.setQuit(function () {
            if (app.view && !app.error) return app.view.discard();
        });

        // after view is detroyed
        app.on('quit', function () {
            if (app.model) app.model.destroy();
        });

        // for debugging purposes
        window.compose = app;

        return app;
    }

    ox.on('http:error:MSGCS-0007 http:error:MSGCS-0011', function (e) {
        var error = _.extend({}, e);
        switch (e.code) {
            // Found no such composition space for identifier: %s
            case 'MSGCS-0007':
                error.message = gt('The mail draft could not be found on the server. It was sent or deleted in the meantime.');
                break;
            // Maximum number of composition spaces is reached. Please terminate existing open spaces in order to open new ones.
            case 'MSGCS-0011':
                var num = error.error_params[0] || 20;
                error.message = gt('You cannot open more than %1$s drafts at the same time.', num);
                break;
            default:
                break;
        }
        require(['io.ox/core/yell'], function (yell) {
            yell(error);
        });
    });

    return {

        getApp: createInstance,

        reuse: function (method, data) {
            var customCID = getAppCID(data);
            return customCID ? ox.ui.App.reuse(customCID) : false;
        }
    };
});
