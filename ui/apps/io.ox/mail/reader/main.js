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

define('io.ox/mail/reader/main',
    ['io.ox/mail/threadview',
     'io.ox/mail/util'
    ], function (ThreadView, util) {

    'use strict';

    var NAME = 'io.ox/mail/reader';

    ox.ui.App.mediator(NAME, {
        /*
         * Setup thread view
         */
        'thread-view': function (app) {
            app.threadView = new ThreadView();
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

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();

            if (options.cid) app.showMail(options.cid);

            win.show();
        });
    }

    return {
        getApp: createInstance
    };
});
