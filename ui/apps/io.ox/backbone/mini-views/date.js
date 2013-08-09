/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/date',
    ['io.ox/backbone/mini-views/abstract',
     'io.ox/core/date'
    ], function (AbstractView, date) {

    'use strict';

    //
    // <div><select class="date"><select class="month"><select class="year"></div>
    //

    // helper
    function createSelect(name, from, to, setter, format) {

        var node = $('<select tabindex="1">').attr('name', name),
            i = Math.min(from, to),
            $i = Math.max(from, to),
            d = new date.Local(0),
            options = [],
            empty;

        for (; i <= $i; i++) {
            setter.call(d, i);
            options.push($('<option>').val(i).text(d.format(format)));
        }

        // revert?
        if (from > to) {
            options.reverse();
        }

        // add empty option - do that after revert
        empty = $('<option>').text('');
        if (name === 'year') {empty.val('0000'); }
        options.unshift(empty);

        // append
        return node.append(options);
    }

    var DateView = AbstractView.extend({

        className: 'native-date-picker',
        events: { 'change select': 'onChange' },

        onChange: function () {
            var year = this.$el.find('.year').val(),
                month = this.$el.find('.month').val(),
                day = this.$el.find('.date').val();
            if (year !== '' && month !== '' && day !== '') {
                //check if date is invalid(like feb 30) and prevent month jump
                var str = year + '-' + _.pad(parseInt(month, 10) + 1, 2) + '-' + _.pad(day, 2),
                    tempDate = date.UTC.parse(str, 'yyyy-M-d'),
                    tempMonth = tempDate.getMonth();
                if (tempMonth.toString() !== month) {
                    tempDate.setDate(0);//last valid day of previous month
                    //set dayfield to right day (needs to be done or an invalid date can be selected if model already has the corrected date)
                    this.$el.find('.date').val(tempDate.getDate());
                }
                this.model.set(this.name, tempDate.getTime());
            } else {
                this.model.set(this.name, null);
                this.$el.find('.date').children().attr('disabled', false);//enable all
            }
        },

        update: function () {
            var value = this.model.get(this.name);
            // change boxes only for valid dates
            if (_.isNumber(value)) {
                var d = new date.Local(date.Local.utc(value));
                this.$el.find('.year').val(d.getYear());
                this.$el.find('.month').val(d.getMonth());
                this.$el.find('.date').val(d.getDate());
                //disable invalid dayfields
                d.setMonth(d.getMonth() + 1);
                d.setDate(0);
                var validDays = d.getDate(),
                    options = this.$el.find('.date').children().attr('disabled', false);
                options = options.slice(validDays + 1, options.length);
                options.attr('disabled', true);
            }
        },

        setup: function (options) {
            this.name = options.name;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },

        render: function () {

            var self = this;

            date.getFormat(date.DATE).replace(
                /(Y+|y+|u+)|(M+|L+)|(d+)|(?:''|'(?:[^']|'')*'|[^A-Za-z'])+/g,
                function (match, y, m, d) {
                    var proto = date.Local.prototype, node, year;
                    if (y) {
                        year = (new date.Local()).getYear();
                        node = createSelect('year', year, year - 150, proto.setYear, y).addClass('year');
                    } else if (m) {
                        node = createSelect('month', 0, 11, proto.setMonth, 'MMMM').addClass('month');
                    } else if (d) {
                        node = createSelect('date', 1, 31, proto.setDate, match).addClass('date');
                    }
                    self.$el.append(node);
                }
            );

            this.update();
            return this;
        }
    });

    return {
        DateView: DateView
    };
});
