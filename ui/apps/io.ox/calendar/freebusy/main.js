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
    ['io.ox/calendar/freebusy/controller'], function (controller) {

    'use strict';

    var NAME = 'io.ox/calendar/freebusy';

    function createInstance() {

        var app, win;

        app = ox.ui.createApp({ name: NAME, title: 'Find free time' });

        // launcher
        app.setLauncher(function (options) {

            win = ox.ui.createWindow({ name: NAME, chromeless: true });
            app.setWindow(win);

            win.show(function () {
                controller.draw.call(win.nodes.main, options, win);
            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});
