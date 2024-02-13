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

define('io.ox/files/actions/delete-previous-versions', [
    'io.ox/files/api',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/files'
], function (api, ModalDialog, gt) {

    'use strict';

    return function (data) {
        //#. 'Delete previous versions' as header of a modal dialog to confirm to delete all previous versions of a file.
        new ModalDialog({ title: gt('Delete previous versions'), description: gt('Do you really want to delete all previous versions except the current version?') })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'deletePreviousVersions' })
            .on('deletePreviousVersions', function () { api.versions.removePreviousVersions(data); })
            .open();
    };
});
