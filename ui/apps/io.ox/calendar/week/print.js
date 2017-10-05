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

define('io.ox/calendar/week/print', [
    'io.ox/calendar/chronos-api',
    'io.ox/calendar/chronos-util',
    'io.ox/calendar/util',
    'io.ox/core/print',
    'settings!io.ox/calendar'
], function (api, chronosUtil, util, print, settings) {

    'use strict';

    function getMoment(event, attribute) {
        return moment.tz(event[attribute].value, event[attribute].tzid || moment().tz());
    }

    function getFilter(start, end) {
        return function (event) {
            var eventStart = getMoment(event, 'startDate').valueOf(),
                eventEnd = getMoment(event, 'endDate').valueOf();

            if (eventEnd <= start) return false;
            if (eventStart >= end) return false;
            return true;
        };
    }

    function sortBy(event) {
        return chronosUtil.isAllday(event) ? -1 : getMoment(event, 'startDate').valueOf();
    }

    function getIntersection(event, list) {
        var intersecting = _(list).filter(function (ev) {
            if (getMoment(event, 'endDate').valueOf() <= getMoment(ev, 'startDate').valueOf()) return false;
            if (getMoment(event, 'startDate').valueOf() >= getMoment(ev, 'endDate').valueOf()) return false;
            return true;
        });
        return {
            size: intersecting.length,
            index: intersecting.indexOf(event)
        };
    }

    function getMap(dayStart, minHour, maxHour) {
        return function (event, index, list) {
            var parts = [],
                isAllday = chronosUtil.isAllday(event),
                intersection = getIntersection(event, list),
                startDate = moment.max(getMoment(event, 'startDate'), dayStart),
                endDate = getMoment(event, 'endDate'),
                startRange = Math.max(startDate.hour(), minHour),
                endRange = Math.max(startDate.hour() + 1, startDate.hour() + endDate.diff(startDate, 'hours') + 1);

            if (isAllday) endRange = startDate.hour() + 1;
            if (endRange > maxHour) endRange = maxHour;

            _.range(startRange, endRange).forEach(function (hour) {
                var top = startDate.minutes() + (startRange - hour) * 60;
                parts.push({
                    isAllday: isAllday,
                    hour: isAllday ? 'allDay' : hour,
                    left: 100 * intersection.index / intersection.size,
                    width: 100 / intersection.size,
                    top: top,
                    height: Math.min((endRange - startRange) * 60, Math.max(15, endDate.diff(startDate, 'minutes') - (startRange - startDate.hour()) * 60)),
                    time: startDate.format('LT'),
                    title: event.summary
                });
            });
            return parts;
        };
    }

    function groupBy(event) {
        return event.hour;
    }

    return {

        open: function (selection, win) {

            print.smart({
                selection: [selection.folder],

                get: function () {
                    return api.getAll({
                        start: selection.start,
                        end: selection.end,
                        folder: selection.folder
                    }).then(function (events) {
                        var weekStart = moment(selection.start),
                            weekEnd = moment(selection.end),
                            days = [],
                            minHour = Number.MAX_SAFE_INTEGER, maxHour = Number.MIN_SAFE_INTEGER;
                        events.forEach(function (event) {
                            minHour = Math.min(Math.min(minHour, getMoment(event, 'startDate').hour()), getMoment(event, 'endDate').hour());
                            maxHour = Math.max(Math.max(maxHour, getMoment(event, 'startDate').hour()), getMoment(event, 'endDate').hour());
                        });
                        minHour = Math.max(0, Math.min(parseInt(settings.get('startHour', 8), 10), minHour - 1));
                        maxHour = Math.min(24, Math.max(parseInt(settings.get('endHour', 18), 10), maxHour + 2));

                        for (;weekEnd.diff(weekStart) > 0; weekStart.add(1, 'day')) {

                            var dayStart = weekStart.valueOf(),
                                dayEnd = weekStart.clone().add(1, 'day').valueOf();
                            days.push({
                                start: minHour,
                                end: maxHour,
                                date: weekStart.date(),
                                slots: _(events)
                                    .chain()
                                    .filter(getFilter(dayStart, dayEnd))
                                    .sortBy(sortBy)
                                    .map(getMap(weekStart, minHour, maxHour))
                                    .flatten()
                                    .groupBy(groupBy)
                                    .value()
                            });
                        }

                        return days;
                    });
                },

                meta: {
                    title: selection.title + ': ' + moment(selection.start).formatInterval(moment(selection.end), 'date'),
                    timeLabels: _.range(24).map(function (hour) {
                        return {
                            value: hour,
                            label: moment().startOf('hour').hour(hour).format('LT')
                        };
                    }),
                    weekdays: _.range(moment(selection.start).day(), moment(selection.end).subtract(1).day() + 1).map(function (index) {
                        return moment().day(index).format('dddd');
                    })
                },

                selector: '.calendar-week-view',

                window: win
            });
        }
    };

});
