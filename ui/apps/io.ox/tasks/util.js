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
define("io.ox/tasks/util", ['gettext!io.ox/tasks/util',
                            "io.ox/core/date"], function (gt, date) {
    
    "use strict";
    
    var lookupArray = [60000 * 5,           //five minutes
                       60000 * 15,          //fifteen minutes
                       60000 * 30,          //thirty minutes
                       60000 * 60],         //one hour]
                       
        lookupDaytimeStrings = ["this morning",
                                "by noon",
                                "this afternoon",
                                "tonight",
                                "late in the evening"],
                                
        lookupWeekdayStrings = ["on Sunday",
                                 "on Monday",
                                 "on Tuesday",
                                 "on Wednesday",
                                 "on Thursday",
                                 "on Friday",
                                 "on Saturday"];
    
    var util = {
            computePopupTime: function (time, finderId)
            {
                var endDate = time;
                var offset = endDate.getTimezoneOffset() * -1 * 60000;
                
                switch (finderId)
                {
                case "0":
                case "1":
                case "2":
                case "3":
                    endDate.setTime(endDate.getTime() + lookupArray[finderId]);
                    break;
                default:
                    endDate.setTime(prepareTime(endDate));
                    switch (finderId)
                    {
                    case "d0":
                        endDate.setHours(6);
                        break;
                    case "d1":
                        endDate.setHours(12);
                        break;
                    case "d2":
                        endDate.setHours(15);
                        break;
                    case "d3":
                        endDate.setHours(18);
                        break;
                    case "d4":
                        endDate.setHours(22);
                        break;
                    default:
                        endDate.setHours(6);
                        switch (finderId)
                        {
                        case "t":
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24);
                            break;
                        case "ww":
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * 7);
                            break;
                        case "w0":
                            var day = endDate.getDay() % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w1":
                            var day = (((endDate.getDay() - 1) % 7) + 7) % 7;//workaround: javascript modulo operator to stupid to handle negative numbers
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w2":
                            var day = (((endDate.getDay() - 2) % 7) + 7) % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w3":
                            var day = (((endDate.getDay() - 3) % 7) + 7) % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w4":
                            var day = (((endDate.getDay() - 4) % 7) + 7) % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w5":
                            var day = (((endDate.getDay() - 5) % 7) + 7) % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        case "w6":
                            var day = (((endDate.getDay() - 6) % 7) + 7) % 7;
                            endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                            break;
                        default:
                            //cannot identify selector...set time now
                            //maybe errormessage
                            endDate = new Date();
                            break;
                        }
                        break;
                    }
                    break;
                }
                
                endDate.setTime(endDate.getTime() + offset);
                
                return endDate;
            },
    
            buildDropdownMenu: function (time)
            {
                //normal times
                var appendString = "<option finderId='0'>" + gt('in 5 minutes') + "</option>" +
                "<option finderId='1'>" + gt('in 15 minutes') + "</option>" +
                "<option finderId='2'>" + gt('in 30 minutes') + "</option>" +
                "<option finderId='3'>" + gt('in one hour') + "</option>";
                
                // variable daytimes
                var i = time.getHours();
                
                if (i < 6)
                    {i = 0;
                } else if (i < 12)
                    {i = 1;
                } else if (i < 15)
                    {i = 2;
                } else if (i < 18)
                    {i = 3;
                } else if (i < 22)
                    {i = 4;
                }
                
                var temp;
                while (i < lookupDaytimeStrings.length)
                    {
                    temp = lookupDaytimeStrings[i];
                    appendString = appendString + "<option finderId='d" + i + "'>" + gt(temp) + "</option>";
                    i++;
                }
                
                //weekdays
                var circleIncomplete = true;
                i = (time.getDay() + 2) % 7;
                var startday = time.getDay();
                
                appendString = appendString + "<option finderId='t'>" + gt("tomorrow") + "</option>";
                
                while (circleIncomplete)
                    {
                    temp = lookupWeekdayStrings[i];
                    appendString = appendString + "<option finderId='w" + i + "'>" + gt(temp) + "</option>";
                    if (i < 6)
                        {i++;
                    } else
                        {
                        i = 0;
                    }
                    
                    if (i === startday)
                        {
                        appendString = appendString + "<option finderId='ww'>" + gt("in one week") + "</option>";
                        circleIncomplete = false;
                    }
                }
                
                return appendString;
            },
            
            //change status number to status text. format enddate to presentable string
            interpretTask: function (task)
            {

                switch (task.status)
                {
                case 2:
                    task.status = gt("In progress");
                    task.badge = "badge badge-warning";
                    break;
                case 3:
                    task.status = gt("Done");
                    task.badge = "badge badge-success";
                    break;
                case 4:
                    task.status = gt("Waiting");
                    task.badge = "badge";
                    break;
                case 5:
                    task.status = gt("Deferred");
                    task.badge = "badge badge-info";
                    break;
                default:
                    task.status = gt("Not started");
                    task.badge = "badge";
                    break;
                }
                var now = new Date();
                if (now.getTime() > task.end_date)//no state for task over time, so manual check is needed
                    {
                    task.badge = "badge badge-important";
                }
                
                if (task.title === null)
                {
                    task.title = gt("No title");
                }
                
                if (task.note === null)
                {
                    task.note = gt("No note");
                }
                if (task.end_date !== null)
                    {
                    task.end_date = new date.Local(task.end_date).format();
                } else
                    {
                    task.end_date = gt("No date");
                }
                
                return task;
            }
            
            
        };
        
    var prepareTime = function (time)
    {
        time.setMilliseconds(0);
        time.setSeconds(0);
        time.setMinutes(0);
            
        return time;
    };
        
    return util;
});