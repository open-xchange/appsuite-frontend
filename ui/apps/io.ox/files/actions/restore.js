/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
 */

define('io.ox/files/actions/restore', [
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (folderApi, filesApi, notifications, gt) {

    'use strict';

    var pathArray,
        affectedFolders,
        promises;

    /**
     * Creates an array with the full path regarding a folder id
     *
     * @param {Integer} folderId
     *  Folder id for the path to be created
     *
     * @return {deferred}
     *  resolves with String of the path
     */
    function getPath(folderId) {
        var def = new $.Deferred();
        folderApi.path(folderId).done(function (folder) {
            var path = _(folder).pluck('title').join('/');
            pathArray.push(path);
            def.resolve(path);
        });
        return def.promise();
    }

    /**
     * Creates a notification with an entry for every single path that comes back from the response
     *
     * @param {Response[]} responses
     *  Response of the file/folder restore function
     */
    function createNotifications(responses) {
        _.each(responses, function (response) {
            if (_.isArray(response.path)) {
                var path = response.path[0];
                if (!_.contains(affectedFolders, path.id)) {
                    affectedFolders.push(path.id);
                }
            }
        });

        _.each(affectedFolders, function (folderId) {
            promises.push(getPath(folderId));
        });

        $.when.apply($, promises).done(function () {
            if (pathArray.length > 1) {
                return notifications.yell('info', gt('Restored into multiple folders:\n\n%s', pathArray.join('\n')));
            }
            return notifications.yell('info', gt('Restored into folder:\n\n%s', pathArray.join('\n')));
        });
    }

    /**
     * Action to restore mixed files and folders out of an array of models
     */
    return function (models) {
        pathArray = [];
        promises = [];
        affectedFolders = [];
        if (!_.isArray(models)) models = [models];

        var folders = _.filter(models, function (model) {
                return model.get('folder_id') === 'folder';
            }),
            files = _(models).difference(folders);

        if (folders.length && files.length) {
            folderApi.restore(folders).done(function (folderResponse) {
                filesApi.restore(files).done(function (fileResponse) {
                    createNotifications(folderResponse.concat(fileResponse));
                });
            });
        } else if (folders.length) {
            folderApi.restore(folders).done(function (folderResponse) {
                createNotifications(folderResponse);
            });
        } else if (files.length) {
            filesApi.restore(files).done(function (fileResponse) {
                createNotifications(fileResponse);
            });
        }
    };
});
