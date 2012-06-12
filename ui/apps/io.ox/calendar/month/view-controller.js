/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view-controller',
    ['io.ox/calendar/util',
     'io.ox/calendar/api',
     'gettext!io.ox/calendar/month/view',
     'less!io.ox/calendar/month/style.css'], function (util, api, gt) {

    'use strict';

    return new ox.ui.WindowView('month-view', function (main) {

        var drawTs = _.now(),
            drawDate = new Date(drawTs),
            list = util.getMonthScaffold(drawTs),
            appointmentFilter = {},
            drawMonth = drawDate.getUTCMonth();

        var calendarCheck = $('ol.calendar', main),
            render = false,
            monthView, prevMonth, thisMonth, nextMonth;

        if (!calendarCheck || calendarCheck.length === 0) {
            render = true;

            monthView = $('<ol>', {"class": "calendar", "start": drawMonth});
            prevMonth = $('<ol>', {"class": "lastmonth"});
            thisMonth = $('<ol>', {"class": "thismonth"});
            nextMonth = $('<ol>', {"class": "nextmonth"});

            monthView.append($('<li>').append(prevMonth))
                .append($('<li>').append(thisMonth))
                .append($('<li>').append(nextMonth));
        }

        _(list).each(function (weeks) {
            _(weeks).each(function (day) {
                var actualList;

                if (!appointmentFilter.start) {
                    appointmentFilter.start = day.timestamp;
                }
                appointmentFilter.end = day.timestamp;

                if (day.month < drawDate.getUTCMonth()) {
                    actualList = prevMonth;
                    if (prevMonth && !prevMonth.attr('start')) {
                        prevMonth.attr('start', day.date);
                    }
                } else if (day.month > drawDate.getUTCMonth()) {
                    actualList = nextMonth;
                } else {
                    actualList = thisMonth;
                }

                if (render) {
                    var actualDay = $("<li>", {"class": "calendarday day" + day.year + '-' + day.month + '-' + day.date});
                    actualDay.data('date', day);
                    actualDay.text(day.date + '.' + (day.month + 1));

                    actualList.append(actualDay);
                }
            });
        });

        // add the data to the calendar
        api.getAll(appointmentFilter).done(function (appointments) {
            _(appointments).each(function (appointment) {

                var appointmentId = 'appointment_' + appointment.folder_id + '_' + appointment.id,
                    appointmentDate = new Date(appointment.start_date),
                    dateStr = appointmentDate.getUTCFullYear() + '-' + appointmentDate.getUTCMonth() + '-' + appointmentDate.getUTCDate(),
                    liItem = $('.calendarday.day' + dateStr, main),
                    appointmentCheck = $('.day' + dateStr + ' .' + appointmentId, main);

                if (!appointmentCheck || appointmentCheck.length === 0) {
                    liItem.append($('<p>', {'class': 'appointmentItem ' + appointmentId}).data('appointment', appointment).text(appointment.title));
                }
            });

        });

        if (render) {
            main.append(monthView);
            main.scrollable();
        }
    });
});
