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

define('io.ox/tasks/actions/move', [
    'io.ox/core/folder/actions/move',
    'io.ox/core/folder/api',
    'io.ox/core/notifications',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks',
    'settings!io.ox/tasks'
], function (move, folderAPI, notifications, api, gt, settings) {

    'use strict';

    return function (baton) {

        var vgrid = baton.grid || (baton.app && baton.app.getGrid && baton.app.getGrid());

        // shared?
        var shared = baton.array().some(function (item) {
            return isShared(item.folder_id);
        });

        if (shared || (baton.target && isShared(baton.target))) {
            return notifications.yell('error', gt('Tasks can not be moved to or out of shared folders'));
        }

        move.item({
            api: api,
            button: gt('Move'),
            flat: true,
            indent: false,
            list: baton.array(),
            module: 'tasks',
            root: '1',
            settings: settings,
            success: {
                single: 'Task has been moved',
                multiple: 'Tasks have been moved'
            },
            target: baton.target,
            title: gt('Move'),
            type: 'move',
            vgrid: vgrid
        });
    };

    function isShared(id) {
        var data = folderAPI.pool.getModel(id).toJSON();
        return folderAPI.is('shared', data);
    }
});
