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
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, composeAPI, mailAPI, accountAPI, mailUtil, settings, gt) {

    'use strict';

    var blocked = {};

    function keepData(obj) {
        return /(compose|edit)/.test(obj.mode) ||
               // forwarding muliple messages
               /(forward)/.test(obj.mode) && !obj.id ||
               obj.restored;
    }

    // formerly part of 'compose'
    ext.point('io.ox/mail/compose/init').extend({
        id: 'from',
        index: 100,
        init: function () {
            var model = this.model;

            if (model.get('from') && model.get('from').length) return;
            accountAPI.getPrimaryAddressFromFolder(model.get('folder_id')).then(function (address) {
                // ensure defaultName is set (bug 56342)
                settings.set(['customDisplayNames', address[1], 'defaultName'], address[0]);
                // custom display names
                if (settings.get(['customDisplayNames', address[1], 'overwrite'])) {
                    address[0] = settings.get(['customDisplayNames', address[1], 'name'], '');
                }
                if (!settings.get('sendDisplayName', true)) {
                    address[0] = null;
                }
                model.set('from', [address]);
            });
        }
    }, {
        id: 'displayname',
        index: 200,
        init: function () {
            var model = this.model,
                config = this.config;

            // TODO: check senderView scenarios
            updateDisplayName();
            config.on('change:sendDisplayName', updateDisplayName);
            ox.on('change:customDisplayNames', updateDisplayName);

            // fix current value
            function updateDisplayName() {
                var from = model.get('from');
                if (!from) return;
                model.set('from', [mailUtil.getSender(from[0], config.get('sendDisplayName'))]);
            }
        }
    });

    // formerly part of setMail
    ext.point('io.ox/mail/compose/set').extend({
        id: 'editor-mode',
        index: 100,
        init: function () {
            if (this.config.get('editorMode') !== 'alternative') return;
            var mode = this.model.get('contentType') === 'text/plain' ? 'text' : 'html';
            this.config.set('editorMode', mode, { silent: true });
        }
    }, {
        id: 'auto-bcc',
        index: 200,
        init: function () {
            if (!settings.get('autobcc') || this.get('mode') === 'edit') return;
            this.model.set('bcc', mailUtil.parseRecipients(settings.get('autobcc'), { localpart: false }));
        }
    }, {
        id: 'auto-discard',
        index: 200,
        init: function () {
            // disable auto remove on discard for draft mails
            this.config.set('autoDiscard', this.config.get('mode') !== 'edit');
        }
    }, {
        id: 'initial-signature',
        index: 300,
        init: function () {
            this.view.signaturesLoading.done(function () {
                this.config.setInitialSignature();
            }.bind(this));
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

        app.failSave = function () {
            if (!app.view) return;
            var failSaveData = app.model.getFailSave();
            return failSaveData ? _.extend({ module: 'io.ox/mail/compose' }, failSaveData) : false;
        };

        app.failRestore = function (point) {
            if (point.restoreById || !point.mode) {
                delete point.restoreById;
                return compose('edit')(point);
            }
            point.initial = false;
            // special flag/handling for 'replace' cause we want
            // to keep the attachments that will be removed otherwise
            if (/(reply|replyall|forward)/.test(point.mode)) point.restored = true;
            return compose(point.mode)(point);
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.email.gui.create.html';
        };

        function compose(type) {

            return function (obj) {

                var def = $.Deferred();
                obj = obj || {};

                app.cid = 'io.ox/mail:' + type + '.' + _.cid(obj);

                // Set window and toolbars invisible initially
                win.nodes.header.addClass('sr-only');
                win.nodes.body.addClass('sr-only');

                win.busy().show(function () {
                    require(['io.ox/mail/compose/bundle']).then(function () {
                        if (settings.get('features/fixContentType', false) && type !== 'compose' && !_.isArray(obj)) {
                            // mitigate Bug#56496, force a get request to make sure content_type is correctly set
                            // in most cases, this should return the mail from pool ('detail')
                            // need circumvent caching, here, because all requests always break data again and we can
                            // never be sure about data being correct
                            return mailAPI.get(_.extend(_.pick(obj, 'id', 'folder_id'), { view: 'raw' }), { cache: false });
                        }
                        return obj;
                    }).then(function (latestMail) {
                        if (!_.isArray(latestMail)) latestMail.security = obj.security;  // Fix for Bug 56496 above breaking Guard.  Security lost with reload
                        else latestMail.forEach(function (m, i) { m.security = obj[i].security; });

                        obj = _.extend({ mode: type }, latestMail);
                        return require(['io.ox/mail/compose/view', 'io.ox/mail/compose/model', 'io.ox/mail/compose/config']);
                    })
                    .then(function (MailComposeView, MailComposeModel, MailComposeConfig) {
                        var data = keepData(obj) ? obj : _.pick(obj, 'id', 'folder_id', 'mode', 'csid', 'content_type', 'security');
                        app.config = new MailComposeConfig(data);
                        app.model = new MailComposeModel({ meta: { type: obj.mode, originalFolderId: data.folder_id, originalId: data.id } });
                        app.view = new MailComposeView({ app: app, model: app.model, config: app.config });

                        ext.point('io.ox/mail/compose/init').invoke('init', app);

                        // TODO can we simplify that?
                        return $.when(/*app.view.fetchMail(data), */app.model.initialized);
                    })
                    .then(function () {
                        win.nodes.main.addClass('scrollable').append(app.view.render().$el);
                        ext.point('io.ox/mail/compose/set').invoke('init', app);

                        return app.view.setMail();
                    })
                    .done(function () {
                        // calculate right margin for to field (some languages like chinese need extra space for cc bcc fields)
                        win.nodes.main.find('.tokenfield').css('padding-right', 14 + win.nodes.main.find('.recipient-actions').width() + win.nodes.main.find('[data-extension-id="to"] .has-picker').length * 20);
                        // Set window and toolbars visible again
                        win.nodes.header.removeClass('sr-only');
                        win.nodes.body.removeClass('sr-only').find('.scrollable').scrollTop(0);
                        win.idle();
                        $(window).trigger('resize');  // Needed for proper initial resizing in editors
                        win.setTitle(obj.subject || gt('Compose'));
                        def.resolve({ app: app });
                        ox.trigger('mail:' + type + ':ready', obj, app);
                    })
                    .fail(function (e) {
                        require(['io.ox/core/notifications'], function (notifications) {
                            notifications.yell(e);
                            // makes no sense to show discard changes popup here
                            app.model.dirty(false);
                            app.view.removeLogoutPoint();
                            app.quit();
                            def.reject(e);
                        });
                    });
                });

                return def;
            };
        }

        // destroy
        app.setQuit(function () {
            if (app.view) return app.view.discard();
        });

        // TODO what is the benefit of this?
        app.compose = compose('new');
        app.forward = compose('forward');
        app.reply = compose('reply');
        app.replyall = compose('replyall');
        app.edit = compose('edit');

        // for debugging purposes
        window.compose = app;

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            // disable reuse if at least one app is sending (depends on type)
            var unblocked = function (sendtype) {
                return blocked[sendtype] === undefined || blocked[sendtype] <= 0;
            };
            if (type === 'reply' && unblocked(composeAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('io.ox/mail:reply.' + _.cid(data));
            }
            if (type === 'replyall' && unblocked(composeAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('io.ox/mail:replyall.' + _.cid(data));
            }
            if (type === 'forward' && unblocked(composeAPI.SENDTYPE.FORWARD)) {
                var cid;
                if (_.isArray(data)) {
                    cid = _(data).map(function (o) { return _.cid(o); }).join();
                } else {
                    cid = _.cid(data);
                }
                return ox.ui.App.reuse('io.ox/mail:forward.' + cid);
            }
            if (type === 'edit' && unblocked(composeAPI.SENDTYPE.DRAFT)) {
                return ox.ui.App.reuse('io.ox/mail:edit.' + _.cid(data));
            }
        }
    };
});
