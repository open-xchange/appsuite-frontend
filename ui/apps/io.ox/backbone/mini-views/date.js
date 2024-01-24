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

define('io.ox/backbone/mini-views/date', [
    'io.ox/backbone/mini-views/abstract',
    'gettext!io.ox/core'
], function (AbstractView, gt) {

    'use strict';

    var titles = {
        year: gt('Year'),
        month: gt('Month'),
        date: gt('Day')
    };

    //
    // <div><select class="date"><select class="month"><select class="year"></div>
    //

    // core/date.js would be a better place but who cares
    function localize(name, text) {
        if (ox.locale === 'ja_JP') {
            if (name === 'year') return text + '年';
            if (name === 'date') return text + '日';
        }
        return text;
    }

    // helper
    function createSelect(name, from, to, setter, format) {

        var node = $('<select class="form-control">').attr({ name: name, title: titles[name], 'aria-label': titles[name] }),
            i = Math.min(from, to),
            $i = Math.max(from, to),
            // see bug 41106 - the initial date is set to 1.1.1970 so the options can always be filled with 31 days
            d = moment.utc(0),
            options = [],
            empty, text;

        for (; i <= $i; i++) {
            setter.call(d, i);
            text = d.format(format);
            text = localize(name, text);
            options.push($('<option>').val(i).text(text));
        }

        // revert?
        if (from > to) {
            options.reverse();
        }

        // add empty option - do that after revert
        empty = $('<option>', { value: name === 'year' ? '1604' : '' }).text('');
        options.unshift(empty);

        // append
        return node.append(options);
    }

    var DateSelectView = AbstractView.extend({

        className: 'native-date-picker row',
        events: {
            'change select': 'onChange',
            'focus select': 'onFocus',
            'blur select': 'onBlur'
        },

        onChange: function () {
            var d = this.getDate();
            if (d !== null && d !== undefined) {
                // check if date is invalid (like feb 30) and prevent month jump
                if (!d.isValid()) {
                    // jump back to last valid day of previous month
                    // invalid date cannot be fixed by changing days. use valid date before change month
                    d = moment([d.creationData().input.year, d.creationData().input.month]).endOf('month').hours(1).minutes(0).seconds(0).milliseconds(0);
                    // set date field to right day
                    // needs to be done or an invalid date can be selected
                    // if model already has the corrected date
                    this.$el.find('.date').val(d.date());
                }
                this.model.set(this.name, d.valueOf());
            } else {
                this.model.set(this.name, d);
                //enable all
                this.$el.find('.date').children().prop('disabled', false);
            }
        },

        onFocus: function (e) {
            this.label.text(this.originalLabel + ' - ' + $(e.target).attr('title'));
        },

        onBlur: function () {
            this.label.text(this.originalLabel);
        },

        getDate: function () {
            var year = this.$el.find('.year').val(),
                month = this.$el.find('.month').val(),
                date = this.$el.find('.date').val();

            // look for month and date; year doesn't matter, it's always set
            // if one is set and the other is not we set to undefined, if both are not set we set to null
            // this way we can see if a user added an incomplete date or wants to remove the date entirely (used in validation functions)
            if ((month === '' || month === null) && (date === '' || date === null)) return null;
            if ((month === '' || month === null) || (date === '' || date === null)) return undefined;
            return moment.utc({
                year: parseInt(year, 10),
                month: parseInt(month, 10),
                date: parseInt(date, 10)
            });
        },

        value: function () {
            var d = this.getDate();
            return d && _.pad(d.year(), 4) + '-' + _.pad(d.month() + 1, 2) + '-' + _.pad(d.date(), 2);
        },

        update: function () {
            var value = this.model.get(this.name), d, year, text;
            // change boxes only for valid dates
            if (_.isNumber(value)) {
                d = moment.utc(value);
                year = String(d.year());
                if (year !== '1' && year !== '1604') {
                    // if the year is not our dropdown we add it
                    var yearValues = [];
                    this.$el.find('.year option').each(function () {
                        yearValues.push($(this).val());
                    });
                    if (!_.contains(yearValues, year)) {
                        text = localize('year', year);
                        this.$el.find('.year').append(
                            $('<option>').val(year).text(text)
                        );
                    }
                }
                // 1604 is the new date without year see bug 56075
                if (year === '1') year = 1604;

                this.$el.find('.year').val(_.pad(year, 4));
                this.$el.find('.month').val(d.month());
                this.$el.find('.date').val(d.date());
                // disable invalid dayfields
                d.date(1);
                d.add(1, 'month');
                d.date(0);
                var validDays = d.date(),
                    options = this.$el.find('.date').children().prop('disabled', false);
                options = options.slice(validDays + 1, options.length);
                options.prop('disabled', true);
            }
        },

        setup: function (options) {
            this.label = options.label;
            this.originalLabel = this.label.text();
            this.name = options.name;
            this.future = options.future || 0; // use positive integers to allow years in the future
            this.past = options.past || 150; // use positive integers to allow years in the past
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },

        render: function () {
            var self = this,
                id = this.label.attr('id');
            moment.localeData().longDateFormat('LL').replace(
                /(Y+)|(M+)|(D+)|(?:''|'(?:[^']|'')*'|[^A-Za-z'])+/g,
                function (match, y, m, d) {
                    var proto = moment.fn, node, year;
                    if (y) {
                        year = moment().year();
                        node = $('<div class="col-xs-4 col-sm-4 col-md-4 col-lg-4">').append(
                            createSelect('year', year + self.future, year - self.past, proto.year, y).addClass('year').attr('aria-labelledby', id)
                        );
                    } else if (m) {
                        node = $('<div class="col-xs-5 col-sm-5 col-md-5 col-lg-5">').append(
                            createSelect('month', 0, 11, proto.month, 'MMMM').addClass('month').attr('aria-labelledby', id)
                        );
                    } else if (d) {
                        node = $('<div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">').append(
                            createSelect('date', 1, 31, proto.date, match).addClass('date').attr('aria-labelledby', id)

                        );
                    }
                    self.$el.append(node);
                }
            );

            this.update();
            return this;
        }
    });

    return {
        DateSelectView: DateSelectView
    };
});
