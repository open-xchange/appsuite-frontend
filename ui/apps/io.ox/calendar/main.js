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

define("io.ox/calendar/main",
    ["io.ox/calendar/api",
     "io.ox/calendar/util",
     "io.ox/core/config",
     "io.ox/core/commons",
     "io.ox/calendar/actions",
     "less!io.ox/calendar/style.css"], function (api, util, config, commons, VGrid, tmpl) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/calendar', title: 'Calendar' }),
        // app window
        win;

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            toolbar: true,
            search: true
        }));

        win.addClass("io-ox-calendar-main");

        // folder tree
        commons.addFolderView(app, { type: 'calendar', view: 'FolderList' });

        // go!
        commons.addFolderSupport(app, null, 'calendar')
            .pipe(commons.showWindow(win))
            .done(function () {
                // switch to month view
                require(['io.ox/calendar/week/perspective'], function (perspective) {
                    perspective.show(app);
                });
            });
    });

    return {
        getApp: app.getInstance
    };
});
