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

define('io.ox/core/folder/actions/move',
    ['io.ox/core/api/folder',
     'io.ox/core/notifications',
     'gettext!io.ox/core'], function (api, notifications, gt) {

    'use strict';

    return function moveFolder(baton) {

        var id = baton.app.folder.get();

        api.get({ folder: id }).done(function (folder) {
            require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (dialogs, views) {
                var title = gt('Move folder'),
                    dialog = new dialogs.ModalDialog()
                        .header(
                            api.getBreadcrumb(folder.id, { prefix: title }).css({ margin: '0' })
                        )
                        .addPrimaryButton('ok', title)
                        .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('height', '250px');
                var type = baton.options.type,
                    tree = new views.FolderTree(dialog.getBody(), {
                        type: type,
                        rootFolderId: type === 'infostore' ? '9' : '1',
                        skipRoot: type === 'mail' ? false : true,
                        tabindex: 0,
                        cut: folder.id,
                        customize: function (target) {
                            if (type === 'mail' && target.module === 'system') {
                                return;
                            }
                            if (!api.can('moveFolder', folder, target)) {
                                this.removeClass('selectable').addClass('disabled');
                            }
                        }
                    });
                dialog.show(function () {
                    tree.paint().done(function () {
                        // open the foldertree to the current folder
                        tree.select(folder.id).done(function () {
                            // select first active element
                            tree.selection.updateIndex().selectFirst();
                            // focus
                            dialog.getBody().focus();
                        });
                    });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api.move(folder.id, selectedFolder[0]).fail(notifications.yell);
                        }
                    }
                    tree.destroy().done(function () {
                        tree = dialog = null;
                    });
                });
            });
        });
    };
});
