/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/settings/editLocale', [
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/views/modal',
    'io.ox/core/locale',
    'io.ox/core/settings/util',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (views, ext, mini, ModalView, locale, util, settings, gt) {

    'use strict';

    var POINT = 'io.ox/core/settings/edit-locale',
        INDEX = 0;

    function openModalDialog() {

        return new ModalView({
            focus: '#settings-time',
            model: new Backbone.Model(),
            point: POINT,
            title: gt('Regional settings'),
            width: 560
        })
        .inject({
            getTimeOptions: function () {
                return [
                    { label: gt('9:00 AM (12 hours)'), value: 'h:mm:ss a' },
                    { label: gt('09:00 AM (12 hours)'), value: 'hh:mm:ss a' },
                    { label: gt('9:00 (24 hours)'), value: 'H:mm:ss' },
                    { label: gt('09:00 (24 hours)'), value: 'HH:mm:ss' },
                    { label: gt('9.00 (24 hours)'), value: 'H.mm.ss' },
                    { label: gt('09.00 (24 hours)'), value: 'HH.mm.ss' }
                ];
            },
            getDateOptions: function () {
                return locale.getDateFormatOptions();
            },
            getNumberOptions: function () {
                return locale.getNumberFormats().map(function (format) {
                    return { label: format, value: format };
                });
            },
            getFirstDayOfWeekOptions: function () {
                // these values can be used to directly set "dow" (see doy)
                var weekdays = moment.localeData().weekdays();
                return [
                    { label: weekdays[1], value: 'monday' },
                    { label: weekdays[6], value: 'saturday' },
                    { label: weekdays[0], value: 'sunday' }
                ];
            },
            getFirstDayOfYearOptions: function () {
                // these values define the first day, not "doy" because it depends on "dow".
                // the active DOY needs to be calculated on the fly
                // formula: doy = 7 + dow - janX
                // existing values for doy (in moment locales): 4, 6, 7, 12
                // combinations:
                // - US: dow=0 first=Jan 1st -> doy=6
                // - Europe: dow=1 first=Jan 4th -> doy=4
                // - Arab: dow=6 first=Jan 1st -> doy=12
                // - 1/7: dow=1 first=Jan 1st -> doy=7
                // So we need to offer two days:
                return [
                    { label: gt('Week that contains January 1st (e.g. US, Canada)'), value: 1 },
                    { label: gt('Week that contains January 4th (e.g. Europe, ISO-8601)'), value: 4 }
                ];
            }
        })
        .addCancelButton()
        .addButton({ label: gt('Reset'), action: 'reset', placement: 'left', className: 'btn-default' })
        .addButton({ label: gt('Save'), action: 'save' })
        .on('open', function () {
            this.initial = locale.getLocaleData();
            this.model.set(this.initial);
        })
        .on('save', function () {
            var changed = this.model.changedAttributes(this.initial);
            if (!changed) return;
            locale.setLocaleData(this.model.toJSON());
        })
        .on('reset', function () {
            locale.resetLocaleData();
        })
        .open();
    }

    ext.point(POINT).extend(
        //
        // Time
        //
        {
            index: INDEX += 100,
            id: 'time',
            render: function () {
                this.$body.append(
                    util.compactSelect('timeLong', gt('Time format'), this.model, this.getTimeOptions(), { width: 12 })
                );
            }
        },
        //
        // Date
        //
        {
            index: INDEX += 100,
            id: 'date',
            render: function () {
                this.$body.append(
                    util.compactSelect('date', gt('Date format'), this.model, this.getDateOptions(), { width: 12 })
                );
            }
        },
        //
        // Number
        //
        {
            index: INDEX += 100,
            id: 'number',
            render: function () {
                this.$body.append(
                    util.compactSelect('number', gt('Number format'), this.model, this.getNumberOptions(), { width: 12 })
                );
            }
        },
        //
        // First day of week
        //
        {
            index: INDEX += 100,
            id: 'first-day-week',
            render: function () {
                this.$body.append(
                    util.compactSelect('firstDayOfWeek', gt('First day of the week'), this.model, this.getFirstDayOfWeekOptions(), { width: 12 })
                );
            }
        },
        //
        // First day of year
        //
        {
            index: INDEX += 100,
            id: 'first-day-year',
            render: function () {
                this.$body.append(
                    util.compactSelect('firstDayOfYear', gt('First week of the year'), this.model, this.getFirstDayOfYearOptions(), { width: 12 })
                );
            }
        }
    );

    return { open: openModalDialog };
});
