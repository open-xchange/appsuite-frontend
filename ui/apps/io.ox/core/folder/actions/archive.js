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

define('io.ox/core/folder/actions/archive', [
    'io.ox/mail/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/core'
], function (api, dialogs, yell, settings, gt) {

    'use strict';

    return function (id) {

        var days = getDays();

        new dialogs.ModalDialog()
        .header(
            $('<h4>').text(gt('Archive messages'))
        )
        .append(
            $.txt(gt('All messages older than %1$d days will be moved to the archive folder', days) + '.')
        )
        //#. Verb: (to) archive messages
        .addPrimaryButton('archive', gt.pgettext('verb', 'Archive'))
        .addButton('cancel', gt('Cancel'))
        .on('archive', function () {
            handler(id, days);
        })
        .show();
    };

    function getDays() {
        var days = settings.get('archive/days');
        return _.isNumber(days) && days > 1 ? days : 90;
    }

    function handler(id, days) {
        //#. notification while archiving messages
        yell('busy', gt('Archiving messages ...'));
        api.archiveFolder(id, { days: days }).then(yell.done, yell);
    }
});
