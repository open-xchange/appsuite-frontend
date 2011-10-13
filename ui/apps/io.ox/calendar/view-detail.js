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

define("io.ox/calendar/view-detail",
    ["io.ox/core/extensions", "io.ox/calendar/util", "io.ox/core/gettext",
     "io.ox/core/api/user", "io.ox/core/api/group", "io.ox/core/api/resource"
    ], function (ext, util, gettext, userAPI, groupAPI, resourceAPI) {
    
    "use strict";
    
    var fnClickPerson = function (e) {
        ext.point("io.ox/core/person:action").each(function (ext) {
            _.call(ext.action, e.data);
        });
    };

    // draw via extension points
    
    // draw appointment date & time
    ext.point("io.ox/calendar/detail").extend({
        index: 100,
        id: "date",
        draw: function (data) {
            var node = $("<div>").addClass("date").appendTo(this);
            ext.point("io.ox/calendar/detail/date").invoke("draw", node, data);
        }
    });
    
    // draw appointment time
    ext.point("io.ox/calendar/detail/date").extend({
        index: 100,
        id: "time",
        draw: function (data) {
            this.append(
                $("<div>").addClass("interval").text(util.getTimeInterval(data))
            );
        }
    });
    
    // draw date and series information
    ext.point("io.ox/calendar/detail/date").extend({
        index: 200,
        id: "date",
        draw: function (data) {
            var seriesString = util.getSeriesString(data);
            this.append(
                $("<div>").addClass("day").text(
                    util.getDateInterval(data) +
                    (seriesString !== "" ? " \u2013 " + seriesString : "")
                )
            );
        }
    });
    
    // draw title
    ext.point("io.ox/calendar/detail").extend({
        index: 200,
        id: "title",
        draw: function (data) {
            this.append(
                $("<div>").addClass("title clear-title").text(data.title || "")
            );
        }
    });
    
    // draw location
    ext.point("io.ox/calendar/detail").extend({
        index: 300,
        id: "location",
        draw: function (data) {
            this.append(
                $("<div>").addClass("location").text(data.location || "\u00a0")
            );
        }
    });
    
    // draw note/comment
    ext.point("io.ox/calendar/detail").extend({
        index: 400,
        id: "note",
        draw: function (data) {
            if (data.note) {
                this.append(
                    $("<div>").addClass("note").html(util.getNote(data))
                );
            }
        }
    });
    
    // draw participants
    
    function drawParticipant(obj, hash) {
        // initialize vars
        var key = obj.mail || obj.id,
            conf = hash[key] || { status: 0, comment: "" },
            confirm = util.getConfirmationSymbol(conf.status),
            statusClass = util.getConfirmationClass(conf.status),
            isPerson = hash[key] || obj.folder_id,
            personClass = isPerson ? "person" : "",
            name, node, name_lc,
            mail_lc = String(obj.mail).toLowerCase();
        // external participant?
        if (obj.type === 5) {
            // beautify
            name_lc = String(obj.display_name).toLowerCase();
            if (name_lc === mail_lc) {
                name = mail_lc;
            } else {
                name = obj.display_name ? obj.display_name + " <" + mail_lc + ">" : mail_lc;
            }
        } else {
            name = obj.display_name || String(obj.mail).toLowerCase();
        }
        node = $("<div>").addClass("participant")
            .append($("<span>").addClass(personClass).text(name))
            .append($("<span>").addClass("status " + statusClass).text(" " + confirm))
            .bind("click", { display_name: name, email1: mail_lc }, fnClickPerson);
        // has confirmation comment?
        if (conf.comment !== "") {
            node.append($("<span>").addClass("comment").text(conf.comment));
        }
        return node;
    }
    
    ext.point("io.ox/calendar/detail").extend({
        index: 500,
        id: "participants",
        draw: function (data) {
            
            var list = data.participants, $i = list.length,
                participants = $i > 1 ? $("<div>").addClass("participants") : $(),
                confirmations = {};
            
            // has more than one participant?
            if ($i > 1) {
                
                confirmations = util.getConfirmations(data);
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
                            var glist, memberList;
                            // resolve group members (remove internal users first)
                            memberList = _(obj.members).difference(users);
                            if (memberList.length) {
                                // new section
                                participants
                                    .append($("<div>").addClass("group").text(obj.display_name + ":"))
                                    .append(glist = $("<div>").addClass("participant-list"));
                                userAPI.getList(memberList)
                                    .done(function (members) {
                                        // loop members
                                        _(members)
                                            .chain()
                                            .sortBy(function (obj) {
                                                return obj.display_name;
                                            })
                                            .each(function (obj) {
                                                glist.append(drawParticipant(obj, confirmations));
                                            });
                                    });
                            }
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
            
            this.append(participants);
        }
    });
    
    // draw details
    ext.point("io.ox/calendar/detail").extend({
        index: 600,
        id: "details",
        draw: function (data) {
            var node = $("<div>")
                .append($("<div>").addClass("label").text("Details"))
                .appendTo(this);
            ext.point("io.ox/calendar/detail/details").invoke("draw", node, data);
        }
    });
    
    // show as
    ext.point("io.ox/calendar/detail/details").extend({
        index: 100,
        id: "shownAs",
        draw: function (data) {
            this.append(
                $("<span>")
                    .addClass("detail-label")
                    .text("Show as" + ":\u00a0")
            )
            .append(
                $("<span>")
                    .addClass("detail shown_as " + util.getShownAsClass(data))
                    .text("\u00a0")
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .text(" " + util.getShownAs(data))
            )
            .append($("<br>"));
        }
    });
    
    // folder
    ext.point("io.ox/calendar/detail/details").extend({
        index: 200,
        id: "folder",
        draw: function (data) {
            this.append(
                $("<span>")
                    .addClass("detail-label")
                    .text("Folder" + ":\u00a0")
            )
            .append(
                 $("<span>").addClass("detail").text(data.folder_id)
            )
            .append($("<br>"));
        }
    });
    
    // created on/by
    ext.point("io.ox/calendar/detail/details").extend({
        index: 200,
        id: "created",
        draw: function (data) {
            this.append(
                $("<span>")
                    .addClass("detail-label")
                    .text("Created" + ":\u00a0")
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text(util.getDate(data.creation_date)))
                    .append($("<span>").text(" \u2013 "))
                    .append($("<span>").append(userAPI.getTextNode(data.created_by)))
             )
             .append($("<br>"));
        }
    });
    
    // modified on/by
    ext.point("io.ox/calendar/detail/details").extend({
        index: 200,
        id: "modified",
        draw: function (data) {
            this.append(
                $("<span>")
                    .addClass("detail-label")
                    .text("Modified" + ":\u00a0")
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text(util.getDate(data.last_modified)))
                    .append($("<span>").text(" \u2013 "))
                    .append($("<span>").append(userAPI.getTextNode(data.modified_by)))
             )
             .append($("<br>"));
        }
    });
    
    return {
        
        draw: function (data) {
            
            var node;
            
            if (!data) {
                node = $();
            } else {
                node = $("<div>").addClass("calendar-detail");
                ext.point("io.ox/calendar/detail").invoke("draw", node, data);
            }
            
            return node;
        }
    };
});