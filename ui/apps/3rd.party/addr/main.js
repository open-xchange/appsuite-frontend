/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('3rd.party/addr/main', function () {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: '3rd.party/addr' }),
        // app window
        win;

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: 'Plaxo Address Book'
        }));

        win.nodes.main.append(
            $('<iframe>', { src: 'http://www.plaxo.com/?lang=en', frameborder: 0 }).css({
                width: '100%',
                height: '100%'
            })
        );

        win.show();
    });

    return {
        getApp: app.getInstance
    };
});