/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/month/print', [
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/print'
], function (api, util, print) {

    'use strict';

    function getFilter(start, end) {
        return function (event) {
            var eventStart = util.getMoment(event.get('startDate')).valueOf(),
                eventEnd = util.getMoment(event.get('endDate')).valueOf();

            // check if appointment is on that day
            if (eventEnd < start) return false;
            if (eventStart > end) return false;
            return true;
        };
    }

    function sortBy(event) {
        return util.isAllday(event) ? -1 : util.getMoment(event.get('startDate')).valueOf();
    }

    function map(event) {
        return {
            time: util.isAllday(event) ? undefined : util.getMoment(event.get('startDate')).format('LT'),
            title: event.get('summary')
        };
    }

    return {

        open: function (selection, win) {

            print.smart({
                selection: [selection.folders],

                get: function () {
                    var collection = api.getCollection({
                        start: selection.start,
                        end: selection.end,
                        folders: selection.folders,
                        view: 'month'
                    });
                    return collection.sync().then(function () {
                        var currentMonth = moment(selection.current).month(),
                            weekStart = moment(selection.start),
                            end = moment(selection.end),
                            weeks = [];

                        // loop over weeks
                        for (;end.diff(weekStart) > -1; weekStart.add(1, 'week')) {
                            var start = weekStart.clone(),
                                weekEnd = weekStart.clone().add(1, 'week'),
                                days = [];

                            // loop over days
                            for (;weekEnd.diff(start) > 0; start.add(1, 'day')) {
                                var dayStart = start.valueOf(),
                                    dayEnd = start.clone().add(1, 'day').valueOf();
                                days.push({
                                    date: start.date(),
                                    events: collection
                                        .chain()
                                        .filter(getFilter(dayStart, dayEnd))
                                        .sortBy(sortBy)
                                        .map(map)
                                        .value(),
                                    className: start.month() === currentMonth ? 'in' : 'out'
                                });
                            }

                            weeks.push({
                                days: days
                            });
                        }
                        return weeks;
                    });
                },

                meta: {
                    labels: _(_.range(7)).map(function (num) {
                        return moment().weekday(num).format('dddd');
                    }),
                    title: selection.title + ' - ' + moment(selection.current).format('MMMM YYYY')
                },

                selector: '.calendar-month-view',

                window: win
            });
        }
    };

});
