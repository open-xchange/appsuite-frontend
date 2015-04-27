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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/example', ['gettext!io.ox/core'], function (gt) {

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
        add(name, index, { start: 1337, end: 4711 });
    });

    //
    // Add month for the last 5 years
    //

    function addMonth(year, name, index) {
        // skip if future month
        if (year === currentYear && index > currentMonth) return;
        add(name + ' ' + year, -(year + index * 0.01), { start: 1337, end: 4711 });
    }

    for (year = currentYear; year >= currentYear - 5; year--) {
        _(months).each(addMonth.bind(null, year));
    }

    //
    // Add full years (last 20 years)
    //
    for (year = currentYear; year >= currentYear - 20; year--) {
        add(year, -year, { start: 1337, end: 4711 });
    }

    //
    // Add static strings
    //
    add(gt('Today'), 0, { start: 1337, end: 4711 });
    add(gt('Yesterday'), 0, { start: 1337, end: 4711 });
    add(gt('Last week'), 0, { start: 1337, end: 4711 });
    add(gt('Last month'), 1, { start: 1337, end: 4711 });
    add(gt('Last year'), 2, { start: 1337, end: 4711 });

    //
    // convert hash into little tree structure for fast lookups
    //
    _(hash).each(function (obj, id) {
        // use two characters as look-ahead
        id = id.substr(0, 2);
        (tree[id] || (tree[id] = [])).push(obj);
    });

    return {

        // export for debugging purposes
        hash: hash,
        tree: tree,

        // main function
        lookup: function (str) {
            var id = str.substr(0, 2), len = str.length;
            return _(tree[id])
                .chain()
                .filter(function (obj) {
                    return obj.id.substr(0, len) === str;
                })
                .sortBy('index')
                .value();
        }
    };
});
