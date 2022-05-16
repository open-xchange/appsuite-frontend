/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/util', [
    'io.ox/core/api/user',
    'io.ox/contacts/api',
    'io.ox/core/api/group',
    'io.ox/core/folder/api',
    'io.ox/core/util',
    'io.ox/backbone/views/modal',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'gettext!io.ox/calendar',
    'io.ox/core/a11y'
], function (userAPI, contactAPI, groupAPI, folderAPI, util, ModalDialog, settings, coreSettings, gt, a11y) {

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
        ],
        attendeeLookupArray = ['', 'INDIVIDUAL', 'GROUP', 'RESOURCE', 'RESOURCE', 'INDIVIDUAL'];

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
            // light
            { label: gt('light red'), value: '#FFE2E2' },
            { label: gt('light orange'), value: '#FDE2B9' },
            { label: gt('light yellow'), value: '#FFEEB0' },
            { label: gt('light olive'), value: '#E6EFBD' },
            { label: gt('light green'), value: '#CAF1D0' },
            { label: gt('light cyan'), value: '#CCF4FF' },
            { label: gt('light azure'), value: '#CFE6FF' },
            { label: gt('light blue'), value: '#D4E0FD' },
            { label: gt('light indigo'), value: '#D1D6FE' },
            { label: gt('light purple'), value: '#E2D0FF' },
            { label: gt('light magenta'), value: '#F7CBF8' },
            { label: gt('light pink'), value: '#F7C7E0' },
            { label: gt('light gray'), value: '#EBEBEB' },
            // medium
            { label: gt('red'), value: '#F5AAAA' },
            { label: gt('orange'), value: '#FFB341' },
            { label: gt('yellow'), value: '#FFCF1A' },
            { label: gt('olive'), value: '#C5D481' },
            { label: gt('green'), value: '#AFDDA0' },
            { label: gt('cyan'), value: '#A2D9E7' },
            { label: gt('azure'), value: '#9BC8F7' },
            { label: gt('blue'), value: '#B1C3EE' },
            { label: gt('indigo'), value: '#949EEC' },
            { label: gt('purple'), value: '#B89AE9' },
            { label: gt('magenta'), value: '#D383D5' },
            { label: gt('pink'), value: '#E18BB8' },
            { label: gt('gray'), value: '#C5C5C5' },
            // dark
            { label: gt('dark red'), value: '#C84646' },
            { label: gt('dark orange'), value: '#B95900' },
            { label: gt('dark yellow'), value: '#935700' },
            { label: gt('dark olive'), value: '#66761F' },
            { label: gt('dark green'), value: '#376B27' },
            { label: gt('dark cyan'), value: '#396D7B' },
            { label: gt('dark azure'), value: '#27609C' },
            { label: gt('dark blue'), value: '#445F9F' },
            { label: gt('dark indigo'), value: '#5E6AC1' },
            { label: gt('dark purple'), value: '#734EAF' },
            { label: gt('dark magenta'), value: '#9A369C' },
            { label: gt('dark pink'), value: '#A4326D' },
            { label: gt('dark gray'), value: '#6B6B6B' }
        ],

        PRIVATE_EVENT_COLOR: '#616161',

        ZULU_FORMAT: 'YYYYMMDD[T]HHmmss[Z]',

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
            // use current calendar timezone
            var m = model.getMoment('startDate').tz(moment().tz()),
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
                    timeZoneStr = that.getMoment(data.startDate).zoneAbbr(),
                    fmtstr = options.a11y ? 'dddd, l' : 'ddd, l';

                if (that.isAllday(data)) {
                    startDate = moment.utc(data.startDate.value).local(true);
                    endDate = moment.utc(data.endDate.value).local(true).subtract(1, 'days');
                } else {
                    startDate = that.getMoment(data.startDate);
                    endDate = that.getMoment(data.endDate);
                    if (options.zone) {
                        startDate.tz(options.zone);
                        endDate.tz(options.zone);
                        timeZoneStr = startDate.zoneAbbr();
                    }
                }
                if (startDate.isSame(endDate, 'day')) {
                    dateStr = startDate.format(fmtstr);
                    timeStr = this.getTimeInterval(data, options.zone);
                } else if (that.isAllday(data)) {
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
                        data.startDate.tzid && !options.noTimezoneLabel ? this.addTimezonePopover($('<span class="label label-default pointer" tabindex="0">').text(timeZoneStr), data, options.timeZoneLabel) : ''
                    )
                );
            }
            return '';
        },

        getDateInterval: function (data, zone, a11y) {
            if (data && data.startDate && data.endDate) {
                var startDate, endDate,
                    fmtstr = a11y ? 'dddd, l' : 'ddd, l';

                a11y = a11y || false;

                if (that.isAllday(data)) {
                    startDate = moment.utc(data.startDate.value).local(true);
                    endDate = moment.utc(data.endDate.value).local(true).subtract(1, 'days');
                } else {
                    startDate = that.getMoment(data.startDate);
                    endDate = that.getMoment(data.endDate);
                    if (zone) {
                        startDate.tz(zone);
                        endDate.tz(zone);
                    }
                }
                if (startDate.isSame(endDate, 'day')) {
                    return startDate.format(fmtstr);
                }
                if (a11y && that.isAllday(data)) {
                    //#. date intervals for screenreaders
                    //#. please keep the 'to' do not use dashes here because this text will be spoken by the screenreaders
                    //#. %1$s is the start date
                    //#. %2$s is the end date
                    //#, c-format
                    return gt('%1$s to %2$s', startDate.format(fmtstr), endDate.format(fmtstr));
                }
                return startDate.formatInterval(endDate, 'yMEd', { alwaysFullDate: true });
            }
            return '';
        },

        getDateIntervalA11y: function (data, zone) {
            return this.getDateInterval(data, zone, true);
        },

        getTimeInterval: function (data, zone, a11y) {
            if (!data || !data.startDate || !data.endDate) return '';
            if (that.isAllday(data)) {
                return this.getFullTimeInterval(data, true);
            }
            var start = that.getMoment(data.startDate),
                end = that.getMoment(data.endDate);
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
            return length <= 1 && smart ? gt('Whole day') :
                //#. General duration (nominative case): X days
                //#. %d is the number of days
                //#, c-format
                gt.ngettext('%d day', '%d days', length, length);
        },

        getReminderOptions: function () {

            var options = {},
                reminderListValues = [
                    // value is ical duration format
                    { value: 'PT0M', format: 'minutes' },
                    { value: 'PT5M', format: 'minutes' },
                    { value: 'PT10M', format: 'minutes' },
                    { value: 'PT15M', format: 'minutes' },
                    { value: 'PT30M', format: 'minutes' },
                    { value: 'PT45M', format: 'minutes' },

                    { value: 'PT1H', format: 'hours' },
                    { value: 'PT2H', format: 'hours' },
                    { value: 'PT4H', format: 'hours' },
                    { value: 'PT6H', format: 'hours' },
                    { value: 'PT8H', format: 'hours' },
                    { value: 'PT12H', format: 'hours' },

                    { value: 'P1D', format: 'days' },
                    { value: 'P2D', format: 'days' },
                    { value: 'P3D', format: 'days' },
                    { value: 'P4D', format: 'days' },
                    { value: 'P5D', format: 'days' },
                    { value: 'P6D', format: 'days' },

                    { value: 'P1W', format: 'weeks' },
                    { value: 'P2W', format: 'weeks' },
                    { value: 'P3W', format: 'weeks' },
                    { value: 'P4W', format: 'weeks' }
                ];

            _(reminderListValues).each(function (item) {
                var i = item.value.match(/\d+/)[0];
                switch (item.format) {
                    case 'minutes':
                        options[item.value] = gt.ngettext('%1$d minute', '%1$d minutes', i, i);
                        break;
                    case 'hours':
                        options[item.value] = gt.ngettext('%1$d hour', '%1$d hours', i, i);
                        break;
                    case 'days':
                        options[item.value] = gt.ngettext('%1$d day', '%1$d days', i, i);
                        break;
                    case 'weeks':
                        options[item.value] = gt.ngettext('%1$d week', '%1$d weeks', i, i);
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
            return that.getMoment(data.endDate).diff(that.getMoment(data.startDate), 'days');
        },

        getStartAndEndTime: function (data) {
            var ret = [];
            if (!data || !data.startDate || !data.endDate) return ret;
            if (that.isAllday(data)) {
                ret.push(this.getFullTimeInterval(data, false));
            } else {
                // make sure to convert to current calendar timezone before displaying
                ret.push(moment.tz(data.startDate.value, data.startDate.tzid || moment().tz()).tz(moment().tz()).format('LT'), moment.tz(data.endDate.value, data.endDate.tzid || moment().tz()).tz(moment().tz()).format('LT'));
            }
            return ret;
        },

        addTimezoneLabel: function (parent, data, options) {

            var current = moment(data.startDate);
            if (data.startDate.value) {
                current = that.getMoment(data[options.attrName || 'startDate']);
            }
            parent.append(
                $.txt(this.getTimeInterval(data)),
                this.addTimezonePopover($('<span class="label label-default pointer" tabindex="0">').text(current.zoneAbbr()), data, options)
            );

            return parent;
        },

        addTimezonePopover: (function () {
            function getContent(data) {
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

            function getTitle(data) {
                return that.getTimeInterval(data, that.getMoment(data.startDate).tz()) + ' ' + that.getMoment(data.startDate).zoneAbbr();
            }

            function addA11ySupport(parent) {
                // a11y preparations such that the popover will be able to receive focus
                var preventClose = false;
                parent.on('focusout blur', function (e) {
                    if (!preventClose) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }).on('show.bs.popover', function () {
                    parent.on('keydown.a11y', function (e) {
                        if (e.which !== 9) return;
                        if (e.shiftKey) return;

                        var popoverid = parent.attr('aria-describedby'),
                            popover = $('#' + popoverid);
                        if (popover.length === 0) return;

                        // prevent default only if a popup is open
                        e.preventDefault();
                        preventClose = true;
                        popover.attr('tabindex', -1).focus();
                        _.defer(function () { preventClose = false; });

                        popover.on('keydown.a11y', function tabOut(e) {
                            if (e.which !== 9) return;
                            e.preventDefault();
                            popover.off('keydown.a11y');
                            if (e.shiftKey) {
                                preventClose = true;
                                parent.focus();
                                _.defer(function () { preventClose = false; });
                            } else {
                                a11y.getNextTabbable(parent).focus();
                                parent.popover('hide');
                            }
                        }).on('blur', function () {
                            if (preventClose) return;
                            parent.popover('hide');
                        });
                    });
                }).on('hide.bs.popover', function (e) {
                    $(e.target).off('keydown.a11y');
                    preventClose = false;
                });
            }

            return function (parent, data, opt) {

                opt = _.extend({
                    placement: 'left',
                    trigger: 'hover focus'
                }, opt);

                addA11ySupport(parent);

                parent.popover({
                    container: opt.container || '#io-ox-core',
                    viewport: {
                        selector: '#io-ox-core',
                        padding: 10
                    },
                    content: getContent.bind(null, data),
                    html: true,
                    placement: function (tip) {
                        // add missing outer class
                        $(tip).addClass('timezones');
                        // get placement
                        return opt.placement;
                    },
                    title: getTitle.bind(null, data),
                    trigger: opt.trigger
                }).on('blur dispose', function () {
                    $(this).popover('hide');
                    // set correct state or toggle doesn't work on next click
                    $(this).data('bs.popover').inState.click = false;
                });

                if (opt.closeOnScroll) {
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
            };
        }()),

        getShownAsClass: function (data) {
            if (that.hasFlag(data, 'transparent')) return 'free';
            return 'reserved';
        },

        getShownAsLabel: function (data) {
            if (that.hasFlag(data, 'transparent')) return 'free';
            return 'label-info';
        },

        getShownAs: function (data) {
            //#. State of an appointment (reserved or free)
            if (that.hasFlag(data, 'transparent')) return gt('Free');
            return gt('Reserved');
        },

        getConfirmationSymbol: function (status) {
            return n_confirm[(_(status).isNumber() ? status : chronosStates.indexOf(status)) || 0];
        },

        getConfirmationClass: function (status) {
            return (_(status).isNumber() ? chronosStates[status] : status || 'NEEDS-ACTION').toLowerCase();
        },

        getStatusClass: function (model) {
            var data = model.attributes || model;
            // currently only cancelled statushas an extra class
            return (data.status === 'CANCELLED' || this.hasFlag(data, 'ebent_cancelled')) ? 'cancelled' : '';
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

            function getWorkweekBitmask() {
                var bitmask = 0, i;
                for (i = 0; i < settings.get('numDaysWorkweek'); i++) bitmask += 1 << ((settings.get('workweekStart') + i) % 7);
                return bitmask;
            }

            var str = '',
                interval = data.interval,
                days = data.days || null,
                month = data.month,
                day_in_month = data.day_in_month;

            switch (data.recurrence_type) {

                // DAILY
                case 1:
                    str = (interval === 1) ?
                        gt.pgettext('daily', 'Every day.') :
                        //#. recurrence string
                        //#. the case %1$d == 1 is handled separately and will not be used
                        //#. %1$d: number of days per interval
                        //#, c-format
                        gt.npgettext('daily', 'Every %1$d day.', 'Every %1$d days.', interval, interval);
                    break;

                // WEEKLY
                case 2:
                    // special case: weekly but all 7 days checked
                    if (days === 127) {
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case, weekly but every day is checked
                            gt.pgettext('daily', 'Every day.') :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: number of weeks per interval
                            //#, c-format
                            gt.npgettext('weekly', 'Every %1$d week on all days.', 'Every %1$d weeks on all days.', interval, interval);
                    } else if (days === getWorkweekBitmask()) { // special case: weekly on workdays
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case: the weekly interval is 1 and all workdays are checked
                            gt.pgettext('weekly', 'On workdays.') :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: number of weeks per interval
                            //#, c-format
                            gt.npgettext('weekly', 'Every %1$d week on workdays.', 'Every %1$d weeks on workdays.', interval, interval);
                    } else if (days === 65) {
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case: the weekly interval is 1 and Sat and Sun are checked
                            gt.pgettext('weekly', 'Every weekend.') :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: number of weeks per interval
                            //#, c-format
                            gt.npgettext('weekly', 'Every %1$d week on weekends.', 'Every %1$d weeks on weekends.', interval, interval);
                    } else {
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case: the weekly interval is 1
                            //#. %1$s: day string, e.g. "Friday" or "Monday, Tuesday, Wednesday"
                            //#. day string will be in nominative form
                            //#, c-format
                            gt.pgettext('weekly', 'Every %1$s.', getDayString(days)) :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: number of weeks per interval
                            //#. %2$s: day string, e.g. "Friday" or "Monday, Tuesday, Wednesday"
                            //#. day string will be in "superessive" form
                            //#, c-format
                            gt.npgettext('weekly', 'Every %1$d week on %2$s.', 'Every %1$d weeks on %2$s.', interval, interval, getDayString(days, { superessive: true }));
                    }

                    break;

                // MONTHLY
                case 3:
                    if (days === null) {
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case: the monthly interval is 1
                            //#. %1$d: numeric, day in month
                            //#. Example: Every month on day 18.
                            //#, c-format
                            gt.pgettext('monthly', 'Every month on day %1$d.', day_in_month) :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: numeric, interval
                            //#. %2$d: numeric, day in month
                            //#. Example: Every 5 months on day 18.
                            //#, c-format
                            gt.npgettext('monthly', 'Every %1$d month on day %2$d.', 'Every %1$d months on day %2$d.', interval, interval, day_in_month);
                    } else {
                        str = (interval === 1) ?
                            //#. recurrence string
                            //#. special case: the monthly interval is 1
                            //#. %1$s: count string, e.g. first, second, or last
                            //#. %2$s: day string, e.g. Monday
                            //#. Example Every month on the second Tuesday.
                            //#, c-format
                            gt.pgettext('monthly', 'Every month on the %1$s %2$s.', getCountString(day_in_month), getDayString(days)) :
                            //#. recurrence string
                            //#. the case %1$d == 1 is handled separately and will not be used
                            //#. %1$d: numeric, interval
                            //#. %2$s: count string, e.g. first, second, or last
                            //#. %3$s: day string, e.g. Monday
                            //#. Example Every 3 months on the second Tuesday.
                            //#, c-format
                            gt.npgettext('monthly', 'Every %1$d month on the %2$s %3$s.', 'Every %1$d months on the %2$s %3$s.', interval, interval, getCountString(day_in_month), getDayString(days));
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
                var lastOccurence;

                if (that.isAllday(data)) {
                    lastOccurence = moment(data.until);
                } else {
                    var tzid = data.endDate.tzid || 'UTC';
                    // this code part expects, that the date of the last occurrence is equal to the until date in the rrule.
                    // whereas this is not required by the RFC, all checked clients stick to that
                    // the until date is either directly on the end of the appointment or refers to the end of the same day
                    var diffToStartOfDay = that.getMoment(data.endDate).diff(that.getMoment(data.endDate).startOf('day'), 'ms');
                    lastOccurence = moment.tz(data.until, tzid).startOf('day').add(diffToStartOfDay, 'ms').tz(moment().tz());
                }

                str = gt('The series ends on %1$s.', lastOccurence.format('l'));
            } else if (data.occurrences) {
                var n = data.occurrences;
                str = gt.ngettext('The series ends after %1$d occurrence.', 'The series ends after %1$d occurrences.', n, n);
            } else {
                str = gt('The series never ends.');
            }

            return str;
        },

        getRecurrenceString: function (data) {
            if (data.rrule) data = new (require('io.ox/calendar/model').Model)(data);
            if (data instanceof Backbone.Model && data.getRruleMapModel) data = data.getRruleMapModel();
            if (data instanceof Backbone.Model) data = data.toJSON();
            var str = that.getRecurrenceDescription(data);
            if (data.recurrence_type > 0 && (data.until || data.occurrences)) str += ' ' + that.getRecurrenceEnd(data);
            return str;
        },
        // basically the same as in recurrence-view
        // used to update reccurence information when moving events
        updateRecurrenceDate: function (event, oldDate) {
            if (!event || !oldDate) return;

            var rruleMapModel = event.getRruleMapModel(),
                type = rruleMapModel.get('recurrence_type');
            if (type === 0) return;

            var date = event.getMoment('startDate');

            // if weekly, shift bits
            if (type === 2) {
                var newDay = moment(date).startOf('day'),
                    oldDay = moment(oldDate).startOf('day'),
                    shift = newDay.diff(oldDay, 'days') % 7,
                    days = rruleMapModel.get('days');
                if (shift < 0) shift += 7;
                for (var i = 0; i < shift; i++) {
                    days = days << 1;
                    if (days > 127) days -= 127;
                }
                rruleMapModel.set('days', days);
            }

            // if monthly or yeary, adjust date/day of week
            if (type === 3 || type === 4) {
                if (rruleMapModel.has('days')) {
                    // repeat by weekday
                    rruleMapModel.set({
                        day_in_month: ((date.date() - 1) / 7 >> 0) + 1,
                        days: 1 << date.day()
                    });
                } else {
                    // repeat by date
                    rruleMapModel.set('day_in_month', date.date());
                }
            }

            // if yearly, adjust month
            if (type === 4) {
                rruleMapModel.set('month', date.month());
            }

            // change until
            if (rruleMapModel.get('until') && moment(rruleMapModel.get('until')).isBefore(date)) {
                rruleMapModel.set({
                    'until': undefined,
                    'occurrences': undefined
                });
            }
            rruleMapModel.serialize();
            return event;
        },

        getAttendeeName: function (data) {
            return data ? data.cn || data.email || data.uri : '';
        },

        getNote: function (data, prop) {
            // calendar: description, tasks: note
            prop = prop || 'description';
            var text = $.trim(data[prop] || (data.get ? data.get(prop) : ''))
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
                        status: obj.confirmation || 0
                    };
                    // only add confirm message if there is one
                    if (obj.confirmmessage) {
                        hash[String(obj.id)].comment = obj.confirmmessage;
                    }
                });
                // external users
                _(data.confirmations).each(function (obj) {
                    hash[obj.mail] = {
                        status: obj.status || 0
                    };
                    // only add confirm message if there is one
                    if (obj.message || obj.confirmmessage) {
                        hash[String(obj.id)].comment = obj.message || obj.confirmmessage;
                    }
                });
            }
            return hash;
        },

        getConfirmationStatus: function (model, defaultStatus) {
            if (!(model instanceof Backbone.Model)) model = new (require('io.ox/calendar/model').Model)(model);
            if (model.hasFlag('accepted')) return 'ACCEPTED';
            if (model.hasFlag('tentative')) return 'TENTATIVE';
            if (model.hasFlag('declined')) return 'DECLINED';
            if (model.hasFlag('needs_action')) return 'NEEDS-ACTION';
            if (model.hasFlag('event_accepted')) return 'ACCEPTED';
            if (model.hasFlag('event_tentative')) return 'TENTATIVE';
            if (model.hasFlag('event_declined')) return 'DECLINED';
            return defaultStatus || 'NEEDS-ACTION';
        },

        getConfirmationMessage: function (obj, id) {
            var user = _(obj.attendees).findWhere({
                entity: id || ox.user_id
            });
            // try extendedParameter (federated sharing)
            if (id && !user) {
                user = _(obj.attendees).find(function (attendee) {
                    return attendee.extendedParameters && attendee.extendedParameters['X-OX-IDENTIFIER'] === id;
                });
            }
            if (!user) return;
            return user.comment;
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
                // don't count groups or resources, ignore unknown states (the spec allows custom partstats)
                } else if (ret[chronosStates.indexOf((c.partStat || 'NEEDS-ACTION').toUpperCase())] && (c.cuType === 'INDIVIDUAL' || !c.cuType)) {
                    ret[chronosStates.indexOf((c.partStat || 'NEEDS-ACTION').toUpperCase())].count++;
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

        // returns array of {mail, displayName} objects + additional fields depending on type
        // contacts have additional fields: first_name, last_name
        // internal users have additional fields: first_name, last_name, type 1, id
        // resolves groups, eliminates duplicates, uses provided mail address of attendee, filters out resources
        resolveAttendees: function (data, options) {
            options = options || {};
            // clone array
            var attendees = data.attendees.slice(),
                users = [],
                groups = [],
                result = [];

            var organizerIsExternalParticipant = data.organizer && !data.organizer.entity && _.isString(data.organizer.email) && _.find(attendees, function (p) {
                return p.mail === data.organizer.email;
            });

            // add organizer if not already part of attendees and not external
            if (data.organizer && !organizerIsExternalParticipant && !(data.organizer.entity && _(_(attendees).pluck('entity')).contains(data.organizer.entity))) {
                attendees.unshift(data.organizer);
            }

            _.each(attendees, function (attendee) {
                switch (attendee.cuType) {
                    case undefined:
                    case 'INDIVIDUAL':
                        if (!attendee.email) return;
                        var data = {
                            display_name: attendee.cn,
                            mail: attendee.email
                        };

                        // internal user
                        if (attendee.entity) {
                            if (options.filterSelf && attendee.entity === ox.user_id) return;
                            users.push(attendee.entity);
                            data.type = 1;
                            data.id = attendee.entity;
                        }

                        if (attendee.contact) {
                            data.first_name = attendee.contact.first_name;
                            data.last_name = attendee.contact.last_name;
                        }

                        result.push(data);
                        break;
                    // group
                    case 'GROUP':
                        // group expects array of object [{ id: 1337 }], yay (see bug 47207)
                        groups.push({ id: attendee.entity });
                        break;
                    // resource or rescource group
                    case 'RESOURCE':
                        // ignore resources
                        break;
                    // no default
                }
            });

            if (!groups.length) return $.Deferred().resolve(result);

            return groupAPI.getList(groups)
                // resolve groups
                .then(function (groups) {
                    var members = [];
                    _.each(groups, function (single) {
                        members = _.union(single.members, members);
                    });
                    members = _(members).difference(users);
                    if (!members.length) return result;
                    return userAPI.getList(members);
                })
                .then(function (users) {
                    return result.concat(_(_(users).map(function (user) {
                        return {
                            display_name: user.display_name,
                            first_name: user.first_name,
                            last_name:  user.last_name,
                            type: 1,
                            mail:  user.email1 || user.email2 || user.email3,
                            id: user.id
                        };
                    })).filter(function (user) {
                        // don't add if mail address is missing (yep, edge-case)
                        return !!user.mail;
                    }));
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
                defaultStatus = folderAPI.is('public', folder) || folderAPI.is('private', folder) ? 'ACCEPTED' : 'NEEDS-ACTION',
                conf = that.getConfirmationStatus(eventModel, defaultStatus);

            if (_.isNumber(eventColor)) eventColor = that.colors[eventColor - 1].value;

            // shared appointments which are needs-action or declined don't receive color classes
            if (/^(needs-action|declined)$/.test(that.getConfirmationClass(conf))) return '';

            // appointments which have cancelled status does not receive color classes
            if (/^(cancelled)$/.test(that.getStatusClass(eventModel))) return '';

            // private appointments are colored with gray instead of folder color
            if (that.isPrivate(eventModel)) folderColor = that.PRIVATE_EVENT_COLOR;

            // if (folderAPI.is('public', folder) && ox.user_id !== appointment.created_by) {
            //     // public appointments which are not from you are always colored in the calendar color
            //     return 'color-label-' + folderColor;
            // }

            if (!eventModel.hasFlag('organizer') && !eventModel.hasFlag('organizer_on_behalf')) return folderColor;

            // set color of appointment. if color is 0, then use color of folder
            return !eventColor ? folderColor : eventColor;
        },

        lightenDarkenColor: _.memoize(function (col, amt) {
            if (_.isString(col)) col = that.colorToHex(col);
            col = that.hexToHSL(col);
            col[2] = Math.floor(col[2] * amt);
            col[2] = Math.max(Math.min(100, col[2]), 0);
            return 'hsl(' + col[0] + ',' + col[1] + '%,' + col[2] + '%)';
        }, function (col, amt) {
            return col + amt;
        }),

        colorToHex: function (color) {
            var data = that.colorToRGB(color);
            return (data[0] << 16) + (data[1] << 8) + data[2];
        },

        colorToHSL: function (color) {
            var hex = that.colorToHex(color);
            return that.hexToHSL(hex);
        },

        colorToRGB: (function () {

            var canvas = document.createElement('canvas'), context = canvas.getContext('2d');
            canvas.width = 1;
            canvas.height = 1;

            return function (color) {
                context.fillStyle = 'white';
                context.fillRect(0, 0, 1, 1);
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                return context.getImageData(0, 0, 1, 1).data;
            };
        }()),

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

        getRelativeLuminance: (function () {

            function val(x) {
                x /= 255;
                return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
            }

            return function (rgb) {
                var l = 0.2126 * val(rgb[0]) + 0.7152 * val(rgb[1]) + 0.0722 * val(rgb[2]);
                // round to 3 digits (rather useful for unit testing)
                return Math.round(l * 1000) / 1000;
            };
        }()),

        // returns color ensuring a color contrast higher than 1:4.5
        // based on algorithm as defined by https://www.w3.org/TR/WCAG20-TECHS/G18.html#G18-tests
        getForegroundColor: _.memoize(function (color) {

            function colorContrast(foreground) {
                var l2 = that.getRelativeLuminance(that.colorToRGB(foreground));
                return (l1 + 0.05) / (l2 + 0.05);
            }

            var l1 = that.getRelativeLuminance(that.colorToRGB(color)),
                hsl = that.colorToHSL(color),
                hue = hsl[0],
                sat = hsl[1] > 0 ? 30 : 0,
                lum = 50,
                foreground;

            if (l1 < 0.18333) return 'white';

            // start with 50% luminance; then go down until color contrast exceeds 5 (little higher than 4.5)
            // whoever finds a simple way to calculate this programmatically
            // (and which is still correct in all cases) gets a beer or two
            do {
                foreground = 'hsl(' + hue + ', ' + sat + '%, ' + lum + '%)';
                lum -= 5;
            } while (lum >= 0 && colorContrast(foreground) < 5);

            return foreground;
        }),

        canAppointmentChangeColor: function (folder, eventModel) {
            var eventColor = eventModel.get('color'),
                privateFlag = that.isPrivate(eventModel),
                defaultStatus = folderAPI.is('public', folder) || folderAPI.is('private', folder) ? 'ACCEPTED' : 'NEEDS-ACTION',
                conf = that.getConfirmationStatus(eventModel, defaultStatus);

            // shared appointments which are needs-action or declined don't receive color classes
            if (/^(needs-action|declined)$/.test(that.getConfirmationClass(conf))) return false;
            // appointments which have cancelled status does not receive color classes
            if (/^(cancelled)$/.test(that.getStatusClass(eventModel))) return false;

            if (!eventModel.hasFlag('organizer')) return true;

            return !eventColor && !privateFlag;
        },

        getFolderColor: function (folder) {
            var defaultColor = settings.get('defaultFolderColor', '#CFE6FF'),
                // should work with models and plain objects
                extendedProperties = (folder.get ? folder.get('com.openexchange.calendar.extendedProperties') : folder['com.openexchange.calendar.extendedProperties']) || {},
                color = extendedProperties.color ? (extendedProperties.color.value || defaultColor) : defaultColor;
            // fallback if color is an index (might still occur due to defaultFolderColor)
            if (_.isNumber(color)) color = that.colors[color - 1].value;
            return color;
        },

        getColorName: function (color) {
            if (!color) return gt('None');
            var colorObj = _.findWhere(this.colors, { value: color });
            if (colorObj) return colorObj.label;
            return gt('Unknown');
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

        openDeeplink: function (model, opt) {
            opt = _({}).extend(opt);
            model = new (require('io.ox/calendar/model').Model)(model.toJSON());

            ox.launch('io.ox/calendar/main', { folder: model.get('folder') }).done(function () {
                var app = this,
                    perspective = opt.perspective || _.url.hash('perspective') || app.props.get('layout');

                function cont(perspective) {
                    if (perspective.selectAppointment) {
                        perspective.selectAppointment(model);
                        // early return to avoud doubled detail view
                        return;
                    }
                    if (opt.showDetails) {
                        var e = $.Event('click', { target: app.perspective.$el });
                        perspective.showAppointment(e, model.toJSON(), { arrow: false });
                    }
                }

                app.folders.add(model.get('folder'));

                // open in current perspective
                if (app.perspective && settings.get('viewView') === perspective) cont(app.perspective, model);

                app.pages.changePage(perspective, { disableAnimations: _.device('smartphone') });

                // wait for perspective change
                app.getWindow().one('change:perspective', function (e, perspective) {
                    cont(perspective, model);
                });
            });
        },

        showRecurrenceDialog: function (model, options) {
            if (!(model instanceof Backbone.Model)) model = new (require('io.ox/calendar/model').Model)(model);
            if (model.get('recurrenceId')) {
                var def = $.Deferred();
                require(['io.ox/calendar/api'], function (calendarAPI) {
                    calendarAPI.get({ id: model.get('seriesId'), folder: model.get('folder') }, false).done(function (masterModel) {
                        options = options || {};
                        var text,
                            teaser = gt('This appointment is part of a series.'),
                            dialog = new ModalDialog({
                                width: 600
                            }).addCancelButton({ left: true });
                        if (!options.dontAllowExceptions) dialog.addButton({ label: gt('Edit this appointment'), action: 'appointment', className: 'btn-default' });

                        if (model.hasFlag('first_occurrence')) {
                            if (options.dontAllowExceptions) return def.resolve('series', masterModel);
                            text = gt('Do you want to edit the whole series or just this appointment within the series?');
                            dialog.addButton({ label: gt('Edit series'), action: 'series' });
                        } else if (model.hasFlag('last_occurrence') && !options.allowEditOnLastOccurence) {
                            return def.resolve('appointment');
                        } else if (options.dontAllowExceptions) {
                            text = gt('Do you want to edit this and all future appointments or the whole series?');
                            dialog.addButton({ label: gt('Series'), action: 'series', className: 'btn-default' });
                            dialog.addButton({ label: gt('Edit all future appointments'), action: 'thisandfuture' });
                        } else {
                            text = gt('Do you want to edit this and all future appointments or just this appointment within the series?');
                            dialog.addButton({ label: gt('Edit all future appointments'), action: 'thisandfuture' });
                        }
                        dialog.build(function () {
                            this.$title.text(gt('Edit appointment'));
                            this.$body.append(teaser, '\u00a0', text);
                        }).open();
                        dialog.on('action', function (value) {
                            def.resolve(value, masterModel);
                        });
                        return def;
                    // in some rare cases we have series exceptions without a series master (don't ask me how someone achieves this). We only edit this single appointment then
                    }).fail(function () {
                        def.resolve('appointment');
                    });
                });
                return def;
            }
            return $.when('appointment');
        },

        isPrivate: function (data, strict) {
            return that.hasFlag(data, 'private') || (!strict && that.hasFlag(data, 'confidential'));
        },

        returnIconsByType: function (obj) {
            var icons = {
                type: [],
                property: []
            };

            if (that.hasFlag(obj, 'tentative')) icons.type.push($('<span class="tentative-flag">').attr('aria-label', gt('Tentative')).append($('<i class="fa fa-question-circle" aria-hidden="true">').attr('title', gt('Tentative'))));
            if (that.hasFlag(obj, 'private')) icons.type.push($('<span class="private-flag">').attr('aria-label', gt('Appointment is private')).append($('<i class="fa fa-user-circle" aria-hidden="true">').attr('title', gt('Appointment is private'))));
            if (that.hasFlag(obj, 'confidential')) icons.type.push($('<span class="confidential-flag">').attr('aria-label', gt('Appointment is confidential')).append($('<i class="fa fa-lock" aria-hidden="true">').attr('title', gt('Appointment is confidential'))));
            if (this.hasFlag(obj, 'series') || this.hasFlag(obj, 'overridden')) icons.property.push($('<span class="recurrence-flag">').attr('aria-label', gt('Appointment is part of a series')).append($('<i class="fa fa-repeat" aria-hidden="true">').attr('title', gt('Appointment is part of a series'))));
            if (this.hasFlag(obj, 'scheduled')) icons.property.push($('<span class="participants-flag">').attr('aria-label', gt('Appointment has participants')).append($('<i class="fa fa-user-o" aria-hidden="true">').attr('title', gt('Appointment has participants'))));
            if (this.hasFlag(obj, 'attachments')) icons.property.push($('<span class="attachments-flag">').attr('aria-label', gt('Appointment has attachments')).append($('<i class="fa fa-paperclip" aria-hidden="true">').attr('title', gt('Appointment has attachments'))));
            return icons;
        },

        getCurrentRangeOptions: function () {
            var app = ox.ui.apps.get('io.ox/calendar');
            if (!app) return {};
            var perspective = app.perspective;
            if (!perspective) return {};

            var rangeStart, rangeEnd, model = perspective.model;
            switch (perspective.getName()) {
                case 'week':
                    rangeStart = moment(model.get('startDate')).utc();
                    rangeEnd = moment(model.get('startDate')).utc().add(model.get('numColumns'), 'days');
                    break;
                case 'month':
                    rangeStart = moment(model.get('startDate')).utc();
                    rangeEnd = moment(model.get('endDate')).utc();
                    break;
                case 'list':
                    rangeStart = moment().startOf('day').utc();
                    rangeEnd = moment().startOf('day').add((app.listView.loader.collection.range || 1), 'month').utc();
                    break;
                default:
            }

            if (!rangeStart || !rangeEnd) return {};
            return {
                expand: true,
                rangeStart: rangeStart.format(that.ZULU_FORMAT),
                rangeEnd: rangeEnd.format(that.ZULU_FORMAT)
            };
        },

        rangeFilter: function (start, end) {
            return function (obj) {
                var tsStart = that.getMoment(obj.startDate),
                    tsEnd = that.getMoment(obj.endDate);
                if (tsEnd < start) return false;
                if (tsStart > end) return false;
                return true;
            };
        },

        cid: function (o) {
            if (_.isObject(o)) {
                if (o.attributes) o = o.attributes;
                var cid = o.folder + '.' + o.id;
                if (o.recurrenceId) cid += '.' + o.recurrenceId;
                return cid;
            } else if (_.isString(o)) {
                var s = o.split('.'),
                    r = { folder: s[0], id: s[1] };
                if (s.length === 3) r.recurrenceId = s[2];
                return r;
            }
        },

        // creates an attendee object from a user object or model and contact model or object
        // distribution lists create an array of attendees representing the members of the distribution list
        // used to create default participants and used by addparticipantsview
        // options can contain attendee object fields that should be prefilled (usually partStat: 'ACCEPTED')
        createAttendee: function (user, options) {

            if (!user) return;
            // make it work for models and objects
            user = user instanceof Backbone.Model ? user.attributes : user;

            // distribution lists are split into members
            if (user.mark_as_distributionlist) {
                return _(user.distribution_list).map(this.createAttendee);
            }
            options = options || {};
            var attendee = {
                cuType: attendeeLookupArray[user.type] || 'INDIVIDUAL',
                cn: user.display_name || user.cn,
                partStat: 'NEEDS-ACTION'
            };

            if (attendee.cuType !== 'RESOURCE') {
                // guests have a user id but are still considered external, so don't add an entity here (normal users have guest_created_by === 0)
                if (!user.guest_created_by && (user.user_id !== undefined || user.contact_id) && user.type !== 5) {
                    attendee.entity = user.user_id || user.id;
                } else if (user.entity) attendee.entity = user.entity;
                attendee.email = user.field && user[user.field] ? user[user.field] : (user.email1 || user.mail || user.email);
                if (!attendee.cn) attendee.cn = attendee.email;
                attendee.uri = 'mailto:' + attendee.email;
            } else {
                attendee.partStat = 'ACCEPTED';
                if (user.description) attendee.comment = user.description;
                attendee.entity = user.id;
                attendee.resource = user;
                if (user.mailaddress) {
                    attendee.email = user.mailaddress;
                    attendee.uri = 'mailto:' + user.mailaddress;
                }
            }

            if (attendee.cuType === 'GROUP') {
                attendee.entity = user.id;
                // not really needed. Added just for convenience. Helps if group should be resolved
                attendee.members = user.members;
            }
            // not really needed. Added just for convenience. Helps if distribution list should be created
            if (attendee.cuType === 'INDIVIDUAL' || !attendee.cuType) {
                if (user.contact) {
                    attendee.contact = {
                        display_name: user.cn || user.display_name,
                        first_name: user.contact.first_name,
                        last_name: user.contact.last_name
                    };
                } else {
                    attendee.contact = {
                        display_name: user.display_name,
                        first_name: user.first_name,
                        last_name: user.last_name
                    };
                }
            }
            // override with predefined values if given
            return _.extend(attendee, options);
        },

        // all day appointments have no timezone and the start and end dates are in date format not date-time
        // checking the start date is sufficient as the end date must be of the same type, according to the spec
        isAllday: function (app) {
            if (!app) return false;
            app = app instanceof Backbone.Model ? app.attributes : app;
            var time = app.startDate;
            // there is no time value for all day appointments
            return this.isLocal(app) && (time.value.indexOf('T') === -1);
        },

        // appointments may be in local time. This means they do not move when the timezone changes. Do not confuse this with UTC time
        isLocal: function (app) {
            if (!app) return false;
            var time = app instanceof Backbone.Model ? app.get('startDate') : app.startDate;
            return time && time.value && !time.tzid;
        },

        getMoment: function (date) {
            if (_.isObject(date)) return moment.tz(date.value, date.tzid || moment().tz());
            return moment(date);
        },

        getMomentInLocalTimezone: function (date) {
            return that.getMoment(date).tz(moment().tz());
        },

        // get the right default alarm for an event
        // note: the default alarm for the birthday calendar is not considered here. There is no use case since you cannot edit those events atm.
        getDefaultAlarms: function (event) {
            // no event or not fulltime (isAllday returns false for no event)
            if (!this.isAllday(event)) {
                return settings.get('chronos/defaultAlarmDateTime', []);
            }
            return settings.get('chronos/defaultAlarmDate', []);
        },

        // checks if the user is allowed to edit an event
        // data is plain object, folder is folderModel (e.g. via app.folder.getModel())
        allowedToEdit: function (data, folder) {

            if (!data || !folder) return false;
            if (!data.id || !data.folder) return false;

            // organizer is allowed to edit
            if (this.hasFlag(data, 'organizer') || this.hasFlag(data, 'organizer_on_behalf')) return true;
            // if user is neither organizer nor attendee editing is only based on folder permissions, so just return true and let the collection modify etc check handle this.
            if (!this.hasFlag(data, 'attendee') && !this.hasFlag(data, 'attendee_on_behalf')) return true;
            // if user is attendee, check if modify privileges are granted
            if ((this.hasFlag(data, 'attendee') || this.hasFlag(data, 'attendee_on_behalf')) && data.attendeePrivileges === 'MODIFY') return true;

            var restrictChanges = settings.get('chronos/restrictAllowedAttendeeChanges', true),
                restrictChangesPublic = settings.get('chronos/restrictAllowedAttendeeChangesPublic', true);

            // if both settings are the same, we don't need a folder check
            // all attendees are allowed to edit or not, no matter which folder the event is in
            if (restrictChanges === restrictChangesPublic) return !restrictChanges;

            return folder.is('public') ? !restrictChangesPublic : !restrictChanges;
        },

        hasFlag: function (data, flag) {
            // support for arrays (used in multiple selection). returns true if all items in the array have the flag
            if (_.isArray(data) && data.length > 0) return _(data).reduce(function (oldVal, item) { return oldVal && that.hasFlag(item, flag); }, true);
            if (data instanceof Backbone.Model) return data.hasFlag(flag);
            if (!data.flags || !data.flags.length) return false;
            return data.flags.indexOf(flag) >= 0;
        },

        // creates data for the edit dialog when an exception should be used to update the series
        createUpdateData: function (master, exception) {
            // consolidate data
            master = master instanceof Backbone.Model ? master.attributes : master;
            exception = exception instanceof Backbone.Model ? exception.attributes : exception;

            // deep copy
            var result = JSON.parse(JSON.stringify(master)),
                // we have 4 possible formats for the recurrence id : Zulu, Date, dateTime, Timezone:localtime, see https://jira.open-xchange.com/browse/SCR-584
                recurrenceId = _(exception.recurrenceId.split(':')).last();

            result.recurrenceId = exception.recurrenceId;

            // recreate dates
            result.startDate.value = this.isAllday(master) ? moment(exception.recurrenceId).format('YYYYMMDD') : moment(recurrenceId).tz(master.startDate.tzid || moment().tz()).format('YYYYMMDD[T]HHmmss');
            // calculate duration and add it to startDate, then format
            result.endDate.value = this.isAllday(master) ? moment(moment(result.startDate.value).valueOf() + moment(master.endDate.value).valueOf() - moment(master.startDate.value).valueOf()).format('YYYYMMDD') :
                moment.tz(moment(result.startDate.value).valueOf() + moment(master.endDate.value).valueOf() - moment(master.startDate.value).valueOf(), result.startDate.tzid || moment().tz()).format('YYYYMMDD[T]HHmmss');

            return result;
        },
        // cleans attendee confrmations and comments, used when data from existing appointments should be used to create a new one (invite, follow up)
        cleanupAttendees: function (attendees) {
            // clean up attendees (remove confirmation status comments etc)
            return _(attendees).map(function (attendee) {
                var temp = _(attendee).pick('cn', 'cuType', 'email', 'uri', 'entity', 'contact', 'resource');
                // resources are always set to accepted
                if (temp.cuType === 'RESOURCE') {
                    temp.partStat = 'ACCEPTED';
                    if (attendee.comment) temp.comment = attendee.comment;
                } else {
                    temp.partStat = 'NEEDS-ACTION';
                }
                return temp;
            });
        },
        confirmWithConflictCheck: function (requestData, options) {
            options = options || {};
            var def = new $.Deferred();

            require(['io.ox/calendar/api'], function (calendarAPI) {
                calendarAPI.confirm(requestData, options).then(function (data) {

                    if (data && data.conflicts) {
                        require(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                            conflictView.dialog(data.conflicts)
                                .on('cancel', function () {
                                    def.reject();
                                })
                                .on('ignore', function () {
                                    options.checkConflicts = false;
                                    that.confirmWithConflictCheck(requestData, options).then(def.resolve, def.reject);
                                });
                        });
                        return;
                    }
                    def.resolve(data);
                }, def.reject);
            });
            return def;
        }
    };

    return that;
});
