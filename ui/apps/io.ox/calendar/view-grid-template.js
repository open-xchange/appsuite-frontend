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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/calendar/view-grid-template",
    ["io.ox/calendar/util", "css!io.ox/calendar/style.css"], function (util) {
    
    "use strict";
    
    return {
        
        main: {
            build: function () {
                var title, location, time, date, shown_as;
                this.addClass("calendar")
                    .append(time = $("<div>").addClass("time"))
                    .append(date = $("<div>").addClass("date"))
                    .append(title = $("<div>").addClass("title"))
                    .append(location = $("<div>").addClass("location"))
                    .append(shown_as = $("<div/>").addClass("abs shown_as"));
                return { title: title, location: location, time: time, date: date, shown_as: shown_as };
            },
            set: function (data, fields, index) {
                fields.title.text(data.title);
                fields.location.text(data.location);
                fields.time.text(util.getTimeInterval(data));
                fields.date.text(util.getDateInterval(data));
                fields.shown_as.get(0).className = "abs shown_as " + util.getShownAsClass(data);
            }
        },
        
        label: {
            build: function () {
                this.addClass("calendar-label");
            },
            set: function (data, fields, index) {
                var d = util.getSmartDate(data.start_date);
                this.text(d);
            }
        },
        
        requiresLabel: function (i, data, current) {
            var d = util.getSmartDate(data.start_date);
            return (i === 0 || d !== current) ? d : false;
        }
    };
});