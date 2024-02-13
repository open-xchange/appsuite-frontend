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

define('plugins/administration/groups/settings/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/util',
    'plugins/administration/groups/settings/edit',
    'io.ox/core/api/group',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core'
], function (ext, ToolbarView, actionsUtil, edit, groupAPI, ModalDialog, gt) {

    'use strict';

    //
    // Actions
    //

    var Action = actionsUtil.Action;

    new Action('administration/groups/create', {
        action: function () {
            edit.open();
        }
    });

    new Action('administration/groups/edit', {
        collection: 'one',
        matches: function (baton) {
            // not allowed for "All users" (id=0) and "Guests" (id=2147483647)
            // Standard group" (id=1) can be edited
            var id = baton.first().id;
            return id !== 0 && id !== 2147483647;
        },
        action: function (baton) {
            var data = baton.first();
            edit.open({ id: data.id });
        }
    });

    new Action('administration/groups/delete', {
        collection: 'one',
        matches: function (baton) {
            // not allowed for "All users" (id=0), "Standard group" (id=1), and "Guests" (id=2147483647)
            var id = baton.first().id;
            return id !== 0 && id !== 1 && id !== 2147483647;
        },
        action: function (baton) {
            var id = baton.first().id, model = groupAPI.getModel(id);
            //#. 'Delete group' as header of a modal dialog to confirm to delete a group.
            //#. %1$s is the group name
            new ModalDialog({ title: gt('Delete group'), description: gt('Do you really want to delete the group "%1$s"? This action cannot be undone!', model.get('display_name')) })
                .addCancelButton()
                .addButton({ label: gt('Delete group'), action: 'delete' })
                .on('delete', function () { groupAPI.remove(id); })
                .open();
        }
    });

    //
    // Toolbar links
    //

    ext.point('administration/groups/toolbar/links').extend(
        {
            index: 100,
            prio: 'hi',
            id: 'create',
            title: gt('Create new group'),
            drawDisabled: true,
            ref: 'administration/groups/create'
        },
        {
            index: 200,
            prio: 'hi',
            id: 'edit',
            title: gt('Edit'),
            drawDisabled: true,
            ref: 'administration/groups/edit'
        },
        {
            index: 300,
            prio: 'hi',
            id: 'delete',
            title: gt('Delete'),
            drawDisabled: true,
            ref: 'administration/groups/delete'
        }
    );

    return {

        create: function () {

            var toolbar = new ToolbarView({ point: 'administration/groups/toolbar/links', simple: true });

            // data is array of strings; convert to objects
            toolbar.update = function (data) {
                toolbar.setData(_(data).map(function (id) { return { id: parseInt(id, 10) }; }));
                return this;
            };

            return toolbar;
        }
    };
});
