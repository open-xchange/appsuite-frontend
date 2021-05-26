/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/files/actions/delete', [
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, folderAPI, ModalDialog, notifications, gt) {

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
                // do not use "gt.ngettext" for plural without count
                notifications.yell('error', (list.length === 1) ?
                    gt('This file has not been deleted, as it is locked by its owner.') :
                    gt('These files have not been deleted, as they are locked by their owner.')
                );
            } else {
                // do not use "gt.ngettext" for plural without count
                var msg = (list.length === 1) ? gt('This file has not been deleted') : gt('These files have not been deleted');
                notifications.yell('error', _.noI18n(msg + '\n' + e.error));
            }

            api.trigger('reload:listview');
        });

        // delete folders
        folderAPI.remove(_(folders).map(function (model) {
            return model.get('id');
        }));
    }

    return function (list) {
        list = _.isArray(list) ? list : [list];

        // do not use "gt.ngettext" for plural without count
        var deleteNotice = (list.length === 1) ?
            gt('Do you really want to delete this item?') :
            gt('Do you really want to delete these items?');

        // do not use "gt.ngettext" for plural without count
        var shareNotice = (list.length === 1) ?
            gt('This file or folder is shared with others. It will not be available for them anymore.') :
            gt('Some files or folders are shared with others. They will not be available for them anymore.');

        function isShared() {
            var result = _.findIndex(list, function (model) {
                return model.get('object_permissions') ? model.get('object_permissions').length !== 0 : model.get('permissions').length > 1;
            });

            if (result !== -1) return true;
        }

        //#. 'Delete item' and 'Delete items' as a header of a modal dialog to confirm to delete files from drive.
        new ModalDialog({
            // do not use "gt.ngettext" for plural without count
            title: (list.length === 1) ? gt('Delete item') : gt('Delete items'),
            description: isShared() ? shareNotice : deleteNotice
        })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'delete' })
            .on('delete', function () {
                _.defer(function () { process(list); });
            })
            .open();
    };
});
