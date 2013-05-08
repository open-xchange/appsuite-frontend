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
    ["io.ox/core/date",
     'gettext!io.ox/calendar',
     'io.ox/core/api/user',
     'io.ox/contacts/api',
     'io.ox/core/api/group'], function (date, gt, userAPI, contactAPI, groupAPI) {

    "use strict";

    // week day names
    var n_dayShort = date.locale.daysStandalone,
        n_day = date.locale.days,
        // month names
        n_month = date.locale.months,
        // day names
        n_count = [gt("last"), "", gt("first"), gt("second"),
                   gt("third"), gt("fourth"), gt("last")
                   ],
        // shown as
        n_shownAs = [gt("Reserved"), gt("Temporary"),
                     gt("Absent"), gt("Free")
                     ],
        shownAsClass = "reserved temporary absent free".split(' '),
        shownAsLabel = "label-info label-warning label-important label-success".split(' '),
        // confirmation status (none, accepted, declined, tentative)
        confirmClass = "unconfirmed accepted declined tentative".split(' '),
        n_confirm = ['', '<i class="icon-ok">', '<i class="icon-remove">', '<i class="icon-question-sign">'],
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

    var zones;
    $.when.apply($, _.map(
        ['America/Los_Angeles',
         'America/New_York',
         //'America/Sao_Paulo',
         'Europe/London',
         'Europe/Berlin',
         //'Europe/Moscow',
         //'Asia/Kolkata',
         //'Asia/Shanghai',
         'Australia/Sydney'], date.getTimeZone))
        .done(function () {
            zones = Array.prototype.slice.call(arguments);
        });


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
            return new date.Local(year, month + 1, 0).getDate();
        },

        isToday: function (timestamp) {
            return Math.floor(timestamp / DAY) ===
                Math.floor(new date.Local().getTime() / DAY);
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
                    var d = new date.Local(timestamp),
                        // get work day TODO: consider custom week start
                        day = d.getDay(),
                        // subtract
                        t = d.getTime() - day * DAY;
                    // round down to day and return
                    return this.floor(t, DAY);
                }
            }
        },

        getTime: function (localDate) {
            return localDate.format(date.TIME);
        },

// OLD STUFF - looks nice
        getDate: function (timestamp) {
            var d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local();
            return d.format(date.DAYOFWEEK_DATE);
        },

