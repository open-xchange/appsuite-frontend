/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/date/patterns',[
    'io.ox/core/extensions',
    'gettext!io.ox/find'
], function (ext, gt) {

    'use strict';

    var POINT = ext.point('io.ox/find/date/patterns'),
        index = 0,
        rangeconnector = '(' + ['-', '\\.\\.', 'to', 'bis', 'à', 'au', 'a'].join('|') + ')';

    // 2014 | April 2014 | Yesterday | Last week ...
    POINT.extend({
        index: index += 100,
        id: 'lookup',
        match: function (baton) {
            var value = baton.data.value,
                free = baton.options.limit - baton.data.matched.length;

            if (free <= 0) return;

            baton.data.matched = baton.data.matched.concat(
                lookup(value).slice(0, free)
            );
        }
    });

    // 10.04. | 10.04.2014 | 10/04/ | 10/04/2014 | 2014-04-10
    POINT.extend({
        index: index += 100,
        id: 'format-full-date',
        regex: /^([MoDoY]{1,4}[/.][MoDoY]{1,4}[/.][MoDoY]{0,4}|(YY){1,2}-[Mo]{1,2}[-][Do]{1,2})$/,
        match: function (baton) {
            var self = baton.extension,
                format = baton.data.format,
                value = baton.data.value;

            if (baton.options.limit === baton.data.matched.length) return;

            if (!self.regex.test(format)) return;

            // add year?
            if (/^[MoDo]{1,2}[/.][MoDo]{1,2}[/.]$/.test(format)) {
                value = value + moment().year();
                format = moment.parseFormat(value);
            }

            var base = moment(value, format);
            baton.data.matched.push({
                id: self.id,
                start: base.clone(),
                end: base.clone()
            });
        }
    });

    // 04.04.2014 - 10.04.2014 | 04/04/2014 - 10/04/2014
    POINT.extend({
        index: index += 100,
        id: 'range',
        regex: new RegExp('^((\\d){1,2}(\\/|\\.)(\\d){1,2}(\\/|\\.)(\\d\\d){1,2})(\\s?)' + rangeconnector + '(\\s?)((\\d){1,2}(\\/|\\.)(\\d){1,2}(\\/|\\.)(\\d\\d){1,2})$'),
        match: function (baton) {
            var self = baton.extension,
                value = baton.data.value;

            if (baton.options.limit === baton.data.matched.length) return;

            // check for range separator and rougly for date format
            if (!self.regex.test(value)) return;

            // extract stard/end
            var parts = value.match(/(\d{1,2}[\/\.]\d{1,2}[\/\.](\d\d){1,2})/g);
            if (parts.length !== 2) return;

            var list = _.map(parts, function (part) {
                    return {
                        value: part,
                        format: moment.parseFormat(part)
                    };
                });
            baton.data.matched.push({
                id: self.id,
                detail: gt('as daterange'),
                start: moment(list[0].value, list[0].format),
                end:  moment(list[1].value, list[1].format)
            });
        }
    });

    // 2014-04-04 to 2014-04-10
    POINT.extend({
        index: index += 100,
        id: 'range-hyphen',
        regex: new RegExp('^((\\d\\d){1,2}(-)(\\d){1,2}(-)(\\d){1,2})(\\s?)' + rangeconnector + '(\\s?)((\\d\\d){1,2}(-)(\\d){1,2}(-)(\\d){1,2})$'),
        match: function (baton) {
            var self = baton.extension,
                value = baton.data.value;

            if (baton.options.limit === baton.data.matched.length) return;

            // check for range separator and rougly for date format
            if (!self.regex.test(value)) return;

            // extract stard/end
            var parts = value.match(/((\d\d){1,2}[-]\d{1,2}[-](\d){1,2})/g);
            if (parts.length !== 2) return;

            var list = _.map(parts, function (part) {
                    return {
                        value: part,
                        format: moment.parseFormat(part)
                    };
                });

            baton.data.matched.push({
                id: self.id,
                detail: gt('as daterange'),
                start: moment(list[0].value, list[0].format),
                end:  moment(list[1].value, list[1].format)
            });
        }
    });

    // generated list of fixed values
    var lookup = (function () {
        var hash = {},
            tree = {},
            locale = moment.localeData(),
            weekdays = locale._weekdays,
            months = locale._months,
            currentMonth = moment().month(),
            currentYear = moment().year(),
            year;

        // Add to hash
        function add(value, index, obj) {
            var id = String(value).toLowerCase();
            hash[id] = _.extend(obj, { label: value, id: id, index: index });
        }

        //
        // Add weekdays
        //
        _(weekdays).map(function (name, index) {
            var base = moment().day(index);
            // adjust if it is a future weekday
            if (moment().diff(base, 'day', true) < 0) base.subtract(7, 'days');
            add(name, index, {
                start: base.clone(),
                end: base.clone()
            });
        });

        //
        // Add month for the last 5 years
        //
        function addMonth(year, name, index) {
            // skip if future month
            if (year === currentYear && index > currentMonth) return;
            var basestring = (index + 1)  + ' ' + year;
            add(name + ' ' + year, -(year + index * 0.01), {
                start: moment(basestring, 'M YYYY').startOf('month'),
                end: moment(basestring, 'M YYYY').endOf('month')
            });
        }

        for (year = currentYear; year >= currentYear - 5; year--) {
            _(months).each(_.partial(addMonth, year));
        }

        //
        // Add full years (last 20 years)
        //
        for (year = currentYear; year >= currentYear - 20; year--) {
            add(year, -year, {
                start: moment(year, 'YYYY').startOf('year'),
                end: moment(year, 'YYYY').endOf('year')
            });
        }

        //
        // Add static strings
        //
        add(gt('Today'), 0, {
            start: moment(),
            end: moment()
        });
        add(gt('Yesterday'), 0, {
            start: moment().subtract(1, 'day'),
            end: moment().subtract(1, 'day')
        });

        add(gt('Last week'), 0, {
            start: moment().subtract(7, 'day').startOf('week'),
            end: moment().subtract(7, 'day').endOf('week')
        });
        add(gt('Last month'), 1, {
            start: moment().subtract(1, 'month').startOf('month'),
            end: moment().subtract(1, 'month').endOf('month')
        });
        add(gt('Last year'), 2, {
            start: moment().subtract(1, 'year').startOf('year'),
            end: moment().subtract(1, 'year').endOf('year')
        });

        add(gt('Last 7 days'), 3, {
            start: moment().subtract(7, 'day'),
            end: moment()
        });
        add(gt('Last 30 days'), 4, {
            start: moment().subtract(30, 'day'),
            end: moment()
        });
        add(gt('Last 365 days'), 5, {
            start: moment().subtract(7, 'day'),
            end: moment()
        });

        //
        // convert hash into little tree structure for fast lookups
        //
        _(hash).each(function (obj, id) {
            // use two characters as look-ahead
            var key = id.substr(0, 2);
            (tree[key] || (tree[key] = [])).push(_.extend(obj, { id: id }));
        });
        return function (str) {
            var key = str.substr(0, 2), len = str.length;
            return _(tree[key])
                .chain()
                .filter(function (obj) {
                    return obj.id.substr(0, len) === str;
                })
                .sortBy('index')
                .value();
        };

    })();

    return {
        lookup: lookup,
        getMatches: function (value, options) {

            var format = moment.parseFormat(value),
                opt = _.extend({ limit: 3 }, options || {}),
                baton = ext.Baton.ensure({ data: { matched: [], value: value, format: format }, options: opt });

            // possible matches add data to baton
            ext.point('io.ox/find/date/patterns').invoke('match', this, baton);

            return baton.data.matched;
        }
    };

});
