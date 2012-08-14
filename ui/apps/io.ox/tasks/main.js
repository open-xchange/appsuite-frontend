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
    var app = ox.ui.createApp({ name: 'io.ox/tasks' }),
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
        
        win.on("show", function () {
            console.log("Wow! I'm here!");
            win.nodes.main.append($("<h1>").text("Hello!"));
        });
        
        win.on("hide", function () {
            console.log("Bye bye");
        });
        
        win.show();
    });

    return {
        getApp: app.getInstance
    };
});
