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

define('plugins/administration/resources/settings/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/util',
    'plugins/administration/resources/settings/edit',
    'io.ox/core/api/resource',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core'
], function (ext, ToolbarView, actionsUtil, edit, resourceAPI, dialogs, gt) {

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
            new dialogs.ModalDialog()
            .text(
                //#. %1$s is the resource name
                gt('Do you really want to delete the resource "%1$s"? This action cannot be undone!', model.get('display_name'))
            )
            .addPrimaryButton('delete', gt('Delete resource'), 'delete')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .on('delete', function () {
                resourceAPI.remove(id);
            })
            .show();
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
