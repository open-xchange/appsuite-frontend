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
    ['io.ox/core/folder/api',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'io.ox/core/tk/folderviews',
     'gettext!io.ox/core'], function (api, notifications, dialogs, views, gt) {

    'use strict';

    return function (id) {

        var model = api.pool.getModel(id), module = model.get('module');

        var dialog = new dialogs.ModalDialog({ async: true })
            .header(
                $('<h4>').append(
                    $.txt(gt('Move folder')),
                    $.txt(': '),
                    $.txt(model.get('title'))
                )
            )
            .addPrimaryButton('ok', gt('Ok'))
            .addButton('cancel', gt('Cancel'));

        dialog.getBody().css('height', '250px');

        var tree = new views.FolderTree(dialog.getBody(), {
            type: module,
            rootFolderId: module === 'infostore' ? '9' : '1',
            skipRoot: module !== 'mail', // skip root unless mail
            tabindex: 0,
            cut: id,
            customize: function (target) {
                if (module === 'mail' && target.module === 'system') return;
                if (!api.can('move:folder', model.toJSON(), target)) {
                    this.removeClass('selectable').addClass('disabled');
                }
            }
        });

        dialog.on('ok', function () {
            var target = tree.selection.get();
            if (target.length !== 1) return this.close();
            // move action
            api.move(id, target[0]).then(this.close, this.idle).fail(notifications.yell);
        })
        .show(function () {
            tree.paint().done(function () {
                // open the foldertree to the current folder
                tree.select(id).done(function () {
                    // select first active element
                    tree.selection.updateIndex().selectFirst();
                    // focus
                    dialog.getBody().focus();
                });
            });
        })
        .done(function () {
            tree.destroy().done(function () {
                tree = dialog = null;
            });
        });
    };
});
