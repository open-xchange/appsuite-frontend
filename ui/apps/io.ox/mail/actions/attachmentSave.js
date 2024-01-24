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

define('io.ox/mail/actions/attachmentSave', [
    'io.ox/mail/api',
    'io.ox/core/notifications',
    'io.ox/core/folder/picker',
    'io.ox/core/folder/api',
    // yep, files not mail!
    'settings!io.ox/files',
    'settings!io.ox/core',
    'gettext!io.ox/mail'
], function (api, notifications, picker, folderAPI, settings, coreSettings, gt) {

    'use strict';

    function commit(list, target) {

        notifications.yell('busy',
            // do not use "gt.ngettext" for plural without count
            (list.length === 1) ? gt('Saving attachment ...') : gt('Saving attachments ...')
        );

        api.saveAttachments(list, target).then(
            // success
            function success(response) {

                function yell(res) {
                    if (res.error) {
                        notifications.yell(res.error);
                    } else {
                        notifications.yell('success',
                            // do not use "gt.ngettext" for plural without count
                            (list.length === 1) ? gt('Attachment has been saved') : gt('Attachments have been saved')
                        );
                    }
                }

                if (_.isArray(response)) {
                    _.each(response, function (fileResponse) {
                        yell(fileResponse);
                    });
                } else {
                    yell(response);
                }
                folderAPI.reload(target, list);
            },
            // fail
            notifications.yell
        );
    }

    return {

        multiple: function (list) {

            var id = settings.get('folderpopup/last') || coreSettings.get('folder/infostore');

            picker({
                async: true,
                button: gt('Save'),
                folder: id,
                module: 'infostore',
                persistent: 'folderpopup',
                root: '9',
                settings: settings,
                title: gt('Save attachment'),
                hideTrashfolder: true,

                done: function (target, dialog) {
                    commit(list, target);
                    dialog.close();
                },

                disable: function (data) {
                    return !folderAPI.can('create', data);
                }
            });
        }
    };
});
