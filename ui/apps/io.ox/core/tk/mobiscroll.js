/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/mobiscroll',
    ['apps/mobiscroll/js/mobi.js',
     'gettext!io.ox/core',
     'io.ox/core/date',
     'css!mobiscroll/css/mobiscroll.core.css',
     'css!mobiscroll/css/mobiscroll.ios7.css'
    ], function (mobi, gt, date) {

    'use strict';

    var settings = {},
        set = false;

    //put some defaults in to reduce code duplications
    if ($.mobiscroll && !set) {
        settings = {
            dateOrder: date.getFormat(date.DATE).replace(/\W/g, '').toLowerCase(),
            dateFormat: date.getFormat(date.DATE).replace(/\by\b/, 'yy').toLowerCase(),
            timeFormat: date.getFormat(date.TIME).replace(/m/g, 'i').replace(/a/g, 'A'),
            monthNamesShort: date.locale.monthsShort,
            setText: gt('Ok'),
            cancelText: gt('Cancel'),
            minuteText: gt('Minutes'),
            hourText: gt('Hours'),
            dayText: gt('Days'),
            monthText: gt('Months'),
            yearText: gt('Years'),
            showLabel: true,
            separator: ' ',
            display: 'bottom',
            endYear: new Date().getFullYear() + 100,
            theme: 'ios7'
        };
        settings.timeWheels = settings.timeFormat.replace(/\W/g, '');
        set = true;
    }

    return settings;
});
