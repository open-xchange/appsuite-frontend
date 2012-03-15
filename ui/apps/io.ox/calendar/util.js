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

define("io.ox/calendar/util",
    ["io.ox/core/date", "gettext!io.ox/calendar/calendar"], function (date, gettext) {

    "use strict";

    // week day names
    var n_dayShort = date.locale.daysNarrow,
        n_day = [gettext("Sunday"), gettext("Monday"), gettext("Tuesday"),
                 gettext("Wednesday"), gettext("Thursday"), gettext("Friday"),
                 gettext("Saturday")
                 ],
        // month names
        n_month = [gettext("January"), gettext("February"), gettext("March"),
                   gettext("April"), gettext("May"), gettext("June"),
                   gettext("July"), gettext("August"), gettext("September"),
                   gettext("October"), gettext("November"), gettext("December")
                  ],
        // day names
        n_count = [gettext("last"), "", gettext("first"), gettext("second"),
                   gettext("third"), gettext("fourth"), gettext("last")
                   ],
        // shown as
        n_shownAs = [gettext("Reserved"), gettext("Temporary"),
                     gettext("Absent"), gettext("Free")
                     ],
        shownAsClass = "reserved temporary absent free".split(' '),
        // confirmation status (none, accepted, declined, tentative)
        n_confirm = ["", "\u2713", "x", "?"],
        confirmClass = ["", "accepted", "declined", "tentative"],
        // constants
        MINUTE = 60000,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        WEEK = 7 * DAY,
        // day bitmask
        SUNDAY = 1,
        MONDAY = 2,
        THUESDAY = 4,
        WEDNESDAY = 8,
        THURSDAY = 16,
        FRIDAY = 32,
        SATURDAY = 64,
        // week starts with (0=Sunday, 1=Monday, ..., 6=Saturday)
        firstWeekDay = date.locale.weekStart;
    
    var that = {

        MINUTE: MINUTE,

        HOUR: HOUR,

        DAY: DAY,

        WEEK: WEEK,

        getFirstWeekDay: function () {
            return firstWeekDay;
        },

        getDayNames: function () {
            return n_dayShort.slice(firstWeekDay).concat(n_dayShort.slice(0, firstWeekDay));
        },

        getDaysInMonth: function (year, month) {
            // trick: month + 1 & day = zero -> last day in month
            return new Date(year, month + 1, 0).getDate();
        },

        isToday: function (timestamp) {
            return Math.floor(timestamp / DAY) ===
                Math.floor(date.Local.localTime((new Date()).getTime()) / DAY);
        },

        floor: function (timestamp, step) {
            // set defaults
            timestamp = timestamp || 0;
            step = step || HOUR;
            // number?
            if (typeof step === "number") {
                return Math.floor(timestamp / step) * step;
            } else {
                if (step === "week") {
                    // get current date
                    var d = new Date(timestamp),
                        // get work day TODO: consider custom week start
                        day = d.getDay(),
                        // subtract
                        t = d.getTime() - day * DAY;
                    // round down to day and return
                    return this.floor(t, DAY);
                }
            }
        },

        getTime: function (timestamp) {
            return (new date.Local(date.Local.utc(timestamp)))
                .format(date.locale.time);
        },

        getDate: function (timestamp) {
            var d = timestamp !== undefined ?
                new date.Local(date.Local.utc(timestamp)) : new date.Local();
            return d.format(date.locale.date);
        },

        getSmartDate: function (timestamp) {

            var d = timestamp !== undefined ? new Date(timestamp) : new Date(),
                now = new Date(),
                weekStart = this.floor(now.getTime(), "week"),
                diff = 0,
                diffWeek = 0;

            // normalize
            d.setUTCHours(0, 0, 0, 0);
            now.setUTCHours(0, 0, 0, 0);

            // get difference
            diff = d - now;
            diffWeek = d - weekStart;

            // past?
            if (diff < 0) {
                if (diff >= -1 * DAY) {
                    return "Yesterday";
                } else if (diffWeek > -7 * DAY) {
                    return "Last Week";
                }
            } else {
                // future
                if (diff < DAY) {
                    return "Today";
                } else if (diff < 2 * DAY) {
                    return "Tomorrow";
                } else if (diffWeek < 7 * DAY) {
                    return n_day[d.getUTCDay()]; // this week
                } else if (diffWeek >= 7 * DAY && diffWeek < 14 * DAY) {
                    return "Next week";
                }
            }

            // any other month
            return n_month[d.getUTCMonth()] + " " + d.getUTCFullYear();
        },

        getDateInterval: function (data) {
            var length = (data.end_date - data.start_date) / DAY >> 0;
            if (data.full_time && length > 1) {
                // \u2013= &ndash;
                return this.getDate(data.start_date) + " \u2013 " + this.getDate(data.end_date - 1);
            } else {
                return this.getDate(data.start_date);
            }
        },

        getTimeInterval: function (data) {
            var length;
            if (data.full_time) {
                length = (data.end_date - data.start_date) / DAY >> 0;
                return length <= 1 ? "Whole day" : length + " days";
            } else {
                return this.getTime(data.start_date) + " \u2013 " + this.getTime(data.end_date);
            }
        },

        getShownAsClass: function (data) {
            return shownAsClass[(data.shown_as || 1) - 1];
        },

        getShownAs: function (data) {
            return n_shownAs[(data.shown_as || 1) - 1];
        },

        getConfirmationSymbol: function (status) {
            return n_confirm[status || 0];
        },

        getConfirmationClass: function (status) {
            return confirmClass[status || 0];
        },

        isRecurring: function (data) {
            return !!data.recurrence_type;
        },

        getRecurrenceString: function (data) {

            function getCountString(i) {
                return n_count[i + 1];
            }

            function getDayString(i) {
                var tmp = [];
                switch (i) {
                case 62:
                    tmp.push(gettext("Work Day"));
                    break;
                case 65:
                    tmp.push(gettext("Weekend Day"));
                    break;
                case 127:
                    tmp.push(gettext("Day"));
                    break;
                default:
                    if ((i % MONDAY) / SUNDAY >= 1) {
                        tmp.push(gettext("Sunday"));
                    }
                    if ((i % THUESDAY) / MONDAY >= 1) {
                        tmp.push(gettext("Monday"));
                    }
                    if ((i % WEDNESDAY) / THUESDAY >= 1) {
                        tmp.push(gettext("Tuesday"));
                    }
                    if ((i % THURSDAY) / WEDNESDAY >= 1) {
                        tmp.push(gettext("Wednesday"));
                    }
                    if ((i % FRIDAY) / THURSDAY >= 1) {
                        tmp.push(gettext("Thursday"));
                    }
                    if ((i % SATURDAY) / FRIDAY >= 1) {
                        tmp.push(gettext("Friday"));
                    }
                    if (i / SATURDAY >= 1) {
                        tmp.push(gettext("Saturday"));
                    }
                }
                return tmp.join(", ");
            }

            function getMonthString(i) {
                return n_month[i];
            }

            var str = "", f = _.printf,
                interval = data.interval,
                days = data.days || null,
                month = data.month,
                day_in_month = data.day_in_month;

            switch (data.recurrence_type) {
            case 1:
                str = f(gettext("Each %s Day"), interval);
                break;
            case 2:
                str = interval === 1 ?
                    f(gettext("Weekly on %s"), getDayString(days)) :
                    f(gettext("Each %s weeks on %s"), interval, getDayString(days));
                break;
            case 3:
                if (days === null) {
                    str = interval === 1 ?
                        f(gettext("On %s. day every month"), day_in_month) :
                        f(gettext("On %s. day every %s. month"), day_in_month, interval);
                } else {
                    str = interval === 1 ?
                        f(gettext("On %s %s every month"), getCountString(day_in_month), getDayString(days)) :
                        f(gettext("On %s %s each %s. months"), getCountString(day_in_month), getDayString(days), interval);
                }
                break;
            case 4:
                if (days === null) {
                    str = f(gettext("Each %s. %s"), day_in_month, getMonthString(month));
                } else {
                    str = f(gettext("On %s %s in %s"), getCountString(day_in_month), getDayString(days), getMonthString(month));
                }
                break;
            }

            return str;
        },

        getNote: function (data) {
            return $.trim(data.note || "")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/</g, "&lt;")
                .replace(/(https?\:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },

        getConfirmations: function (data) {
            var hash = {};
            // internal users
            _(data.users).each(function (obj) {
                hash[String(obj.id)] = {
                    status: obj.confirmation || 0,
                    comment: obj.confirmmessage || ""
                };
            });
            // external users
            _(data.confirmations).each(function (obj) {
                hash[obj.mail] = {
                    status: obj.status || 0,
                    comment: obj.confirmmessage || ""
                };
            });
            return hash;
        },

        // returns a set of rows, each containing 7 days
        // helps at drawing a mini calendar or a month view
        getMonthScaffold: function (timestamp) {

            // use timestamp or current time
            var d = new Date(timestamp || _.now()),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                weekday = d.getUTCDay(),
                // apply week day shift
                shift = (7 + weekday - that.getFirstWeekDay()) % 7,
                // get number of days in month
                max = that.getDaysInMonth(year, month) + shift,
                // loop
                i = 0,
                rows = [],
                day = Date.UTC(year, month, 1) - DAY * shift,
                row,
                obj;

            for (; i < max || i % 7 !== 0; i += 1, day += DAY) {
                if (i % 7 === 0) {
                    row = [];
                    rows.push(row);
                }
                d = new Date(day);
                row.push(obj = {
                    year: d.getUTCFullYear(),
                    month: d.getUTCMonth(),
                    date: d.getUTCDate(),
                    day: d.getUTCDay(),
                    timestamp: day,
                    isToday: that.isToday(day),
                    col: i % 7,
                    row: rows.length - 1
                });
                // is weekend?
                obj.isWeekend = obj.day === 0 || obj.day === 6;
                // is out of current month?
                obj.isOut = obj.year !== year || obj.month !== month;
            }

            return rows;
        }
    };

    return that;
});
