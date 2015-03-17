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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/util',
    ['io.ox/core/date',
     'gettext!io.ox/calendar',
     'settings!io.ox/calendar',
     'io.ox/core/api/user',
     'io.ox/contacts/api',
     'io.ox/core/api/group',
     'io.ox/core/folder/api',
     'io.ox/core/util'
    ], function (date, gt, settings, userAPI, contactAPI, groupAPI, folderAPI, util) {

    'use strict';

    var // day names
        n_count = [gt('last'), '', gt('first'), gt('second'), gt('third'), gt('fourth'), gt('last')],
        // shown as
        n_shownAs = [gt('Reserved'), gt('Temporary'), gt('Absent'), gt('Free')],
        shownAsClass = 'reserved temporary absent free'.split(' '),
        shownAsLabel = 'label-info label-warning label-important label-success'.split(' '),
        // confirmation status (none, accepted, declined, tentative)
        confirmClass = 'unconfirmed accepted declined tentative'.split(' '),
        confirmTitles = [/*appointment confirmation status*/gt('unconfirmed'),
            /*appointment confirmation status*/gt('accepted'),
            /*appointment confirmation status*/gt('declined'),
            /*appointment confirmation status*/gt('tentative')
        ],
        n_confirm = ['', '<i class="fa fa-check">', '<i class="fa fa-times">', '<i class="fa fa-question-circle">'];

    var that = {

        // day bitmask
        days: {
            SUNDAY: 1,
            MONDAY: 2,
            TUESDAY: 4,
            WEDNESDAY: 8,
            THURSDAY: 16,
            FRIDAY: 32,
            SATURDAY: 64
        },

        isBossyAppointmentHandling: function (opt) {

            _.extend({
                app: {},
                invert: false,
                folderData: null
            }, opt);

            if (settings.get('bossyAppointmentHandling', false)) {

                var check = function (data) {
                    if (folderAPI.is('private', data)) {
                        var isOrganizer = opt.app.organizerId === ox.user_id;
                        return opt.invert ? !isOrganizer : isOrganizer;
                    } else {
                        return true;
                    }
                };

                if (opt.folderData) {
                    return $.Deferred().resolve(check(opt.folderData));
                } else {
                    return folderAPI.get(opt.app.folder_id).then(function (data) {
                        return check(data);
                    });
                }

            } else {
                return $.Deferred().resolve(true);
            }
        },

        getFirstWeekDay: function () {
            // week starts with (0=Sunday, 1=Monday, ..., 6=Saturday)
            return date.locale.weekStart;
        },

        getDaysInMonth: function (year, month) {
            // trick: month + 1 & day = zero -> last day in month
            return new date.Local(year, month + 1, 0).getDate();
        },

        isToday: function (timestamp) {
            return Math.floor(timestamp / date.DAY) ===
                Math.floor(new date.Local().getTime() / date.DAY);
        },

        floor: function (timestamp, step) {
            // set defaults
            timestamp = timestamp || 0;
            step = step || date.HOUR;
            // number?
            if (typeof step === 'number') {
                return Math.floor(timestamp / step) * step;
            } else {
                if (step === 'week') {
                    // get current date
                    var d = new date.Local(timestamp),
                        // get work day TODO: consider custom week start
                        day = d.getDay(),
                        // subtract
                        t = d.getTime() - day * date.DAY;
                    // round down to day and return
                    return this.floor(t, date.DAY);
                }
            }
        },

        getTime: function (localDate) {
            return localDate.format(date.TIME);
        },

        getDate: function (timestamp) {
            var d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local();
            return d.format(date.DAYOFWEEK_DATE);
        },

        //returns date with full weekday name
        getDateA11y: function (timestamp) {
            var d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local();
            return date.locale.days[d.getDay()] + ', ' + d.format(date.DATE);
        },

        getSmartDate: function (data, showDate) {

            var timestamp = data.full_time ? date.Local.utc(data.start_date) : data.start_date,
                d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local(),
                now = new date.Local(),
                showDate = showDate || false,
                weekStart = this.floor(now.getTime(), 'week'),
                diff = 0,
                diffWeek = 0,
                lastSunday;

            // normalize
            d.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            // get difference
            diff = d - now;
            diffWeek = d - weekStart;

            // past?
            if (diff < 0) {
                // handle last sunday on next sunday
                lastSunday = (diffWeek === -7 * date.DAY && now.t === weekStart);

                if (diff >= -1 * date.DAY) {
                    return gt('Yesterday');
                } else if (diffWeek > -7 * date.DAY || lastSunday) {
                    return gt('Last Week');
                }
            } else {
                // future
                if (diff < date.DAY) {
                    return gt('Today');
                } else if (diff < 2 * date.DAY) {
                    return gt('Tomorrow');
                } else if (diffWeek < 7 * date.DAY) {
                    // this week
                    return date.locale.days[d.getDay()];
                } else if (diffWeek >= 7 * date.DAY && diffWeek < 14 * date.DAY) {
                    return showDate ? d.format(date.DATE) : gt('Next Week');
                }
            }

            // any other month
            return showDate ? d.format(date.DATE) : date.locale.months[d.getMonth()] + ' ' + d.getYear();
        },

        getEvenSmarterDate: function (data) {

            var timestamp = data.full_time ? date.Local.utc(data.start_date) : data.start_date,
                d = timestamp !== undefined ? new date.Local(timestamp) : new date.Local(),
                now = new date.Local(), diff = 0;

            // normalize
            d.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            // get difference
            diff = d - now;

            // past?
            if (diff < 0) {
                if (diff >= -1 * date.DAY) {
                    return gt('Yesterday') + ', ' + d.format(date.DATE);
                } else {
                    return d.format('EE, ') + d.format(date.DATE);
                }
            } else {
                // future
                if (diff < date.DAY) {
                    return gt('Today') + ', ' + d.format(date.DATE);
                } else if (diff < 2 * date.DAY) {
                    return gt('Tomorrow') + ', ' + d.format(date.DATE);
                } else {
                    return d.format('EE, ') + d.format(date.DATE);
                }
            }
        },

        getDateInterval: function (data) {
            if (data && data.start_date && data.end_date) {
                var startDate = data.start_date,
                    endDate = data.end_date;
                if (data.full_time) {
                    startDate = date.Local.utc(startDate);
                    endDate = date.Local.utc(endDate);
                    endDate -= date.DAY;
                }
                if (this.onSameDay(startDate, endDate)) {
                    return this.getDate(startDate);
                } else {
                    return this.getDate(startDate) + ' \u2013 ' + this.getDate(endDate);
                }
            } else {
                return '';
            }
        },

        getDateIntervalA11y: function (data) {
            if (data && data.start_date && data.end_date) {
                var startDate = data.start_date,
                    endDate = data.end_date;
                if (data.full_time) {
                    startDate = date.Local.utc(startDate);
                    endDate = date.Local.utc(endDate);
                    endDate -= date.DAY;
                }
                if (this.onSameDay(startDate, endDate)) {
                    return this.getDateA11y(startDate);
                } else {
                            //#. date intervals for screenreaders
                            //#. please keep the 'to' do not use dashes here because this text will be spoken by the screenreaders
                            //#. %1$s is the start date
                            //#. %2$s is the end date
                            //#, c-format
                    return gt('%1$s to %2$s', this.getDateA11y(startDate), this.getDateA11y(endDate));
                }
            } else {
                return '';
            }
        },

        getReminderOptions: function () {
            var reminderListValues = [
                {value: -1, format: 'string'},

                {value: 0, format: 'minutes'},
                {value: 5, format: 'minutes'},
                {value: 10, format: 'minutes'},
                {value: 15, format: 'minutes'},
                {value: 30, format: 'minutes'},
                {value: 45, format: 'minutes'},

                {value: 60, format: 'hours'},
                {value: 120, format: 'hours'},
                {value: 240, format: 'hours'},
                {value: 360, format: 'hours'},
                {value: 480, format: 'hours'},
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

            _(reminderListValues).each(function (item) {
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

        getDurationInDays: function (data) {
            return (data.end_date - data.start_date) / date.DAY >> 0;
        },

        getFullTimeInterval: function (data, smart) {
            var length = this.getDurationInDays(data);
            return length <= 1  && smart ? gt('Whole day') : gt.format(
                //#. General duration (nominative case): X days
                //#. %d is the number of days
                //#, c-format
                gt.ngettext('%d day', '%d days', length), length);
        },

        getTimeInterval: function (data, D) {
            if (!data || !data.start_date || !data.end_date) return '';
            if (data.full_time) {
                return this.getFullTimeInterval(data, true);
            } else {
                D = D || date.Local;
                var diff = date.locale.intervals[(date.locale.h12 ? 'hm' : 'Hm') + (date.TIME & date.TIMEZONE ? 'v' : '')];
                return new D(data.start_date).formatInterval(new D(data.end_date), diff.a || diff.m);
            }
        },
        getTimeIntervalA11y: function (data) {
            if (!data || !data.start_date || !data.end_date) return '';
            if (data.full_time) {
                return this.getFullTimeInterval(data, true);
            } else {
                var start = new date.Local(data.start_date),
                    end = new date.Local(data.end_date);
                        //#. Time intervals for screenreaders
                        //#. please keep the 'to' do not use dashes here because this text will be spoken by the screenreaders
                        //#. %1$s is the start time
                        //#. %2$s is the end time
                        //#, c-format
                return gt('%1$s to %2$s', start.format(date.TIME), end.format(date.TIME));
            }
        },

        getStartAndEndTime: function (data) {
            var ret = [];
            if (!data || !data.start_date || !data.end_date) return ret;
            if (data.full_time) {
                ret.push(this.getFullTimeInterval(data, false));
            } else {
                ret.push(new date.Local(data.start_date).format(date.TIME), new date.Local(data.end_date).format(date.TIME));
            }
            return ret;
        },

        addTimezoneLabel: function (parent, data) {

            var current = date.Local.getTTInfoLocal(data.start_date);
            parent.append(
                $.txt(gt.noI18n(that.getTimeInterval(data))),
                $('<span class="label label-default pointer" tabindex="1">').text(gt.noI18n(current.abbr)).popover({
                    container: '#io-ox-core',
                    content: getContent(),
                    html: true,
                    placement: function (tip) {
                        // add missing outer class
                        $(tip).addClass('timezones');
                        // get placement
                        return 'left';
                    },
                    title: that.getTimeInterval(data) + ' ' + current.abbr,
                    trigger: 'hover focus'
                }).on('blur', function () {
                    $(this).popover('hide');
                })
            );

            function getContent() {
                // hard coded for demo purposes
                var div = $('<ul class="list-unstyled">');
                $.when.apply($, _.map(
                    ['America/Los_Angeles',
                     'America/New_York',
                     'Europe/London',
                     'Europe/Berlin',
                     'Australia/Sydney'], date.getTimeZone))
                    .done(function () {
                        _(Array.prototype.slice.call(arguments)).each(function (zone) {
                            // must use outer DIV with "clear: both" here for proper layout in firefox
                            div.append($('<li>').append(
                                $('<span>')
                                    .text(gt.noI18n(zone.displayName.replace(/^.*?\//, '').replace(/_/g, ' '))),
                                $('<span>')
                                    .addClass('label label-info')
                                    .text(gt.noI18n(zone.getTTInfoLocal(data.start_date).abbr)),
                                $('<span>')
                                    .addClass('time')
                                    .text(gt.noI18n(that.getTimeInterval(data, zone)))
                            ));
                        });
                    });

                return div;
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

        getRecurrenceString: function (data) {

            function getCountString(i) {
                return n_count[i + 1];
            }

            function getDayString(i) {
                var tmp = [];
                if (i === 62) {
                    tmp.push(
                        //#. recurrence string
                        gt('work days')
                    );
                } else {
                    if ((i & that.days.SUNDAY) !== 0) tmp.push(gt('Sunday'));
                    if ((i & that.days.MONDAY) !== 0) tmp.push(gt('Monday'));
                    if ((i & that.days.TUESDAY) !== 0) tmp.push(gt('Tuesday'));
                    if ((i & that.days.WEDNESDAY) !== 0) tmp.push(gt('Wednesday'));
                    if ((i & that.days.THURSDAY) !== 0) tmp.push(gt('Thursday'));
                    if ((i & that.days.FRIDAY) !== 0) tmp.push(gt('Friday'));
                    if ((i & that.days.SATURDAY) !== 0) tmp.push(gt('Saturday'));
                }

                var and =
                    //#. recurrence string
                    //#. used to concatenate two weekdays, like Monday and Tuesday
                    gt('and');

                return tmp.length === 2 ? tmp.join(' ' + and + ' ') : tmp.join(', ');
            }

            function getMonthString(i) {
                // month names
                return date.locale.months[i];
            }

            var str = '',
                interval = data.interval,
                days = data.days || null,
                month = data.month,
                day_in_month = data.day_in_month;

            switch (data.recurrence_type) {

            // DAILY
            case 1:
                return interval === 1 ?
                    gt('Every day') :
                    //#. recurrence string
                    //#. %1$d: numeric
                    gt('Every %1$d days', interval);

            // WEEKLY
            case 2:
                // special case: weekly but all days checked
                if (days === 127) {
                    return interval === 1 ?
                        gt('Every day') :
                        //#. recurrence string
                        //#. %1$d: numeric
                        gt('Every %1$d weeks on all days', interval);
                }

                // special case: weekly on work days
                if (days === 62) {
                    return interval === 1 ?
                        //#. recurrence string
                        gt('On work days') :
                        //#. recurrence string
                        //#. %1$d: numeric
                        gt('Every %1$d weeks on work days', interval);
                }

                return interval === 1 ?
                    //#. recurrence string
                    //#. %1$s day string, e.g. "work days" or "Friday" or "Monday, Tuesday, Wednesday"
                    gt('Weekly on %1$s', getDayString(days)) :
                    //#. recurrence string
                    //#. %1$d: numeric
                    //#. %2$s: day string, e.g. "Friday" or "Monday, Tuesday, Wednesday"
                    gt('Every %1$d weeks on %2$s', interval, getDayString(days));

            // MONTHLY
            case 3:
                if (days === null) {
                    return interval === 1 ?
                        //#. recurrence string
                        //#. %1$d: numeric, day in month
                        gt('Monthly on day %1$d', day_in_month) :
                        //#. recurrence string
                        //#. %1$d: numeric, interval
                        //#. %1$d: numeric, day in month
                        gt('Every %1$d months on day %2$d', interval, day_in_month);
                }

                return interval === 1 ?
                    //#. recurrence string
                    //#. %1$s: count string, e.g. first, second, or last
                    //#. %2$s: day string, e.g. Monday
                    gt('Monthly on the %1$s %2$s', getCountString(day_in_month), getDayString(days)) :
                    //#. recurrence string
                    //#. %1$d: numeric, interval
                    //#. %2$s: count string, e.g. first, second, or last
                    //#. %3$s: day string, e.g. Monday
                    gt('Every %1$d months on the %2$s %3$s', interval, getCountString(day_in_month), getDayString(days));

            // YEARLY
            case 4:
                if (days === null) {
                    return !interval || interval === 1 ?
                        //#. recurrence string
                        //#. %1$s: Month nane, e.g. January
                        //#. %2$d: Date, numeric, e.g. 29
                        gt('Yearly on %1$s %2$d', getMonthString(month), day_in_month) :
                        //#. recurrence string
                        //#. %1$d: interval, numeric
                        //#. %2$s: Month nane, e.g. January
                        //#. %3$d: Date, numeric, e.g. 29
                        gt('Every %1$d years on %2$s %3$d', interval, getMonthString(month), day_in_month);
                }

                return !interval || interval === 1 ?
                    //#. recurrence string
                    //#. %1$s: count string, e.g. first, second, or last
                    //#. %2$s: day string, e.g. Monday
                    //#. %3$s: month nane, e.g. January
                    gt('Yearly on the %1$s %2$s of %3$d', getCountString(day_in_month), getDayString(days), getMonthString(month)) :
                    //#. recurrence string
                    //#. %1$d: interval, numeric
                    //#. %2$s: count string, e.g. first, second, or last
                    //#. %3$s: day string, e.g. Monday
                    //#. %4$s: month nane, e.g. January
                    gt('Every %1$d years on the %2$s %3$s of %4$d', interval, getCountString(day_in_month), getDayString(days), getMonthString(month));
            }

            return str;
        },

        getNote: function (data) {

            var text = $.trim(gt.noI18n(data.note) || '')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/</g, '&lt;');

            return util.urlify(text);
        },

        getConfirmations: function (data) {
            var hash = {};
            if (data) {
                // internal users
                _(data.users).each(function (obj) {
                    hash[String(obj.id)] = {
                        status: obj.confirmation || 0,
                        comment: obj.confirmmessage || ''
                    };
                });
                // external users
                _(data.confirmations).each(function (obj) {
                    hash[obj.mail] = {
                        status: obj.status || 0,
                        comment: obj.message || obj.confirmmessage || ''
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

        getConfirmationSummary: function (conf) {
            var ret = { count: 0 };
            // init
            _.each(confirmClass, function (cls, i) {
                ret[i] = {
                    icon: n_confirm[i] || '<i class="fa fa-exclamation-circle">',
                    count: 0,
                    css: cls,
                    title: confirmTitles[i] || ''
                };
            });
            _.each(conf, function (c) {
                ret[c.status].count++;
                ret.count++;
            });
            return ret;
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

        resolveGroupMembers: function (groupIDs, userIDs) {
            groupIDs = groupIDs || [];
            userIDs = userIDs || [];

            return groupAPI.getList(groupIDs)
                .then(function (groups) {
                    _.each(groups, function (single) {
                        userIDs = _.union(single.members, userIDs);
                    });
                    return userAPI.getList(userIDs);
                })
                .then(function (users) {
                    return _(users).map(function (user) {
                        return $.extend(user, { mail: user.email1, mail_field: 1 });
                    });
                });
        },

        resolveParticipants: function (participants, mode) {

            var groupIDs = [],
                userIDs = [],
                result = [];

            mode = mode || 'dist';

            _.each(participants, function (participant) {
                if (participant.type === 5) {
                    // external user
                    if (mode === 'dist') {
                        result.push({
                            display_name: participant.display_name,
                            mail: participant.mail,
                            mail_field: 0
                        });
                    } else {
                        result.push([participant.display_name, participant.mail]);
                    }
                } else if (participant.type === 2) {
                    // group
                    groupIDs.push(participant.id);
                } else if (participant.type === 1) {
                    // internal user
                    userIDs.push(participant.id);
                }
            });

            return that.resolveGroupMembers(groupIDs, userIDs).then(function (users) {
                if (mode === 'dist') {
                    return _([].concat(result, users)).uniq();
                } else {
                    _.each(users, function (user) {
                        // don't add myself
                        if (user.id === ox.user_id) return;
                        // don't add if mail address is missing (yep, edge-case)
                        if (!user.mail) return;
                        // add to result
                        result.push([user.display_name, user.mail]);
                    });
                    return result;
                }
            });
        },

        createRecipientsArray: function (data) {
            // include external organizer
            var list = data.participants.slice();
            if (!data.organizerId && _.isString(data.organizer)) {
                list.unshift({
                    display_name: data.organizer,
                    mail: data.organizer,
                    type: 5
                });
            }
            return this.resolveParticipants(list, 'rec');
        },

        createDistlistArray: function (data) {
            // include external organizer
            var list = data.participants.slice();
            if (!data.organizerId && _.isString(data.organizer)) {
                list.unshift({
                    display_name: data.organizer,
                    mail: data.organizer,
                    type: 5
                });
            }
            return this.resolveParticipants(list, 'dist');
        },

        getUserIdByInternalId: function (internal) {
            return contactAPI.get({ id: internal, folder: 6 }).then(function (data) {
                return data.user_id;
            });
        }
    };

    return that;
});
