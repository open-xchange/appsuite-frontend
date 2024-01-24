/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/actions/versions-delete', [
    'io.ox/files/api',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/files'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (data) {
        //#. 'Delete version' as header text to confirm to delete a version of a file via a modal dialog.
        new ModalDialog({ title: gt('Delete version'), description: gt.pgettext('One file only', 'Do you really want to delete this version?') })
            .addCancelButton()
            .addButton({ label: gt('Delete version'), action: 'delete' })
            .on('delete', function () { api.versions.remove(data); })
            .open();
    };
});
