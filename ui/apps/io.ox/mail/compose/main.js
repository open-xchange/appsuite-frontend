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
 *
 * To try new mail compose:
 *
 * Temporary:
 * ox.registry.set('mail-compose', 'io.ox/mail/compose/main');
 *
 * Permanently:
 * require('settings!io.ox/core').set('registry/mail-compose', 'io.ox/mail/compose/main').save();
 * To use old mail compose:
 * require('settings!io.ox/core').set('registry/mail-compose', undefined).save();
 */

define('io.ox/mail/compose/main', ['io.ox/mail/api', 'gettext!io.ox/mail', 'io.ox/mail/compose/bundle'], function (mailAPI, gt) {

    'use strict';

    var blocked = {};

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
                name: 'io.ox/mail/compose',
                title: gt('Compose'),
                userContent: true,
                closable: true
            }),
            win;

        app.setLauncher(function () {
            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/mail/compose',
                chromeless: true
            }));

            // use main role on 'outer' to include actions in header
            win.nodes.body.removeAttr('role');
            win.nodes.outer.attr('role', 'main');
        });

        app.failSave = function () {
            if (!app.view) return;
            return _.extend({ module: 'io.ox/mail/compose' }, app.view.model.getFailSave());
        };

        app.failRestore = function (point) {
            return compose(point.mode)(point);
        };

        function compose(type) {

            return function (obj) {
                var def = $.Deferred();
                _.url.hash('app', 'io.ox/mail/compose:' + type);

                obj = _.extend({ mode: type }, obj);

                app.cid = 'io.ox/mail:' + type + '.' + _.cid(obj);

                // Set window and toolbars invisible initially
                win.nodes.header.addClass('sr-only');
                win.nodes.body.addClass('sr-only');

                win.busy().show(function () {
                    require(['io.ox/mail/compose/view'], function (MailComposeView) {
                        app.view = new MailComposeView({ data: obj, app: app });
                        win.nodes.main.addClass('scrollable').append(app.view.render().$el);
                        app.view.fetchMail(obj).done(function () {
                            app.view.setMail()
                            .done(function () {
                                // Set window and toolbars visible again
                                win.nodes.header.removeClass('sr-only');
                                win.nodes.body.removeClass('sr-only').find('.scrollable').scrollTop(0);
                                win.idle();
                                win.setTitle(gt('Compose'));
                                def.resolve({ app: app });
                                ox.trigger('mail:' + type + ':ready', obj, app);
                            });
                        })
                        .fail(function (e) {
                            require(['io.ox/core/notifications'], function (notifications) {
                                notifications.yell(e);
                                app.quit();
                                def.reject();
                            });
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

        app.compose  = compose('compose');
        app.forward  = compose('forward');
        app.reply    = compose('reply');
        app.replyall = compose('replyall');
        app.edit     = compose('edit');

        // for debugging purposes
        window.compose = app;

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            //disable reuse if at least one app is sending (depends on type)
            var unblocked = function (sendtype) {
                return blocked[sendtype] === undefined || blocked[sendtype] <= 0;
            };
            if (type === 'reply' && unblocked(mailAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('io.ox/mail:reply.' + _.cid(data));
            }
            if (type === 'replyall' && unblocked(mailAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('io.ox/mail:replyall.' + _.cid(data));
            }
            if (type === 'forward' && unblocked(mailAPI.SENDTYPE.FORWARD)) {
                return ox.ui.App.reuse('io.ox/mail:forward.' + _.cid(data));
            }
            if (type === 'edit' && unblocked(mailAPI.SENDTYPE.DRAFT)) {
                return ox.ui.App.reuse('io.ox/mail:edit.' + _.cid(data));
            }
        }
    };
});
