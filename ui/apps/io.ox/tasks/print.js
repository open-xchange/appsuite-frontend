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

define('io.ox/tasks/print', [
    'io.ox/core/print',
    'io.ox/calendar/print',
    'io.ox/tasks/api',
    'io.ox/tasks/util',
    'io.ox/calendar/util',
    'gettext!io.ox/tasks'
], function (print, calendarPrint, api, util, calendarUtil, gt) {

    'use strict';

    function getDate(data, prop, format) {
        var t = data[prop];
        // setting right format and timezone
        return _.isNumber(t) ? moment(t).format(format) : '';
    }

    var states = { 1: gt('Not started'), 2: gt('In progress'), 3: gt('Done'), 4: gt('Waiting'), 5: gt('Deferred') },
        priorities = { 1: gt('Low'), 2: gt('Medium'), 3: gt('High') };

    function getState(data) {
        if (data.status === 2) {
            return '<b>' + states[data.status] + '</b>, ' + gt('Progress') + ': ' + (data.percent_completed || 0) + '%';
        }
        return '<b>' + states[data.status] + '</b>';
    }

    function getPriority(data) {
        if (data.priority) {
            return priorities[data.priority];
        }
        //use medium priority as default
        return priorities[1];
    }

    function process(data) {
        return calendarPrint.load(data).then(function (unified) {
            return _.extend(unified, {
                original: data,
                subject: data.title,
                start: getDate(data, 'start_time', 'l'),
                due: getDate(data, 'end_time', 'l'),
                recurrence: calendarUtil.getRecurrenceString(data),
                state: getState(data),
                content: $.trim(data.note),
                target_duration: data.target_duration,
                actual_duration: data.actual_duration,
                target_costs: data.target_costs,
                actual_costs: data.actual_costs,
                priority: getPriority(data),
                currency: data.currency,
                trip_meter: data.trip_meter,
                billing_information: data.billing_information,
                companies: data.companies,
                date_completed: getDate(data, 'date_completed', 'l LT'),
                alarm: getDate(data, 'alarm', 'l LT')
            });
        });
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(obj);
                },

                title: selection.length === 1 ? selection[0].title : undefined,

                i18n: {
                    due: gt('Due'),
                    start: gt('Start'),
                    accepted: gt('Accepted'),
                    declined: gt('Declined'),
                    tentative: gt('Tentatively accepted'),
                    unconfirmed: gt('Unconfirmed'),
                    target_duration: gt('Estimated duration in minutes'),
                    actual_duration: gt('Actual duration in minutes'),
                    target_costs: gt('Estimated costs'),
                    actual_costs: gt('Actual costs'),
                    trip_meter: gt('Distance'),
                    billing_information: gt('Billing information'),
                    companies: gt('Companies'),
                    date_completed: gt('Date completed'),
                    alarm: gt('Reminder date'),
                    priority: gt('Priority'),
                    recurrence: gt('This task recurs')
                },

                process: process,
                selection: selection,
                selector: '.task',
                window: win
            });
        }
    };
});
