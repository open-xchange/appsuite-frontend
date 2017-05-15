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
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (api, dialogs, notifications, gt) {

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
            dialog = new dialogs.ModalDialog(),
            deleteNotice = gt('Do you really want to delete folder "%s"?', model.get('title')),
            shareNotice = gt('This folder is shared with others. It won\'t be available for them any more.');

        function isShared() {
            if (model.get('permissions').length > 1) return true;
        }

        dialog.text(deleteNotice)
        .append($('<p>').text(isShared() ? shareNotice : ''))
        .addPrimaryButton('delete', gt('Delete'))
        .addButton('cancel', gt('Cancel'))
        .on('delete', function () {
            handler(id, options);
        })
        .show();

        dialog.getContentNode().find('h4').addClass('white-space');
    };
});
