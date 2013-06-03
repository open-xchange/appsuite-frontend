/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/tasks/util',
    ['gettext!io.ox/tasks',
     'settings!io.ox/tasks',
     'io.ox/core/date'], function (gt, settings, date) {

    'use strict';

    var lookupArray = [60000 * 5,           //five minutes
                       60000 * 15,          //fifteen minutes
                       60000 * 30,          //thirty minutes
                       60000 * 60],         //one hour]

        lookupDaytimeStrings = [gt('this morning'),
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
            computePopupTime: function (time, value) {
                var endDate = new Date(time.getTime()),
                    weekDay = endDate.getDay(),
                    alarmDate = new Date(time.getTime());

                switch (value) {
                case '5':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[0]);
                    break;
                case '15':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[1]);
                    break;
                case '30':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[2]);
                    break;
                case '60':
                    alarmDate.setTime(alarmDate.getTime() + lookupArray[3]);
                    break;
                default:
                    alarmDate.setTime(prepareTime(alarmDate));
                    switch (value) {
                    case 'd0':
                        alarmDate.setHours(6);
                        break;
                    case 'd1':
                        alarmDate.setHours(12);
                        break;
                    case 'd2':
                        alarmDate.setHours(15);
                        break;
                    case 'd3':
                        alarmDate.setHours(18);
                        break;
                    case 'd4':
                        alarmDate.setHours(22);
                        break;
                    default:
                        alarmDate.setHours(6);
                        switch (value) {
                        case 't':
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24);
                            break;
                        case 'ww':
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * 7);
                            break;
                        case 'w0':
                            var day = alarmDate.getDay() % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w1':
                            var day = (((alarmDate.getDay() - 1) % 7) + 7) % 7;//workaround: javascript modulo operator to stupid to handle negative numbers
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w2':
                            var day = (((alarmDate.getDay() - 2) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w3':
                            var day = (((alarmDate.getDay() - 3) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w4':
                            var day = (((alarmDate.getDay() - 4) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w5':
                            var day = (((alarmDate.getDay() - 5) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case 'w6':
                            var day = (((alarmDate.getDay() - 6) % 7) + 7) % 7;
                            alarmDate.setTime(alarmDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        default:
                            //cannot identify selector...set time now
                            //maybe errormessage
                            alarmDate = new Date();
                            break;
                        }
                        break;
                    }
                    break;
                }

                endDate.setTime(prepareTime(endDate));
                endDate.setHours(6);
                if (weekDay < 1 || weekDay > 4) {
                    weekDay = (((endDate.getDay() - 1) % 7) + 7) % 7;
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - weekDay));
                } else {
                    weekDay = (((endDate.getDay() - 5) % 7) + 7) % 7;
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - weekDay));
                }

                if (alarmDate.getTime() > endDate.getTime()) {//endDate should not be before alarmDate
                    endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * 7);
                }
                var result = {
                        endDate: endDate,
                        alarmDate: alarmDate
                    };
                return result;
            },

            //selects the default reminder if its available, otherwise the next item
            selectDefaultReminder: function (node) {
                var interval = settings.get('interval', '5'),
                    options  = [];
                _(node.prop('options')).each(function (obj) {
                    options.push($(obj).val());
                });
                if (!(_.contains(options, interval))) {//default option not present
                    //check if its today or weekday
                    if (interval[0] === 'd') {
                        var found = false;
                        for (var i = parseInt(interval[1], 10) + 1; i < 5; i++) {
                            if (_.contains(options, 'd' + i)) {
                                found = true;
                                interval = 'd' + i;
                                break;
                            }
                        }

                        if (!found) {//too late for today. use tomorrow
                            interval = 't';
                        }
                    } else {//weekday not found. must be either tomorrow or today
                        var weekDay = new Date().getDay();
                        if (weekDay === parseInt(interval[1], 10)) {//its today, make it next week
                            interval = 'ww';
                        } else {//must be tomorrow
                            interval = 't';
                        }
                    }
                }
                node.val(interval);
            },

            //builds dropdownmenu nodes, if bootstrapDropdown is set listnodes are created else option nodes
            buildDropdownMenu: function (time, bootstrapDropdown) {
                if (!time) {
                    time = new Date();
                }

                //normal times
                var appendString = "<option value='5'>" + gt('in 5 minutes') + '</option>' +
                "<option value='15'>" + gt('in 15 minutes') + '</option>' +
                "<option value='30'>" + gt('in 30 minutes') + '</option>' +
                "<option value='60'>" + gt('in one hour') + '</option>';

                // variable daytimes
                var i = time.getHours(),
                    temp;

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
                    temp = lookupDaytimeStrings[i];
                    appendString = appendString + "<option value='d" + i + "'>" + temp + '</option>';
                    i++;
                }

                //weekdays
                var circleIncomplete = true,
                    startday = time.getDay();

                i = (time.getDay() + 2) % 7;

                appendString = appendString + "<option value='t'>" + gt('tomorrow') + '</option>';

                while (circleIncomplete) {
                    temp = lookupWeekdayStrings[i];
                    appendString = appendString + "<option value='w" + i + "'>" + temp + '</option>';
                    if (i < 6) {
                        i++;
                    } else {
                        i = 0;
                    }

                    if (i === startday) {
                        appendString = appendString + "<option value='ww'>" + gt('in one week') + '</option>';
                        circleIncomplete = false;
                    }
                }

                if (bootstrapDropdown) {
                    appendString = appendString.replace(/<option/g, '<li><a tabindex="1" role="menuitem" href="#"');
                    appendString = appendString.replace(/option>/g, 'a></li>');
                }

                return appendString;
            },

            //change status number to status text. format enddate to presentable string
            //if detail is set, alarm and startdate get converted too and status text is set for more states than overdue and success
            interpretTask: function (task, detail)
            {
                task = _.copy(task, true);
                if (task.status === 3) {
                    task.status = gt('Done');
                    task.badge = 'badge badge-success';

                } else {

                    var now = new Date();
                    if (task.end_date !== undefined && task.end_date !== null && now.getTime() > task.end_date) {//no state for task over time, so manual check is needed
                        task.status = gt('Over due');
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
                    task.end_date = new date.Local(task.end_date).format();
                } else {
                    task.end_date = '';
                }

                if (detail) {
                    if (task.start_date !== undefined && task.start_date !== null) {
                        task.start_date = new date.Local(task.start_date).format();
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

            sortTasks: function (tasks, order) {//done tasks last, overduetasks first, same date alphabetical
                tasks = _.copy(tasks, true);//make local copy
                if (!order) {
                    order = 'asc';
                }

                var resultArray = [],
                    alphabetArray = [];

                for (var i = 0; i < tasks.length; i++) {
                    if (tasks[i].status === 3) {
                        resultArray.push(tasks[i]);
                    } else {
                        alphabetArray.push(tasks[i]);
                    }
                }

                alphabetArray.sort(function (a, b) {
                        if (a.end_date > b.end_date || a.end_date === null) {
                            return 1;
                        } else if (a.end_date < b.end_date || b.end_date === null) {
                            return -1;
                        } else if (a.title > b.title) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });
                if (order === 'desc') {
                    resultArray.push(alphabetArray);
                } else {
                    resultArray.unshift(alphabetArray);
                }
                return _.flatten(resultArray);
            }

        };

    var prepareTime = function (time) {
        time.setMilliseconds(0);
        time.setSeconds(0);
        time.setMinutes(0);

        return time;
    };

    return util;
});
