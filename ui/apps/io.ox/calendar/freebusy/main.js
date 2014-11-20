/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/main', [
    'io.ox/calendar/freebusy/controller',
    'settings!io.ox/core'
], function (controller, settings) {

    'use strict';

    var NAME = 'io.ox/calendar/freebusy';

    function createInstance() {

        var app, win;

        app = ox.ui.createApp({
            name: NAME,
            title: 'Scheduling',
            closable: true
        });

        // launcher
        app.setLauncher(function (options) {

            win = ox.ui.createWindow({ name: NAME, chromeless: true });
            app.setWindow(win);

            // if folder is missing or we don't have a model to update
            options.standalone = !options.folder || !options.model;
            options.folder = options.folder || options.folder_id || settings.get('folder/calendar');

            if (options.participants === undefined) {
                options.participants = [{ id: ox.user_id, type: 1 }];
            }

            // clean up & quit
            function quit() {
                if (options.app) {
                    options.app.off('quit', quit);
                }
                app.quit();
                options.$el = options.app = options.model = null;
                app = win = options = null;
            }

            // quit if opener quits
            if (options.app) {
                options.app.on('quit', quit);
                app.on('quit', function () {
                    options.app.off('quit', quit);
                });
            }

            win.show(function () {

                win.busy();

                options.$el = win.nodes.main;
                var freebusy = controller.getInstance(options, function () {
                    win.idle();
                });

                freebusy.promise.done(function (action, data) {
                    switch (action) {
                    case 'quit':
                        quit();
                        break;
                    case 'update':
                        options.model.set({
                            start_date: data.start_date,
                            participants: data.participants
                        }, { validate: true });
                        // set end_date in a seperate call to avoid the appointment model applyAutoLengthMagic (Bug 27259)
                        options.model.set({
                            end_date: data.end_date
                        }, { validate: true });
                        /* falls through */
                    case 'cancel':
                        options.app.getWindow().show();
                        if (options.callback) options.callback();
                        quit();
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
