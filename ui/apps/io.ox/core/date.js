// NOJSHINT
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define.async('io.ox/core/date',
    ['io.ox/core/gettext',
     'settings!io.ox/core',
     'gettext!io.ox/core'
    ], function (gettext, settings, gt) {

    /*jshint white:false */

    'use strict';

    var dateTimeFormats = ['', 'E', 'yMd', 'yMEd', 'Hm', 'yMEdHm', 'yMdHm',
                           'yMEdHm', 'v', 'yMEdHmv', 'yMdHmv', 'yMEdHmv', 'Hmv',
                           'yMEdHmv', 'yMdHmv', 'yMEdHmv', 'Md'];

    // average ms / year
    var AVG_YEAR = 31556952000;

    var api = {
        // ms / s
        SECOND:    1000,
        // ms / min
        MINUTE:   60000,
        // ms / h
        HOUR:   3600000,
        // ms / day
        DAY:   86400000,
        // ms / week
        WEEK: 604800000,

        // Flags for format functions. Multiple flags can be combined through
        // addition or bitwise ORing.
        DAYOFWEEK: 1,
        DATE:      2,
        TIME:      4,
        TIMEZONE:  8,

        // Valid format flag combinations as dedicated constants.
        // In a combination, DAYOFWEEK implies DATE and TIMEZONE implies TIME.
        DAYOFWEEK_DATE:       3,
        DATE_TIME:            6,
        DAYOFWEEK_DATE_TIME:  7,
        TIME_TIMEZONE:       12,
        DATE_TIME_TIMEZONE:  14,
        FULL_DATE:           15,
        DATE_NOYEAR:         16,

        getFormat: function (format) {
            format = format || api.DATE_TIME;
            if (typeof format === 'number') {
                format = dateTimeFormats[format];
                if (api.locale.h12) format = format.replace('H', 'h');
                format = api.locale.formats[format];
            }
            return format;
        },

        getInputFormat: function (format) {
            return this.getFormat(format).replace(/(y+)|(M+)|(d+)/g, function (_, y, m, d) {
                //#. Strings to build input formats to be more accessible
                //#. yyyy: 4-digit year | MM: 2-digit month | dd: 2-digit day
                //#. Sample for de_DE: TT.MM.JJJJ
                return y ? gt('yyyy') :
                       m ? gt('MM') :
                       d ? gt('dd') :
                       _;
            });
        },

        /**
         * Formats a duration as a string
         * @param {Number} t The duration in milliseconds
         * @param {Boolean} until Specifies whether the returned text should be
         * in objective case (if true) or in nominative case (if false).
         * @type String
         * @return The formatted interval.
         */
        formatDuration: function (t, until) {
            var m = Math.round(t / api.MINUTE);
            var Week = api.WEEK / api.MINUTE;
            if (m >= Week && t % Week === 0) {
                return get_w(Math.round(t / Week));
            } else {
                return days(t);
            }
            function get_w(w) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X weeks
                    //#. %d is the number of weeks
                    //#, c-format
                    gt.npgettext('in', '%d week', '%d weeks', w) :
                    //#. General duration (nominative case): X weeks
                    //#. %d is the number of weeks
                    //#, c-format
                    gt.ngettext('%d week', '%d weeks', w),
                    w);
            }
            function days(m) {
                var Day = api.DAY / api.MINUTE;
                if (m < Day) return hours(m);
                var d = Math.floor(m / Day);
                m = m % Day;
                return m ? get_dhm(d, m) : get_d(d);
            }
            function get_d(d) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X days
                    //#. %d is the number of days
                    //#, c-format
                    gt.npgettext('in', '%d day', '%d days', d) :
                    //#. General duration (nominative case): X days
                    //#. %d is the number of days
                    //#, c-format
                    gt.ngettext('%d day', '%d days', d),
                    d);
            }
            function get_dhm(d, m) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X days, Y hours and Z minutes
                    //#. %1$d is the number of days
                    //#. %2$s is the text for the remainder of the last day
                    //#, c-format
                    gt.npgettext('in', '%1$d day, %2$s', '%1$d days, %2$s', d) :
                    //#. General duration (nominative case): X days, Y hours and Z minutes
                    //#. %1$d is the number of days
                    //#. %2$s is the text for the remainder of the last day
                    //#, c-format
                    gt.ngettext('%1$d day, %2$s', '%1$d days, %2$s', d),
                    d, hours(m));
            }
            function hours(m) {
                if (m < 60) return minutes(m);
                var h = Math.floor(t / 60);
                m = m % 60;
                return m ? get_hm(h, m) : get_h(h);
            }
            function get_h(h) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X hours
                    //#. %d is the number of hours
                    //#, c-format
                    gt.npgettext('in', '%d hour', '%d hours', h) :
                    //#. General duration (nominative case): X hours
                    //#. %d is the number of hours
                    //#, c-format
                    gt.ngettext('%d hour', '%d hours', h),
                    h);
            }
            function get_hm(h, m) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X hours and Y minutes
                    //#. %1$d is the number of hours
                    //#. %2$s is the text for the remainder of the last hour
                    //#, c-format
                    gt.npgettext('in', '%1$d hour and %2$s', '%1$d hours and %2$s', h) :
                    //#. General duration (nominative case): X hours and Y minutes
                    //#. %1$d is the number of hours
                    //#. %2$s is the text for the remainder of the last hour
                    //#, c-format
                    gt.ngettext('%1$d hour and %2$s', '%1$d hours and %2$s', h),
                    h, minutes(m));
            }
            function minutes(m) {
                return gt.format(until ?
                    //#. Reminder (objective case): in X minutes
                    //#. %d is the number of minutes
                    //#, c-format
                    gt.npgettext('in', '%d minute', '%d minutes', m) :
                    //#. General duration (nominative case): X minutes
                    //#. %d is the number of minutes
                    //#, c-format
                    gt.ngettext('%d minute', '%d minutes', m),
                    m);
            }
        }
    };

    //@include api.locale = date/date.root.json
    ;

    // TODO: Difference between server and client clocks.
    var offset = 0;

    /**
     * Computes the number of the first day of the specified week, taking into
     * account weekStart.
     * @param  {LocalDate} d The date for which to calculate the first day of
     * week number.
     * @type Number
     * @return First day in the week as the number of days since 1970-01-01.
     * @ignore
     */
    function getWeekStart(d) {
        return d.getDays() - (d.getDay() - api.locale.weekStart + 7) % 7;
    }

    /**
     * Returns the day of the week which decides the week number
     * @return Day of week as the number of days since 1970-01-01.
     */
    function getKeyDayOfWeek(d) {
        return (getWeekStart(d) + 7 - api.locale.daysInFirstWeek);
    }

    /**
     * Computes the week number of the specified Date object, taking into
     * account daysInFirstWeek and weekStart.
     * @param {Date} d The date for which to calculate the week number.
     * @param {Boolean} inMonth True to compute the week number in a month,
     * False for the week number in a year
     * @type Number
     * @return Week number of the specified date.
     * @ignore
     */
    function getWeek(d, inMonth) {
        var keyDay = getKeyDayOfWeek(d);
        var D = d.constructor;
        var keyDate = new D(keyDay * api.DAY);
        var jan1st = new D(keyDate.getTime()).setMonth(inMonth ? keyDate.getMonth() : 0, 1);
        return Math.floor((keyDay - jan1st.getDays()) / 7) + 1;
    }

    function getWeekYear(d) {
        var year = d.getYear(), month = d.getMonth(), week = getWeek(d);
        if (month === 0 && week > 26) year--;
        if (month === 11 && week < 26) year++;
        return year;
    }

    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    var reLetters = "GyYMwWDdFEuaHkKhmsSzZvV".split("").join("+|") + "+";
    var regex = new RegExp("(" + reLetters + ")|'((?:[^']|'')+)'|('')", "g");

    function num(n, x) {
        var s = x.toString();
        n -= s.length;
        if (n <= 0) return s;
        var a = new Array(n + 1);
        for (var i = 0; i < n; i++) a[i] = "0";
        a[n] = s;
        return a.join("");
    }
    function text(n, full, short) { return n >= 4 ? full : short; }

    var funs = {
        a: function (n, d) {
            return api.locale.dayPeriods[d.getHours() < 12 ? 'am' : 'pm'];
        },
        D: function (n, d) {
            return num(n,
                d.getDays() - new d.constructor(d.getYear(), 0).getDays() + 1);
        },
        d: function (n, d) { return num(n, d.getDate()); },
        E: function (n, d) {
            var m = d.getDay();
            return text(n, api.locale.days[m], api.locale.daysShort[m]);
        },
        F: function (n, d) {
            return num(n, Math.floor(d.getDate() / 7) + 1);
        },
        G: function (n, d) {
            return api.locale.eras[d.getYear() < 1 ? 0 : 1];
        },
        H: function (n, d) { return num(n, d.getHours()); },
        h: function (n, d) { return num(n, d.getHours() % 12 || 12); },
        K: function (n, d) { return num(n, d.getHours() % 12); },
        k: function (n, d) { return num(n, d.getHours() || 24); },
        M: function (n, d) {
            var m = d.getMonth();
            if (n >= 3) {
                return text(n, api.locale.months[m], api.locale.monthsShort[m]);
            } else {
                return num(n, m + 1);
            }
        },
        m: function (n, d) { return num(n, d.getMinutes()); },
        S: function (n, d) { return num(n, d.getMilliseconds()); },
        s: function (n, d) { return num(n, d.getSeconds()); },
        u: function (n, d) { return num(n, (d.getDay() + 6) % 7 + 1); },
        W: function (n, d) { return num(n, getWeek(d, true)); },
        w: function (n, d) { return num(n, getWeek(d)); },
        Y: function (n, d) {
            var y = d.getYear(), m = d.getMonth(), w = getWeek(d);
            if (m === 0 && w > 26) y--;
            if (m === 11 && w < 26) y++;
            if (y < 1) y = 1 - y;
            return num(n, n === 2 ? y % 100 : y);
        },
        y: function (n, d) {
            var y = d.getYear();
            if (y < 1) y = 1 - y;
            return num(n, n === 2 ? y % 100 : y);
        },
        z: function (n, d) {

        },
        Z: function (n, d) {

        },
        v: function (n, d) {
            return d.getTimeZone();
        },
        V: function (n, d) {

        }
        // TODO: z, Z, v and V
    };
    function formatDateTime(format, date) {
        return String(format).replace(regex,
            function (match, fmt, text, quote) {
                if (fmt) {
                    return funs[fmt.charAt(0)](fmt.length, date);
                } else if (text) {
                    return text.replace(/''/g, "'");
                } else if (quote) {
                    return "'";
                }
            });
    }

    var pregexStr = "(" + reLetters + ")(?!" + reLetters + ")|(" + reLetters +
        ")(?=" + reLetters + ")|'((?:[^']|'')+)'|('')|([$^\\\\.*+?()[\\]{}|])";
    var pregex = new RegExp(pregexStr, "g");

    function escape(rex) {
        return String(rex).replace(/[$\^\\.*+?()\[\]{}|]/g, "\\$&");
    }
    function makeRegex(names, shortNames) {
        return "(" + _.map(names.concat(shortNames), escape).join("|") + ")";
    }
    function makeMap(names, shortNames) {
        var map = {};
        for (var i = 0; i < names.length; i++) {
            map[names[i]] = i;
            map[shortNames[i]] = i;
        }
        return map;
    }
    var monthRegex, dayRegex, monthMap, dayMap;
    var numRex = "([+-]?\\d+)";
    function number(n) { return numRex; }

    var prexs = {
        a: function (n) {
            return "(" + escape(api.locale.dayPeriods.am) + "|" +
                         escape(api.locale.dayPeriods.pm) + ")";
        },
        E: function (n) { return dayRegex; },
        G: function (n) {
            return "(" + escape(api.locale.eras[0]) + "|" +
                         escape(api.locale.eras[1]) + ")";
        },
        M: function (n) { return n >= 3 ? monthRegex : numRex; },
        D: number, d: number, F: number, H: number, h: number, K: number,
        k: number, m: number, S: number, s: number, u: number, W: number,
        w: number, Y: number, y: number
        // TODO: z, Z and X
    };

    function mnum(n) {
        return n > 1 ? "([-+\\d]\\d{1," + (n - 1) + "})" : "(\\d{1," + n + "})";
    }

    var mrexs = {
        M: function (n) { return n >= 3 ? monthRegex : mnum(n); },
        a: prexs.a, D: mnum, d: mnum, E: prexs.E, F: mnum, G: prexs.G, H: mnum,
        h: mnum, K: mnum, k: mnum, m: mnum, S: mnum, s: mnum, u: mnum, W: mnum,
        w: mnum, Y: mnum, y: mnum
        // TODO: z, Z and X
    };

    function nfun(field) {
        return function (n) {
            return function (s, d) { d[field] = Number(s); };
        };
    }

    var pfuns = {
        a: function (n) {
            return function (s, d) { d.pm = s === api.locale.dayPeriods.pm; };
        },
        E: function (n) { return function (s, d) {  }; },
        G: function (n) {
            return function (s, d) { d.bc = s === api.locale.eras[0]; };
        },
        h: function (n) {
            return function (s, d) { d.h2 = s === "12" ? 0 : Number(s); };
        },
        k: function (n) {
            return function (s, d) { d.h = s === "24" ? 0 : Number(s); };
        },
        M: function (n) {
            return n >= 3 ? function (s, d) { d.m = monthMap[s]; }
                          : function (s, d) { d.m = s - 1; };
        },
        Y: function(n) {
            return function (s, d) {
                d.wcentury = n === 2 && s.match(/^\d\d$/);
                d.wyStr = s.length;
                d.wy = Number(s);
            };
        },
        y: function (n) {
            return function (s, d) {
                d.century = n === 2 && s.match(/^\d\d$/);
                d.yStr = s.length;
                d.y = Number(s);
            };
        },
        D: nfun("yd"), d: nfun("d"), F: $.noop, H: nfun("h"), K: nfun("h2"),
        m: nfun("min"), S: nfun("ms"), s: nfun("s"), u: $.noop, W: $.noop,
        w: nfun("w")
        // TODO: z, Z and X
    };

    var threshold = new Date();
    var century = Math.floor((threshold.getUTCFullYear() + 20) / 100) * 100;

    function parseDateTime(formatMatch, string, D) {
        var handlers = [];
        var rex = formatMatch.replace(pregex,
            function (match, pfmt, mfmt, text, quote, escape) {
                if (pfmt) {
                    handlers.push(pfuns[pfmt.charAt(0)](pfmt.length));
                    return prexs[pfmt.charAt(0)](pfmt.length);
                } else if (mfmt) {
                    handlers.push(pfuns[mfmt.charAt(0)](mfmt.length));
                    return mrexs[mfmt.charAt(0)](mfmt.length);
                } else if (text) {
                    return text;
                } else if (quote) {
                    return "'";
                } else if (escape) {
                    return "\\" + escape;
                }
            });
        var match = string.match(new RegExp("^\\s*" + rex + "\\s*$", "i"));
        if (!match) return null;
        var d = { bc: false, century: false, pm: false,
            y: 1970, m: 0, d: 1, h: 0, h2: 0, min: 0, s: 0, ms: 0,
            w: 1, wd: 0 };
        for (var i = 0; i < handlers.length; i++)
            handlers[i](match[i + 1], d);
        if (!d.h) d.h = Number(d.h2) + (d.pm ? 12 : 0);
        if (d.h < 0 || d.h >= 24 || d.min < 0 || d.min >= 60 ||
            d.s < 0 || d.s >= 60 || d.ms < 0 || d.ms >= 1000)
        {
            return null;
        }
        function adjustYear(year, strLen) {
            year = Number(year);
            var yL = year.toString().length;
            if (yL <= 2 && yL === strLen) {
                year += century;
            }
            // var date = new D(year - 20, d.m, d.d, d.h, d.min, d.s, d.ms);
            // if (date.getTime() > threshold.getTime()) year -= 100;
            if (d.bc) year = 1 - year;
            return year;
        }
        d.y = adjustYear(d.y, d.yStr);
        var date = new D(0);
        if ("wy" in d) {
            d.wy = adjustYear(d.wy, d.wyStr);
            date.setYear(d.wy);
            var jan1st = date.getDays(), start = getWeekStart(date);
            if (7 - (jan1st - start) < api.locale.daysInFirstWeek) start += 7;
            date.setTime(D.utc(api.DAY *
                (start + 7 * d.w - 7 + (d.wd - api.locale.weekStart + 7) % 7)));
            if (getWeekYear(date) !== Number(d.wy) ||
                getWeek(date)     !== Number(d.w)  ||
                date.getDay()     !== Number(d.wd))
            {
                return null;
            }
        } else if ("yd" in d) {
            if (d.yd < 0 || d.yd > (isLeapYear(d.y) ? 366 : 365)) return null;
            date.setYear(d.y);
            date.add(api.DAY * (d.yd - 1));
        } else {
            date.setYear(d.y, d.m, d.d);
            if (date.getYear()  !== Number(d.y) ||
                date.getMonth() !== Number(d.m) ||
                date.getDate()  !== Number(d.d))
            {
                return null;
            }
        }
        date.setHours(d.h, d.min, d.s, d.ms);
        return date;
    }

    // Time zone support

    var tzRegExp = (function () {
        function opt(s) {
            return "(?:" + s + ")?";
        }
        var abbr = "([^\\d,+-]{3,})",
            time = "(\\d+)(?::(\\d+)(?::(\\d+))?)?",
            offset = "([+-])?" + time,
            when = ",(?:J(\\d+)|(\\d+)|M(\\d+)\\.(\\d+)\\.(\\d+))(?:\\/" +
                   time + ")?";
        return new RegExp("^" + abbr + offset +
                          opt(abbr + opt(offset) + when + when) + "$");
    }());

    function julian(day, time) {
        var delta = (day - 1) * api.DAY + time,
            leap = day > 31 + 28 ? api.DAY : 0;
        return function (year) {
            return Date.UTC(year, 0) + delta + (isLeapYear(year) ? leap : 0);
        };
    }
    function gregorian(day, time) {
        var delta = day * api.DAY + time;
        return function (year) {
            return Date.UTC(year, 0) + delta;
        };
    }
    function monthly(month, week, day, time) {
        if (Number(week) === 5) {
            return function (year) {
                var last = Date.UTC(year, month) - api.DAY,
                    dayOfLast = new Date(last).getUTCDay();
                return last - (dayOfLast - day + 7) % 7 * api.DAY + time;
            };
        } else {
            month--;
            var delta = week * 7 * api.DAY + time;
            return function (year) {
                var first = Date.UTC(year, month),
                    dayOfFirst = new Date(first).getUTCDay();
                return first + (day - dayOfFirst + 7) % 7 * api.DAY + delta;
            };
        }
    }

    function parseTZ(tz) {
        var m = tzRegExp.exec(tz);
        function time(i) {
            return m[i++] * api.HOUR + (m[i++] || 0) * api.MINUTE +
                (m[i] || 0) * api.SECOND;
        }
        function offset(i) {
            return m[i] === "-" ? time(i + 1) : -time(i + 1);
        }
        function when(i) {
            var t = m[i + 5] ? time(i + 5) : 72e5;
            return m[i]     ? julian(m[i], t) :
                   m[i + 1] ? gregorian(m[i + 1], t) :
                              monthly(m[i + 2], m[i + 3], m[i + 4], t);
        }
        if (m) {
            var std = {
                abbr: m[1],
                isdst: false,
                gmtoff: offset(2)
            };
            if (m[6]) {
                var dst = {
                    abbr: m[6],
                    isdst: true,
                    gmtoff: m[8] ? offset(7) : std.gmtoff + api.HOUR
                };
                var start = when(11), end = when(19);
                return function (t, local) {
                    var year = new Date(t).getUTCFullYear(),
                        s = start(year) - (local ? 0 : std.gmtoff),
                        e = end(year) - (local ? 0 : dst.gmtoff),
                        isdst = s < e ? t >= s && t < e : t >= s || t < e;
                    return isdst ? dst : std;
                };
            } else {
                return function () { return std; };
            }
        }
    }

    function parseTZInfo(tzinfo) {
        if (tzinfo.slice(0, 4) !== "TZif") {
            throw new Error("Not a zoneinfo file.");
        }
        // Some ISO-8859-1 characters are not mapped 1:1 in Unicode.
        // This is a map back from Unicode to the original byte values.
        var map = { 8364: 128, 8218: 130, 402: 131, 8222: 132, 8230: 133,
                    8224: 134, 8225: 135, 710: 136, 8240: 137, 352: 138,
                    8249: 139, 338: 140, 381: 142, 8216: 145, 8217: 146,
                    8220: 147, 8221: 148, 8226: 149, 8211: 150, 8212: 151,
                    732: 152, 8482: 153, 353: 154, 8250: 155, 339: 156,
                    382: 158, 376: 159 },
            pos = 0, i;

        function byte() {
            var b = tzinfo.charCodeAt(pos++);
            return b < 0x100 ? b : map[b];
        }

        function uint32() {
            return byte() * 0x1000000 + byte() * 0x10000 +
                   byte() * 0x100 + byte();
        }

        function int32() {
            var n = uint32();
            return n < 0x80000000 ? n : n - 0x100000000;
        }

        function int64() {
            return int32() * 0x100000000 + uint32();
        }

        // header

        function header() {
            if (tzinfo.slice(pos, pos + 4) !== "TZif") {
                throw new Error("Invalid zoneinfo header.");
            }
            pos += 20;
            return {
                ttisgmtcnt: int32(),
                ttisstdcnt: int32(),
                leapcnt: int32(),
                timecnt: int32(),
                typecnt: int32(),
                charcnt: int32()
            };
        }

        var tzh = header(), time;

        // use 64 bit variant if available

        var version2 = tzinfo.charAt(4) >= "2";

        if (version2) {
            time = int64;
            pos += tzh.timecnt * 5 + tzh.typecnt * 6 + tzh.charcnt +
                   tzh.leapcnt * 8 + tzh.ttisstdcnt + tzh.ttisgmtcnt;
            tzh = header();
        } else {
            time = int32;
        }

        // transition times

        var transitions = [];
        for (i = 0; i < tzh.timecnt; i++) {
            transitions.push({ start: time() * 1000 });
        }
        for (i = 0; i < tzh.timecnt; i++) {
            transitions[i].index = byte();
        }

        // types of local time

        var ttinfos = [];
        for (i = 0; i < tzh.typecnt; i++) {
            ttinfos.push({
                gmtoff: int32() * api.SECOND,
                isdst: byte(),
                abbr: byte()
            });
        }
        transitions = _.map(transitions, function (t) {
            return { start: t.start, ttinfo: ttinfos[t.index] };
        });

        // abbreviations

        for (i = 0; i < tzh.typecnt; i++) {
            var start = pos + ttinfos[i].abbr;
            ttinfos[i].abbr =
                tzinfo.slice(start, tzinfo.indexOf("\x00", start));
        }
        pos += tzh.charcnt;

        // ignore leap seconds, isstd flags and isgmt flags

        pos += tzh.leapcnt * (version2 ? 12 : 8) +
               tzh.ttisstdcnt + tzh.ttisgmtcnt;

        // precomputed stuff

        var initialTTInfo = _.find(ttinfos, function (ttinfo) {
            return !ttinfo.isdst;
        }) || _.first(ttinfos);

        var finalTTInfo = version2 && byte() === 10 && parseTZ(tzinfo.slice(pos, tzinfo.indexOf("\n", pos)));

        if (!finalTTInfo) {
            finalTTInfo = function () {
                return _.last(transitions).ttinfo;
            };
        }

        var BIN_SIZE = AVG_YEAR / 2;

        function makeGetTTInfo(transitions, local) {
            var firstTransition = Infinity, lastTransition = -Infinity,
                offset;

            function getBin(t) {
                return Math.max(0, Math.floor((t - offset) / BIN_SIZE));
            }

            var hash = [];
            if (transitions.length) {
                lastTransition = _.last(transitions).start;
                firstTransition = _.first(transitions).start;
                offset = _.find(transitions, function (t) {
                        return lastTransition - t.start < 1000 * AVG_YEAR;
                    }).start + AVG_YEAR / 4;
                var bin = -1;
                for (var i = 0; i < transitions.length; i++) {
                    var index = getBin(transitions[i].start);
                    while (bin < index) hash[++bin] = i;
                    hash[bin] = i;
                }
            }

            return function (t) {
                if (t < firstTransition) {
                    return initialTTInfo;
                } else if (t >= lastTransition) {
                    return finalTTInfo(t, local);
                } else {
                    for (var i = hash[getBin(t)]; transitions[i].start > t; --i) {}
                    return transitions[i].ttinfo;
                }
            };
        }

        // time zone specific Date class

        function LocalDate(y, m, d, h, min, s, ms) {
            switch (arguments.length) {
                case 0:
                    this.t = new Date().getTime() + offset;
                    this.local = LocalDate.localTime(this.t);
                    break;
                case 1:
                    this.t = new Date(y).getTime();
                    this.local = LocalDate.localTime(this.t);
                    break;
                default:
                    this.local = Date.UTC.apply(Date, arguments);
                    this.t = LocalDate.utc(this.local);
            }
        }

        $.extend(LocalDate.prototype, DatePrototype);
        if (Object.defineProperty) {
            for (var i in DatePrototype) {
                Object.defineProperty(LocalDate.prototype, i,
                                      { enumerable: false });
            }
        }

        LocalDate.getTTInfo = makeGetTTInfo(transitions);

        /**
         * Returns the local timestamp for a UTC timestamp
         */
        LocalDate.localTime = function (t) {
            return t + LocalDate.getTTInfo(t).gmtoff;
        };

        var prev = initialTTInfo;
        LocalDate.getTTInfoLocal = makeGetTTInfo(_.map(transitions,
            function (tr) {
                return {
                    start: tr.start + prev.gmtoff,
                    ttinfo: prev = tr.ttinfo
                };
            }), true);

        /**
         * Returns the UTC timestamp for a local timestamp
         */
        LocalDate.utc = function (t) {
            return t - LocalDate.getTTInfoLocal(t).gmtoff;
        };

        LocalDate.parse = function (string, format) {
            return parseDateTime(api.getFormat(format), string, LocalDate);
        };

        assert(LocalDate.transitions = transitions);

        return LocalDate;
    }

    var DatePrototype = {
        getDays: function () {
            return Math.floor(this.local / api.DAY);
        },
        getTimeZone: function () {
            return this.constructor.getTTInfo(this.t).abbr;
        },
        valueOf: function () {
            return this.t;
        },
        toString: function () {
            return this.format(api.FULL_DATE);
        },
        add: function(time) {
            this.t = this.constructor.utc(this.local += time);
            return this;
        },
        addUTC: function (time) {
            this.local = this.constructor.localTime(this.t += time);
            return this;
        },
        addMonths: function (months) {
            var d = new Date(this.local);
            d.setUTCMonth(d.getUTCMonth() + months);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        addYears: function (years) {
            var d = new Date(this.local);
            d.setUTCFullYear(d.getUTCFullYear() + years);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        setStartOfWeek: function () {
            this.local = api.DAY * getWeekStart(this);
            this.t = this.constructor.utc(this.local);
            return this;
        },
        getTime: function () {
            return this.t;
        },
        setTime: function (t) {
            this.local = this.constructor.localTime(this.t = t);
            return this;
        },
        getYear: function () {
            return new Date(this.local).getUTCFullYear();
        },
        setYear: function (year, month, date) {
            var d = new Date(this.local);
            d.setUTCFullYear.apply(d, arguments);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getMonth: function () {
            return new Date(this.local).getUTCMonth();
        },
        setMonth: function (month, date) {
            var d = new Date(this.local);
            d.setUTCMonth.apply(d, arguments);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getDate: function () {
            return new Date(this.local).getUTCDate();
        },
        setDate: function(date) {
            var d = new Date(this.local);
            d.setUTCDate(date);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getDay: function () {
            return new Date(this.local).getUTCDay();
        },
        getHours: function () {
            return new Date(this.local).getUTCHours();
        },
        setHours: function (hour, min, sec, ms) {
            var d = new Date(this.local);
            d.setUTCHours.apply(d, arguments);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getMinutes: function () {
            return new Date(this.local).getUTCMinutes();
        },
        setMinutes: function (min, sec, ms) {
            var d = new Date(this.local);
            d.setUTCMinutes.apply(d, arguments);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getSeconds: function () {
            return new Date(this.local).getUTCSeconds();
        },
        setSeconds: function (sec, ms) {
            var d = new Date(this.local);
            d.setUTCSeconds.apply(d, arguments);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getMilliseconds: function () {
            return new Date(this.local).getUTCMilliseconds();
        },
        setMilliseconds: function (ms) {
            var d = new Date(this.local);
            d.setUTCMilliseconds(ms);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        format: function (format) {
            return formatDateTime(api.getFormat(format), this);
        },
        getIntervalFormat: function (end, format) {
            var L = api.locale;
            if (format & api.TIME) {
                if (this.getDays() === end.getDays()) {
                    var diff = L.intervals[(L.h12 ? 'hm' : 'Hm') +
                                           (format & api.TIMEZONE ? 'v' : '')];
                    if (L.h12 &&
                        (this.getHours() < 12) !== (end.getHours() < 12))
                    {
                        return diff.a;
                    } else if (this.getHours() !== end.getHours()) {
                        return diff.h;
                    } else if (this.getMinutes() !== end.getMinutes()) {
                        return diff.m;
                    } else if (this.getTimeZone() === end.getTimeZone()) {
                        return api.getFormat(format);
                    }
                } else {
                    format |= api.DATE;
                }
            } else {
                var diff = format & api.DAYOFWEEK ? L.intervals.yMMMEd :
                                                    L.intervals.yMMMd;
                if (this.getYear() !== end.getYear()) {
                    return diff.y;
                } else if (this.getMonth() !== end.getMonth()) {
                    return diff.m;
                } else if (this.getDate() !== end.getDate()) {
                    return diff.d;
                } else {
                    return api.getFormat(format);
                }
            }
            format = api.getFormat(format);
            return _.printf(L.intervals.fallback, format, format);
        },
        formatInterval: function (end, format) {
            if (typeof format === 'number') {
                format = this.getIntervalFormat(end, format);
            }
            var fields = {}, match;
            regex.lastIndex = 0;
            while ((match = regex.exec(format))) {
                if (!match[1]) continue;
                var letter = match[1].charAt(0);
                if (fields[letter]) break;
                fields[letter] = true;
            }
            if (regex.lastIndex) {
                return this.format(format.slice(0, match.index)) +
                        end.format(format.slice(match.index));
            } else {
                return this.format(format);
            }
        }
    };

    api.getTimeZone = _.memoize(function (name) {
        return require(["raw!io.ox/core/date/tz/zoneinfo/" + name])
            .pipe(parseTZInfo)
            .pipe(function (D) {
                D.id = name;
                // just use this for performance reasons
                D.displayName = name;
                return D;
            });
    });

    var locale = gettext.language.pipe(function (lang) {
        return require(["text!io.ox/core/date/date." + lang + ".json"]);
    }).pipe(null, function (err) {
        return require(['text!io.ox/core/date/date.root.json']);
    }).done(function (locale) {
        api.locale = JSON.parse(locale);
        monthRegex = makeRegex(api.locale.months, api.locale.monthsShort);
        dayRegex = makeRegex(api.locale.days, api.locale.daysShort);
        monthMap = makeMap(api.locale.months, api.locale.monthsShort);
        dayMap = makeMap(api.locale.days, api.locale.daysShort);
    });

    // TODO: get default from local clock
    return $.when(
        api.getTimeZone('UTC'),
        api.getTimeZone(settings.get('timezone', 'UTC'))
            .then(null, function () { return api.getTimeZone('UTC'); }),
        locale
    ).then(function (utc, tz) {
        api.UTC = utc;
        api.Local = tz;
        return api;
    });
});
