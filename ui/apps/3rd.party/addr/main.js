/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
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