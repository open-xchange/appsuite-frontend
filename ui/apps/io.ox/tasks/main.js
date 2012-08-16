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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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
        
        
        // This appends a node into our window
        win.nodes.main.append($("<h1>").text("Hello!"));
        
        
        // Let's define some event handlers on our window
        win.on("show", function () {
            // Gets called whenever the window is shown
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
