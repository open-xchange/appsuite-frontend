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

define("io.ox/tasks/main", function () {

    "use strict";

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
        
        app.setWindow(win);
        
        var content = win.nodes.main;
        content.append("div").text("This is just a placeholder taskapp");

        // Let's define some event handlers on our window
        win.on("show", function () {
            console.log("Wow! I'm here!");
        });
        
        win.on("hide", function () {
            // Gets called whenever the window is hidden
            console.log("Bye bye");
        });
        
        win.show();
    });

    return {
        getApp: app.getInstance
    };
});
