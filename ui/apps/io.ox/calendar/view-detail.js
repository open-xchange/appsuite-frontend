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
    ["io.ox/core/extensions",
     "io.ox/calendar/util",
     "io.ox/core/api/user",
     "io.ox/core/api/group",
     "io.ox/core/api/resource",
     "io.ox/core/api/folder",
     "io.ox/core/tk/attachments",
     "io.ox/core/extPatterns/links",
     "gettext!io.ox/calendar",
     "less!io.ox/calendar/style.css"
    ], function (ext, util, userAPI, groupAPI, resourceAPI, folderAPI, attachments, links, gt) {

    "use strict";

    var fnClickPerson = function (e) {
        e.preventDefault();
        ext.point("io.ox/core/person:action").each(function (ext) {
            _.call(ext.action, e.data, e);
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
                util.addTimezoneLabel($("<div>").addClass("interval"), data)
            );
        }
    });

    // draw date and recurrence information
    ext.point("io.ox/calendar/detail/date").extend({
        index: 200,
        id: "date",
        draw: function (data) {
            var recurrenceString = util.getRecurrenceString(data);
            this.append(
                $("<div>").addClass("day").append(
                    $.txt(gt.noI18n(util.getDateInterval(data))),
                    $.txt(gt.noI18n((recurrenceString !== "" ? " \u2013 " + recurrenceString : "")))
                )
            );
        }
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 350,
        id: 'inline-actions',
        draw: function (data) {
            ext.point('io.ox/calendar/detail/actions').invoke('draw', this, data);
        }
    });

    // draw title
    ext.point("io.ox/calendar/detail").extend({
        index: 200,
        id: "title",
        draw: function (data) {
            this.append(
                $("<div>").addClass("title clear-title").text(gt.noI18n(data.title || ""))
            );
        }
    });

    // draw location
    ext.point("io.ox/calendar/detail").extend({
        index: 300,
        id: "location",
        draw: function (data) {
            this.append(
                $("<div>").addClass("location").text(gt.noI18n(data.location || "\u00A0"))
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
            display_name, name, node, name_lc,
            mail_lc = String(obj.mail).toLowerCase();
        // external participant?
        if (obj.type === 5) {
            // beautify
            name_lc = String(obj.display_name).toLowerCase();
            if (name_lc === mail_lc) {
                name = display_name = mail_lc;
            } else {
                name = obj.display_name ? obj.display_name + " <" + mail_lc + ">" : mail_lc;
                display_name = obj.display_name || mail_lc;
            }
        } else {
            name = display_name = obj.display_name || String(obj.mail).toLowerCase();
        }
        node = $("<div>").addClass("participant")
            .append($('<a href="#">').addClass(personClass + ' ' + statusClass).text(gt.noI18n(name)))
            .append($("<span>").addClass("status " + statusClass).html(" " + confirm))
            .on("click", {
                display_name: display_name,
                email1: mail_lc,
                internal_userid: obj.internal_userid
            }, fnClickPerson);
        // has confirmation comment?
        if (conf.comment !== "") {
            node.append($("<span>").addClass("comment").text(gt.noI18n(conf.comment)));
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
                        .addClass("io-ox-label participants-block").text(gt("Participants")));

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
                                    .append($("<div>").addClass("group").text(gt.noI18n(obj.display_name + ":")))
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
                            .append($("<div>").addClass("io-ox-label").text(gt("Resources")))
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


    ext.point('io.ox/calendar/detail').extend({
        index: 550,
        id: 'inline-actions-participantrelated',
        draw: function (data) {
            if (data.participants.length > 1) {
                ext.point('io.ox/calendar/detail/actions-participantrelated').invoke('draw', this, data);
            }

        }
    });

    // draw details
    ext.point("io.ox/calendar/detail").extend({
        index: 600,
        id: "details",
        draw: function (data) {
            var node = $("<div>").addClass('details')
                .append($("<div>").addClass("io-ox-label").text(gt("Details")))
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
                    .append($.txt(gt("Show as")), $.txt(gt.noI18n(":\u00A0")))
            )
            .append(
                $("<span>")
                    .addClass("detail shown_as " + util.getShownAsClass(data))
                    .text("\u00A0")
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($.txt(gt.noI18n(" ")), $.txt(gt.noI18n(util.getShownAs(data))))
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
                    .append($.txt(gt("Folder")), $.txt(gt.noI18n(":\u00A0"))),
                $("<span>")
                    .addClass("detail")
                    .text(gt.noI18n(folderAPI.getTextNode(data.folder_id).data)),
                $("<br>")
            );
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
                    .append($.txt(gt("Created")), $.txt(gt.noI18n(":\u00A0")))
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text(gt.noI18n(util.getDate(data.creation_date))))
                    .append($("<span>").text(gt.noI18n(" \u2013 ")))
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
                    .append($.txt(gt("Modified")), $.txt(gt.noI18n(":\u00A0")))
            )
            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text(gt.noI18n(util.getDate(data.last_modified))))
                    .append($("<span>").text(gt.noI18n(" \u2013 ")))
                    .append($("<span>").append(userAPI.getTextNode(data.modified_by)))
             )
             .append($("<br>"));
        }
    });

    ext.point("io.ox/calendar/detail").extend({
        id: 'attachments',
        index: 700,
        draw: function (data) {
            var $node = $('<div>').appendTo(this).append($("<div>").addClass("io-ox-label").text(gt("Attachments")));
            ext.point("io.ox/calendar/detail/attachments").invoke('draw', $node, new ext.Baton({data: data}));
        }
    });

    ext.point("io.ox/calendar/detail/attachments").extend(new attachments.AttachmentList({
        id: 'attachment-list',
        index: 200,
        module: 1
    }));

    return {

        draw: function (data) {

            var node;

            if (!data) {
                node = $();
            } else {
                node = $("<div>").addClass("calendar-detail");
                node.attr('data-cid', String(_.cid(data)));
                ext.point("io.ox/calendar/detail").invoke("draw", node, data);
            }

            return node;
        }
    };
});
