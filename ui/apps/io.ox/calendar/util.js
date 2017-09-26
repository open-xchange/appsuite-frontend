/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/util', [
    'io.ox/core/api/user',
    'io.ox/contacts/api',
    'io.ox/core/api/group',
    'io.ox/core/folder/api',
    'io.ox/core/util',
    'io.ox/core/tk/dialogs',
    'io.ox/calendar/chronos-util',
    'settings!io.ox/chronos',
    'settings!io.ox/core',
    'gettext!io.ox/calendar'
], function (userAPI, contactAPI, groupAPI, folderAPI, util, dialogs, chronosUtil, settings, coreSettings, gt) {

    'use strict';

    // day names
    var n_count = [gt('fifth / last'), '', gt('first'), gt('second'), gt('third'), gt('fourth'), gt('fifth / last')],
        // confirmation status (none, accepted, declined, tentative)
        chronosStates = 'NEEDS-ACTION ACCEPTED DECLINED TENTATIVE'.split(' '),
        confirmTitles = [
            gt('unconfirmed'),
            gt('accepted'),
            gt('declined'),
            gt('tentative')
        ],
        n_confirm = ['', '<i class="fa fa-check" aria-hidden="true">', '<i class="fa fa-times" aria-hidden="true">', '<i class="fa fa-question-circle" aria-hidden="true">'],
        superessiveWeekdays = [
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Sunday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Monday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Tuesday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Wednesday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Thursday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Friday'),
            //#. superessive of the weekday
            //#. will only be used in a form like “Happens every week on $weekday”
            gt.pgettext('superessive', 'Saturday')
        ];

    var that = {

        // column translations
        columns: {
            title: gt('Subject'),
            location: gt('Location'),
            note: gt('Description')
        },

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

        colors: [
            { label: gt('light blue'), value: '#CEE7FF', foreground: '#2A4B6C' },
            { label: gt('dark blue'), value: '#96BBE8', foreground: '#0B1624' },
            { label: gt('purple'), value: '#C4AFE3', foreground: '#3F0E84' },
            { label: gt('pink'), value: '#F0D8F0', foreground: '#8A1C8C' },
            { label: gt('red'), value: '#F2D1D2', foreground: '#A83336' },
            { label: gt('orange'), value: '#FFD1A3', foreground: '#622906' },
            { label: gt('yellow'), value: '#F7EBB6', foreground: '#5C4209' },
            { label: gt('light green'), value: '#D4DEA7', foreground: '#526107' },
            { label: gt('dark green'), value: '#99AF6E', foreground: '#28350F' },
            { label: gt('gray'), value: '#666666', foreground: '#FFFFFF' }
        ],

        isBossyAppointmentHandling: function (opt) {

            opt = _.extend({
                app: {},
                invert: false,
                folderData: null
            }, opt);

            if (!settings.get('bossyAppointmentHandling', false)) return $.when(true);

            var check = function (data) {
                if (folderAPI.is('private', data)) {
                    var isOrganizer = opt.app.organizer.entity === ox.user_id;
                    return opt.invert ? !isOrganizer : isOrganizer;
                }
                return true;
            };

            if (opt.folderData) return $.when(check(opt.folderData));

            if (!opt.app.folder) return $.when(false);

            return folderAPI.get(opt.app.folder).then(function (data) {
                return check(data);
            });
        },

        getFirstWeekDay: function () {
            // week starts with (0=Sunday, 1=Monday, ..., 6=Saturday)
            return moment.localeData().firstDayOfWeek();
        },

        getDaysInMonth: function (year, month) {
            // trick: month + 1 & day = zero -> last day in month
            return moment([year, month + 1]).daysInMonth();
        },

        isToday: function (timestamp) {
            return moment().isSame(timestamp, 'day');
        },

        getTime: function (moment) {
            return moment.format('LT');
        },

        getDate: function (timestamp) {
            return moment(timestamp ? timestamp : undefined).format('ddd, l');
        },

        getSmartDate: function (model) {
            return model.getMoment('startDate').calendar();
        },

        getEvenSmarterDate: function (model) {
            var m = model.getMoment('startDate'),
                startOfDay = moment().startOf('day');
            // past?
            if (m.isBefore(startOfDay)) {
                if (m.isAfter(startOfDay.subtract(1, 'day'))) {
                    return gt('Yesterday') + ', ' + m.format('l');
                }
                return m.format('ddd, l');
            }
            // future
            if (m.isBefore(startOfDay.add(1, 'days'))) {
                return gt('Today') + ', ' + m.format('l');
            }
            if (m.isBefore(startOfDay.add(1, 'day'))) {
                return gt('Tomorrow') + ', ' + m.format('l');
            }
            return m.format('ddd, l');
        },

        // function that returns markup for date and time + timzonelabel
        getDateTimeIntervalMarkup: function (data, options) {
            if (data && data.startDate && data.endDate) {

                options = _.extend({ timeZoneLabel: { placement:  _.device('touch') ? 'bottom' : 'top' }, a11y: false, output: 'markup' }, options);

                if (options.container && options.container.parents('#io-ox-core').length < 1) {
                    // view is not in core (happens with deep links)
                    // add timezonepopover to body
                    options.timeZoneLabel.container = 'body';
                }
                var startDate,
                    endDate,
                    dateStr,
                    timeStr,
                    timeZoneStr = moment.tz(data.startDate.value, data.startDate.tzid).zoneAbbr(),
                    fmtstr = options.a11y ? 'dddd, l' : 'ddd, l';

                if (chronosUtil.isAllday(data)) {
                    startDate = moment.utc(data.startDate.value).local(true);
                    endDate = moment.utc(data.endDate.value).local(true).subtract(1, 'days');
                } else {
                    startDate = moment.tz(data.startDate.value, data.startDate.tzid);
                    endDate = moment.tz(data.endDate.value, data.startDate.tzid);
                }
                if (startDate.isSame(endDate, 'day')) {
                    dateStr = startDate.format(fmtstr);
                    timeStr = this.getTimeInterval(data, options.zone);
                } else if (chronosUtil.isAllday(data)) {
                    dateStr = this.getDateInterval(data);
                    timeStr = this.getTimeInterval(data, options.zone);
                } else {
                    // not same day and not fulltime. use interval with date and time, separate date and is confusing
                    dateStr = startDate.formatInterval(endDate, fmtstr + ' LT');
                }

                // standard markup or object with strings
                if (options.output === 'strings') {
                    return { dateStr: dateStr, timeStr: timeStr || '', timeZoneStr: timeZoneStr };
                }
                return $('<div class="date-time">').append(
                    // date
                    $('<span class="date">').text(dateStr),
                    // mdash
                    $.txt(' \u00A0 '),
                    // time
                    $('<span class="time">').append(
                        timeStr ? $.txt(timeStr) : '',
                        // Yep there are appointments without timezone. May not be all day appointmens either
                        data.startDate.tzid ? this.addTimezonePopover($('<span class="label label-default pointer" tabindex="0">').text(timeZoneStr), data, options.timeZoneLabel) : ''
                    )
                );
            }
            return '';
        },

        getDateInterval: function (data, a11y) {
            if (data && data.startDate && data.endDate) {
                var startDate, endDate,
                    fmtstr = a11y ? 'dddd, l' : 'ddd, l';

                a11y = a11y || false;

                if (chronosUtil.isAllday(data)) {
                    startDate = moment.utc(data.startDate.value).local(true);
                    endDate = moment.utc(data.endDate.value).local(true).subtract(1, 'days');
                } else {
                    startDate = moment.tz(data.startDate.value, data.startDate.tzid || moment.defaultZone.name);
                    endDate = moment.tz(data.endDate.value, data.endDate.tzid || moment.defaultZone.name);
                }
                if (startDate.isSame(endDate, 'day')) {
                    return startDate.format(fmtstr);
                }
                if (a11y && chronosUtil.isAllday(data)) {
                    //#. date intervals for screenreaders
                    //#. please keep the 'to' do not use dashes here because this text will be spoken by the screenreaders
                    //#. %1$s is the start date
                    //#. %2$s is the end date
                    //#, c-format
                    return gt('%1$s to %2$s', startDate.format(fmtstr), endDate.format(fmtstr));
                }
                return startDate.formatInterval(endDate, fmtstr);
            }
            return '';
        },

        getDateIntervalA11y: function (data) {
            return this.getDateInterval(data, true);
        },

        getTimeInterval: function (data, zone, a11y) {
            if (!data || !data.startDate || !data.endDate) return '';
            if (chronosUtil.isAllday(data)) {
                return this.getFullTimeInterval(data, true);
            }
            var start = moment.tz(data.startDate.value, data.startDate.tzid),
                end = moment.tz(data.endDate.value, data.startDate.tzid);
            if (zone) {
                start.tz(zone);
                end.tz(zone);
            }
            if (a11y) {
                //#. date intervals for screenreaders
                //#. please keep the 'to' do not use dashes here because this text will be spoken by the screenreaders
                //#. %1$s is the start date
                //#. %2$s is the end date
                //#, c-format
                return gt('%1$s to %2$s', start.format('LT'), end.format('LT'));
            }
            return start.formatInterval(end, 'time');
        },

        getTimeIntervalA11y: function (data, zone) {
            return this.getTimeInterval(data, zone, true);
        },

        getFullTimeInterval: function (data, smart) {
            var length = this.getDurationInDays(data);
            return length <= 1 && smart ? gt('Whole day') : gt.format(
                //#. General duration (nominative case): X days
                //#. %d is the number of days
                //#, c-format
                gt.ngettext('%d day', '%d days', length), length);
        },

        getReminderOptions: function () {
            // TODO: moment.js alternative mode
            // var opt = {};
            // [-1,0,5,10,15,30,45,60,120,240,360,480,720,1440,2880,4320,5760,7200,8640,10080,20160,30240,40320].forEach(function (val) {
            //     opt[val] = val < 0 ? gt('No reminder') : moment.duration(val, 'minutes').humanize();
            // });
            // return opt;

            var options = {},
                reminderListValues = [
                    // value is ical duration format
                    { value: '-PT0M', format: 'minutes' },
                    { value: '-PT5M', format: 'minutes' },
                    { value: '-PT10M', format: 'minutes' },
                    { value: '-PT15M', format: 'minutes' },
                    { value: '-PT30M', format: 'minutes' },
                    { value: '-PT45M', format: 'minutes' },

                    { value: '-PT1H', format: 'hours' },
                    { value: '-PT2H', format: 'hours' },
                    { value: '-PT4H', format: 'hours' },
                    { value: '-PT6H', format: 'hours' },
                    { value: '-PT8H', format: 'hours' },
                    { value: '-PT12H', format: 'hours' },

                    { value: '-P1D', format: 'days' },
                    { value: '-P2D', format: 'days' },
                    { value: '-P3D', format: 'days' },
                    { value: '-P4D', format: 'days' },
                    { value: '-P5D', format: 'days' },
                    { value: '-P6D', format: 'days' },

                    { value: '-P1W', format: 'weeks' },
                    { value: '-P2W', format: 'weeks' },
                    { value: '-P3W', format: 'weeks' },
                    { value: '-P4W', format: 'weeks' }
                ];

            _(reminderListValues).each(function (item) {
                var i = item.value.match(/\d+/)[0];
                switch (item.format) {
                    case 'minutes':
                        options[item.value] = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', i), i);
                        break;
                    case 'hours':
                        options[item.value] = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), i);
                        break;
                    case 'days':
                        options[item.value] = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), i);
                        break;
                    case 'weeks':
                        options[item.value] = gt.format(gt.ngettext('%1$d Week', '%1$d Weeks', i), i);
                        break;
                    // no default
                }
            });

            return options;
        },

        onSameDay: function (t1, t2) {
            return moment(t1).isSame(t2, 'day');
        },

        getDurationInDays: function (data) {
            return moment(data.endDate.value).diff(data.startDate.value, 'days');
        },

        getStartAndEndTime: function (data) {
            var ret = [];
            if (!data || !data.startDate || !data.endDate) return ret;
            if (chronosUtil.isAllday(data)) {
                ret.push(this.getFullTimeInterval(data, false));
            } else {
                ret.push(moment.tz(data.startDate.value, data.startDate.tzid).format('LT'), moment.tz(data.endDate.value, data.endDate.tzid).format('LT'));
            }
            return ret;
        },

        addTimezoneLabel: function (parent, data, options) {

            var current = moment(data.startDate);
            if (data.startDate.value) {
                current = moment.tz(data[options.attrName || 'startDate'].value, data[options.attrName || 'startDate'].tzid || moment.defaultZone.name);
            }
            parent.append(
                $.txt(this.getTimeInterval(data)),
                this.addTimezonePopover($('<span class="label label-default pointer" tabindex="0">').text(current.zoneAbbr()), data, options)
            );

            return parent;
        },

        addTimezonePopover: function (parent, data, opt) {
            var current = moment(data.startDate);
            if (data.startDate.value) {
                current = moment.tz(data[opt.attrName || 'startDate'].value, data[opt.attrName || 'startDate'].tzid || moment.defaultZone.name);
            }

            opt = _.extend({
                placement: 'left',
                trigger: 'hover focus'
            }, opt);

            function getContent() {
                // hard coded for demo purposes
                var div = $('<ul class="list-unstyled">'),
                    list = settings.get('favoriteTimezones');

                if (!list || list.length === 0) {
                    list = [
                        'America/Los_Angeles',
                        'America/New_York',
                        'Europe/London',
                        'Europe/Berlin',
                        'Australia/Sydney'
                    ];
                }

                _(list).chain().uniq().first(10).each(function (zone) {
                    // get short name (with a few exceptions; see bug 41440)
                    var name = /(North|East|South|West|Central)/.test(zone) ? zone : zone.replace(/^.*?\//, '');
                    // must use outer DIV with "clear: both" here for proper layout in firefox
                    div.append(
                        $('<li>').append(
                            $('<span>').text(name.replace(/_/g, ' ')),
                            $('<span class="time">').text(that.getTimeInterval(data, zone))
                        )
                    );
                });

                return div;
            }

            function getTitle() {
                return that.getTimeInterval(data) + ' ' + current.zoneAbbr();
            }

            parent.popover({
                container: opt.container || '#io-ox-core',
                viewport: {
                    selector: '#io-ox-core',
                    padding: 10
                },
                content: getContent,
                html: true,
                placement: function (tip) {
                    // add missing outer class
                    $(tip).addClass('timezones');
                    // get placement
                    return opt.placement;
                },
                title: getTitle,
                trigger: opt.trigger
            }).on('blur dispose', function () {
                $(this).popover('hide');
                // set correct state or toggle doesn't work on next click
                $(this).data('bs.popover').inState.click = false;
            });

            if (opt.closeOnScroll && !coreSettings.get('features/accessibility', true)) {
                // add listener on popup shown. Otherwise we will not get the correct scrollparent at this point (if the popover container is not yet added to the dom)
                parent.on('shown.bs.popover', function () {
                    parent.scrollParent().one('scroll', function () {
                        parent.popover('hide');
                        // set correct state or toggle doesn't work on next click
                        parent.data('bs.popover').inState.click = false;
                    });
                });
            }

            return parent;
        },

        getShownAsClass: function (data) {
            data = data instanceof Backbone.Model ? data.attributes : data;
            if (data.transp === 'TRANSPARENT') return 'free';
            return 'reserved';
        },

        getShownAsLabel: function (data) {
            data = data instanceof Backbone.Model ? data.attributes : data;
            if (data.transp === 'TRANSPARENT') return 'label-success';
            return 'label-info';
        },

        getShownAs: function (data) {
            data = data instanceof Backbone.Model ? data.attributes : data;
            if (data.transp === 'TRANSPARENT') return gt('Free');
            return gt('Reserved');
        },

        getConfirmationSymbol: function (status) {
            return n_confirm[(_(status).isNumber() ? status : chronosStates.indexOf(status)) || 0];
        },

        getConfirmationClass: function (status) {
            return (_(status).isNumber() ? chronosStates[status] : status || 'NEEDS-ACTION').toLowerCase();
        },

        getConfirmationLabel: function (status) {
            return confirmTitles[(_(status).isNumber() ? status : chronosStates.indexOf(status)) || 0];
        },

        getRecurrenceDescription: function (data) {
            function getCountString(i) {
                return n_count[i + 1];
            }

            function getDayString(days, options) {
                options = _.extend({ superessive: false }, options);
                var firstDayOfWeek = moment.localeData().firstDayOfWeek(),
                    tmp = _(_.range(7)).chain().map(function (index) {
                        var mask = 1 << ((index + firstDayOfWeek) % 7);
                        if ((days & mask) !== 0) {
                            return options.superessive ?
                                superessiveWeekdays[(index + firstDayOfWeek) % 7] :
                                moment().weekday(index).format('dddd');
                        }
                    }).compact().value();

                var and =
                    //#. recurrence string
                    //#. used to concatenate two weekdays, like Monday and Tuesday
                    //#. make sure that the leading and trailing spaces are also in the translation
                    gt(' and '),
                    delimiter =
                    //#. This delimiter is used to concatenate a list of string
                    //#. Example: Monday, Tuesday, Wednesday
                    //#. make sure, that the trailing space is also in the translation
                    gt(', ');

                return tmp.length === 2 ? tmp.join(and) : tmp.join(delimiter);
            }

            function getMonthString(i) {
                // month names
                return moment.months()[i];
            }

            var str = '',
                interval = data.interval,
                days = data.days || null,
                month = data.month,
                day_in_month = data.day_in_month;

            switch (data.recurrence_type) {

                // DAILY
                case 1:
                    //#. recurrence string
                    //#. %1$d: numeric
                    str = gt.npgettext('daily', 'Every day.', 'Every %1$d days.', interval, interval);
                    break;

                // WEEKLY
                case 2:
                    // special case: weekly but all days checked
                    if (days === 127) {
                        //#. recurrence string
                        //#. %1$d: numeric
                        str = gt.npgettext('weekly', 'Every day.', 'Every %1$d weeks on all days.', interval, interval);
                    } else if (days === 62) { // special case: weekly on workdays
                        //#. recurrence string
                        //#. %1$d: numeric
                        str = gt.npgettext('weekly', 'On workdays.', 'Every %1$d weeks on workdays.', interval, interval);
                    } else if (days === 65) {
                        //#. recurrence string
                        //#. %1$d: numeric
                        str = gt.npgettext('weekly', 'Every weekend.', 'Every %1$d weeks on weekends.', interval, interval);
                    } else if (days === 0) { // special case when no day is selected
                        str = gt('Never.');
                    } else {
                        //#. recurrence string
                        //#. %1$d: numeric
                        //#. %2$s: day string, e.g. "Friday" or "Monday, Tuesday, Wednesday"
                        //#. day string will be in "superessive" form if %1$d >= 2; nominative if %1$d == 1
                        str = gt.npgettext('weekly', 'Every %2$s.', 'Every %1$d weeks on %2$s.', interval, interval, getDayString(days, { superessive: interval > 1 }));
                    }

                    break;

                // MONTHLY
                case 3:
                    if (days === null) {
                        //#. recurrence string
                        //#. %1$d: numeric, interval
                        //#. %2$d: numeric, day in month
                        //#. Example: Every 5 months on day 18
                        str = gt.npgettext('monthly', 'Every month on day %2$d.', 'Every %1$d months on day %2$d.', interval, interval, day_in_month);
                    } else {
                        //#. recurrence string
                        //#. %1$d: numeric, interval
                        //#. %2$s: count string, e.g. first, second, or last
                        //#. %3$s: day string, e.g. Monday
                        //#. Example Every 3 months on the second Tuesday
                        str = gt.npgettext('monthly', 'Every month on the %2$s %3$s.', 'Every %1$d months on the %2$s %3$s.', interval, interval, getCountString(day_in_month), getDayString(days));
                    }

                    break;

                // YEARLY
                case 4:
                    if (days === null) {
                        //#. recurrence string
                        //#. %1$s: Month nane, e.g. January
                        //#. %2$d: Date, numeric, e.g. 29
                        //#. Example: Every year in December on day 3
                        str = gt('Every year in %1$s on day %2$d.', getMonthString(month), day_in_month);
                    } else {
                        //#. recurrence string
                        //#. %1$s: count string, e.g. first, second, or last
                        //#. %2$s: day string, e.g. Monday
                        //#. %3$s: month nane, e.g. January
                        //#. Example: Every year on the first Tuesday in December
                        str = gt('Every year on the %1$s %2$s in %3$d.', getCountString(day_in_month), getDayString(days), getMonthString(month));
                    }

                    break;
                // no default
            }

            return str;
        },

        getRecurrenceEnd: function (data) {
            var str;
            if (data.until) {
                str = gt('The series ends on %1$s.', moment(data.until).format('l'));
            } else if (data.occurrences) {
                var n = data.occurrences;
                str = gt.format(gt.ngettext('The series ends after one occurrence.', 'The series ends after %1$d occurences.', n), n);
            } else {
                str = gt('The series never ends.');
            }

            return str;
        },

        getRecurrenceString: function (data) {
            if (data.rrule) data = new (require('io.ox/calendar/chronos-model').Model)(data);
            if (data instanceof Backbone.Model && data.getRruleMapModel) data = data.getRruleMapModel();
            if (data instanceof Backbone.Model) data = data.toJSON();
            var str = that.getRecurrenceDescription(data);
            if (data.recurrence_type > 0 && (data.until || data.occurrences)) str += ' ' + that.getRecurrenceEnd(data);
            return str;
        },
        // basically the same as in recurrence-view, just without model
        // used to fix reccurence information when Ïging
        updateRecurrenceDate: function (appointment, old_start_date) {
            if (!appointment || !old_start_date) return;

            var type = appointment.recurrence_type;
            if (type === 0) return;
            var oldDate = moment(old_start_date),
                date = moment(appointment.startDate);

            // if weekly and only single day selected
            if (type === 2 && appointment.days === 1 << oldDate.day()) {
                appointment.days = 1 << date.day();
            }

            // if monthly or yeary, adjust date/day of week
            if (type === 3 || type === 4) {
                if (_(appointment).has('days')) {
                    // repeat by weekday
                    appointment.day_in_month = ((date.date() - 1) / 7 >> 0) + 1;
                    appointment.days = 1 << date.day();
                } else {
                    // repeat by date
                    appointment.day_in_month = date.date();
                }
            }

            // if yearly, adjust month
            if (type === 4) {
                appointment.month = date.month();
            }

            // change until
            if (appointment.until && moment(appointment.until).isBefore(date)) {
                appointment.until = date.add(1, ['d', 'w', 'M', 'y'][appointment.recurrence_type - 1]).valueOf();
            }
            return appointment;
        },

        getNote: function (data) {
            var text = $.trim(data.description || (data.get ? data.get('description') : ''))
                .replace(/\n{3,}/g, '\n\n')
                .replace(/</g, '&lt;');
            //use br to keep linebreaks when pasting (see 38714)
            return util.urlify(text).replace(/\n/g, '<br>');
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

        getConfirmationStatus: function (obj, id, defaultStatus) {
            var user = _(obj.attendees).findWhere({
                entity: id || ox.user_id
            });
            if (!user) return (defaultStatus || 'NEEDS-ACTION');
            return user.partStat || (defaultStatus || 'NEEDS-ACTION');
        },

        getConfirmationMessage: function (obj, id) {
            var user = _(obj.attendees).findWhere({
                entity: id || ox.user_id
            });
            if (!user) return '';
            return user.comment || '';
        },

        getConfirmationSummary: function (conf) {
            var ret = { count: 0 };
            // init
            _.each(chronosStates, function (cls, i) {
                ret[i] = {
                    icon: n_confirm[i] || '<i class="fa fa-exclamation-circle" aria-hidden="true">',
                    count: 0,
                    css: cls.toLowerCase(),
                    title: confirmTitles[i] || ''
                };
            });

            _.each(conf, function (c) {
                // tasks
                if (_.isNumber(c.status)) {
                    ret[c.status].count++;
                    ret.count++;
                // don't count groups or ressources, ignore unknown states (the spec allows custom partstats)
                } else if (ret[chronosStates.indexOf(c.partStat.toUpperCase())] && c.cuType === 'INDIVIDUAL') {
                    ret[chronosStates.indexOf(c.partStat.toUpperCase())].count++;
                    ret.count++;
                }
            });
            return ret;
        },

        getWeekScaffold: function (timestamp) {
            var day = moment(timestamp).startOf('week'),
                obj,
                ret = { days: [] };
            for (var i = 0; i < 7; i++) {
                ret.days.push(obj = {
                    year: day.year(),
                    month: day.month(),
                    date: day.date(),
                    day: day.day(),
                    timestamp: +day,
                    isToday: moment().isSame(day, 'day'),
                    col: i % 7
                });
                // is weekend?
                obj.isWeekend = obj.day === 0 || obj.day === 6;
                obj.isFirst = obj.date === 1;
                if (obj.isFirst) {
                    ret.hasFirst = true;
                }
                day.add(1, 'days');

                obj.isLast = day.date() === 1;
                if (obj.isLast) {
                    ret.hasLast = true;
                }
            }
            return ret;
        },

        resolveParticipants: function (data) {
            // clone array
            var attendees = data.attendees.slice(),
                IDs = {
                    user: [],
                    group: [],
                    ext: []
                };

            var organizerIsExternalParticipant = !data.organizer.entity && _.isString(data.organizer.email) && _.find(attendees, function (p) {
                return p.mail === data.organizer.email;
            });

            if (!organizerIsExternalParticipant) {
                attendees.unshift(data.organizer);
            }

            _.each(attendees, function (attendee) {
                switch (attendee.cuType) {
                    case 'INDIVIDUAL':
                        // internal user
                        if (attendee.entity) {
                            // user API expects array of integer [1337]
                            IDs.user.push(attendee.entity);
                        } else {
                            // external attendee
                            IDs.ext.push({
                                display_name: attendee.cn,
                                mail: attendee.email,
                                mail_field: 0
                            });
                        }
                        break;
                    // group
                    case 'GROUP':
                        // group expects array of object [{ id: 1337 }], yay (see bug 47207)
                        IDs.group.push({ id: attendee.entity });
                        break;
                    // resource or rescource group
                    case 'RESOURCE':
                        // ignore resources
                        break;
                    // no default
                }
            });

            return groupAPI.getList(IDs.group)
                // resolve groups
                .then(function (groups) {
                    _.each(groups, function (single) {
                        IDs.user = _.union(single.members, IDs.user);
                    });
                    return userAPI.getList(IDs.user);
                })
                // add mail to user objects
                .then(function (users) {
                    // add user type 1 to all internal users
                    _.each(users, function (obj) {
                        _.extend(obj, { type: 1 });
                    });
                    // search for external users in contacts
                    var defs = _(IDs.ext).map(function (ext) {
                        return contactAPI.search(ext.mail);
                    });
                    return $.when.apply($, defs).then(function () {
                        _(arguments).each(function (result, i) {
                            if (_.isArray(result) && result.length) {
                                IDs.ext[i] = result[0];
                            }
                        });
                        // combine results with groups and map
                        return _([].concat(IDs.ext, users))
                            .chain()
                            .uniq()
                            .map(function (user) {
                                return $.extend(user, { mail: user.email1, mail_field: 1 });
                            })
                            .value();
                    });
                });
        },

        getUserIdByInternalId: function (internal) {
            return contactAPI.get({ id: internal, folder: 6 }).then(function (data) {
                return data.user_id;
            });
        },

        getAppointmentColor: function (folder, eventModel) {
            var folderColor = that.getFolderColor(folder),
                eventColor = eventModel.get('color'),
                conf = that.getConfirmationStatus(eventModel.attributes, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id, folderAPI.is('public', folder) ? 'ACCEPTED' : 'NEEDS-ACTION');

            if (_.isNumber(eventColor)) eventColor = that.colors[eventColor - 1].value;

            // shared appointments which are needs-action or declined don't receive color classes
            if (/^(needs-action|declined)$/.test(that.getConfirmationClass(conf))) return '';

            // private appointments are colored with gray instead of folder color
            if (that.isPrivate(eventModel)) folderColor = _(that.colors).last().value;

            // if (folderAPI.is('public', folder) && ox.user_id !== appointment.created_by) {
            //     // public appointments which are not from you are always colored in the calendar color
            //     return 'color-label-' + folderColor;
            // }

            // set color of appointment. if color is 0, then use color of folder
            return !eventColor ? folderColor : eventColor;
        },

        lightenDarkenColor: function (col, amt) {
            if (_.isString(col)) col = this.colorToHex(col);
            col = that.hexToHSL(col);
            col[2] = Math.floor(col[2] * amt);
            col[2] = Math.max(Math.min(100, col[2]), 0);
            return 'hsl(' + col[0] + ',' + col[1] + '%,' + col[2] + '%)';
        },

        colorToHex: function (color) {
            var canvas = document.createElement('canvas'), context = canvas.getContext('2d'), data;
            canvas.width = 1;
            canvas.height = 1;
            context.fillStyle = 'rgba(0, 0, 0, 0)';
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            data = context.getImageData(0, 0, 1, 1).data;
            return (data[0] << 16) + (data[1] << 8) + data[2];
        },

        hexToHSL: function (color) {
            var r = (color >> 16) / 255,
                g = ((color >> 8) & 0x00FF) / 255,
                b = (color & 0x0000FF) / 255,
                max = Math.max(r, g, b), min = Math.min(r, g, b),
                h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                    default: h = 0; break;
                }
                h /= 6;
            }

            return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
        },

        getForegroundColor: function (color) {
            var c = _(that.colors).findWhere({ value: color });
            if (c) return c.foreground;
            color = that.colorToHex(color);
            return color > 0xffffff / 2 ? 'black' : 'white';
        },

        canAppointmentChangeColor: function (folder, eventModel) {
            var eventColor = eventModel.get('color'),
                privateFlag = that.isPrivate(eventModel),
                conf = that.getConfirmationStatus(eventModel.attributes, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id);

            // shared appointments which are needs-action or declined don't receive color classes
            if (/^(needs-action|declined)$/.test(that.getConfirmationClass(conf))) {
                return false;
            }

            return !eventColor && !privateFlag;
        },

        getFolderColor: function (folder) {
            var defaultColor = settings.get('defaultFolderColor', 1),
                color = folder.meta ? folder.meta.color || defaultColor : defaultColor;
            // fallback if color is an index
            if (_.isNumber(color)) color = that.colors[color - 1].value;
            return color;
        },

        getDeepLink: function (data) {
            return [
                ox.abs,
                ox.root,
                '/#app=io.ox/calendar&id=',
                data.folder_id || data.folder,
                '.',
                data.recurrence_id || data.id,
                '.',
                data.recurrence_position || 0,
                '&folder=',
                data.folder_id || data.folder
            ].join('');
        },

        getRecurrenceChangeDialog: function () {
            return new dialogs.ModalDialog()
                    .text(gt('By changing the date of this appointment you are creating an appointment exception to the series.'))
                    .addPrimaryButton('appointment', gt('Create exception'), 'appointment')
                    .addButton('cancel', gt('Cancel'), 'cancel');
        },

        getRecurrenceEditDialog: function () {
            return new dialogs.ModalDialog()
                    .text(gt('Do you want to edit the whole series or just one appointment within the series?'))
                    .addPrimaryButton('series',
                        //#. Use singular in this context
                        gt('Series'), 'series')
                    .addButton('appointment', gt('Appointment'), 'appointment')
                    .addButton('cancel', gt('Cancel'), 'cancel');
        },

        isPrivate: function (data) {
            if (data.attributes) data = data.attributes;
            return data['class'] === 'CONFIDENTIAL';
        }
    };

    return that;
});
