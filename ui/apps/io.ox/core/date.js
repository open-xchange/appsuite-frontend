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
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define.async('io.ox/core/date', ['io.ox/core/gettext', 'io.ox/core/config'],
function (gettext, config) {
    /*jshint white:false */

    'use strict';

    var AVG_YEAR = 31556952000; // average ms / year

    var api = {
        SECOND:    1000, // ms / s
        MINUTE:   60000, // ms / min
        HOUR:   3600000, // ms / h
        DAY:   86400000, // ms / day
        WEEK: 604800000  // ms / week
    };

    //@include api.locale = date.root.json
    ;

    // TODO: Difference between server and client clocks.
    var offset = 0;

    function getDays(d) {
        return Math.floor(d / api.DAY);
    }

    /**
     * Computes the number of the first day of the specified week, taking into
     * account weekStart.
     * @param  {Date} d The date for which to calculate the first day of week
     * number.
     * @type Number
     * @return First day in the week as the number of days since 1970-01-01.
     * @ignore
     */
    function getWeekStart(d) {
        return getDays(d.getTime()) - (d.getUTCDay() - api.weekStart + 7) % 7;
    }

    /**
     * Returns the day of the week which decides the week number
     * @return Day of week as the number of days since 1970-01-01.
     */
    function getKeyDayOfWeek(d) {
        return (getWeekStart(d) + 7 - api.daysInFirstWeek);
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
        var keyDate = new Date(keyDay * api.DAY);
        var jan1st = Date.UTC(keyDate.getUTCFullYear(),
                              inMonth ? keyDate.getUTCMonth() : 0);
        return Math.floor((keyDay - getDays(jan1st)) / 7) + 1;
    }

    function getWeekYear(d) {
        var year = d.getUTCFullYear(),
            month = d.getUTCMonth(),
            week = getWeek(d);
        if (month === 0 && week > 26) year--;
        if (month === 11 && week < 26) year++;
        return year;
    }

    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    var reLetters = "GyYMwWDdFEuaHkKhmsSzZX".split("").join("+|") + "+";
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
            return api.locale.dayPeriods[d.getUTCHours() < 12 ? 'am' : 'pm'];
        },
        D: function (n, d) {
            return num(n,
                getDays(d.getTime() - Date.UTC(d.getUTCFullYear(), 0)) + 1);
        },
        d: function (n, d) { return num(n, d.getUTCDate()); },
        E: function (n, d) {
            var m = d.getUTCDay();
            return text(n, api.locale.days[m], api.locale.shortDays[m]);
        },
        F: function (n, d) {
            return num(n, Math.floor(d.getUTCDate() / 7) + 1);
        },
        G: function (n, d) {
            return api.locale.eras[d.getTime() < -621355968e5 ? 0 : 1];
        },
        H: function (n, d) { return num(n, d.getUTCHours()); },
        h: function (n, d) { return num(n, d.getUTCHours() % 12 || 12); },
        K: function (n, d) { return num(n, d.getUTCHours() % 12); },
        k: function (n, d) { return num(n, d.getUTCHours() || 24); },
        M: function (n, d) {
            var m = d.getUTCMonth();
            if (n >= 3) {
                return text(n, api.locale.months[m], api.locale.monthsShort[m]);
            } else {
                return num(n, m + 1);
            }
        },
        m: function (n, d) { return num(n, d.getUTCMinutes()); },
        S: function (n, d) { return num(n, d.getMilliseconds()); },
        s: function (n, d) { return num(n, d.getUTCSeconds()); },
        u: function (n, d) { return num(n, (d.getUTCDay() + 6) % 7 + 1); },
        W: function (n, d) { return num(n, getWeek(d, true)); },
        w: function (n, d) { return num(n, getWeek(d)); },
        X: function (n, d) {

        },
        Y: function (n, d) {
            var y = d.getUTCFullYear(), m = d.getUTCMonth(), w = getWeek(d);
            if (m === 0 && w > 26) y--;
            if (m === 11 && w < 26) y++;
            if (y < 1) y = 1 - y;
            return num(n, n === 2 ? y % 100 : y);
        },
        y: function (n, d) {
            var y = d.getUTCFullYear();
            if (y < 1) y = 1 - y;
            return num(n, n === 2 ? y % 100 : y);
        },
        Z: function (n, d) {

        },
        z: function (n, d) {

        }
        // TODO: z, Z and X
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
                d.wy = Number(s);
            };
        },
        y: function (n) {
            return function (s, d) {
                d.century = n === 2 && s.match(/^\d\d$/);
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

    function parseDateTime(formatMatch, string) {
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
        function adjustYear(year, isCentury) {
            if (isCentury) {
                year = Number(year) + century;
                var date = new Date(0);
                date.setUTCFullYear(year - 20, d.m, d.d);
                date.setUTCHours(d.h, d.min, d.s, d.ms);
                if (date.getTime() > threshold.getTime()) year -= 100;
            }
            if (d.bc) year = 1 - year;
            return year;
        }
        d.y = adjustYear(d.y);
        var date = new Date(0);
        if ("wy" in d) {
            d.wy = adjustYear(d.wy);
            date.setUTCFullYear(d.wy);
            var jan1st = getDays(date.getTime()), start = getWeekStart(date);
            if (7 - (jan1st - start) < api.daysInFirstWeek) start += 7;
            date.setTime(start + 7 * d.w - 7 + (d.wd - api.weekStart + 7) % 7);
            if (getWeekYear(date) !== Number(d.wy) ||
                getWeek(date)     !== Number(d.w)  ||
                date.getUTCDay()  !== Number(d.wd))
            {
                return null;
            }
        } else if ("yd" in d) {
            if (d.yd < 0 || d.yd > (isLeapYear(d.y) ? 366 : 365)) return null;
            date.setUTCFullYear(d.y);
            date.setTime(date.getTime() + api.DAY * d.yd - api.DAY);
        } else {
            date.setUTCFullYear(d.y, d.m, d.d);
            if (date.getUTCFullYear() !== Number(d.y) ||
                date.getUTCMonth()    !== Number(d.m) ||
                date.getUTCDate()     !== Number(d.d))
            {
                return null;
            }
        }
        date.setUTCHours(d.h, d.min, d.s, d.ms);
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

        var finalTTInfo = version2 && byte() === 10 ?
                parseTZ(tzinfo.slice(pos, tzinfo.indexOf("\n", pos))) :
                function () {
                    return _.last(transitions).ttinfo;
                };

        var BIN_SIZE = AVG_YEAR / 2;

        function makeGetTTInfo(transitions, local) {
            var firstTransition = Infinity, lastTransition = -Infinity,
                offset;

            function getBin(t) {
                return Math.floor((t - offset) / BIN_SIZE);
            }

            var hash = [];
            if (transitions.length) {
                firstTransition = _.first(transitions).start;
                lastTransition = _.last(transitions).start;
                offset = firstTransition + AVG_YEAR / 4;
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

        function D(y, m, d, h, min, s, ms) {
            switch (arguments.length) {
                case 0:
                    this.t = new Date().getTime() + offset;
                    this.local = D.localTime(this.t);
                    break;
                case 1:
                    this.t = new Date(y).getTime();
                    this.local = D.localTime(this.t);
                    break;
                default:
                    arguments[1]--;
                    this.local = Date.UTC.apply(Date, arguments);
                    this.t = D.utc(this.local);
            }
        }

        $.extend(D.prototype, DatePrototype);
        if (Object.defineProperty) {
            for (var i in DatePrototype) {
                Object.defineProperty(D.prototype, i, { enumerable: false });
            }
        }

        D.getTTInfo = makeGetTTInfo(transitions);

        /**
         * Returns the local timestamp for a UTC timestamp
         */
        D.localTime = function (t) { return t + D.getTTInfo(t).gmtoff; };

        var prev = initialTTInfo;
        D.getTTInfoLocal = makeGetTTInfo(_.map(transitions, function (tr) {
            return { start: tr.start + prev.gmtoff, ttinfo: prev = tr.ttinfo };
        }), true);

        /**
         * Returns the UTC timestamp for a local timestamp
         */
        D.utc = function (t) { return t - D.getTTInfoLocal(t).gmtoff; };

        D.parse = function (string, format) {
            return new D(D.utc(parseDateTime(format || api.locale.dateTime, string)));

            //before monkey-patch
            //return new D(parseDateTime(format || api.locale.dateTime, string));
        };

        assert(D.transitions = transitions);

        return D;
    }

    var DatePrototype = {
        getDays: function () {
            return Math.floor(this.local / api.DAY);
        },
        format: function (format) {
            var d = new Date(this.local);
            return formatDateTime(format || api.locale.dateTime, d);
        },
        toString: function () {
            return this.format();
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
        setYear: function (y) {
            var d = new Date(this.local);
            d.setUTCFullYear(y);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getMonth: function () {
            return new Date(this.local).getUTCMonth() + 1;
        },
        setMonth: function (m) {
            var d = new Date(this.local);
            d.setUTCMonth(m - 1);
            this.t = this.constructor.utc(this.local = d.getTime());
            return this;
        },
        getDay: function () {
            return new Date(this.local).getUTCDay();
        }
    };
    _.each(['Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'],
        function(name) {
            DatePrototype['get' + name] = new Function(
                'return new Date(this.local).getUTC' + name + '();');
            DatePrototype['set' + name] = new Function('x',
                'var d = new Date(this.local);' +
                'd.setUTC' + name + '(x);' +
                'this.t = this.constructor.utc(this.local = d.getTime());' +
                'return this;');
        });

    api.getTimeZone = _.memoize(function (name) {
        return require(["text!io.ox/core/tz/zoneinfo/" + name])
            .pipe(parseTZInfo)
            .pipe(function (D) {
                D.id = name;
                D.displayName = config.get(['availableTimeZones', name], name);
                return D;
            });
    });

    var locale = gettext.language.pipe(function (lang) {
        return require(["text!io.ox/core/date." + lang + ".json"]);
    }).done(function (locale) {
        api.locale = JSON.parse(locale);
        monthRegex = makeRegex(api.locale.months, api.locale.monthsShort);
        dayRegex = makeRegex(api.locale.days, api.locale.daysShort);
        monthMap = makeMap(api.locale.months, api.locale.monthsShort);
        dayMap = makeMap(api.locale.days, api.locale.daysShort);
    });

    // TODO: load the entire locale config
    return $.when(api.getTimeZone('Europe/Berlin'), locale/*, config */)
        .pipe(function (tz) {
            api.Local = tz;
            return api;
        });
});
