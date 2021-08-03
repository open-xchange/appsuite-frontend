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

define('plugins/administration/resources/settings/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/util',
    'plugins/administration/resources/settings/edit',
    'io.ox/core/api/resource',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core'
], function (ext, ToolbarView, actionsUtil, edit, resourceAPI, ModalDialog, gt) {

    'use strict';

    //
    // Actions
    //

    var Action = actionsUtil.Action;

    new Action('administration/resources/create', {
        action: function () {
            edit.open();
        }
    });

    new Action('administration/resources/edit', {
        collection: 'one',
        action: function (baton) {
            var data = baton.first();
            edit.open({ id: data.id });
        }
    });

    new Action('administration/resources/delete', {
        collection: 'one',
        action: function (baton) {
            var id = baton.first().id, model = resourceAPI.getModel(id);
            //#. 'Delete resource' as heade of a modal dialog to confirm to delete a resource
            //#. %1$s is the resource name
            new ModalDialog({ title: gt('Delete resource'), description: gt('Do you really want to delete the resource "%1$s"? This action cannot be undone!', model.get('display_name')) })
                .addCancelButton()
                .addButton({ label: gt('Delete resource'), action: 'delete' })
                .on('delete', function () { resourceAPI.remove(id); })
                .open();
        }
    });

    //
    // Toolbar links
    //

    ext.point('administration/resources/toolbar/links').extend(
        {
            index: 100,
            prio: 'hi',
            id: 'create',
            title: gt('Create new resource'),
            drawDisabled: true,
            ref: 'administration/resources/create'
        },
        {
            index: 200,
            prio: 'hi',
            id: 'edit',
            title: gt('Edit'),
            drawDisabled: true,
            ref: 'administration/resources/edit'
        },
        {
            index: 300,
            prio: 'hi',
            id: 'delete',
            title: gt('Delete'),
            drawDisabled: true,
            ref: 'administration/resources/delete'
        }
    );

    return {

        create: function () {

            var toolbar = new ToolbarView({ point: 'administration/resources/toolbar/links', simple: true });

            // data is array of strings; convert to objects
            toolbar.update = function (data) {
                toolbar.setData(_(data).map(function (id) { return { id: parseInt(id, 10) }; }));
                return this;
            };

            return toolbar;
        }
    };
});
