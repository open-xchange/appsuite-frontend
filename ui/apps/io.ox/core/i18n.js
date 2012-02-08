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
    
    var tzRegExp = (function () {
        function opt(s) {
            return "(?:" + s + ")?";
        }
        var abbr = "([A-Za-z]{3,})",
            time = "(\\d+)(?::(\\d+)(?::(\\d+))?)?",
            offset = "([+-])?" + time,
            when = "(?:J(\\d+)|(\\d+)|M(\\d+)\\.(\\d+)\\.(\\d+))(?:\\/" + time +
                   ")?";
        return new RegExp("^" + abbr + offset +
                          opt(abbr + opt(offset) + when + when) + "$");
    }());
    
    function julian(day) {}
    function gregorian(day) {}
    function monthly(month, week, day) {}
    
    function parseTZ(tz) {
        var m = tzRegExp.exec(tz);
        function time(i) {
            return m[i++] * 36e5 + (m[i++] || 0) * 6e4 + (m[i] || 0) * 1e3;
        }
        function when(i) {
            return {
                date: m[i]     ? julian(m[i]) :
                      m[i + 1] ? gregorian(m[i + 1]) :
                                 monthly(m[i + 2], m[i + 3], m[i + 4]),
                time: m[i + 5] ? time(i + 5) : 72e5
            };
        }
        if (m) {
            var tzdata = {
                std: m[1],
                stdOffset: time(3)
            };
            if (m[2] === "-") {
                tzdata.stdOffset = -tzdata.stdOffset;
            }
            if (m[6]) {
                tzdata.dst = m[6];
                tzdata.dstOffset = m[7] ? time(7) : tzdata.stdOffset - 36e5;
                tzdata.start = when(10);
                tzdata.end = when(18);
            }
            return tzdata;
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
            if (uint32() !== 0x545a6966) {
                throw new Error("Invalid zoneinfo header.");
            }
            pos += 16;
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
        
        if (tzinfo.charAt(4) < "2") {
            time = int32;
        } else {
            time = int64;
            pos += tzh.timecnt * 5 + tzh.typecnt * 6 + tzh.charcnt +
                   tzh.leapcnt * 8 + tzh.ttisstdcnt + tzh.ttisgmtcnt;
            tzh = header();
        }
        
        // transition times
        
        var transitions = [];
        for (i = 0; i < tzh.timecnt; i++) {
            transitions.push({ start: new Date(time() * 1000) });
        }
        for (i = 0; i < tzh.timecnt; i++) {
            transitions[i].index = byte();
        }
        
        // types of local time
        
        var ttinfos = [];
        for (i = 0; i < tzh.typecnt; i++) {
            ttinfos.push({ gmtoff: int32(), isdst: byte(), abbr: byte() });
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
        
        // leap seconds (ignored)
        
        pos += tzh.leapcnt * 8;
        
        // which transition times are in standard (non-DST) time
        
        for (i = 0; i < tzh.ttisstdcnt; i++) {
            ttinfos[i].isstd = byte();
        }
        
        // which transition times are in GMT
        
        for (i = 0; i < tzh.ttisgmtcnt; i++) {
            ttinfos[i].isgmt = byte();
        }
        
        if (tzinfo.charAt(4) >= "2" && byte() === 10) {
            transitions.rest = parseTZ(tzinfo.slice(pos,
                                                    tzinfo.indexOf("\n", pos)));
        }
        
        return transitions;
    }
    
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
        },
        
        parseTZInfo: function (timezone) {
            return $.ajax({ url: "tz/zoneinfo/" + timezone, dataType: "text" })
                .pipe(parseTZInfo);
        }
    };
});