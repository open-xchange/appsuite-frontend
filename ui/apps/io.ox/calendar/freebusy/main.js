/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/main',
    ['io.ox/calendar/freebusy/controller',
     'settings!io.ox/core'], function (controller, settings) {

    'use strict';

    var NAME = 'io.ox/calendar/freebusy';

    function createInstance() {

        var app, win;

        app = ox.ui.createApp({ name: NAME, title: 'Find a free time' });

        // launcher
        app.setLauncher(function (options) {

            win = ox.ui.createWindow({ name: NAME, chromeless: true });
            app.setWindow(win);

            if (!options.folder) {
                options.folder = settings.get('folder/calendar');
                options.standalone = true;
            }

            win.show(function () {

                win.busy();

                options.$el = win.nodes.main;
                var freebusy = controller.getInstance(options, function () {
                    win.idle();
                });

                freebusy.promise.done(function (action, data) {
                    console.log('promise.done', action, data);
                    switch (action) {
                    case 'quit':
                        app.quit();
                        break;
                    case 'cancel':
                        console.log('cancel');
                        break;
                    case 'update':
                        console.log('update', data);
                        break;
                    }
                });
            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});
