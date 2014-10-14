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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions/move', [
    'io.ox/core/folder/api',
    'io.ox/core/notifications',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks',
    'settings!io.ox/tasks'
], function (folderAPI, notifications, api, gt, settings) {

    'use strict';

    function isShared(id) {
        var data = folderAPI.pool.getModel(id).toJSON();
        return folderAPI.is('shared', data);
    }

    return {
        multiple: function (list, baton) {
            var vgrid = baton.grid || (baton.app && baton.app.getGrid && baton.app.getGrid());

            // shared?
            var shared = _([].concat(list)).reduce(function (memo, obj) {
                return memo || isShared(obj.folder_id);
            }, false);

            if (shared || (baton.target && isShared(baton.target))) {
                return notifications.yell('error', gt('Tasks can not be moved to or out of shared folders'));
            }

            require(['io.ox/core/folder/actions/move'], function (move) {

                move.item({
                    api: api,
                    button: gt('Move'),
                    flat: true,
                    indent: false,
                    list: list,
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
            });
        }
    };
});
