/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/mobiscroll', ['apps/mobiscroll/js/mobi.js',
                                    'gettext!io.ox/core',
                                    'io.ox/core/date',
                                    'css!mobiscroll/css/mobiscroll.core.css',
                                    'css!mobiscroll/css/mobiscroll.android-ics.css',
                                    'css!mobiscroll/css/mobiscroll.ios.css'], function (mobi, gt, date) {

    'use strict';
    
    var settings = {},
        set = false;
    
    //put some defaults in to reduce code duplications
    if ($.mobiscroll && !set) {
        settings = {
            dateOrder: date.getFormat(date.DATE).replace(/\W/g, '').toLowerCase(),
            dateFormat: date.getFormat(date.DATE).replace(/\by\b/, 'yy').toLowerCase(),
            timeFormat: date.getFormat(date.TIME).replace(/m/g, 'i'),
            monthNamesShort: date.locale.monthsShort,
            setText: gt('Ok'),
            cancelText: gt('Cancel'),
            minuteText: gt('Minutes'),
            hourText: gt('Hours'),
            dayText: gt('Days'),
            monthText: gt('Months'),
            yearText: gt('Years'),
            showLabel: true,
            display: 'bottom',
            endYear: new Date().getFullYear() + 100,
            theme: 'android-ics light'
        };
        settings.timeWheels = settings.timeFormat.replace(/\W/g, '');
        if (_.device('ios')) {
            settings.theme = 'ios';
        }
        $.mobiscroll.setDefaults(settings);
        set = true;
    }
    
    return settings;
});