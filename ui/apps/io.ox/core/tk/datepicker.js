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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/core/tk/datepicker', [
    'gettext!io.ox/core',
    'io.ox/core/date',
    'static/3rd.party/bootstrap-datepicker/js/bootstrap-datepicker.js',
    'static/3rd.party/bootstrap-combobox.js'
], function (gt, date) {

    'use strict';

    var settings = {};

    //put some defaults in to reduce code duplications
    if ($.fn.datepicker) {
        // localize the datepicker, use en as default with current languages
        $.fn.datepicker.dates.en = {
            days: date.locale.days,
            daysShort: date.locale.daysShort,
            daysMin: date.locale.daysStandalone,
            months: date.locale.months,
            monthsShort: date.locale.monthsShort,
            today: gt('Today'),
            clear: gt('Clear')
        };

        settings = {
            autoclose: true,
            calendarWeeks: true,
            format: date.getFormat(date.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),
            todayBtn: 'linked', // today button should insert and select. See Bug #34381
            todayHighlight: true,
            weekStart: date.locale.weekStart
        };

        _.extend($.fn.datepicker.defaults, settings);
    }

    return settings;
});
