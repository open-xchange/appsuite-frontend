/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/tk/mobiscroll', [
    'gettext!io.ox/core',
    'static/3rd.party/mobiscroll.js',
    'css!3rd.party/mobiscroll.css'
], function (gt) {

    'use strict';

    var settings = {};

    //put some defaults in to reduce code duplications
    if ($.mobiscroll) {
        settings = {
            cancelText: gt('Cancel'),
            clearText: gt('Clear'),
            dayText: gt('Day'),
            hourText: gt('Hours'),
            minuteText: gt('Minutes'),
            monthText: gt('Month'),
            setText: gt('Ok'),
            yearText: gt('Year'),
            display: 'bottom',
            preset: 'date',
            theme: 'ios',
            separator: ' ',
            showLabel: true,
            endYear: moment().year() + 100,
            monthNamesShort: moment.monthsShort(),
            dateFormat: moment.localeData().longDateFormat('l').toLowerCase().replace(/yy/g, 'y'),
            timeFormat: moment.localeData().longDateFormat('LT').replace(/m/g, 'i'),
            amText: moment.localeData().meridiem(0),
            pmText: moment.localeData().meridiem(12)
        };
        settings.dateOrder = settings.dateFormat.replace(/\W/g, '').replace(/yy/g, 'y');
        settings.timeWheels = settings.timeFormat.replace(/\W/g, '');
        $.mobiscroll.setDefaults(settings);
    }

    return settings;
});
