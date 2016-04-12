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

    function handler(id) {
        api.remove(id).fail(notifications.yell);
    }

    return function (id) {

        var model = api.pool.getModel(id),
            dialog = new dialogs.ModalDialog();

        function isShared() {
            if (model.get('permissions').length > 1) return true;
        }

        function assembleText() {
            var deleteNotice = gt('Do you really want to delete folder "%s"?', model.get('title')),
                shareNotice = gt('This folder is shared with others. It won\'t be available for the invited guests any more.');

            return isShared() ? deleteNotice + '\n' + shareNotice : deleteNotice;
        }

        dialog.text(assembleText())
        .addPrimaryButton('delete', gt('Delete'))
        .addButton('cancel', gt('Cancel'))
        .on('delete', function () {
            handler(id);
        })
        .show();

        dialog.getContentNode().find('h4').addClass('white-space');
    };
});
