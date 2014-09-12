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

        var model = api.pool.getModel(id);

        new dialogs.ModalDialog()
        .text(gt('Do you really want to delete folder "%s"?', model.get('title')))
        .addPrimaryButton('delete', gt('Delete'))
        .addButton('cancel', gt('Cancel'))
        .on('delete', function () {
            handler(id);
        })
        .show();
    };
});
