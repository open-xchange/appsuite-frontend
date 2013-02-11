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

define('io.ox/files/main',
    ['io.ox/core/commons',
     'gettext!io.ox/files',
     'settings!io.ox/files',
     'io.ox/core/extPatterns/actions',
     'io.ox/files/actions',
     'less!io.ox/files/style.less'
    ], function (commons, gt, settings, actions) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Files' }),
        // app window
        win;

    // launcher
    app.setLauncher(function (options) {
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: gt('Files'),
            toolbar: true,
            search: true
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        // folder tree
        commons.addFolderView(app, { type: 'infostore', rootFolderId: 9 });

        win.nodes.outer.on('drop', function (e, baton) {
            if (baton.dragType === 'mail') {
                actions.invoke('io.ox/files/actions/move', null, baton);
            }
        });

        // go!
        commons.addFolderSupport(app, null, 'infostore')
            .pipe(commons.showWindow(win))
            .done(function () {
                // switch to view in url hash or default
                var p = settings.get('view', 'icons');
                if (!/^(icons|list)$/.test(p)) {
                    p = 'icons';
                }
                ox.ui.Perspective.show(app, options.perspective || _.url.hash('perspective') || p);
            });
    });

    return {
        getApp: app.getInstance
    };
});
