/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/tasks/print',
    ['io.ox/core/print',
     'io.ox/calendar/print',
     'io.ox/tasks/api',
     'io.ox/tasks/util',
     'io.ox/core/date',
     'gettext!io.ox/tasks'], function (print, calendarPrint, api, util, date, gt) {

    'use strict';

    function getDate(data, prop) {
        var t = data[prop];
        return _.isNumber(t) ? new date.Local(date.Local.utc(t)).format(date.DATE) : '';
    }

    var states = { 1: gt('Not started'), 2: gt('In progress'), 3: gt('Done'), 4: gt('Waiting'), 5: gt('Deferred') };

    function getState(data) {
        if (data.status === 2) {
            return '<b>' + states[data.status] + '</b>, ' + gt('Progress') + ': ' + (data.percent_completed || 0) + '%';
        } else {
            return '<b>' + states[data.status] + '</b>';
        }
    }

    function process(data) {
        return calendarPrint.load(data).pipe(function (unified) {
            console.log('tasks', unified, data);
            return _.extend(unified, {
                original: data,
                subject: data.title,
                location: $.trim(data.location),
                start: getDate(data, 'start_date'),
                due: getDate(data, 'end_date'),
                state: getState(data),
                content: $.trim(data.note)
            });
        });
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(obj);
                },

                i18n: {
                    due: gt('Due'),
                    start: gt('Start'),
                    accepted: gt('Accepted'),
                    declined: gt('Declined'),
                    tentative: gt('Tentatively accepted'),
                    unconfirmed: gt('Unconfirmed')
                },

                file: 'print.html',
                process: process,
                selection: selection,
                selector: '.task',
                window: win
            });
        }
    };
});
