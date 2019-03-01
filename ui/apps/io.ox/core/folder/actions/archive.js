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
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'settings!io.ox/mail',
    'gettext!io.ox/core'
], function (api, ModalDialog, yell, settings, gt) {

    'use strict';

    return function (id) {

        var days = settings.get('archive/days');
        days = _.isNumber(days) && days > 1 ? days : 90;

        new ModalDialog({ title: gt('Archive messages'), description: gt('All messages older than %1$d days will be moved to the archive folder', days) + '.' })
            .addCancelButton()
            //#. Verb: (to) archive messages
            .addButton({ label: gt.pgettext('verb', 'Archive'), action: 'archive' })
            .on('archive', function () {
                //#. notification while archiving messages
                yell('busy', gt('Archiving messages ...'));
                api.archiveFolder(id, { days: days }).then(yell.done, yell);
            })
            .open();
    };
});
