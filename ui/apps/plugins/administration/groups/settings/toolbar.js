/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/administration/groups/settings/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/util',
    'plugins/administration/groups/settings/edit',
    'io.ox/core/api/group',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core'
], function (ext, ToolbarView, actionsUtil, edit, groupAPI, dialogs, gt) {

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
            new dialogs.ModalDialog()
            .text(
                //#. %1$s is the group name
                gt('Do you really want to delete the group "%1$s"? This action cannot be undone!', model.get('display_name'))
            )
            .addPrimaryButton('delete', gt('Delete group'), 'delete')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .on('delete', function () {
                groupAPI.remove(id);
            })
            .show();
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
