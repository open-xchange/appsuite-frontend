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

define('io.ox/mail/actions/attachmentSave',
    ['io.ox/mail/api',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'io.ox/core/tk/folderviews',
     'io.ox/core/api/folder',
     'settings!io.ox/files', // yep, files not mail!
     'settings!io.ox/core',
     'gettext!io.ox/mail'], function (api, notifications, dialogs, views, folderAPI, settings, settingsCore, gt) {

    'use strict';

    function commit(list, target) {

        notifications.yell('busy',
            gt.ngettext('Saving attachment in file store', 'Saving attachments in file store', list.length) + ' ...'
        );

        api.saveAttachments(list, target).then(
            // success
            function success(response) {
                if (response.error) {
                    notifications.yell('error', response);
                } else {
                    notifications.yell('success',
                        gt.ngettext('Attachment has been saved', 'Attachments have been saved', list.length)
                    );
                }
                folderAPI.reload(target, list);
            },
            // fail
            notifications.yell
        );
    }

    return {

        multiple: function (list) {

            var dialog = new dialogs.ModalDialog({tabTrap: true})
                .header($('<h4>').text('Save attachment'))
                .addPrimaryButton('ok', gt('Save'), 'ok', {tabIndex: '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'});

            dialog.getBody().css({ height: '250px' });

            var folderId = settingsCore.get('folder/infostore'),
                id = settings.get('folderpopup/last') || folderId,
                tree = new views.FolderTree(dialog.getBody(), {
                    type: 'infostore',
                    rootFolderId: '9',
                    open: settings.get('folderpopup/open', []),
                    tabindex: 0,
                    toggle: function (open) {
                        settings.set('folderpopup/open', open).save();
                    },
                    select: function (id) {
                        settings.set('folderpopup/last', id).save();
                    }
                });

            dialog.show(function () {
                tree.paint().done(function () {
                    tree.select(id).done(function () {
                        dialog.getBody().focus();
                    });
                });
            })
            .done(function (action) {
                if (action === 'ok') {
                    var target = _(tree.selection.get()).first();
                    if (target) commit(list, target);
                }
                tree.destroy().done(function () {
                    tree = dialog = null;
                });
            });
        }
    };
});
