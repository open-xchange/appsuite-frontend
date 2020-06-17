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
