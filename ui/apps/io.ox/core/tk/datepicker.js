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

define('io.ox/core/tk/datepicker', [
    'gettext!io.ox/core',
    'static/3rd.party/bootstrap-datepicker.js'
], function (gt) {

    'use strict';

    var settings = {};

    //put some defaults in to reduce code duplications
    if ($.fn.datepicker) {
        // localize the datepicker, use en as default with current languages
        $.fn.datepicker.dates.en = {
            days: moment.weekdays(),
            daysShort: moment.weekdaysShort(),
            daysMin: moment.weekdaysMin(),
            months: moment.months(),
            monthsShort: moment.monthsShort(),
            today: gt('Today'),
            clear: gt('Clear')
        };

        settings = {
            autoclose: true,
            calendarWeeks: true,
            format: moment.localeData().longDateFormat('l').toLowerCase(),
            todayBtn: 'linked', // today button should insert and select. See Bug #34381
            todayHighlight: true,
            weekStart: moment.localeData().firstDayOfWeek()
        };
        _.extend($.fn.datepicker.defaults, settings);
    }

    return settings;
});
