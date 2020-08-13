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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/util', [
    'gettext!io.ox/tasks',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'io.ox/mail/sanitizer'
], function (gt, coreSettings, capabilities, sanitizer) {

    'use strict';

    // global handler for cross-app links
    $(document).on('click', '.ox-internal-mail-link', function (e) {
        e.preventDefault();
        var cid = decodeURIComponent($(this).attr('data-cid').replace(/:/g, '.'));
        ox.launch('io.ox/mail/detail/main', { cid: cid });
    });

    var lookupDaytimeStrings = [
            gt('this morning'),
            gt('by noon'),
            gt('this afternoon'),
            gt('tonight'),
            gt('late in the evening')
        ],
        hours = [
            //this morning
            6,
            // by noon
            12,
            // this afternoon
            15,
            // tonight
            18,
            // late in the evening
            22
        ],
        util = {
            computePopupTime: function (value, smartEndDate) {
                smartEndDate = smartEndDate || false;
                // no need for milliseconds or seconds, minutes are accurate enough
                var alarmDate = moment().milliseconds(0).seconds(0),
                    endDate;

                if (!isNaN(parseInt(value, 10))) {
                    //in x minutes
                    alarmDate.add(parseInt(value, 10), 'minutes');
                } else {
                    alarmDate.startOf('hour');
                    if (value.indexOf('d') === 0) {
                        //this morning, by noon etc
                        alarmDate.hours(hours[parseInt(value.charAt(1), 10)]);
                    } else {
                        alarmDate.hours(6);
                        if (value === 't') {
                            //tomorow
                            alarmDate.add(1, 'day');
                        } else if (value === 'ww') {
                            // next week
                            alarmDate.add(1, 'week');
                        } else if (value.indexOf('w') === 0) {
                            //next sunday - saturday
                            alarmDate.day(parseInt(value.charAt(1), 10));
                            //day selects the weekday of the current week, this might be in the past, for example selecting sunday on a wednesday
                            if (alarmDate.valueOf() < _.now()) {
                                alarmDate.add(1, 'week');
                            }
                        }
                    }
                }

                // set endDate
                endDate = moment(alarmDate);

                if (smartEndDate) {
                    // 0 for Sunday to 6 for Saturday
                    var weekDay = endDate.day();
                    // if weekend, shift to next Monday, otherwise to Friday
                    endDate.day(weekDay < 1 || weekDay > 5 ? 8 : 12);
                }

                // endDate should not be before alarmDate
                if (alarmDate.valueOf() > endDate.valueOf()) {
                    endDate.add(1, 'week');
                }

                // end Date does not have a time
                endDate.startOf('day');

                return {
                    // UTC
                    endDate: endDate.utc(true).valueOf(),
                    alarmDate: alarmDate.utc().valueOf()
                };
            },

            // builds dropdownmenu nodes, if o.bootstrapDropdown is set listnodes are created else option nodes
            buildDropdownMenu: function (o) {
                o = o || {};
                // get the values
                var options = this.buildOptionArray(o),
                    result = [];

                // put the values in nodes
                _(options).each(function (obj) {
                    var label = obj[1], value = obj[0],
                        data = { 'data-name': 'change-due-date', 'data-value': label.toLowerCase() };

                    result.push(
                        o.bootstrapDropdown ?
                            $('<li>').append(
                                $('<a href="#" role="menuitem">').attr(data).val(value).text(label)
                            ) :
                            $('<option>').val(value).text(label)
                    );
                });

                return result;
            },

            //returns the same as buildDropdownMenu but returns an array of value string pairs
            buildOptionArray: function (o) {
                o = o || {};
                var result = [],
                    now = moment(),
                    i = now.hours();

                if (!o.daysOnly) {
                    result = [
                        [5, gt('in 5 minutes')],
                        [15, gt('in 15 minutes')],
                        [30, gt('in 30 minutes')],
                        [60, gt('in one hour')]
                    ];

                    if (i < 6) {
                        i = 0;
                    } else if (i < 12) {
                        i = 1;
                    } else if (i < 15) {
                        i = 2;
                    } else if (i < 18) {
                        i = 3;
                    } else if (i < 22) {
                        i = 4;
                    }

                    while (i < lookupDaytimeStrings.length) {
                        result.push(['d' + i, lookupDaytimeStrings[i]]);
                        i++;
                    }
                }

                // tomorrow
                result.push(['t', gt('tomorrow')]);

                for (i = (now.day() + 2) % 7; i !== now.day(); i = ++i % 7) {
                    result.push(['w' + i, moment.weekdays(i)]);
                }

                result.push(['ww', gt('in one week')]);

                return result;
            },

            isOverdue: function (task) {
                return (task.end_time !== undefined && task.end_time !== null && task.end_time < _.now() && task.status !== 3);
            },

            getSmartEnddate: function (data) {
                var m = data.full_time ? moment.utc(data.end_time).local(true) : moment(data.end_time),
                    startOfDay = moment().startOf('day');
                // past?
                if (m.isBefore(startOfDay)) {
                    if (m.isAfter(startOfDay.subtract(1, 'day'))) {
                        return gt('Yesterday') + ', ' + m.format(data.full_time ? 'l' : 'l, LT');
                    }
                    return m.format('ddd, ' + m.format(data.full_time ? 'l' : 'l, LT'));
                }
                // future
                if (m.isBefore(startOfDay.add(1, 'days'))) {
                    return gt('Today') + ', ' + m.format(data.full_time ? 'l' : 'l, LT');
                } else if (m.isBefore(startOfDay.add(1, 'day'))) {
                    return gt('Tomorrow') + ', ' + m.format(data.full_time ? 'l' : 'l, LT');
                }
                return m.format('ddd, ' + m.format(data.full_time ? 'l' : 'l, LT'));
            },

            // looks in the task note for 'mail:' + _.ecid(maildata), removes that from the note and returns the mail link as a button that opens the mailapp
            checkMailLinks: function (note) {
                var links = note.match(/mail:\/\/\S*/g),
                    link;

                if (links && links[0] && capabilities.has('webmail')) {

                    for (var i = 0; i < links.length; i++) {
                        link = '<a href="#" role="button" data-cid="' + links[i].replace(/^mail:\/\//, '') + '" class="ox-internal-mail-link label label-primary">' + gt('Original mail') + '</a>';
                        // replace links
                        note = note.replace(links[i], link);
                    }
                    //remove signature style divider "--" used by tasks created by mail reminder function (if it's at the start remove it entirely)
                    note = note.replace(/(<br>)+-+(<br>)*/, '<br>').replace(/^-+(<br>)*/, '');
                }

                // prevent malicious code here
                return sanitizer.simpleSanitize(note);
            },

            //change status number to status text. format enddate to presentable string
            //if detail is set, alarm and startdate get converted too and status text is set for more states than overdue and success
            interpretTask: function (task, options) {
                options = options || {};
                task = _.copy(task, true);

                //no state for task over time, so manual check is needed
                if (!options.noOverdue && this.isOverdue(task)) {
                    task.status = gt('Overdue');
                    task.badge = 'badge badge-overdue';
                } else if (task.status) {
                    switch (task.status) {
                        case 1:
                            task.status = gt('Not started');
                            task.badge = 'badge badge-notstarted';
                            break;
                        case 2:
                            task.status = gt('In progress');
                            task.badge = 'badge badge-inprogress';
                            break;
                        case 3:
                            task.status = gt('Done');
                            task.badge = 'badge badge-done';
                            break;
                        case 4:
                            task.status = gt('Waiting');
                            task.badge = 'badge badge-waiting';
                            break;
                        case 5:
                            task.status = gt('Deferred');
                            task.badge = 'badge badge-deferred';
                            break;
                        // no default
                    }
                } else {
                    task.status = '';
                    task.badge = '';
                }

                if (task.title === undefined || task.title === null) {
                    task.title = '\u2014';
                }

                function formatTime(value, fullTime) {
                    if (value === undefined || value === null) return '';

                    if (fullTime) {
                        // fulltime tasks are timezone independent
                        return moment.utc(value).format('l');
                    }
                    return moment.tz(value, coreSettings.get('timezone')).format('l, LT');
                }

                // convert UTC timestamps to local time
                task.end_time = formatTime(task.end_time, task.full_time);
                task.start_time = formatTime(task.start_time, task.full_time);
                task.alarm = formatTime(task.alarm);
                task.date_completed = formatTime(task.date_completed);

                return task;
            },

            //done tasks last, overduetasks first, same or no date alphabetical
            sortTasks: function (tasks, order) {
                //make local copy
                tasks = _.copy(tasks, true);
                if (!order) {
                    order = 'asc';
                }

                var resultArray = [],
                    dateArray = [],
                    emptyDateArray = [],
                    //sort by alphabet
                    alphabetSort = function (a, b) {
                        if (!a.title) {
                            return -1;
                        }
                        if (!b.title) {
                            return 1;
                        }
                        if (a.title.toLowerCase() > b.title.toLowerCase()) {
                            return 1;
                        }
                        return -1;
                    },
                    //sort by endDate. If equal, sort by alphabet
                    dateSort = function (a, b) {
                        if (a.end_time > b.end_time) {
                            return 1;
                        // treat end_time=null and end_time=undefined equally. may happen with done tasks
                        } else if (a.end_time === b.end_time || (a.end_time === undefined && b.end_time === null) || (a.end_time === null && b.end_time === undefined)) {
                            return alphabetSort(a, b);
                        }
                        return -1;
                    };

                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].status === 3) {
                        resultArray.push(tasks[i]);
                    } else if (tasks[i].end_time === null || tasks[i].end_time === undefined) {
                        //tasks without end_time
                        emptyDateArray.push(tasks[i]);
                    } else {
                        // tasks with end_time
                        dateArray.push(tasks[i]);
                    }
                }
                //sort by end_time and alphabet
                resultArray.sort(dateSort);
                //sort by alphabet
                emptyDateArray.sort(alphabetSort);
                //sort by end_time and alphabet
                dateArray.sort(dateSort);

                if (order === 'desc') {
                    resultArray.push(emptyDateArray.reverse(), dateArray.reverse());
                    resultArray = _.flatten(resultArray);
                } else {
                    resultArray.unshift(dateArray, emptyDateArray);
                    resultArray = _.flatten(resultArray);
                }
                return resultArray;
            },

            getPriority: function (data) {
                if (data) {
                    var p = parseInt(data.priority, 10) || 0,
                        $span = $('<span>');
                    switch (p) {
                        case 0:
                            $span.addClass('noprio').attr('title', gt('No priority'));
                            break;
                        case 1:
                            $span.addClass('low').attr('title', gt('Low priority'));
                            break;
                        case 2:
                            $span.addClass('medium').attr('title', gt('Medium priority'));
                            break;
                        case 3:
                            $span.addClass('high').attr('title', gt('High priority'));
                            break;
                        // no default
                    }
                    for (var i = 0; i < p; i++) {
                        $span.append($('<i class="fa fa-exclamation" aria-hidden="true">'));
                    }
                    return $span;
                }

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
                var hash = util.getConfirmations(obj),
                    user = id || ox.user_id;
                return hash[user] ? hash[user].status : 0;
            },

            getConfirmationMessage: function (obj, id) {
                var hash = util.getConfirmations(obj),
                    user = id || ox.user_id;
                return hash[user] ? hash[user].comment : '';
            },

            getDateTimeIntervalMarkup: function (data, options) {
                if (data && data.start_date && data.end_date) {

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
                        timeZoneStr = moment(data.start_date).zoneAbbr(),
                        fmtstr = options.a11y ? 'dddd, l' : 'ddd, l';

                    if (data.full_time) {
                        startDate = moment.utc(data.start_date).local(true);
                        endDate = moment.utc(data.end_date).local(true).subtract(1, 'days');
                    } else {
                        startDate = moment(data.start_date);
                        endDate = moment(data.end_date);
                    }
                    if (startDate.isSame(endDate, 'day')) {
                        dateStr = startDate.format(fmtstr);
                        timeStr = util.getTimeInterval(data, options.zone);
                    } else if (data.full_time) {
                        dateStr = util.getDateInterval(data);
                        timeStr = util.getTimeInterval(data, options.zone);
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
                            timeStr ? $.txt(timeStr) : ''
                        )
                    );
                }
                return '';
            },

            getDateInterval: function (data, a11y) {
                if (data && data.start_date && data.end_date) {
                    var startDate, endDate,
                        fmtstr = a11y ? 'dddd, l' : 'ddd, l';

                    a11y = a11y || false;

                    if (data.full_time) {
                        startDate = moment.utc(data.start_date).local(true);
                        endDate = moment.utc(data.end_date).local(true).subtract(1, 'days');
                    } else {
                        startDate = moment(data.start_date);
                        endDate = moment(data.end_date);
                    }
                    if (startDate.isSame(endDate, 'day')) {
                        return startDate.format(fmtstr);
                    }
                    if (a11y && data.full_time) {
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

            getTimeInterval: function (data, zone, a11y) {
                if (!data || !data.start_date || !data.end_date) return '';
                if (data.full_time) {
                    return util.getFullTimeInterval(data, true);
                }
                var start = moment(data.start_date),
                    end = moment(data.end_date);
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

            getFullTimeInterval: function (data, smart) {
                var length = util.getDurationInDays(data);
                return length <= 1 && smart ?
                    gt('Whole day') :
                    //#. General duration (nominative case): X days
                    //#. %d is the number of days
                    //#, c-format
                    gt.ngettext('%d day', '%d days', length, length);
            },

            getDurationInDays: function (data) {
                return moment(data.end_date).diff(data.start_date, 'days');
            },

            getReminderOptions: function () {

                var options = {},
                    reminderListValues = [
                        { value: -1, format: 'string' },
                        { value: 0, format: 'minutes' },
                        { value: 5, format: 'minutes' },
                        { value: 10, format: 'minutes' },
                        { value: 15, format: 'minutes' },
                        { value: 30, format: 'minutes' },
                        { value: 45, format: 'minutes' },

                        { value: 60, format: 'hours' },
                        { value: 120, format: 'hours' },
                        { value: 240, format: 'hours' },
                        { value: 360, format: 'hours' },
                        { value: 480, format: 'hours' },
                        { value: 720, format: 'hours' },

                        { value: 1440, format: 'days' },
                        { value: 2880, format: 'days' },
                        { value: 4320, format: 'days' },
                        { value: 5760, format: 'days' },
                        { value: 7200, format: 'days' },
                        { value: 8640, format: 'days' },

                        { value: 10080, format: 'weeks' },
                        { value: 20160, format: 'weeks' },
                        { value: 30240, format: 'weeks' },
                        { value: 40320, format: 'weeks' }
                    ];

                _(reminderListValues).each(function (item) {
                    var i;
                    switch (item.format) {
                        case 'string':
                            options[item.value] = gt('No reminder');
                            break;
                        case 'minutes':
                            options[item.value] = gt.ngettext('%1$d Minute', '%1$d Minutes', item.value, item.value);
                            break;
                        case 'hours':
                            i = Math.floor(item.value / 60);
                            options[item.value] = gt.ngettext('%1$d Hour', '%1$d Hours', i, i);
                            break;
                        case 'days':
                            i = Math.floor(item.value / 60 / 24);
                            options[item.value] = gt.ngettext('%1$d Day', '%1$d Days', i, i);
                            break;
                        case 'weeks':
                            i = Math.floor(item.value / 60 / 24 / 7);
                            options[item.value] = gt.ngettext('%1$d Week', '%1$d Weeks', i, i);
                            break;
                        // no default
                    }
                });

                return options;
            }

        };

    return util;
});
