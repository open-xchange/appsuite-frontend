/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/week/print', [
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/print',
    'settings!io.ox/calendar',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (api, util, print, settings, folderAPI, gt) {

    'use strict';

    function getFilter(start, end) {
        return function (event) {
            var eventStart = util.getMomentInLocalTimezone(event.get('startDate')).valueOf(),
                eventEnd = util.getMomentInLocalTimezone(event.get('endDate')).valueOf();

            if (eventEnd <= start) return false;
            if (eventStart >= end) return false;
            return true;
        };
    }

    function sortBy(event) {
        return util.isAllday(event) ? -1 : util.getMomentInLocalTimezone(event.get('startDate')).valueOf();
    }

    function getIntersection(event, list) {
        var intersecting = _(list).filter(function (ev) {
            var aStart = util.getMomentInLocalTimezone(event.get('startDate')).valueOf(),
                // make sure an appointment lasts at least 30 minutes
                aEnd = moment.max(moment(aStart).add(30, 'minutes'), util.getMomentInLocalTimezone(event.get('endDate'))).valueOf(),
                bStart = util.getMomentInLocalTimezone(ev.get('startDate')).valueOf(),
                // make sure an appointment lasts at least 30 minutes
                bEnd = moment.max(moment(bStart).add(30, 'minutes'), util.getMomentInLocalTimezone(ev.get('endDate'))).valueOf();
            if (util.isAllday(event)) return false;
            if (util.isAllday(ev)) return false;
            if (aEnd <= bStart) return false;
            if (aStart >= bEnd) return false;
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
                isAllday = util.isAllday(event),
                intersection = getIntersection(event, list),
                startDate = moment.max(util.getMomentInLocalTimezone(event.get('startDate')), dayStart),
                // make sure appointment lasts at least 30 minutes
                endDate = moment.max(startDate.clone().add(30, 'minutes'), util.getMomentInLocalTimezone(event.get('endDate'))),
                startRange = Math.max(startDate.hour(), minHour),
                // appointment ends at a full hour => no need for an additional slot.
                // appointment ends somewhere inside an hour => make sure this slot is included
                // see OXUIB-973
                endRange = Math.max(startDate.hour() + 1, endDate.hour() + (endDate.minutes() === 0 ? 0 : 1));

            if (isAllday) endRange = startDate.hour() + 1;
            if (endRange > maxHour) endRange = maxHour;

            _.range(startRange, endRange).forEach(function (hour) {
                var top = startDate.minutes() + (startRange - hour) * 60,
                    folder = folderAPI.pool.models[event.get('folder')],
                    // if declined use base grey color
                    color = util.getAppointmentColor(folder.attributes, event) || '#e8e8e8';

                parts.push({
                    isAllday: isAllday,
                    hour: isAllday ? 'allDay' : hour,
                    left: 100 * intersection.index / intersection.size,
                    width: 100 / intersection.size,
                    top: top,
                    height: Math.min((endRange - startRange) * 60, Math.max(15, endDate.diff(startDate, 'minutes') - (startRange - startDate.hour()) * 60)),
                    time: startDate.format('LT'),
                    title: event.get('summary'),
                    color: util.getForegroundColor(color),
                    backgroundColor: color
                });
            });
            return parts;
        };
    }

    function groupBy(event) {
        return event.hour;
    }

    function getDate(data) {
        var strings = util.getDateTimeIntervalMarkup(data, { output: 'strings', zone: moment().tz() });
        return strings.dateStr + ' ' + strings.timeStr;
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
                        view: 'week'
                    });
                    return collection.sync().then(function () {
                        var weekStart = moment(selection.start),
                            weekEnd = moment(selection.end),
                            days = [],
                            minHour = 10000000, maxHour = -10000000;
                        collection.forEach(function (event) {
                            minHour = Math.min(Math.min(minHour, util.getMomentInLocalTimezone(event.get('startDate')).hour()), util.getMomentInLocalTimezone(event.get('endDate')).hour());
                            maxHour = Math.max(Math.max(maxHour, util.getMomentInLocalTimezone(event.get('startDate')).hour()), util.getMomentInLocalTimezone(event.get('endDate')).hour());
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
                                list: _(collection.toJSON()).map(function (event) {
                                    return {
                                        summary: event.summary,
                                        location: event.location,
                                        date: getDate(event)
                                    };
                                }),
                                slots: collection
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
                    // subtract a day to avoid confusion. Week from Monday 2nd to Sunday 8th would show till 9th instead
                    title: selection.title + ': ' + moment(selection.start).formatInterval(moment(selection.end).subtract(1, 'day'), 'date'),
                    timeLabels: _.range(24).map(function (hour) {
                        return {
                            value: hour,
                            label: moment().startOf('hour').hour(hour).format('LT')
                        };
                    }),
                    weekdays: _.range(0, selection.numberOfColumns || 7).map(function (index) {
                        return moment(selection.start).startOf('day').add(index, 'days').format('dddd');
                    }),
                    eventListLabel: gt('Appointments')
                },

                selector: '.calendar-week-view',

                window: win
            });
        }
    };

});
