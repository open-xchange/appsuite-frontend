/* jshint unused: false */
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

define('io.ox/mail/compose/main',
    ['io.ox/mail/api',
     'io.ox/core/extensions',
     'io.ox/core/tk/upload',
     'io.ox/emoji/main',
     'io.ox/core/notifications',
     'gettext!io.ox/mail',
     'io.ox/mail/compose/view',
     'io.ox/mail/compose/model',
     'less!io.ox/mail/style',
     'less!io.ox/mail/compose/style'
    ], function (mailAPI, ext, upload, emoji, notifications, gt, MailComposeView, MailModel) {

    'use strict';

    var blocked = {};

    // multi instance pattern
    function createInstance() {

        function blockReuse(sendtype) {
            blocked[sendtype] = (blocked[sendtype] || 0) + 1;
        }

        function unblockReuse(sendtype) {
            blocked[sendtype] = (blocked[sendtype] || 0) - 1;
            if (blocked[sendtype] <= 0)
                delete blocked[sendtype];
        }

        // application object
        var app = ox.ui.createApp({
                name: 'io.ox/mail/compose',
                title: gt('Compose'),
                userContent: true,
                closable: true
            }),
            editor,
            editorHash = {},
            win;

        app.setLauncher(function () {
            // get window
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/mail/compose',
                search: false,
                chromeless: true
            }));
        });

        app.failSave = function () {
            var mail = app.view.getMail();
            delete mail.files;
            return {
                module: 'io.ox/mail/compose',
                description: gt('Mail') + ': ' + (mail.data.subject || gt('No subject')),
                point: mail
            };
        };

        app.failRestore = function (point) {
            var def = $.Deferred();

            var model = new MailModel(point.data);
            app.view = new MailComposeView({ model: model, app: app });

            _.url.hash('app', 'io.ox/mail/compose:' + point.mode);

            win.busy().show(function () {
                win.nodes.main.addClass('scrollable').append(app.view.render().$el);
                app.view.setMail(point.data).done(function () {
                    //app.dirty(true);
                    win.idle();
                    //app.getEditor().focus();
                    def.resolve({app: app});
                });
            });
            return def;
        };

        function compose(data) {

            var def = $.Deferred();
            data.mode = 'compose';
            var model = new MailModel(data);
            app.view = new MailComposeView({ model: model, app: app });

            _.url.hash('app', 'io.ox/mail/compose:compose');

            win.busy().show(function () {
                win.nodes.main.addClass('scrollable').append(app.view.render().$el);
                app.view.setMail()
                .done(function () {
                    win.idle();
                     // render view and append
                    def.resolve({app: app});
                })
                .fail(function (e) {
                    notifications.yell(e);
                    app.dirty(false).quit();
                    def.reject();
                });
            });

            return def;
        }

        function reply(type) {

            return function (obj) {

                var def = $.Deferred();
                _.url.hash('app', 'io.ox/mail/compose:' + type);

                app.cid = 'io.ox/mail:' + type + '.' + _.cid(obj);

                function cont(obj) {
                    win.busy().show(function () {
                        mailAPI[type](obj, 'html')
                        .done(function (data) {
                            data.sendtype = type === 'forward' ? mailAPI.SENDTYPE.FORWARD : mailAPI.SENDTYPE.REPLY;
                            data.mode = type;
                            var model = new MailModel(data);
                            app.view = new MailComposeView({ model: model, app: app });
                            win.nodes.main.addClass('scrollable').append(app.view.render().$el);

                            app.view.setMail(data)
                            .done(function () {
                                win.idle();
                                def.resolve({app: app});
                            });
                        })
                        .fail(function (e) {
                            notifications.yell(e);
                            app.dirty(false).quit();
                            def.reject();
                        });
                    });
                }

                if (obj === undefined) {
                    cont({ folder: _.url.hash('folder'), id: _.url.hash('id') });
                } else {
                    cont(obj);
                }

                return def;
            };
        }

        app.compose  = compose;
        app.forward  = reply('forward');
        app.reply    = reply('reply');
        app.replyall = reply('replyall');

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
