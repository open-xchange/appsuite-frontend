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
    'gettext!io.ox/tasks'
], function (gt) {

    'use strict';

    var lookupDaytimeStrings = [
            gt('this morning'),
            gt('by noon'),
            gt('this afternoon'),
            gt('tonight'),
            gt('late in the evening')
        ],

        util = {
            computePopupTime: function (value, smartEndDate) {
                smartEndDate = smartEndDate || false;
                var alarmDate = moment(),
                    endDate;

                switch (value) {
                // in 5 minutes
                case '5':
                    alarmDate.add(5, 'minutes');
                    break;
                // in 15 minutes
                case '15':
                    alarmDate.add(15, 'minutes');
                    break;
                // in 30 minutes
                case '30':
                    alarmDate.add(30, 'minutes');
                    break;
                // in 60 minutes
                case '60':
                    alarmDate.add(1, 'hour');
                    break;
                default:
                    alarmDate.startOf('hour');
                    switch (value) {
                    // this morning
                    case 'd0':
                        alarmDate.hours(6);
                        break;
                    // by noon
                    case 'd1':
                        alarmDate.hours(12);
                        break;
                    // this afternoon
                    case 'd2':
                        alarmDate.hours(15);
                        break;
                    // tonight
                    case 'd3':
                        alarmDate.hours(18);
                        break;
                    // late in the evening
                    case 'd4':
                        alarmDate.hours(22);
                        break;
                    default:
                        alarmDate.hours(6);
                        switch (value) {
                        // tomorrow
                        case 't':
                            alarmDate.add(1, 'day');
                            break;
                        // next week
                        case 'ww':
                            alarmDate.add(1, 'week');
                            break;
                        // next Sunday
                        case 'w0':
                            alarmDate.day(7);
                            break;
                        // next Monday
                        case 'w1':
                            alarmDate.day(8);
                            break;
                        // next Tuesday
                        case 'w2':
                            alarmDate.day(9);
                            break;
                        // next Wednesday
                        case 'w3':
                            alarmDate.day(10);
                            break;
                        // next Thursday
                        case 'w4':
                            alarmDate.day(11);
                            break;
                        // next Friday
                        case 'w5':
                            alarmDate.day(12);
                            break;
                        // next Saturday
                        case 'w6':
                            alarmDate.day(13);
                            break;
                        default:
                            //cannot identify selector...set time now
                            break;
                        }
                        break;
                    }
                    break;
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
                    // Localtime
                    alarmDate: alarmDate.valueOf()
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

                for (i = (now.day() + 2) % 7;i !== now.day(); i = ++i % 7) {
                    //#. reminder date selection
                    //#. %1$s is a weekdays, like 'next Monday'
                    result.push(['w' + i, gt('next %1$s', moment.weekdays(i))]);
                }

                result.push(['ww', gt('in one week')]);

                return result;
            },

            //change status number to status text. format enddate to presentable string
            //if detail is set, alarm and startdate get converted too and status text is set for more states than overdue and success
            interpretTask: function (task, options) {
                options = options || {};
                task = _.copy(task, true);
                //no state for task over time, so manual check is needed
                if (!options.noOverdue && (task.status !== 3 && task.end_date !== undefined && task.end_date !== null && _.now() > task.end_date)) {
                    task.status = gt('Overdue');
                    task.badge = 'badge badge-important';
                } else if (task.status) {
                    switch (task.status) {
                        case 1:
                            task.status = gt('Not started');
                            task.badge = 'badge';
                            break;
                        case 2:
                            task.status = gt('In progress');
                            task.badge = 'badge';
                            break;
                        case 3:
                            task.status = gt('Done');
                            task.badge = 'badge badge-success';
                            break;
                        case 4:
                            task.status = gt('Waiting');
                            task.badge = 'badge';
                            break;
                        case 5:
                            task.status = gt('Deferred');
                            task.badge = 'badge';
                            break;
                    }
                } else {
                    task.status = '';
                    task.badge = '';
                }

                if (task.title === undefined || task.title === null) {
                    task.title = '\u2014';
                }

                if (task.end_date !== undefined && task.end_date !== null) {
                    // convert UTC timestamp to local time
                    task.end_date = moment.utc(task.end_date).local(true).format('l');

                } else {
                    task.end_date = '';
                }

                if (options.detail) {
                    if (task.start_date !== undefined && task.start_date !== null) {
                        task.start_date = moment.utc(task.start_date).local(true).format('l');

                    } else {
                        task.start_date = '';
                    }
                    if (task.date_completed) {
                        task.date_completed = moment(task.date_completed).format('l LT');
                    }

                    if (task.alarm !== undefined && task.alarm !== null) {
                        task.alarm = moment(task.alarm).format('l LT');
                    } else {
                        task.alarm = '';
                    }
                }

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
                        } else {
                            return -1;
                        }
                    },
                    //sort by endDate. If equal, sort by alphabet
                    dateSort = function (a, b) {
                        /* jshint eqeqeq: false */
                        if (a.end_date > b.end_date) {
                            return 1;
                        // use == here so end_date=null and end_date=undefined are equal. may happen with done tasks
                        } else if (a.end_date == b.end_date) {
                            return alphabetSort(a, b);
                        } else {
                            return -1;
                        }
                        /* jshint eqeqeq: true */
                    };

                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].status === 3) {
                        resultArray.push(tasks[i]);
                    } else if (tasks[i].end_date === null || tasks[i].end_date === undefined) {
                        //tasks without end_date
                        emptyDateArray.push(tasks[i]);
                    } else {
                        // tasks with end_date
                        dateArray.push(tasks[i]);
                    }
                }
                //sort by end_date and alphabet
                resultArray.sort(dateSort);
                //sort by alphabet
                emptyDateArray.sort(alphabetSort);
                //sort by end_date and alphabet
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
