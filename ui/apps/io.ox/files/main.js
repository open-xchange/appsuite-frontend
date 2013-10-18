/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/files/main',
    ['io.ox/core/commons',
     'gettext!io.ox/files',
     'settings!io.ox/files',
     'io.ox/core/api/folder',
     'io.ox/core/extPatterns/actions',
     'io.ox/files/actions',
     'less!io.ox/files/style.less'
    ], function (commons, gt, settings, folderAPI, actions) {

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
            title: 'Files',
            toolbar: true,
            search: true
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        // folder tree
        commons.addFolderView(app, { type: 'infostore', rootFolderId: settings.get('rootFolderId') });

        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/files/actions/move', null, baton);
        });

        // fix missing default folder
        options.folder = options.folder || folderAPI.getDefaultFolder('infostore') || 9;

        // go!
        return commons.addFolderSupport(app, null, 'infostore', options.folder)
            .pipe(commons.showWindow(win))
            .done(function () {
                // switch to view in url hash or default
                var p = settings.get('view', 'fluid');
                if (/^(icons)$/.test(p)) {
                    //old setting value support
                    p = 'fluid:icon';
                } else if (!/^(fluid:list|fluid:icon|fluid:tile)$/.test(p)) {
                    p = 'fluid:list';
                }
                ox.ui.Perspective.show(app, options.perspective || _.url.hash('perspective') || p);
            });
    });

    return {
        getApp: app.getInstance
    };
});
