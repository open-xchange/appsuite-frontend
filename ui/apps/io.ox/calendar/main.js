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
     "settings!io.ox/calendar",
     "io.ox/calendar/actions",
     "less!io.ox/calendar/style.css"], function (api, util, config, commons, settings) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/calendar', title: 'Calendar' }),
        // app window
        win,
        lastPerspective = settings.get('viewView', 'workweek');
 
    // launcher
    app.setLauncher(function (options) {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            toolbar: true,
            search: true
        }));

        app.settings = settings;
        win.addClass("io-ox-calendar-main");

        // folder tree
        commons.addFolderView(app, { type: 'calendar', view: 'FolderList' });

        // go!
        commons.addFolderSupport(app, null, 'calendar')
            .pipe(commons.showWindow(win))
            .done(function () {
                ox.ui.Perspective.show(app, options.perspective || _.url.hash('perspective') || lastPerspective);
            });

        win.on('search:open', function () {
            lastPerspective = win.currentPerspective;
            ox.ui.Perspective.show(app, 'list');
        });

        win.on('search:close', function () {
            if (lastPerspective) {
                ox.ui.Perspective.show(app, lastPerspective);
            }
        });

        win.on('change:perspective', function (e, name) {
            if (name !== 'list') {
                lastPerspective = null;
                win.search.close();
            }
        });

    });

    return {
        getApp: app.getInstance
    };
});
