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

define("io.ox/files/main",
    ["io.ox/core/commons",
     "gettext!io.ox/files",
     "io.ox/files/actions",
     "less!io.ox/files/style.less"
    ], function (commons, gt) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Files' }),
        // app window
        win;

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: gt("Files"),
            toolbar: true,
            search: true
        }));

        win.addClass("io-ox-files-main");

        // folder tree
        commons.addFolderView(app, { type: 'infostore', rootFolderId: 9 });

        // go!
        commons.addFolderSupport(app, null, 'infostore')
            .pipe(commons.showWindow(win))
            .done(function () {
                // switch to view in url hash or default
                ox.ui.Perspective.show(app, _.url.hash('perspective') || 'icons');
            });
    });

    return {
        getApp: app.getInstance
    };
});
