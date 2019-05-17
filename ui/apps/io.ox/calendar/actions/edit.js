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

define('io.ox/calendar/actions/edit', [
    'io.ox/calendar/edit/main',
    'io.ox/calendar/api',
    'io.ox/core/notifications',
    'io.ox/calendar/util'
], function (m, api, notifications, util) {

    'use strict';

    return function (originalData) {

        var o = api.reduce(originalData);

        // allow editing the series on last occurence. This allows people to prolong the series by changing the rrule
        util.showRecurrenceDialog(originalData, { allowEditOnLastOccurence: true }).done(function (action) {
            if (action === 'cancel') return;
            // use series master for this and future
            if (action === 'series' || action === 'thisandfuture') {
                // edit the series, discard recurrenceId and reference to seriesId if exception
                delete o.recurrenceId;
                o.id = originalData.seriesId || originalData.id;
            }
            // disable cache with second param
            api.get(o, false).then(
                function (data) {
                    data = data.toJSON();
                    if (action === 'thisandfuture') data = util.createUpdateData(data, originalData);
                    if (m.reuse('edit', data, { action: action })) return;
                    m.getApp().launch().done(function () {
                        this.edit(data, { action: action });
                    });
                },
                notifications.yell
            );
        });
    };
});