// NEW STUFF - not yet done
//
//        getTime: function (timestamp) {
//            return (new date.Local(date.Local.utc(timestamp)))
//                .format(date.locale.time);
//        },
//
//        getDate: function (timestamp) {
//            var d = timestamp !== undefined ?
//                new date.Local(date.Local.utc(timestamp)) : new date.Local();
//            return d.format(date.locale.date);
//        },

        getSmartDate: function (timestamp, showDate) {

            var d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local(),
                now = new date.Local(),
                showDate = showDate || false,
                weekStart = this.floor(now.getTime(), "week"),
                diff = 0,
                diffWeek = 0;

            // normalize
            d.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            // get difference
            diff = d - now;
            diffWeek = d - weekStart;

            // past?
            if (diff < 0) {
                if (diff >= -1 * DAY) {
                    return gt("Yesterday");
                } else if (diffWeek > -7 * DAY) {
                    return gt("Last Week");
                }
            } else {
                // future
                if (diff < DAY) {
                    return gt("Today");
                } else if (diff < 2 * DAY) {
                    return gt("Tomorrow");
                } else if (diffWeek < 7 * DAY) {
                    return n_day[d.getDay()]; // this week
                } else if (diffWeek >= 7 * DAY && diffWeek < 14 * DAY) {
                    return showDate ? d.format(date.DATE) : gt("Next Week");
                }
            }

            // any other month
            return showDate ? d.format(date.DATE) : n_month[d.getMonth()] + " " + d.getYear();
        },

        getDateInterval: function (data) {
            var startDate = data.start_date,
                endDate = data.end_date;
            if (data.full_time) {
                startDate = date.Local.utc(startDate);
                endDate = date.Local.utc(endDate);
            }
            if (this.onSameDay(startDate, endDate)) {
                return this.getDate(startDate);
            } else {
                return this.getDate(startDate) + " \u2013 " + this.getDate(endDate);
            }
        },

        getReminderOptions: function () {
            var inputid = _.uniqueId('dialog'),
                reminderListValues = [
                {value: -1, format: 'string'},
                {value: 0, format: 'minutes'},
                {value: 15, format: 'minutes'},
                {value: 30, format: 'minutes'},
                {value: 45, format: 'minutes'},

                {value: 60, format: 'hours'},
                {value: 120, format: 'hours'},
                {value: 240, format: 'hours'},
                {value: 360, format: 'hours'},
                {value: 420, format: 'hours'},
                {value: 720, format: 'hours'},

                {value: 1440, format: 'days'},
                {value: 2880, format: 'days'},
                {value: 4320, format: 'days'},
                {value: 5760, format: 'days'},
                {value: 7200, format: 'days'},
                {value: 8640, format: 'days'},

                {value: 10080, format: 'weeks'},
                {value: 20160, format: 'weeks'},
                {value: 30240, format: 'weeks'},
                {value: 40320, format: 'weeks'}
            ],
            options = {};

            _(reminderListValues).each(function (item, index) {
                var i;
                switch (item.format) {
                case 'string':
                    options[item.value] = gt('No reminder');
                    break;
                case 'minutes':
                    options[item.value] = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', item.value), gt.noI18n(item.value));
                    break;
                case 'hours':
                    i = Math.floor(item.value / 60);
                    options[item.value] = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), gt.noI18n(i));
                    break;
                case 'days':
                    i  = Math.floor(item.value / 60 / 24);
                    options[item.value] = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), gt.noI18n(i));
                    break;
                case 'weeks':
                    i = Math.floor(item.value / 60 / 24 / 7);
                    options[item.value] = gt.format(gt.ngettext('%1$d Week', '%1$d Weeks', i), gt.noI18n(i));
                    break;
                }
            });

            return options;
        },

        onSameDay: function (t1, t2) {
            return new date.Local(t1).getDays() === new date.Local(t2).getDays();
        },

        getTimeInterval: function (data, D) {
            var length, start, end, suffix;
            D = D || date.Local;
            if (data.full_time) {
                length = (data.end_date - data.start_date) / DAY >> 0;
                return length <= 1 ? gt('Whole day') : gt.format(
                    //#. General duration (nominative case): X days
                    //#. %d is the number of days
                    //#, c-format
                    gt.ngettext('%d day', '%d days', length), length);
            } else {
                var L = date.locale,
                    diff = L.intervals[(L.h12 ? 'hm' : 'Hm') +
                                       (date.TIME & date.TIMEZONE ? 'v' : '')];
                return new D(data.start_date).formatInterval(
                    new D(data.end_date), diff.m);
            }
        },

        addTimezoneLabel: function (parent, data) {

            var current = date.Local.getTTInfoLocal(data.start_date);

            parent.append(
                $.txt(gt.noI18n(that.getTimeInterval(data) + ' ')),
                $('<span class="label pointer" tabindex="0">').text(gt.noI18n(current.abbr)).popover({
                    title: that.getTimeInterval(data) + ' ' + current.abbr,
                    content: getContent,
                    html: true,
                    animation: false,
                    trigger: 'focus',
                    container: $('#tmp'),
                    placement: function (tip, element) {
                        // add missing outer class
                        $(tip).addClass('timezones');
                        // get placement
                        var off = $(element).offset(),
                            width = $('body').width() / 2;
                        return off.left > width ? 'left' : 'right';
                    }
                })
                .on('dispose', function () {
                    $(this).popover('destroy'); // avoids zombie-popovers
                })
            );

            function getContent() {
                // hard coded for demo purposes
                var div = $('<div>');
                _(zones).each(function (zone) {
                    // must use outer DIV with "clear: both" here for proper layout in firefox
                    div.append($('<div class="clear">').append(
                        $('<span>').text(gt.noI18n(zone.displayName.replace(/^.*?\//, ''))),
                        $('<b>').append($('<span>')
                            .addClass('label label-info')
                            .text(gt.noI18n(zone.getTTInfoLocal(data.start_date).abbr))),
                        $('<i>').text(gt.noI18n(that.getTimeInterval(data, zone)))
                    ));
                });
                return '<div class="list">' + div.html() + '</div>';
            }

            return parent;
        },

        getShownAsClass: function (data) {
            return shownAsClass[(data.shown_as || 1) - 1];
        },

        getShownAsLabel: function (data) {
            return shownAsLabel[(data.shown_as || 1) - 1];
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
                    tmp.push(gt("Work Day"));
                    break;
                case 65:
                    tmp.push(gt("Weekend Day"));
                    break;
                case 127:
                    tmp.push(gt("Day"));
                    break;
                default:
                    if ((i % MONDAY) / SUNDAY >= 1) {
                        tmp.push(gt("Sunday"));
                    }
                    if ((i % THUESDAY) / MONDAY >= 1) {
                        tmp.push(gt("Monday"));
                    }
                    if ((i % WEDNESDAY) / THUESDAY >= 1) {
                        tmp.push(gt("Tuesday"));
                    }
                    if ((i % THURSDAY) / WEDNESDAY >= 1) {
                        tmp.push(gt("Wednesday"));
                    }
                    if ((i % FRIDAY) / THURSDAY >= 1) {
                        tmp.push(gt("Thursday"));
                    }
                    if ((i % SATURDAY) / FRIDAY >= 1) {
                        tmp.push(gt("Friday"));
                    }
                    if (i / SATURDAY >= 1) {
                        tmp.push(gt("Saturday"));
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
                str = f(gt("Each %s Day"), interval);
                break;
            case 2:
                str = interval === 1 ?
                    f(gt("Weekly on %s"), getDayString(days)) :
                    f(gt("Each %s weeks on %s"), interval, getDayString(days));
                break;
            case 3:
                if (days === null) {
                    str = interval === 1 ?
                        f(gt("On %s. day every month"), day_in_month) :
                        f(gt("On %s. day every %s. month"), day_in_month, interval);
                } else {
                    str = interval === 1 ?
                        f(gt("On %s %s every month"), getCountString(day_in_month), getDayString(days)) :
                        f(gt("On %s %s each %s. months"), getCountString(day_in_month), getDayString(days), interval);
                }
                break;
            case 4:
                if (days === null) {
                    str = f(gt("Each %s. %s"), day_in_month, getMonthString(month));
                } else {
                    str = f(gt("On %s %s in %s"), getCountString(day_in_month), getDayString(days), getMonthString(month));
                }
                break;
            }

            return str;
        },

        getNote: function (data) {
            return $.trim(gt.noI18n(data.note) || "")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/</g, "&lt;")
                .replace(/(https?\:\/\/\S+)/g, function ($1) {
                    // soft-break long words (like long URLs)
                    var text = $1.replace(/(\S{20})/g, '$1\u200B');
                    return '<a href="' + $1 + '" target="_blank">' + text + '</a>';
                });
        },

        getConfirmations: function (data) {
            var hash = {};
            if (data) {
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
            }
            return hash;
        },

        getConfirmationStatus: function (obj, id) {
            var hash = this.getConfirmations(obj),
                user = id || ox.user_id;
            return hash[user] ? hash[user].status : 1;
        },

        getConfirmationMessage: function (obj, id) {
            var hash = this.getConfirmations(obj),
                user = id || ox.user_id;
            return hash[user] ? hash[user].comment : '';
        },

        // returns a set of rows, each containing 7 days
        // helps at drawing a mini calendar or a month view
        getMonthScaffold: function (year, month, forerun, overrun) {

            forerun = forerun || 0;
            overrun = overrun || 0;

            var firstDayOfMonth = Date.UTC(year, month, 1),
                // apply week day shift
                shift = (7 + (new date.Local(firstDayOfMonth)).getDay() - that.getFirstWeekDay()) % 7,
                day = firstDayOfMonth - DAY * shift,
                // loop
                rows = [], row, obj, d;

            function getMax() {
                // get number of days in month
                return that.getDaysInMonth(year, month) + shift;
            }

            function loop(max) {
                for (var i = 0; i < max || (i % 7 !== 0); i += 1, day += DAY) {
                    if (i % 7 === 0) {
                        row = [];
                        rows.push(row);
                    }
                    d = new date.Local(day);
                    row.push(obj = {
                        year: d.getYear(),
                        month: d.getMonth(),
                        date: d.getDate(),
                        day: d.getDay(),
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
            }

            // forerun?
            if (forerun > 0) {
                day -= forerun * WEEK;
                loop(forerun * 7);
            }

            loop(getMax());

            // overrun?
            if (overrun > 0) {
                loop(overrun * 7);
            }

            return rows;
        },

        getTodayStart: function (timestamp) {
            return ((timestamp || _.now()) / DAY >> 0) * DAY;
        },

        getWeekStart: function (timestamp) {

            timestamp = this.getTodayStart(timestamp);

            var d = new date.Local(timestamp),
                // apply week day shift
                shift = (7 + d.getDay() - this.getFirstWeekDay()) % 7;

            return d.getTime() - DAY * shift;
        },

        getWeekScaffold: function (timestamp) {
            var day = new date.Local(timestamp).setStartOfWeek(),
                i = 0, obj, ret = {}, today = new date.Local().getDays();
            ret.days = [];
            for (; i < 7; i += 1) {
                ret.days.push(obj = {
                    year: day.getYear(),
                    month: day.getMonth(),
                    date: day.getDate(),
                    day: day.getDay(),
                    timestamp: day.getTime(),
                    isToday: day.getDays() === today,
                    col: i % 7
                });
                // is weekend?
                obj.isWeekend = obj.day === 0 || obj.day === 6;
                obj.isFirst = day.getDate() === 1;
                if (obj.isFirst) {
                    ret.hasFirst = true;
                }
                day.add(date.DAY);
            }
            return ret;
        },

        removeDuplicates: function (idsFromGrGroups, idsFromUsers) {
            return _([].concat(idsFromGrGroups, idsFromUsers)).uniq();
        },

        resolveGroupMembers: function (idsFromGroupMembers, collectedUserIds) {

            return groupAPI.getList(idsFromGroupMembers)
                .then(function (data) {

                    var collectedIdsFromGroups = [];

                    _.each(data, function (single) {
                        _.each(single.members, function (single) {
                            collectedIdsFromGroups.push(single);
                        });
                    });

                    collectedIdsFromGroups = that.removeDuplicates(collectedIdsFromGroups, collectedUserIds);
                    return userAPI.getList(collectedIdsFromGroups);
                })
                .then(function (data) {
                    return _(data).map(function (single) {
                        return {
                            display_name: single.display_name,
                            folder_id: single.folder_id,
                            id: single.id,
                            mail: single.email1,
                            mail_field: 1
                        };
                    });
                });
        },

        createArrayOfRecipients: function (participants, def) {

            var arrayOfRecipients = [],
                arrayOfIds = [],
                idsFromGroupMembers = [],
                arrayOfGroupMembers = [],
                currentUser = ox.user_id;

            _.each(participants, function (single) {
                if (single.type === 5) {
                    arrayOfRecipients.push([single.display_name, single.mail]);
                } else if (single.type === 2) {
                    idsFromGroupMembers.push(single.id);
                } else if (single.type === 1 && single.id !== currentUser) {
                    arrayOfIds.push(single.id);
                }
            });

            that.resolveGroupMembers(idsFromGroupMembers, arrayOfIds).done(function (arrayOfGroupMembers) {

                _.each(arrayOfGroupMembers, function (single) {
                    if (single.id !== currentUser) {
                        arrayOfRecipients.push([single.display_name, single.mail]);
                    }
                });

                userAPI.getList(arrayOfIds).done(function (obj) {
                    _.each(obj, function (single) {
                        arrayOfRecipients.push([single.display_name, single.email1]);
                    });
                    def.resolve(
                        arrayOfRecipients
                    );
                });
            });
        },

        getUserIdByInternalId: function (internal, def) {
            contactAPI.get({id: internal, folder: 6}).done(function (data) {
                def.resolve(data.user_id);
            });
        },

        createDistlistArrayFromPartisipantList: function (participants, def) {
            var distlistArray = [],
                idsFromGroupMembers = [],
                collectedIdsFromGroups = [],
                returnArray = [],
                arrayOfIds = [],
                currentUser = ox.user_id;

            _.each(participants, function (single) {
                if (single.type === 2) {
                    idsFromGroupMembers.push(single.id);
                } else if (single.type === 5) {
                    returnArray.push({
                        display_name: single.display_name,
                        mail: single.mail,
                        mail_field: 0
                    });
                } else if (single.type === 1) {
                    arrayOfIds.push(single.id);
                }
            });

            that.resolveGroupMembers(idsFromGroupMembers, returnArray, arrayOfIds);

            userAPI.getList(arrayOfIds).done(function (obj) {
                _.each(obj, function (single) {
                    if (single.id !== currentUser) {
                        returnArray.push({
                            display_name: single.display_name,
                            folder_id: single.folder_id,
                            id: single.contact_id,
                            mail: single.email1,
                            mail_field: 1
                        });
                    }
                });
                def.resolve({distribution_list: returnArray});
            });


        }
    };

    return that;
});
