/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/find/date/lookup', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    //
    // efficient auto-complete lookups
    //

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
    return {

        // export for debugging purposes
        hash: hash,
        tree: tree,

        // main function
        lookup: function (str) {
            var key = str.substr(0, 2), len = str.length;
            return _(tree[key])
                .chain()
                .filter(function (obj) {
                    return obj.id.substr(0, len) === str;
                })
                .sortBy('index')
                .value();
        }
    };
});
