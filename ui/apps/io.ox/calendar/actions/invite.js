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

define('io.ox/calendar/actions/invite', ['settings!io.ox/calendar'], function (settings) {

    'use strict';

    return function (data) {

        // use ox.launch to have an indicator for slow connections
        ox.launch('io.ox/calendar/edit/main').done(function () {

            // include external organizer
            var attendees = data.attendees;
            if (!data.organizer.entity && _.isString(data.organizer.cn)) {
                data.organizer.partStat = 'NEEDS-ACTION';
                attendees.unshift(data.organizer);
            }
            // open create dialog with same participants
            data = {
                folder: settings.get('chronos/defaultFolderId'),
                attendees: attendees,
                startDate: { value: moment().startOf('hour').format('YYYYMMDD[T]HHmmss'), tzid: moment().tz() },
                endDate: { value: moment().startOf('hour').add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: moment().tz() }
            };
            this.create(data);
        });
    };
});
