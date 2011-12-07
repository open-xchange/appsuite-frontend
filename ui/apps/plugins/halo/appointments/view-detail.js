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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("plugins/halo/appointments/view-detail",
    ["io.ox/calendar/view-detail", "css!io.ox/calendar/style.css"], function (viewer) {

    "use strict";

    function show(data) {

        var app = ox.ui.createApp({
            title: data.title
        });

        app.setLauncher(function () {

            var win = ox.ui.createWindow({});
            win.nodes.main.css("overflow", "auto");

            app.setWindow(win);
            win.setQuitOnClose(true);

            win.nodes.main.append(viewer.draw(data));

            win.show();
        });


        app.launch();
    }

    return {
        show: show
    };
});