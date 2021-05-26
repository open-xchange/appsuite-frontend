/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
