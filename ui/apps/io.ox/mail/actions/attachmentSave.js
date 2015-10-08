/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/actions/attachmentSave', [
    'io.ox/mail/api',
    'io.ox/core/notifications',
    'io.ox/core/tk/dialogs',
    'io.ox/core/folder/picker',
    'io.ox/core/folder/api',
    // yep, files not mail!
    'settings!io.ox/files',
    'settings!io.ox/core',
    'gettext!io.ox/mail'
], function (api, notifications, dialogs, picker, folderAPI, settings, settingsCore, gt) {

    'use strict';

    function commit(list, target) {

        notifications.yell('busy',
            gt.ngettext('Saving attachment ...', 'Saving attachments ...', list.length)
        );

        api.saveAttachments(list, target).then(
            // success
            function success(response) {

                function yell(res) {
                    if (res.error) {
                        notifications.yell(res.error);
                    } else {
                        notifications.yell('success',
                            gt.ngettext('Attachment has been saved', 'Attachments have been saved', list.length)
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

            var id = settings.get('folderpopup/last') || settingsCore.get('folder/infostore');

            picker({

                button: gt('Save'),
                folder: id,
                module: 'infostore',
                persistent: 'folderpopup',
                root: '9',
                settings: settings,
                title: gt('Save attachment'),
                hideTrashfolder: true,

                done: function (target) {
                    commit(list, target);
                },

                disable: function (data) {
                    return !folderAPI.can('create', data);
                }
            });
        }
    };
});
