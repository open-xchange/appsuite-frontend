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
        win,
        lastperspective;

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
                // switch to week perspective or perspective in hash
                var options = {
                    perspective: (_.url.hash('perspective') ? _.url.hash('perspective').split(":") : ["week", "week"])
                };
                require(['io.ox/calendar/' + options.perspective[0] + '/perspective'], function (perspective) {
                    perspective.show(app, options);
                });

            });

        win.on('search:open', function () {
            lastperspective = (_.url.hash('perspective') ? _.url.hash('perspective').split(":") : ["week", "week"]);
            require(['io.ox/calendar/list/perspective'], function (perspective) {
                perspective.show(app, { perspective: 'list' });
            });
        });

        win.on('search:close', function () {
            var options = { perspective: lastperspective };
            require(['io.ox/calendar/' + options.perspective[0] + '/perspective'], function (perspective) {
                perspective.show(app, options);
            });
        });

    });

    return {
        getApp: app.getInstance
    };
});
