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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/util', [
    'gettext!io.ox/tasks',
    'settings!io.ox/core',
    'io.ox/core/capabilities'
], function (gt, coreSettings, capabilities) {

    'use strict';

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
                var alarmDate = moment(),
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

            //builds dropdownmenu nodes, if o.bootstrapDropdown is set listnodes are created else option nodes
            buildDropdownMenu: function (o) {
                o = o || {};
                //get the values
                var options = this.buildOptionArray(o),
                    result = [];

                //put the values in nodes
                if (o.bootstrapDropdown) {
                    _(options).each(function (obj) {
                        result.push($('<li>').append($('<a tabindex="1" role="menuitem" href="#">').val(obj[0]).text(obj[1])));
                    });
                } else {
                    _(options).each(function (obj) {
                        result.push($('<option>').val(obj[0]).text(obj[1]));
                    });
                }

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
                    //#. reminder date selection
                    //#. %1$s is a weekday, like 'next Monday'
                    result.push(['w' + i, gt('next %1$s', moment.weekdays(i))]);
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

            // looks in the task note for 'mail:' + _.cid(maildata), removes that from the note and returns the mail link as a button that opens the mailapp
            // currently only looks for one link at the end of the note. Used by mail reminders.
            checkMailLinks: function (note) {

                // find the link (note using .+ and not \w+ as folders might contain spaces)
                var links = note.match(/mail:\/\/.+?\.\w+/g),
                    link;

                if (links && links[0] && capabilities.has('webmail')) {

                    for (var i = 0; i < links.length; i++) {
                        link = '<span role="button" cid="' + links[i].replace(/^mail:\/\//, '') + '" class="ox-internal-mail-link label label-primary">' + gt('Original mail') + '</span>';
                        // replace links
                        note = note.replace(links[i], link);
                    }

                    // add function but make sure they are added only once
                    // code can be moved once we introduce general links for apps
                    $('.task-detail-container').undelegate('.ox-internal-mail-link', 'click').delegate('.ox-internal-mail-link', 'click', function () {
                        var self = $(this),
                            cid = self.attr('cid'),
                            // save height and width so it doesn't change when the busy animation is drawn
                            width = self.outerWidth() + 'px',
                            height = self.outerHeight() + 'px';
                        if (cid) {
                            self.css({ width: width, height: height }).busy(true);
                            require(['io.ox/mail/api'], function (api) {
                                // see if mail is still there. Also loads the mail into the pool. Needed for the app to work
                                api.get(_.extend({}, { unseen: true }, _.cid(cid))).done(function () {
                                    ox.launch('io.ox/mail/detail/main', { cid: cid });
                                }).fail(function (error) {
                                    //if the mail was moved or the mail was deleted the cid cannot be found, show error
                                    require(['io.ox/core/yell'], function (yell) {
                                        yell(error);
                                    });
                                }).always(function () {
                                    self.idle().css({ width: 'auto', height: 'auto' }).text(gt('Original mail'));
                                });
                            });
                        }
                    });
                    //remove signature style divider "--" used by tasks created by mail reminder function (if it's at the start remove it entirely)
                    note = note.replace(/(<br>)+-+(<br>)*/, '<br>').replace(/^-+(<br>)*/, '');
                }
                return note;
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

                function formatTime(value, format) {
                    if (value === undefined || value === null) return '';

                    return moment.tz(value, coreSettings.get('timezone')).format(format);
                }

                // convert UTC timestamps to local time
                task.end_time = formatTime(task.end_time, task.full_time ? 'l' : 'l, LT');
                task.start_time = formatTime(task.start_time, task.full_time ? 'l' : 'l, LT');
                task.alarm = formatTime(task.alarm, 'l, LT');
                task.date_completed = formatTime(task.date_completed, 'l, LT');

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
                        $span.append($('<i class="fa fa-exclamation">'));
                    }
                    return $span;
                }

            }
        };

    return util;
});
