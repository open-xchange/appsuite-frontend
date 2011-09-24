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

define("io.ox/calendar/base", [], function () {
    
    // week day
    var days = "So Mo Di Mi Do Fr Sa".split(' '),
        // shown as
        shownAs = " reserved temporary absent free".split(' '),
        // constants
        MINUTE = 60000,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        WEEK = 7 * DAY;
    
    var that = {
        
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
        
        getTime: function (timestamp) {
            var d = new Date(timestamp);
            return _.pad(d.getUTCHours(), 2) + ":" + _.pad(d.getUTCMinutes(), 2);
        },
        
        getDate: function (timestamp) {
            var d = new Date(timestamp);
            return days[d.getUTCDay()] + ", " + _.pad(d.getUTCDate(), 2) + "." + _.pad(d.getUTCMonth() + 1, 2) + "." + d.getUTCFullYear();
        },
        
        getDateInterval: function (data) {
            var length = (data.end_date - data.start_date) / DAY >> 0;
            if (data.full_time && length > 1) {
                // \u2013= &ndash;
                return this.getDate(data.start_date) + " \u2013 " + this.getDate(data.end_date - 1);
            } else {
                return this.getDate(data.start_date);
            }
        },
        
        getTimeInterval: function (data) {
            var length;
            if (data.full_time) {
                length = (data.end_date - data.start_date) / DAY >> 0;
                return length <= 1 ? "Whole day" : length + " days";
            } else {
                return this.getTime(data.start_date) + " \u2013 " + this.getTime(data.end_date);
            }
        },
        
        getShownAs: function (data) {
            return shownAs[data.shown_as || 0];
        },
        
        draw: function (data) {
            
            if (!data) {
                return $();
            }
            
            var list = data.participants, $i = list.length,
                participants = $i > 1 ? $("<div>").addClass("participants") : $(),
                note = data.note ?
                    $("<div>")
                        .append($("<div>").addClass("label").text("Comments"))
                        .append($("<div>").addClass("note").text(data.note)) :
                    $();
            
            var node = $("<div>")
                .addClass("calendar-detail")
                .append(
                    $("<div>").addClass("date")
                        .append(
                            $("<div>").addClass("day").text(this.getDateInterval(data))
                        )
                        .append(
                            $("<div>").addClass("interval").text(this.getTimeInterval(data))
                        )
                )
                .append(
                    $("<div>").addClass("title").text(data.title || "")
                )
                .append(
                    $("<div>").addClass("location").text(data.location || "\u00a0")
                )
                .append(note)
                .append(participants);
            
            // has participants?
            if ($i > 1) {
                participants.busy();
                // get user & resource APIs
                require(["io.ox/core/api/user", "io.ox/core/api/resource"], function (user, resource) {
                    // get internal users
                    var users = _(list)
                        .chain()
                        .select(function (obj) {
                            return obj.type === 1;
                        })
                        .map(function (obj) {
                            return obj.id;
                        })
                        .value();
                    // get resources
                    var resources = _(list)
                        .chain()
                        .select(function (obj) {
                            return obj.type === 3;
                        })
                        .map(function (obj) {
                            return obj.id;
                        })
                        .value();
                    // get external participants
                    var external = _(list)
                        .chain()
                        .select(function (obj) {
                            return obj.type === 5;
                        })
                        .map(function (obj) {
                            return obj.mail; // not id!
                        })
                        .value()
                        .sort();
                    
                    var plist = $("<div>").addClass("participant-list");
                    
                    $.when(
                        user.getList(users).done(function (data) {
                            // loop over internal users
                            _(data)
                                .chain()
                                .sortBy(function (obj) {
                                    return obj.display_name;
                                })
                                .each(function (obj) {
                                    plist.append(
                                       $("<div>").addClass("participant person").text(obj.display_name || "---")
                                    );
                                });
                            // loop over external participants
                            _(external).each(function (obj) {
                                plist.append(
                                   $("<div>").addClass("participant person").text(String(obj).toLowerCase())
                                );
                            });
                        }),
                        resource.getList(resources).done(function (data) {
                            // loop over internal users
                            _(data)
                                .chain()
                                .sortBy(function (obj) {
                                    return obj.display_name;
                                })
                                .each(function (obj) {
                                    plist.append(
                                       $("<div>").addClass("participant person").text(obj.display_name || "---")
                                    );
                                });
                            // loop over external participants
                            _(external).each(function (obj) {
                                plist.append(
                                   $("<div>").addClass("participant person").text(String(obj).toLowerCase())
                                );
                            });
                        })
                    )
                    .always(function () {
                        participants.idle()
                            .append($("<div>").addClass("label").text("Participants"))
                            .append(plist)
                            .append($("<div>").addClass("participants-clear"));
                    });
                });
            }
            
            return node;
        }
    };
    
    return that;
});