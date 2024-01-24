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

define('io.ox/files/actions/edit-description', [
    'io.ox/files/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, ModalDialog, notifications, gt) {

    'use strict';

    return function (data) {
        new ModalDialog({ title: gt('Description') })
            .build(function () {
                this.$body.append(
                    this.$textarea = $('<textarea rows="10" class="form-control" maxlength="65535" >').val(data.description)
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' })
            .on('save', function () {
                return api.update(data, { description: this.$textarea.val() }).fail(function (error) {
                    // too long description
                    //#. %1$d: max number of characters
                    if (error.code === 'IFO-0100' && error.truncated.toString() === '706') return notifications.yell('error', gt('File description can only be %1$d characters long.', error.problematic[0].max_size));
                    notifications.yell(error);
                });
            })
            .open();
    };
});
