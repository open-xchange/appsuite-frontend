/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions/create', [
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/api/user',
    'io.ox/contacts/util',
    'gettext!io.ox/calendar',
    'settings!io.ox/core'
], function (api, dialogs, userAPI, util, gt, settings) {

    'use strict';

    function openEditDialog(params) {
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(params);
            });
        });
    }

    function showDialog(params, folder) {

        userAPI.get({ id: folder.created_by }).done(function (user) {

            var fullname = util.getFullName(user);

            new dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Appointments in shared calendars'))
            )
            .build(function () {
                this.getContentNode().append(
                    $('<p>').text(gt('The selected calendar is shared by %1$s. Appointments in shared calendars will generally be created on behalf of the owner.', fullname) + ' '),
                    $('<p>').html(gt('Do you really want to create an appointment <b>on behalf of the folder owner</b> or do you want to create an appointment <b>with the folder owner</b> in your own calendar?'))
                );
            })
            .addPrimaryButton('behalf', gt('On behalf of the owner'))
            .addButton('invite', gt('Invite owner'))
            .addAlternativeButton('cancel', gt('Cancel'))
            .on('behalf', function () {
                openEditDialog(params);
            })
            .on('invite', function () {
                params.participants = [{ id: user.id, type: 1 }];
                params.folder_id = settings.get('folders/calendar');
                openEditDialog(params);
            })
            .show();
        });
    }

    return function (baton, obj) {

        // FIXME: if this action is invoked by the menu button, both
        // arguments are the same (the app)
        var params = {
            folder_id: baton.app.folder.get(),
            participants: []
        };

        if (obj && obj.start_date) {
            _.extend(params, obj);
        }

        // show warning for shared folders
        api.get(params.folder_id).done(function (folder) {
            if (api.is('shared', folder)) showDialog(params, folder); else openEditDialog(params);
        });
    };
});
