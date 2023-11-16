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

define('io.ox/find/date/patterns', [
    'io.ox/core/extensions',
    'gettext!io.ox/core'
], function (ext, gt) {

    'use strict';

    var POINT = ext.point('io.ox/find/date/patterns'),
        index = 0,
        exp = {
            fulldate: '((\\d{1,2})[/.-](\\d){1,2}[/.-](\\d{4})|(\\d{4})[/.-](\\d){1,2}[/.-](\\d{1,2}))',
            connector: '(\\s)?(' + ['-', '\\.\\.', 'to', 'bis', 'à', 'au', 'a'].join('|') + ')(\\s)?'
        },
        reFulldate = new RegExp('^' + exp.fulldate + '$'),
        reParts = new RegExp(exp.fulldate, 'g'),
        reRange = new RegExp('^' + exp.fulldate + exp.connector + exp.fulldate + '$');

    // 2014 | April 2014 | Yesterday | Last week ...
    POINT.extend({
        index: index += 100,
        id: 'lookup',
        match: function (baton) {
            var value = baton.data.value,
                free = baton.options.limit - baton.data.matched.length;
            if (free <= 0) return;
            // add
            baton.data.matched = baton.data.matched.concat(
                lookup(value).slice(0, free)
            );
        }
    });

    // 04.04.2014
    POINT.extend({
        index: index += 100,
        id: 'format-full-date',
        regex: reFulldate,
        match: function (baton) {
            var self = baton.extension,
                value = baton.data.value, base;

            if (baton.options.limit === baton.data.matched.length) return;
            if (!self.regex.test(value)) return;
            // add
            base = moment(value, getFormat(value));

            // invalid date = NaN, show error.
            if (isNaN(base.diff(base, 'days'))) return;

            baton.data.matched.push({
                id: self.id,
                start: base.clone(),
                end: base.clone()
            });
        }
    });

    // 04.04.2014 - 10.04.2014
    POINT.extend({
        index: index += 100,
        id: 'range',
        regex: reRange,
        match: function (baton) {
            var self = baton.extension,
                value = baton.data.value,
                parts, list, left, right, autofix;

            if (baton.options.limit === baton.data.matched.length) return;

            // check for range separator and rougly for date format
            if (!self.regex.test(value)) return;

            // split and get formats
            parts = value.match(reParts).slice(0, 2);
            list = _.map(parts, function (part) {
                return {
                    value: part,
                    format: getFormat(part)
                };
            });
            // autofix
            left = moment(list[0].value, list[0].format);
            right = moment(list[1].value, list[1].format);

            // if either date is invalid, show error.
            if (isNaN(left.diff(right, 'days'))) return;

            autofix = left.diff(right, 'days') > 0;
            // add
            baton.data.matched.push({
                id: self.id,
                detail: gt('as daterange'),
                start: autofix ? right : left,
                end: autofix ? left : right
            });
        }
    });

    var getFormat = (function () {
        var regexEndian = /(\d{1,4})([/.-])(\d{1,2})[/.-](\d{1,4})/,
            replaceEndian = function (matchedPart, first, separator, second, third) {
                var hasYearSuffix = first.length < third.length, leadingMonth,
                    parts = hasYearSuffix ? [undefined, undefined, 'YYYY'] : ['YYYY', undefined, undefined];
                // special case: MM/DD/YYYY and DD/MM/YYYY
                if (separator === '/' && hasYearSuffix) {
                    leadingMonth = moment.localeData().longDateFormat('L') === 'MM/DD/YYYY';
                    parts[0] = first.replace(/./g, leadingMonth ? 'M' : 'D');
                    parts[1] = second.replace(/./g, leadingMonth ? 'D' : 'M');
                }
                // month: always in the middle
                parts[1] = parts[1] || second.replace(/./g, 'M');
                // day: fill up last undefined part
                parts[0] = parts[0] || first.replace(/./g, 'D');
                parts[2] = parts[2] || third.replace(/./g, 'D');
                return parts.join(separator);
            };
        return function (value) {
            return value.replace(regexEndian, replaceEndian);
        };
    })();

    var tree = {},
        generated;

    // generated list of fixed values
    function getTree() {
        // cache for current date
        if (generated === moment().format('YYYY-MM-DD')) return tree;

        var hash = {},
            weekdays = getSingleValueList(moment.weekdays()),
            months = getSingleValueList(moment.months()),
            currentMonth = moment().month(),
            currentYear = moment().year(),
            year;

        // resolve '(foo|bar)' entries
        function getSingleValueList(list) {
            // f.e. polish is special (nominative, subjective)
            return _.map(list, function (value) {
                // single value
                if (value[0] !== '(') return value;
                // first of multiple value
                return /\((.+)\|.*\)/.exec(value)[1];
            });
        }

        // Add to hash
        function add(values, index, obj) {
            [].concat(values).forEach(function (value) {
                var id = String(value).toLowerCase();
                hash[id] = _.extend({}, obj, { label: value, id: id, index: index });
            });
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
            var basestring = (index + 1) + ' ' + year;
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
        add([gt('Last day'), gt('Yesterday')], 0, {
            start: moment().subtract(1, 'day'),
            end: moment().subtract(1, 'day')
        });
        add([gt('Last week'), gt('Previous week')], 0, {
            start: moment().subtract(7, 'day').startOf('week'),
            end: moment().subtract(7, 'day').endOf('week')
        });
        add([gt('Last month'), gt('Previous month')], 1, {
            start: moment().subtract(1, 'month').startOf('month'),
            end: moment().subtract(1, 'month').endOf('month')
        });
        add([gt('Last year'), gt('Previous year')], 2, {
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
        tree = {};
        _(hash).each(function (obj, id) {
            // use two characters as look-ahead
            var key = id.substr(0, 2);
            (tree[key] || (tree[key] = [])).push(_.extend(obj, { id: id }));
        });
        generated = moment().format('YYYY-MM-DD');
        return tree;
    }

    function lookup(str) {
        // build catalogue when needed
        var tree = getTree(),
            key = str.substr(0, 2), len = str.length;
        return _(tree[key])
            .chain()
            .filter(function (obj) {
                return obj.id.substr(0, len) === str;
            })
            .sortBy('index')
            .value();
    }

    function getMatches(value, options) {
        value = String(value || '').toLowerCase();

        var opt = _.extend({ limit: 3 }, options || {}),
            baton = ext.Baton.ensure({ data: { matched: [], value: value }, options: opt });

        // possible matches add data to baton
        ext.point('io.ox/find/date/patterns').invoke('match', this, baton);

        return baton.data.matched;
    }

    return {
        lookup: lookup,
        getTree: getTree,
        getMatches: getMatches
    };

});
