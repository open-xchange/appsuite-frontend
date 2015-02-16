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

define('io.ox/core/folder/actions/archive', [
    'io.ox/mail/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (api, dialogs, yell, gt) {

    'use strict';

    var DAYS = 90;

    function handler(id) {

        //#. notification while archiving messages
        yell('busy', gt('Archiving messages ...'));

        api.archiveFolder(id).then(yell.done, yell);
    }

    return function (id) {

        new dialogs.ModalDialog()
        .header(
            $('<h4>').text(gt('Archive messages'))
        )
        .append(
            $.txt(gt('All messages older than %1$d days will be moved to the archive folder', DAYS) + '.')
        )
        //#. Verb: (to) archive messages
        .addPrimaryButton('archive', gt.pgettext('verb', 'Archive'))
        .addButton('cancel', gt('Cancel'))
        .on('archive', function () {
            handler(id);
        })
        .show();
    };
});
