/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/folder/actions/rename', [
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (api, ModalDialog, ext, yell, gt) {

    'use strict';

    function handler(id, changes) {

        var invalid = false;

        // check for valid folder name
        ext.point('io.ox/core/filename')
            .invoke('validate', null, changes.title, 'folder')
            .find(function (result) {
                if (result !== true) {
                    yell('warning', result);
                    return (invalid = true);
                }
            });

        if (invalid) return $.Deferred().reject();

        return api.update(id, changes).fail(yell);
    }

    return function (id) {

        var model = api.pool.getModel(id);

        if (model.get('standard_folder')) {
            yell('error', gt('This is a standard folder, which can\'t be renamed.'));
            return;
        }

        new ModalDialog({ title: gt('Rename folder'), async: true, width: 400, enter: 'rename' })
            .build(function () {
                this.$body.append(
                    this.$input = $('<input class="form-control" type="text">')
                        .attr({ placeholder: gt('Folder name'), 'aria-labelledby': this.$title.attr('id') })
                        .val(model.get('title'))
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Rename'), action: 'rename' })
            .on('rename', function () { handler(id, { title: this.$input.val() }).then(this.close, this.idle); })
            .open();
    };
});
