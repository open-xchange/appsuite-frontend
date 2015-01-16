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

define('io.ox/core/tk/mobiscroll', [
    'gettext!io.ox/core',
    'io.ox/core/date',
    'static/3rd.party/mobiscroll/mobiscroll.js',
    'css!3rd.party/mobiscroll/mobiscroll.css'
], function (gt, date) {

    'use strict';

    var settings = {};

    //put some defaults in to reduce code duplications
    if ($.mobiscroll) {
        settings = {
            cancelText: gt('Cancel'),
            clearText: gt('Clear'),
            dateOrder: date.getFormat(date.DATE).replace(/\W/g, '').toLowerCase(),
            dateFormat: date.getFormat(date.DATE).replace(/\by\b/, 'yy').toLowerCase(),
            dayText: gt('Days'),
            display: 'bottom',
            endYear: new Date().getFullYear() + 100,
            hourText: gt('Hours'),
            minuteText: gt('Minutes'),
            monthNamesShort: date.locale.monthsShort,
            monthText: gt('Months'),
            preset: 'date',
            separator: ' ',
            setText: gt('Ok'),
            showLabel: true,
            theme: 'ios',
            timeFormat: date.getFormat(date.TIME).replace(/m/g, 'i').replace(/a/g, 'A'),
            yearText: gt('Years')
        };
        settings.timeWheels = settings.timeFormat.replace(/\W/g, '');
        $.mobiscroll.setDefaults(settings);
    }

    return settings;
});
