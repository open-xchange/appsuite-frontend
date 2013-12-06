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
define('io.ox/tasks/util',
    ['io.ox/core/date',
     'settings!io.ox/tasks',
     'gettext!io.ox/tasks'
    ], function (date, settings, gt) {

    'use strict';

    var lookupDaytimeStrings = [gt('this morning'),
                                gt('by noon'),
                                gt('this afternoon'),
                                gt('tonight'),
                                gt('late in the evening')],

        lookupWeekdayStrings = [gt('next Sunday'),
                                gt('next Monday'),
                                gt('next Tuesday'),
                                gt('next Wednesday'),
                                gt('next Thursday'),
                                gt('next Friday'),
                                gt('next Saturday')];

    var util = {
            computePopupTime: function (value, smartEndDate) {
                smartEndDate = smartEndDate || false;
                var alarmDate = new date.Local(),
                    endDate;

                switch (value) {
                case '5': // in 5 minutes
                    alarmDate.add(date.MINUTE * 5);
                    break;
                case '15': // in 15 minutes
                    alarmDate.add(date.MINUTE * 15);
                    break;
                case '30': // in 30 minutes
                    alarmDate.add(date.MINUTE * 30);
                    break;
                case '60': // in 60 minutes
                    alarmDate.add(date.HOUR);
                    break;
                default:
                    alarmDate.setMinutes(0, 0, 0);
                    switch (value) {
                    case 'd0': // this morning
                        alarmDate.setHours(6);
                        break;
                    case 'd1': // by noon
                        alarmDate.setHours(12);
                        break;
                    case 'd2': // this afternoon
                        alarmDate.setHours(15);
                        break;
                    case 'd3': // tonight
                        alarmDate.setHours(18);
                        break;
                    case 'd4': // late in the evening
                        alarmDate.setHours(22);
                        break;
                    default:
                        alarmDate.setHours(6);
                        switch (value) {
                        case 't': // tomorrow
                            alarmDate.add(date.DAY);
                            break;
                        case 'ww': // next week
                            alarmDate.add(date.WEEK);
                            break;
                        case 'w0': // next Sunday
                            alarmDate.add(date.DAY * (7 - alarmDate.getDay()));
                            break;
                        case 'w1': // next Monday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 6) % 7)));
                            break;
                        case 'w2': // next Tuesday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 5) % 7)));
                            break;
                        case 'w3': // next Wednesday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 4) % 7)));
                            break;
                        case 'w4': // next Thursday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 3) % 7)));
                            break;
                        case 'w5': // next Friday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 2) % 7)));
                            break;
                        case 'w6': // next Saturday
                            alarmDate.add(date.DAY * (7 - ((alarmDate.getDay() + 1) % 7)));
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
                endDate = new date.Local(alarmDate.getTime());

                if (smartEndDate) {
                    var weekDay = endDate.getDay(); // 0 for Sunday to 6 for Saturday
                    if (weekDay < 1 || weekDay > 5) { // if weekend, shift to next Monday
                        endDate.add(date.DAY * (7 - ((endDate.getDay() + 6) % 7)));
                    } else { // next Friday
                        endDate.add(date.DAY * (7 - ((endDate.getDay() + 2) % 7)));
                    }
                }

                // endDate should not be before alarmDate
                if (alarmDate.getTime() > endDate.getTime()) {
                    endDate.add(date.WEEK);
                }

                // end Date does not have a time
                endDate.setHours(0, 0, 0, 0);

                return {
                    endDate: endDate.local, // UTC
                    alarmDate: alarmDate.getTime() // Localtime
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
                    now = new date.Local(),
                    i = now.getHours();

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

                result.push(['t', gt('tomorrow')]); // tomorrow

                for (i = (now.getDay() + 2) % 7;i !== now.getDay(); i = ++i % 7) {
                    result.push(['w' + i, lookupWeekdayStrings[i]]);
                }

                result.push(['ww', gt('in one week')]);

                return result;
            },

            //change status number to status text. format enddate to presentable string
            //if detail is set, alarm and startdate get converted too and status text is set for more states than overdue and success
            interpretTask: function (task, detail) {
                task = _.copy(task, true);
                if (task.status === 3) {
                    task.status = gt('Done');
                    task.badge = 'badge badge-success';

                } else {

                    if (task.end_date !== undefined && task.end_date !== null && _.now() > task.end_date) {//no state for task over time, so manual check is needed
                        task.status = gt('Overdue');
                        task.badge = 'badge badge-important';
                    } else if (detail && task.status) {
                        switch (task.status) {
                        case 1:
                            task.status = gt('Not started');
                            task.badge = 'badge';
                            break;
                        case 2:
                            task.status = gt('In progress');
                            task.badge = 'badge';
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
                }

                if (task.title === undefined || task.title === null) {
                    task.title = '\u2014';
                }

                if (task.end_date !== undefined && task.end_date !== null) {
                    // convert UTC timestamp to local time
                    task.end_date = new date.Local(date.Local.utc(task.end_date)).format(date.DATE);
                } else {
                    task.end_date = '';
                }

                if (detail) {
                    if (task.start_date !== undefined && task.start_date !== null) {
                        task.start_date = new date.Local(date.Local.utc(task.start_date)).format(date.DATE);
                    } else {
                        task.start_date = '';
                    }
                    if (task.date_completed) {
                        task.date_completed = new date.Local(task.date_completed).format();
                    }

                    if (task.alarm !== undefined && task.alarm !== null) {
                        task.alarm = new date.Local(task.alarm).format();
                    } else {
                        task.alarm = '';
                    }
                }

                return task;
            },

            sortTasks: function (tasks, order) {//done tasks last, overduetasks first, same or no date alphabetical
                tasks = _.copy(tasks, true);//make local copy
                if (!order) {
                    order = 'asc';
                }

                var resultArray = [],
                    dateArray = [],
                    emptyDateArray = [],
                    alphabetSort = function (a, b) {//sort by alphabet
                            if (a.title > b.title) {
                                return 1;
                            } else {
                                return -1;
                            }
                        },
                    dateSort = function (a, b) {//sort by endDate. If equal, sort by alphabet
                            /* jshint eqeqeq: false */
                            if (a.end_date > b.end_date) {
                                return 1;
                            } else if (a.end_date == b.end_date) {// use == here so end_date=null and end_date=undefined are equal. may happen with done tasks
                                return alphabetSort(a, b);
                            }
                            else {
                                return -1;
                            }
                            /* jshint eqeqeq: true */
                        };

                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].status === 3) {
                        resultArray.push(tasks[i]);
                    } else if (tasks[i].end_date === null || tasks[i].end_date === undefined) {
                        emptyDateArray.push(tasks[i]);//tasks without end_date
                    } else {
                        dateArray.push(tasks[i]);// tasks with end_date
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
                // normal?
                if (data && data.priority === 2) return $();
                var i = '<i class="icon-exclamation"/>',
                    indicator = $('<span>').append(_.noI18n('\u00A0'), i, i, i);
                if (data && data.priority === 3) {
                    return indicator.addClass('high').attr('title', gt('High priority'));
                } else {
                    return indicator.addClass('low').attr('title', gt('Low priority'));
                }
            }
        };

    return util;
});
