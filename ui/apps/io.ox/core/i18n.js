/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/core/i18n", ["gettext!io.ox/core/i18n"], function (gettext) {

    "use strict";
    
    // day names
    var n_day = [
            gettext("Sunday"), gettext("Monday"), gettext("Tuesday"),
            gettext("Wednesday"), gettext("Thursday"), gettext("Friday"),
            gettext("Saturday")
        ],

        // month names
        n_month = [
            gettext("January"), gettext("February"), gettext("March"),
            gettext("April"), gettext("May"), gettext("June"),
            gettext("July"), gettext("August"), gettext("September"),
            gettext("October"), gettext("November"), gettext("December")
        ],

        dRegex = /(\w+)/g,

        dReplaceField = function (d, m) {
            switch (m) {
            case 'd':
            case 'dd': // day
                return _.pad(d.getUTCDate(), m.length);
            case 'EE':
            case 'EEE': // abbr. weekday
                return n_day[d.getUTCDay()].substr(0, m.length);
            case 'EEEE': // full weekday
                return n_day[d.getUTCDay()];
            case 'H':
            case 'HH':
                return _.pad(d.getUTCHours(), m.length);
            case 'm':
            case 'mm':
                return _.pad(d.getUTCMinutes(), m.length);
            case 'M':
            case 'MM': // month
                return _.pad(d.getUTCMonth() + 1, m.length);
            case 'MMM': // abbr. month name
                return n_month[d.getUTCMonth()].substr(0, 3);
            case 'MMMM': // full month name
                return n_month[d.getUTCMonth()];
            case 's':
            case 'ss':
                return _.pad(d.getUTCSeconds(), m.length);
            case 'YY':
            case 'YYYY': // year
                return String(d.getUTCFullYear()).substr(-m.length);
            default:
                return m;
            }
        },

        dReplace = function (d) {
            // return new closure - we just need date as reference
            return function (m) {
                return dReplaceField(d, m);
            };
        },

        dateFormats = {
            "fulldatetime": "EEE dd. MMM YYYY HH:mm",
            "datetime": "dd.MM.YYYY HH:mm",
            "date": "dd.MM.YYYY",
            "time": "HH:mm",
            "": "EEE dd. MMM YYYY HH:mm" // default
        },

        getNamedFormat = function (f) {
            f = String(f || "");
            return dateFormats[f] || f;
        },

        // sizes (kilo, mega, giga, tera, peta, ...)
        n_size = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    return {

        date: function (format, date) {

            // special format?
            format = getNamedFormat(format);

            // make sure we have a date object
            // default is current time
            if (date === undefined) {
                date = new Date(_.utc());
            } else if (_.isNumber(date)) {
                date = new Date(date);
            }

            return format.replace(dRegex, dReplace(date));
        },

        // time-based greeting phrase
        getGreetingPhrase: function (time) {

            time = time !== undefined ? time : _.utc();

            var hour = new Date(time).getHours();

            // find proper phrase
            if (hour >= 4 && hour <= 11) {
                return gettext("Good morning");
            } else if (hour >= 18 && hour <= 23) {
                return gettext("Good evening");
            } else {
                return gettext("Hello");
            }
        },

        round: function (num, digits) {
            // TODO: add localization (. vs ,)
            digits = digits || 0;
            var pow = Math.pow(10, digits);
            return Math.round(num * pow) / pow;
        },

        // better place? even been i18n'd?
        filesize: function (size) {
            var i = 0, $i = n_size.length;
            while (size > 1024 && i < $i) {
                size = size / 1024;
                i++;
            }
            return this.round(size, 1) + ' ' + n_size[i];
        }
    };
});