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

    return function (data) {

        // reduce data
        var copy = _(data).pick(
            'alarm color_label folder_id full_time location note participants private_flag shown_as title'.split(' ')
        );

        // check isBefore once for the start_date; then reuse that information for end_date (see bug 44647)
        var isBefore = false;

        // copy date/time
        ['start_date', 'end_date'].forEach(function (field) {
            var ref = moment(data[field]),
                // set date to today, keep time, then use same weekday
                d = moment({ hour: ref.hour(), minute: ref.minute() }).weekday(ref.weekday());
            // add 1 week if date is in the past
            if (isBefore || d.isBefore(moment())) {
                d.add(1, 'w');
                isBefore = true;
            }
            copy[field] = d.valueOf();
        });

        // use ox.launch to have an indicator for slow connections
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(copy);
            });
        });
    };
});
