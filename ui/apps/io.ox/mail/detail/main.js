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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/detail/main',
    ['io.ox/mail/threadview',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/notifications'
    ], function (threadView, api, util, notifications) {

    'use strict';

    var NAME = 'io.ox/mail/detail';

    ox.ui.App.mediator(NAME, {
        /*
         * Setup thread view
         */
        'thread-view': function (app) {
            app.threadView = new threadView.Desktop({ disableDrag: true });
            app.getWindow().nodes.main
                .addClass('mail-reader')
                .append(app.threadView.render().$el);
        },
        /*
         * Show thread/email
         */
        'show-mail': function (app) {
            app.showMail = function (cid) {
                app.threadView.show(cid);
                if (app.threadView.model) {
                    var subject = app.threadView.model.get('subject');
                    app.setTitle(util.getSubject(subject));
                    // respond to 'remove' event to close the detail view
                    app.threadView.listenTo(app.threadView.model, 'remove', function () {
                        app.quit();
                    });
                }
            };
        }
    });

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: ''
        });

        app.on('quit', function () {
            app.threadView.remove();
            app.threadView = null;
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();
            win.show();

            var cid = options.cid, obj;

            if (cid !== undefined) {
                // called from mail app
                obj = _.cid(String(cid).replace(/^thread\./, ''));
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.showMail(cid);
                return;
            }

            // deep-link
            obj = app.getState();
            cid = _.cid(obj);

            if (obj.folder && obj.id) {
                api.get(obj).then(
                    function success() {
                        app.showMail(cid);
                    },
                    notifications.yell
                );
            }
        });
    }

    return {
        getApp: createInstance
    };
});
