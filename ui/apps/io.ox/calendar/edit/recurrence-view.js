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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/calendar/edit/recurrence-view", function () {
    "use strict";
    // Alright, this stuff is complicated, so first
    // let's model our problem domain a bit,
    // and then figure out how to present the
    // options
    
    // First, some constants
    // A series is of a certain recurrence type
    // daily, weekly, monhtly, yearly, no_recurrence
    var RECURRENCE_TYPES = {
        NO_RECURRENCE: 0,
        DAILY: 1,
        WEEKLY: 2,
        MONTHLY: 3,
        YEARLY: 4
    };
    
    // Sometimes we need to reference a certain day, so
    // here are the weekdays, bitmap-style
    
    var DAYS = {
        SUNDAY: 1,
        MONDAY: 2,
        TUESDAY: 4,
        WEDNESDAY: 8,
        THURSDAY: 16,
        FRIDAY: 32,
        SATURDAY: 64
    };
    // Usage: DAYS.pack('monday', 'wednesday', 'friday') -> some bitmask
    DAYS.pack = function () {
        var result = 0;
        _(arguments).each(function (day) {
            var dayConst = DAYS[day.toUpperCase()];
            
            if (_.isUndefined(dayConst)) {
                throw "Invalid day: " + day;
            }
            result = result | dayConst;
        });
        return result;
    };
    
    // Usage: DAYS.unpack(bitmask) -> ['monday', 'wednesday', 'friday']}
    DAYS.unpack = function (bitmask) {
        var days = [];
        _(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).each(function (day) {
            var dayConst = DAYS[day];
            if (bitmask & dayConst) {
                days.push(day.toLowerCase());
            }
        });
        
        return days;
    };
    
    
    ////
    
    var recurrences = {
        
    };
    
    
    var RecurrenceView = function (options) {
        
        _.extend(this, {
            
        }, options);
        
    };
    
    
    return RecurrenceView;
});