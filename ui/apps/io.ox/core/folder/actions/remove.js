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

define('io.ox/core/folder/actions/remove', [
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (api, ModalDialog, notifications, gt) {

    'use strict';

    function handler(id, options) {
        api.remove(id, options).fail(function (error) {
            // special errormessage, backend message will confuse user (reads could not create folder on a remove action)
            // happens when yu try to delete a special system folder from an external account
            if (error && error.code === 'IMAP-2015') {
                notifications.yell('error', gt('Could not delete folder. This can be due to insufficient permissions in your trash folder or this might be a special folder that cannot be deleted.'));
                return;
            }
            notifications.yell(error);
        });
    }

    return function (id, options) {

        var model = api.pool.getModel(id),
            deleteNotice = model.get('module') === 'calendar' ? gt('Do you really want to delete calendar "%s"?', model.get('title')) : gt('Do you really want to delete folder "%s"?', model.get('title')),
            shareNotice = model.get('module') === 'calendar' ? gt('This calendar is shared with others. It won\'t be available for them any more.') : gt('This folder is shared with others. It won\'t be available for them any more.');

        //#. 'Delete calendar' as header of modal dialog to delete a shared calendar.
        new ModalDialog({ title: gt('Delete calendar'), description: model.get('permissions').length > 1 ? shareNotice : deleteNotice })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'delete' })
            .on('delete', function () { handler(id, options); })
            .open();
    };
});
