/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/notes/main', [
    'io.ox/notes/api',
    'settings!io.ox/notes',
    'io.ox/notes/mediator',
    'less!io.ox/notes/style'
], function (api, settings, mediator) {

    'use strict';

    // remove this, once it is out of prototype state
    if (!ox.debug) return;

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/notes',
        id: 'io.ox/notes',
        title: 'Notes'
    });

    // launcher
    app.setLauncher(function () {

        // get window
        var win = ox.ui.createWindow({
            name: 'io.ox/notes',
            title: 'Notes',
            chromeless: true,
            find: false
        });

        app.setWindow(win);
        app.settings = settings;
        window.notes = app;

        win.show();

        function show(folderId) {
            win.idle();
            _.url.hash('folder', folderId);
            app.folder.set(folderId);
            mediator(app);
            if (settings.get('tours/welcome/run', true)) showTour();
        }

        // hash support
        app.getWindow().on('show', function () {
            _.url.hash('folder', app.folder.get());
        });

        var folderId = api.getDefaultFolder();
        if (folderId) return show(_.url.hash('folder') || folderId);

        win.busy(0.00);

        api.createDefaultFolders()
            .progress(function (pct, caption) {
                win.busy(pct, caption);
            })
            .done(show);
    });

    function showTour() {
        require(['io.ox/notes/tour'], function (tour) {
            tour.start();
        });
    }

    return {
        getApp: app.getInstance
    };
});
