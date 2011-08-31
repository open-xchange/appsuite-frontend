/**
 * 
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com 
 * 
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * 
 */

define("io.ox/calendar/api", ["io.ox/core/http"], function (http) {
    
    var MINUTE = 60000,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        WEEK = 7 * DAY;
    
    // really stupid caching for dev speed
    var cache = {};
    
    return {
        
        MINUTE: MINUTE,
        
        HOUR: HOUR,
        
        DAY: DAY,
        
        WEEK: WEEK,
        
        floor: function (timestamp, step) {
            // set defaults
            timestamp = timestamp || 0;
            step = step || HOUR;
            // number?
            if (typeof step === "number") {
                return Math.floor(timestamp / step) * step;
            } else {
                if (step === "week") {
                    // get current date
                    var d = new Date(timestamp);
                    // get work day
                    var day = (d.getDay() + 6) % 7; // starts on Monday
                    // subtract
                    var t = d.getTime() - day * DAY;
                    // round down to day and return
                    return this.floor(t, DAY);
                }
            }
        },
        
        list: function (folderId, start, end) {
            
            // default: 0 = all
            folderId = folderId || 0;
            // round start & end
            start = (start / DAY >> 0) * DAY;
            end = (end / DAY >> 0) * DAY;
            
            var key = folderId + "." + start + "." + end;
            
            if (cache[key] === undefined) {
                return http.GET({
                    module: "calendar",
                    appendColumns: true,
                    params: {
                        action: "all",
                        folder: folderId || 0,
                        start: start || _.now(),
                        end: end || (_.now() + DAY)
                    }
                })
                .done(function (data) {
                    cache[key] = data;
                });
            } else {
                return $.Deferred().resolve(cache[key]);
            }
        }
    };
});