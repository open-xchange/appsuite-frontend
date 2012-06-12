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

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'dot!io.ox/calendar/month/template.html',
     'io.ox/core/date',
     'gettext!io.ox/calendar/view',
     'less!io.ox/calendar/month/style.css'], function (util, tmpl, date, gt) {

    'use strict';

    return {

        drawScaffold: function (main) {

            var days = date.locale.days;
            days = days.slice(1).concat(days[0]);
            return tmpl.render('scaffold', { days: days });
        },

        drawMonth: function (timestamp) {

            var month = $('<div class="month">'),
                list = util.getMonthScaffold(timestamp);

            _(list).each(function (weeks) {
                var week = $('<div class="week">').appendTo(month);
                _(weeks).each(function (day) {
                    console.log('DAY', day);
                    week.append(tmpl.render('day', day));
                });
            });

            month.append(
                $('<div class="vertical-name">').text('June 2012')
            );

            return month;
        },

        drawAppointment: function (a) {
            return tmpl.render('appointment', {
                cid: _.cid(a),
                start: util.getTime(a.start_date),
                subject: a.title,
                shownAs: util.getShownAsClass(a)
            });
        }
    };
});