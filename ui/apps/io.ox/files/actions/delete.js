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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/delete', [
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, folderAPI, dialogs, notifications, gt) {

    'use strict';

    function isFile(o) {
        // isFile is only defined on file models
        return o.isFile && o.isFile();
    }

    function process(list) {

        var items = _(list).filter(isFile),
            folders = _(list).reject(isFile);

        // delete files
        api.remove(_(items).invoke('toJSON')).fail(function (e) {
            if (e && e.code && e.code === 'IFO-0415') {
                notifications.yell('error', gt.ngettext(
                    'This file has not been deleted, as it is locked by its owner.',
                    'These files have not been deleted, as they are locked by their owner.',
                    list.length
                ));
            } else {
                notifications.yell('error', gt.ngettext(
                    'This file has not been deleted',
                    'These files have not been deleted',
                    list.length
                ) + '\n' + e.error);
            }
        });

        // delete folders
        _(folders).each(function (folder) {
            folderAPI.remove(folder.id);
        });
    }

    return function (list) {

        list = _.isArray(list) ? list : [list];

        new dialogs.ModalDialog()
            .text(gt.ngettext(
                'Do you really want to delete this item?',
                'Do you really want to delete these items?',
                list.length
            ))
            .addPrimaryButton('delete', gt('Delete'), 'delete',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
            .on('delete', function () {
                process(list);
            })
            .show();
    };
});
