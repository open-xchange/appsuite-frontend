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
    'gettext!io.ox/mail'
], function (ext, mailAPI, accountAPI, mailUtil, settings, gt) {

    'use strict';

    // via point.cascade

    var POINT = ext.point('io.ox/mail/compose/boot'),
        INDEX = 0;

    POINT.extend({
        id: 'bundle',
        index: INDEX += 100,
        perform: function () {
            return require(['io.ox/mail/compose/bundle']);
        }
    }, {
        id: 'compose-model',
        index: INDEX += 100,
        perform: function (baton) {
            var self = this;

            // already has a model. e.g. when opened via restorepoint
            if (baton.model) {
                this.model = baton.model;
                return this.model.initialized;
            }

            return require(['io.ox/mail/compose/model']).then(function (MailComposeModel) {
                self.model = baton.model = new MailComposeModel(baton.data);
                return self.model.initialized;
            });
        }
    }, {
        id: 'compose-view',
        index: INDEX += 100,
        perform: function (baton) {
            var self = this;
            return require(['io.ox/mail/compose/config', 'io.ox/mail/compose/view']).then(function (MailComposeConfig, MailComposeView) {
                self.config = new MailComposeConfig({ type: self.model.type });
                self.view = baton.view = new MailComposeView({ app: self, model: self.model, config: self.config });
            });
        }
    }, {
        id: 'fix-from',
        index: INDEX += 100,
        perform: function () {
            var model = this.model;
            if (model.get('from')) return;
            return accountAPI.getPrimaryAddressFromFolder(model.get('meta').originalFolderId).then(function (address) {
                // ensure defaultName is set (bug 56342)
                settings.set(['customDisplayNames', address[1], 'defaultName'], address[0]);
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
                var value = settings.get('mobileSignature', gt('Sent from %s via mobile', ox.serverConfig.productName));
                def.resolve([{ id: '0', content: value, misc: { insertion: 'below' } }]);
            } else {
                require(['io.ox/core/api/snippets'], function (snippetAPI) {
                    snippetAPI.getAll('signature').always(function (signatures) {
                        var oldSignatures = self.config.get('signatures') || [],
                            allSignatures = _.uniq(signatures.concat(oldSignatures), false, function (o) { return o.id; });
                        // update model
                        self.config.set('signatures', allSignatures);
                        // add options to dropdown (empty signature already set)
                        // TODO: mobile signatures
                        def.resolve(allSignatures);
                    });
                });
            }
            return def.then(function (list) {
                this.config.set('signatures', list);
                return list;
            }.bind(this));
        }
    }, {
        id: 'render-view',
        index: INDEX += 100,
        perform: function (baton) {
            var win = baton.win;
            win.nodes.main.addClass('scrollable').append(this.view.render().$el);
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
                this.config.setInitialSignature();
            }.bind(this));
        }
    }, {
        id: 'finally',
        index: INDEX += 100,
        perform: function (baton) {
            var win = baton.win;
            // calculate right margin for to field (some languages like chinese need extra space for cc bcc fields)
            win.nodes.main.find('.tokenfield').css('padding-right', 14 + win.nodes.main.find('.recipient-actions').width() + win.nodes.main.find('[data-extension-id="to"] .has-picker').length * 20);
            // Set window and toolbars visible again
            win.nodes.header.removeClass('sr-only');
            win.nodes.body.removeClass('sr-only').find('.scrollable').scrollTop(0);
            win.idle();
            $(window).trigger('resize');  // Needed for proper initial resizing in editors
            win.setTitle(this.model.get('subject') || gt('Compose'));
            this.view.dirty(false);
        }
    });

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
            return require(['io.ox/mail/compose/bundle']).then(function () {
                return require(['io.ox/mail/compose/model']);
            }).then(function (MailComposeModel) {
                var data = { id: point };
                if (_.isObject(point)) {
                    // create composition space from old restore point
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
                }
                var model = new MailComposeModel(data);
                return app.open({}, model);
            });
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.email.gui.create.html';
        };

        app.open = function (obj, model) {
            var def = $.Deferred();
            obj = _.extend({}, obj);

            // Set window and toolbars invisible initially
            win.nodes.header.addClass('sr-only');
            win.nodes.body.addClass('sr-only');

            win.busy().show(function () {

                POINT.cascade(app, { data: obj || {}, model: model, win: win }).then(function success() {
                    def.resolve({ app: app });
                    ox.trigger('mail:' + app.model.get('meta').type + ':ready', obj, app);
                }, function fail(e) {
                    require(['io.ox/core/notifications'], function (notifications) {
                        notifications.yell(e);
                        if (app.view) {
                            app.view.dirty(false);
                            app.view.removeLogoutPoint();
                        }
                        app.quit();

                        def.reject(e);
                    });
                });
            });

            return def;
        };

        // destroy
        app.setQuit(function () {
            if (app.view) return app.view.discard();
        });

        // after view is detroyed
        app.on('quit', function () {
            if (app.model) app.model.destroy();
        });

        // for debugging purposes
        window.compose = app;

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function () {
            // disable reuse since a floating window is never reused
            return false;
        }
    };
});
