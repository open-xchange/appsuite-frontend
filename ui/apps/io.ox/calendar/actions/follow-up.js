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

define('io.ox/calendar/actions/follow-up', [
    'io.ox/calendar/util'
], function (util) {

    'use strict';

    return function (model) {

        // reduce data
        var copy = model.pick(
            'color class folder location description participants attendees transp summary'.split(' ')
        );

        // check isBefore once for the startDate; then reuse that information for endDate (see bug 44647)
        var needsShift = false,
            isAllday = util.isAllday(model),
            format = isAllday ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';

        // copy date/time
        ['startDate', 'endDate'].forEach(function (field) {
            var ref = model.getMoment(field),
                // set date to today, keep time, then use same weekday
                d = moment({ hour: ref.hour(), minute: ref.minute() }).weekday(ref.weekday()),
                target = moment.max(d, ref);

            // shift about one week?
            if (needsShift || target.isBefore(moment()) || target.isSameOrBefore(ref)) {
                target.add(1, 'w');
                needsShift = true;
            }
            copy[field] = { value: target.format(format), tzid: model.get(field).tzid };
        });

        // clean up attendees (remove confirmation status comments etc)
        copy.attendees = _(copy.attendees).map(function (attendee) {
            var temp = _(attendee).pick('cn', 'cuType', 'email', 'uri', 'entity', 'contact');
            // resources are always set to accepted
            if (temp.cn === 'RESOURCE') {
                temp.partStat = 'ACCEPTED';
                if (attendee.comment) temp.comment = attendee.comment;
            } else {
                temp.partStat = 'NEEDS-ACTION';
            }
            return temp;
        });

        // use ox.launch to have an indicator for slow connections
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(copy);
            });
        });
    };
});
