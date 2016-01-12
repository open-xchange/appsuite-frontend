/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/common', [
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/core',
    'io.ox/core/api/account',
    'io.ox/core/http'
], function (mailAPI, folderAPI, dialogs, notifications, gt, account, http) {

    'use strict';

    return {

        markFolderSeen: function (e) {
            mailAPI.allSeen(e.data.folder);
        },

        moveAll: function (source) {
            ox.load(['io.ox/core/folder/actions/move']).done(function (move) {
                move.all({ button: gt('Move all'), source: source });
            });
        },

        expunge: function (folder) {
            notifications.yell('busy', gt('Cleaning up ...'));
            mailAPI.expunge(folder).done(function () {
                notifications.yell('success', gt('The folder has been cleaned up.'));
            });
        },

        clearFolder: function (e) {
            var id = e.data.id;
            folderAPI.get(id).done(function (folder) {
                new dialogs.ModalDialog()
                    .text(gt('Do you really want to empty folder "%s"?', folderAPI.getFolderTitle(folder.title, 30)))
                    .addPrimaryButton('delete', gt('Empty folder'), 'delete', { tabIndex: 1 })
                    .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                    .on('delete', function () {

                        function clear() {
                            // dedicated message for drive because "empty" does not remove folders
                            var message = folder.module === 'infostore' ?
                                gt('All files have been deleted') :
                                gt('The folder has been emptied');
                            folderAPI.clear(id).done(function () {
                                notifications.yell('success', message);
                            });
                        }

                        if (account.is('spam', id)) {
                            http.pause();
                            mailAPI.allSeen(id);
                            clear();
                            http.resume();
                        } else {
                            clear();
                        }
                    })
                    .show();
            });
        }
    };
});
