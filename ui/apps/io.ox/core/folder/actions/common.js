/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/folder/actions/common', [
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/core',
    'io.ox/core/api/account',
    'io.ox/core/http'
], function (mailAPI, folderAPI, ModalDialog, notifications, gt, account, http) {

    'use strict';

    return {

        selectOnly: function (e) {
            var app = ox.ui.apps.get('io.ox/calendar');
            if (app.folders.isSingleSelection()) app.folders.reset();
            else app.folders.setOnly(e.data.folder.id);
        },

        refreshCalendar: function (e) {
            notifications.yell('warning', gt('Refreshing calendar might take some time...'));
            require(['io.ox/calendar/api'], function (calendarApi) {
                calendarApi.refreshCalendar(e.data.folder.id).then(function () {
                    notifications.yell('success', gt('Successfully refreshed calendar'));
                }, notifications.yell).always(function () {
                    folderAPI.pool.unfetch(e.data.folder.id);
                    folderAPI.refresh();
                });
            });
        },

        markFolderSeen: function (e) {
            mailAPI.allSeen(e.data.folder);
        },

        moveAll: function (source) {
            ox.load(['io.ox/core/folder/actions/move']).done(function (move) {
                move.all({ button: gt('Move all'), source: source });
            });
        },

        expunge: function (id) {
            notifications.yell('busy', gt('Cleaning up ...'));
            mailAPI.expunge(id).done(function () {
                notifications.yell('success', gt('The folder has been cleaned up.'));
            });
        },

        clearFolder: (function () {

            function clear(id, module) {
                folderAPI.clear(id).done(function () {
                    notifications.yell('success', getMessage(module));
                });
            }

            function getMessage(module) {
                switch (module) {
                    case 'mail': return gt('All messages have been deleted');
                    // dedicated message for drive because "empty" does not remove folders
                    case 'infostore': return gt('All files have been deleted');
                    default: return gt('The folder has been emptied');
                }
            }

            return function (id) {

                folderAPI.get(id).done(function (folder) {
                    //#. 'Delete all messages' as header et´´text to confirm to empty a selected folder and delete all messages via a modal dialog.
                    new ModalDialog({ title: gt('Delete all messages'), description: gt('Do you really want to empty folder "%s"?', folderAPI.getFolderTitle(folder.title, 30)) })
                        .addCancelButton()
                        //#. empty is a verb in this case. Used when the contents of a folder should be deleted
                        .addButton({ label: gt('Empty folder'), action: 'delete' })
                        .on('delete', function () {
                            if (account.is('spam|confirmed_spam', id)) {
                                http.pause();
                                mailAPI.allSeen(id);
                                clear(id, folder.module);
                                http.resume();
                            } else {
                                clear(id, folder.module);
                            }
                        })
                        .open();
                });
            };
        }())
    };
});
