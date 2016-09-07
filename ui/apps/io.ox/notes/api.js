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

define('io.ox/notes/api', [
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/http',
    'settings!io.ox/notes'
], function (filesAPI, folderAPI, http, settings) {

    'use strict';

    function map(cid) {
        // return existing file model
        return filesAPI.pool.get('detail').get(cid);
    }

    var api = {

        get: function (obj) {
            return $.when(
                filesAPI.get(obj),
                $.ajax({ type: 'GET', url: filesAPI.getUrl(obj, 'view') + '&' + _.now(), dataType: 'text' })
            )
            .then(function (data, text) {
                return { data: data, content: text[0] };
            });
        },

        resolve: function (list, json) {
            var models = _(list).chain().map(map).compact().value();
            return json === false ? models : _(models).invoke('toJSON');
        },

        getModel: function (cid) {
            return filesAPI.pool.get('detail').get(cid);
        },

        addToPool: function (data) {
            filesAPI.pool.get('detail').add(data);
        },

        create: function (options) {

            options = _.extend({
                content: '',
                folder: this.getDefaultFolder(),
                title: 'New note'
            }, options);
            // yep, not yet translated
            var filename = options.title.toLowerCase() + '.txt',
                blob = new window.Blob([options.content], { type: 'text/plain' });

            return filesAPI.upload({ addVersion: false, file: blob, filename: filename, folder: options.folder, title: options.title })
                .done(function (data) {
                    filesAPI.pool.get('detail').add(data);
                });
        },

        update: function (file, changes) {
            if (_.isString(file)) file = _.cid(file);
            return filesAPI.update(file, changes);
        },

        updateContent: function (file, content) {
            var blob = new window.Blob([content], { type: 'text/plain' });
            return filesAPI.versions.upload({ id: file.id, folder: file.folder_id, file: blob, filename: file.filename });
        },

        createDefaultFolders: function () {
            var defaultInfoStoreFolder = folderAPI.getDefaultFolder('infostore'),
                rootFolder;
            // yep, not yet translated
            return folderAPI.create(defaultInfoStoreFolder, { title: 'Notes' })
                .then(function (data) {
                    rootFolder = data.id;
                    settings.set('folder/root', rootFolder).save();
                })
                .then(function () {
                    // add default folder
                    return folderAPI.create(rootFolder, { title: 'General' }).then(function (data) {
                        settings.set('folder/default', data.id).save();
                        return api.createWelcomeNote();
                    });
                })
                .then(function () {
                    http.pause();
                    // yep, not yet translated
                    ['Ideas', 'Meetings', 'Shopping', 'Todo lists', 'Work'].forEach(function (title) {
                        folderAPI.create(rootFolder, { title: title });
                    });
                    return http.resume().then(function () {
                        return rootFolder;
                    });
                });
        },

        createWelcomeNote: function () {
            return this.create({
                content: 'With *OX Notes* you can create simple todo or shopping lists, ' +
                    'easily take meetings minutes, or quickly write down your ideas.\n\n' +
                    '- [x] Make a list\n- [x] Have a break\n- [x] Mark the first two items as done\n- [x] Be proud to have finished three items yet\n- [ ] So much done. Have a beer!\n\n' +
                    'You can also create numbered lists: \n# First item\n# Second item\n\n' +
                    '_And you can highlight important parts_ and you can ~cross out parts~.\n\n' +
                    'Links are automatically detected, of course: http://www.open-xchange.com',
                title: 'Welcome to OX Notes'
            });
        },

        getRootFolder: function () {
            return settings.get('folder/root');
        },

        getDefaultFolder: function () {
            return settings.get('folder/default');
        }
    };

    return api;
});
