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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/main", ["io.ox/tasks/api",
                            'gettext!io.ox/tasks',
                            "io.ox/core/date"], function (api, gt, date) {

    "use strict";

    //PLACEHOLDER FILE - NO REAL FUNCTIONALITY
    // application object
    var app = ox.ui.createApp({ name: 'io.ox/tasks', title: 'Tasks' }),
        // app window
        win;
    // launcher
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: "Tasks",
            toolbar: true,
            search: true
        });
        
        win.nodes.main.append($('<div>').text("This is just a placeholder taskapp"));

        app.setWindow(win);

        // Let's define some event handlers on our window
        win.on("show", function () {
        });
        
        win.on("hide", function () {
            // Gets called whenever the window is hidden
        });
        
        win.show();
    });

    return {
        getApp: app.getInstance
    };
});
