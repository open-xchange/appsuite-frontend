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

define("io.ox/calendar/base",
    ["io.ox/core/gettext", "io.ox/core/api/user", "io.ox/core/api/group",
     "io.ox/core/api/resource"], function (gettext, userAPI, groupAPI, resourceAPI) {
    
    // week day names
    var n_day = "So Mo Di Mi Do Fr Sa".split(' '),
        // month names
        n_month = [gettext("January"), gettext("February"), gettext("March"),
                   gettext("April"), gettext("May"), gettext("June"),
                   gettext("July"), gettext("August"), gettext("September"),
                   gettext("October"), gettext("November"), gettext("December")
                  ],
        // day names
        n_count = [gettext("last"), "", gettext("first"), gettext("second"),
                   gettext("third"), gettext("fourth"), gettext("last")
                   ],
        // shown as
        n_shownAs = [gettext("Reserved"), gettext("Temporary"),
                     gettext("Absent"), gettext("Free")
                     ],
        shownAsClass = "reserved temporary absent free".split(' '),
        // confirmation status (none, accepted, declined, tentative)
        n_confirm = ["", "\u2713", "x", "?"],
        confirmClass = ["", "accepted", "declined", "tentative"],
        // constants
        MINUTE = 60000,
        HOUR = 60 * MINUTE,
        DAY = 24 * HOUR,
        WEEK = 7 * DAY,
        // day bitmask
        SUNDAY = 1,
        MONDAY = 2,
        THUESDAY = 4,
        WEDNESDAY = 8,
        THURSDAY = 16,
        FRIDAY = 32,
        SATURDAY = 64;
    
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
            return n_day[d.getUTCDay()] + ", " + _.pad(d.getUTCDate(), 2) + "." + _.pad(d.getUTCMonth() + 1, 2) + "." + d.getUTCFullYear();
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
        
        getShownAsClass: function (data) {
            return shownAsClass[(data.shown_as || 1) - 1];
        },
        
        getShownAs: function (data) {
            return n_shownAs[(data.shown_as || 1) - 1];
        },
        
        isSeries: function (data) {
            return !!data.recurrence_type;
        },
        
        getSeriesString: function (data) {
            
            function getCountString(i) {
                return n_count[i + 1];
            }
            
            function getDayString(i) {
                var tmp = [];
                switch (i) {
                case 62:
                    tmp.push(gettext("Work Day"));
                    break;
                case 65:
                    tmp.push(gettext("Weekend Day"));
                    break;
                case 127:
                    tmp.push(gettext("Day"));
                    break;
                default:
                    if ((i % MONDAY) / SUNDAY >= 1) {
                        tmp.push(gettext("Sunday"));
                    }
                    if ((i % THUESDAY) / MONDAY >= 1) {
                        tmp.push(gettext("Monday"));
                    }
                    if ((i % WEDNESDAY) / THUESDAY >= 1) {
                        tmp.push(gettext("Tuesday"));
                    }
                    if ((i % THURSDAY) / WEDNESDAY >= 1) {
                        tmp.push(gettext("Wednesday"));
                    }
                    if ((i % FRIDAY) / THURSDAY >= 1) {
                        tmp.push(gettext("Thursday"));
                    }
                    if ((i % SATURDAY) / FRIDAY >= 1) {
                        tmp.push(gettext("Friday"));
                    }
                    if (i / SATURDAY >= 1) {
                        tmp.push(gettext("Saturday"));
                    }
                }
                return tmp.join(", ");
            }
            
            function getMonthString(i) {
                return n_month[i];
            }
            
            var str = "", f = _.printf,
                interval = data.interval, days = data.days, month = data.month,
                day_in_month = data.day_in_month;
            
            switch (data.recurrence_type) {
            case 1:
                str = f(gettext("Each %s Day"), interval);
                break;
            case 2:
                str = interval === 1 ?
                    f(gettext("Weekly on %s"), getDayString(days)) :
                    f(gettext("Each %s weeks on %s"), interval, getDayString(days));
                break;
            case 3:
                if (days === null) {
                    str = f(gettext("On %s. day every %s. month"), day_in_month, data.interval);
                } else {
                    str = f(gettext("On %s %s each %s. months"), getCountString(day_in_month), getDayString(days), interval);
                }
                break;
            case 4:
                if (days === null) {
                    str = f(gettext("Each %s. %s"), day_in_month, getMonthString(month));
                } else {
                    str = f(gettext("On %s %s in %s"), getCountString(day_in_month), getDayString(days), getMonthString(month));
                }
                break;
            }
            
            return str;
        },
        
        getNote: function (data) {
            return $.trim(data.note || "")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/</g, "&lt;")
                .replace(/(https?\:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
        },
        
        getConfirmations: function (data) {
            var hash = {};
            // internal users
            _(data.users).each(function (obj) {
                hash[String(obj.id)] = {
                    status: obj.confirmation || 0,
                    comment: obj.confirmmessage || ""
                };
            });
            // external users
            _(data.confirmations).each(function (obj) {
                hash[obj.mail] = {
                    status: obj.status || 0,
                    comment: obj.confirmmessage || ""
                };
            });
            return hash;
        },
        
        draw: function (data) {
            
            if (!data) {
                return $();
            }
            
            var list = data.participants, $i = list.length,
                participants = $i > 1 ? $("<div>").addClass("participants") : $(),
                confirmations = {},
                note = data.note ?
                    $("<div>")
                        .append($("<div>").addClass("note").html(this.getNote(data))) :
                    $(),
                seriesString = this.getSeriesString(data);
            
            var node = $("<div>")
                .addClass("calendar-detail")
                .append(
                    $("<div>").addClass("date")
                        .append(
                            $("<div>").addClass("interval").text(this.getTimeInterval(data))
                        )
                        .append(
                            $("<div>").addClass("day").text(
                                this.getDateInterval(data) +
                                (seriesString !== "" ? " \u2013 " + seriesString : "")
                            )
                        )
                )
                .append(
                    $("<div>").addClass("title").text(data.title || "")
                )
                .append(
                    $("<div>").addClass("location").text(data.location || "\u00a0")
                )
                .append(note)
                .append(participants)
                .append($("<div>").addClass("label").text("Details"));
            
            // show as
            node.append(
                    $("<span>")
                        .addClass("detail-label")
                        .text("Show as" + ":\u00a0")
                )
                .append(
                    $("<span>")
                        .addClass("detail shown_as " + this.getShownAsClass(data))
                        .text("\u00a0")
                )
                .append(
                    $("<span>")
                        .addClass("detail")
                        .text(" " + this.getShownAs(data))
                )
                .append($("<br>"))
            // folder
                .append(
                    $("<span>").addClass("detail-label").text("Folder" + ":\u00a0")
                )
                .append(
                    $("<span>").addClass("detail").text(data.folder_id)
                )
                .append($("<br>"))
            // created
                .append(
                    $("<span>")
                        .addClass("detail-label")
                        .text("Created" + ":\u00a0")
                )
                .append(
                    $("<span>")
                        .addClass("detail")
                        .append($("<span>").text(this.getDate(data.creation_date)))
                        .append($("<span>").text(" \u2013 "))
                        .append($("<span>").append(userAPI.getTextNode(data.created_by)))
                )
                .append($("<br>"))
            // modified by
                .append(
                    $("<span>")
                        .addClass("detail-label")
                        .text("Modified" + ":\u00a0")
                )
                .append(
                    $("<span>")
                        .addClass("detail")
                        .append($("<span>").text(this.getDate(data.last_modified)))
                        .append($("<span>").text(" \u2013 "))
                        .append($("<span>").append(userAPI.getTextNode(data.modified_by)))
                )
                .append($("<br>"));
            
            function drawParticipant(obj, hash) {
                var key = obj.mail || obj.id, conf = hash[key] || { status: 1, comment: "" },
                    confirm = n_confirm[conf.status || 0],
                    statusClass = confirmClass[conf.status || 0],
                    personClass = hash[key] ? "person" : "",
                    name = obj.display_name || String(obj.mail).toLowerCase(),
                    node;
                node = $("<div>").addClass("participant")
                    .append($("<span>").addClass(personClass).text(name))
                    .append($("<span>").addClass("status " + statusClass).text(" " + confirm));
                if (conf.comment !== "") {
                    node.append($("<span>").addClass("comment").text(conf.comment));
                }
                return node;
            }
            
            // has participants?
            if ($i > 1) {
                
                confirmations = this.getConfirmations(data);
                participants.busy();
                
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
                // get user groups
                var groups = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 2;
                    })
                    .map(function (obj) {
                        return { id: obj.id };
                    })
                    .value();
                // get resources
                var resources = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 3;
                    })
                    .map(function (obj) {
                        return { id: obj.id };
                    })
                    .value();
                // get external participants
                var external = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 5;
                    })
                    .sortBy(function (obj) {
                        return obj.mail;
                    })
                    .value();
                
                
                participants.append($("<div>")
                        .addClass("label").text("Participants"));
                    
                var plist = $("<div>").addClass("participant-list").appendTo(participants);
                
                $.when(userAPI.getList(users), groupAPI.getList(groups), resourceAPI.getList(resources))
                .done(function (userList, groupList, resourceList) {
                    // loop over internal users
                    _(userList)
                        .chain()
                        .sortBy(function (obj) {
                            return obj.display_name;
                        })
                        .each(function (obj) {
                            plist.append(drawParticipant(obj, confirmations));
                        });
                    // loop over external participants
                    _(external).each(function (obj) {
                        plist.append(drawParticipant(obj, confirmations));
                    });
                    // loop over groups
                    _(groupList)
                        .chain()
                        .sortBy(function (obj) {
                            return obj.display_name;
                        })
                        .each(function (obj) {
                            // new section
                            var glist;
                            participants
                                .append($("<div>").addClass("group").text(obj.display_name + ":"))
                                .append(glist = $("<div>").addClass("participant-list"));
                            // resolve group members
                            userAPI.getList(obj.members)
                                .done(function (members) {
                                    // sort members
                                    _(members)
                                        .chain()
                                        .sortBy(function (obj) {
                                            return obj.display_name;
                                        })
                                        .each(function (obj) {
                                            glist.append(drawParticipant(obj, confirmations));
                                        });
                                });
                        });
                    // resources
                    if (resourceList.length) {
                        participants
                            .append($("<div>").addClass("label").text("Resources"))
                            .append(plist = $("<div>").addClass("participant-list"));
                        // loop over resources
                        _(resourceList)
                            .chain()
                            .sortBy(function (obj) {
                                return obj.display_name;
                            })
                            .each(function (obj) {
                                plist.append(drawParticipant(obj, confirmations));
                            });
                    }
                })
                .always(function () {
                    // finish
                    participants.idle()
                        .append($("<div>").addClass("participants-clear"));
                });
            }
            
            return node;
        }
    };
    
    return that;
});