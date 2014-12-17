/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/util', [
    'io.ox/core/date'
], function (OXDate) {

    'use strict';

    var util = {
        /**
         * returns a date formatted as string
         */
        getDateFormated: function (timestamp, options) {
            if (!_.isNumber(timestamp)) { return '-'; }

            var opt = $.extend({ fulldate: false, filtertoday: true }, options || {}),
            now = new OXDate.Local(),
            d = new OXDate.Local(timestamp),
            timestr = function () {
                return d.format(OXDate.TIME);
            },
            datestr = function () {
                return d.format(OXDate.DATE) + (opt.fulldate ? ' ' + timestr() : '');
            },
            isSameDay = function () {
                return d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getYear() === now.getYear();
            };
            return isSameDay() && opt.filtertoday ? timestr() : datestr();
        }

    };

    return util;
});
