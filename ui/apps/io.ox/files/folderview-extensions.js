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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/files/folderview-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/files/legacy_api',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (ext, folderAPI, filesAPI, notifications, gt) {

    'use strict';

    var POINT = 'io.ox/files/folderview';

    function clearFolder(e) {
        e.preventDefault();

        var baton = e.data.baton,
        id = _(baton.app.folderView.selection.get()).first();
        $.when(
            folderAPI.get(id),
            ox.load(['io.ox/core/tk/dialogs'])
        ).done(function (folder, dialogs) {
            new dialogs.ModalDialog()
                .text(gt('Do you really want to empty folder "%s"?', folderAPI.getFolderTitle(folder.title, 30)))
                .addPrimaryButton('delete', gt('Empty folder'), 'delete', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                .show()
                .done(function (action) {
                    if (action === 'delete') {
                        notifications.yell('busy', gt('Emptying folder ...'));
                        filesAPI.clear(id).done(function () {
                            notifications.yell('success', gt('The folder has been emptied.'));
                        });
                    }
                });
        });
    }

    ext.point(POINT + '/sidepanel/context-menu').extend({
        id: 'clear',
        index: 450,
        draw: function (baton) {
            var link = $('<a href="#" data-action="clearfolder" role="menuitem">').text(gt('Empty folder'));
            this.append($('<li class="divider">'), $('<li>').append(link));
            if (folderAPI.can('delete', baton.data) && folderAPI.is('trash', baton.data)) {
                link.attr('tabindex', 1).on('click', { baton: baton }, clearFolder);
            } else {
                link.attr('aria-disabled', true).addClass('disabled').on('click', $.preventDefault);
            }
        }
    });

});
