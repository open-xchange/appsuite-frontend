/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/notes/main', [
    'io.ox/core/folder/api',
    'io.ox/core/http',
    'settings!io.ox/notes',
    'io.ox/notes/mediator',
    'less!io.ox/notes/style'
], function (folderAPI, http, settings, mediator) {

    'use strict';

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

        function show(folderId) {
            app.folder.set(folderId);
            _.url.hash('folder', folderId);
            mediator(app);
            win.show();
        }

        var folderId = settings.get('folder');
        if (folderId) return show(_.url.hash('folder') || folderId);

        var defaultInfoStoreFolder = folderAPI.getDefaultFolder('infostore');
        folderAPI.create(defaultInfoStoreFolder, { title: 'Notes' }).done(function (data) {
            var defaultFolder = data.id;
            settings.set('folder', defaultFolder).save();
            http.pause();
            ['General', 'Ideas', 'Meetings', 'Shopping', 'Todo lists', 'Work'].forEach(function (title) {
                folderAPI.create(defaultFolder, { title: title });
            });
            http.resume(function () {
                show(defaultFolder);
            });
        });
    });

    return {
        getApp: app.getInstance
    };
});
