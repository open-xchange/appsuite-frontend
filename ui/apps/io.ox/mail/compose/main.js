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
    'io.ox/mail/compose/api',
    'io.ox/mail/api',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (composeAPI, mailAPI, settings, gt) {

    'use strict';

    var blocked = {};

    function keepData(obj) {
        return /(compose|edit)/.test(obj.mode) ||
               // forwarding muliple messages
               /(forward)/.test(obj.mode) && !obj.id ||
               obj.restored;
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
                        return require(['io.ox/mail/compose/view', 'io.ox/mail/compose/model']);
                    })
                    .then(function (MailComposeView, MailComposeModel) {
                        var data = keepData(obj) ? obj : _.pick(obj, 'id', 'folder_id', 'mode', 'csid', 'content_type', 'security');
                        app.model = new MailComposeModel(data);
                        app.view = new MailComposeView({ app: app, model: app.model });
                        return app.view.fetchMail(data);
                    })
                    .then(function () {
                        win.nodes.main.addClass('scrollable').append(app.view.render().$el);
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

        app.compose = compose('compose');
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
