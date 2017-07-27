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

define('io.ox/calendar/actions/follow-up', function () {

    'use strict';

    return function (model) {

        // reduce data
        var copy = model.pick(
            'alarms color folder allDay location description participants attendees transp summary'.split(' ')
        );

        // check isBefore once for the startDate; then reuse that information for endDate (see bug 44647)
        var isBefore = false;

        // copy date/time
        ['startDate', 'endDate'].forEach(function (field) {
            var ref = model.getMoment(field),
                // set date to today, keep time, then use same weekday
                d = moment({ hour: ref.hour(), minute: ref.minute() }).weekday(ref.weekday());
            // add 1 week if date is in the past
            if (isBefore || d.isBefore(moment())) {
                d.add(1, 'w');
                isBefore = true;
            }
            // TODO consider date without time here. We need a general solution for that
            copy[field] = { value: d.format('YYYYMMDD[T]HHmmss'), tzid: d._z ? d._z.name : undefined };
        });

        // use ox.launch to have an indicator for slow connections
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(copy);
            });
        });
    };
});
