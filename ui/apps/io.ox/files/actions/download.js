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

define('io.ox/files/actions/download', [
    'io.ox/core/download',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (download, notifications, gt) {

    'use strict';

    /**
     * filters 'description only items' (just descriptions without 'real' files)
     * @param  {object|array} list or single item
     * @return {deferred} resolves as array
     */
    function filterUnsupported(list) {
        return _(list).filter(function (obj) {
            return !_.isEmpty(obj.filename) || obj.file_size > 0 || obj.standard_folder !== undefined;
        });
    }

    // loop over list, get full file object and trigger downloads
    return function (list) {
        var filtered = filterUnsupported(list);
        if (filtered.length === 1) {
            // single as file
            download.file(filtered[0]);
        } else if (filtered.length > 1) {
            // multiple as zip
            download.files(filtered);
        }
        // 'description only' items
        if (filtered.length === 0 || list.length !== filtered.length) {
            notifications.yell('info', gt('Items without a file can not be downloaded.'));
        }
    };
});
