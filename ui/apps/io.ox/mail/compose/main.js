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
 * require('settings!io.ox/core').set(['registry', 'mail-compose'], 'io.ox/mail/compose/main').save();
 * To use old mail compose:
 * require('settings!io.ox/core').set(['registry', 'mail-compose'], undefined).save();
 */

define('io.ox/mail/compose/main',
    ['io.ox/mail/api',
     'io.ox/mail/compose/model',
     'io.ox/mail/compose/view',
     'io.ox/core/notifications',
     'settings!io.ox/mail',
     'gettext!io.ox/mail',
     'less!io.ox/mail/style',
     'less!io.ox/mail/compose/style'
    ], function (mailAPI, MailModel, MailComposeView, notifications, settings, gt) {

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
                search: false,
                chromeless: true
            }));
        });

        app.failSave = function () {
            var mail = app.view.model.toJSON();
            //remove local files, since they can not be restored
            delete mail.files;
            mail.attachments = mail.attachments.filter(function (attachment) {
                return attachment.get('group') !== 'localFile';
            });
            return {
                module: 'io.ox/mail/compose',
                description: gt('Mail') + ': ' + (mail.subject || gt('No subject')),
                point: mail
            };
        };

        app.failRestore = function (point) {
            var def = $.Deferred(),
                model = new MailModel(point);

            app.view = new MailComposeView({ model: model, app: app });

            _.url.hash('app', 'io.ox/mail/compose:' + point.mode);

            win.busy().show(function () {
                win.nodes.main.addClass('scrollable').append(app.view.render().$el);
                app.view.setMail(point.data).done(function () {
                    model.dirty(true);
                    win.idle();
                    def.resolve({app: app});
                });
            });
            return def;
        };

        function compose(type) {
            return function (data) {
                data = _.extend({mode: type}, data);

                if (type === 'edit') {
                    app.cid = 'io.ox/mail:edit.' + _.cid(data); // here, for reuse it's edit!
                    data.msgref = data.folder_id + '/' + data.id;
                }

                var def = $.Deferred(),
                    model = new MailModel(data);

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
                        app.quit();
                        def.reject();
                    });
                });

                return def;
            };
        }

        function reply(type) {

            return function (obj) {

                var def = $.Deferred();
                _.url.hash('app', 'io.ox/mail/compose:' + type);

                app.cid = 'io.ox/mail:' + type + '.' + _.cid(obj);

                function cont(obj) {
                    win.busy().show(function () {
                        mailAPI[type](obj, settings.get('messageFormat', 'html'))
                        .done(function (data) {
                            data.sendtype = type === 'forward' ? mailAPI.SENDTYPE.FORWARD : mailAPI.SENDTYPE.REPLY;
                            data.mode = type;
                            var model = new MailModel(data);
                            app.view = new MailComposeView({ model: model, app: app });
                            win.nodes.main.addClass('scrollable').append(app.view.render().$el);

                            app.view.setMail()
                            .done(function () {
                                win.idle();
                                def.resolve({app: app});
                            });
                        })
                        .fail(function (e) {
                            notifications.yell(e);
                            app.quit();
                            def.reject();
                        });
                    });
                }

                cont(obj || { folder: _.url.hash('folder'), id: _.url.hash('id') });

                return def;
            };
        }

        // destroy
        app.setQuit(function () { return app.view.discard(); });

        app.compose  = compose('compose');
        app.forward  = reply('forward');
        app.reply    = reply('reply');
        app.replyall = reply('replyall');
        app.edit     = compose('edit');

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
