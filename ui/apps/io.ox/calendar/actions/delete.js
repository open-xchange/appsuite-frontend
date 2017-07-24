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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/delete', [
    'io.ox/calendar/chronos-api',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar'
], function (api, notifications, gt) {

    'use strict';

    return function (list) {
        // only simple delete for now
        // TODO make it work for recurring appointments
        ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {

            var cont = function () {
                api.remove(list).fail(notifications.yell);
            };

            // different warnings especially for events with
            // recurrence_type > 0 should handled here
            if (false) {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to delete the whole series or just one appointment within the series?'))
                    .addPrimaryButton('series', gt('Series'), 'series')
                    .addButton('appointment', gt('Appointment'), 'appointment')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont(action === 'series');
                    });
            } else {
                new dialogs.ModalDialog()
                    .text(gt('Do you want to delete this appointment?'))
                    .addPrimaryButton('ok', gt('Delete'), 'ok')
                    .addButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont();
                    });
            }
        });
    };

});
