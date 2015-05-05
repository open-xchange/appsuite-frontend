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

define('io.ox/find/date/extensions',[
    'io.ox/core/extensions',
    'gettext!io.ox/find',
    'io.ox/find/date/lookup'
], function (ext, gt, lookup) {

    'use strict';

    var POINT = ext.point('io.ox/find/date/matchers'),
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
                lookup.lookup(value).slice(0, free)
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

});
