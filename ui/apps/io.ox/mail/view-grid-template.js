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

define("io.ox/mail/view-grid-template",
    ["io.ox/mail/util", "io.ox/core/tk/vgrid",
     "less!io.ox/mail/style.css"], function (util, VGrid) {

    "use strict";

    var that = {

        // main grid template
        main: {
            build: function () {
                var from, date, priority, subject, attachment, threadSize, flag;
                this.addClass("mail")
                    .append(
                        $("<div/>")
                            .append(date = $("<span/>").addClass("date"))
                            .append(from = $("<span/>").addClass("from"))
                    )
                    .append(
                        $("<div/>")
                            .append(threadSize = $("<div/>").addClass("threadSize"))
                            .append(attachment = $("<span/>").addClass("attachment"))
                            .append(priority = $("<span/>").addClass("priority"))
                            .append(subject = $("<span/>").addClass("subject"))
                    )
                    .append(flag = $("<div/>").addClass("flag abs"));
                return { from: from, date: date, priority: priority, subject: subject, attachment: attachment, threadSize: threadSize, flag: flag };
            },
            set: function (data, fields, index) {
                fields.priority.text(util.getPriority(data));
                fields.subject.text(_.prewrap(data.subject));
                if (!data.threadSize || data.threadSize === 1) {
                    fields.threadSize.text("").hide();
                } else {
                    fields.threadSize.text(data.threadSize).css("display", "");
                }
                fields.from.empty().append(util.getFrom(data.from), true);
                fields.date.text(util.getTime(data.received_date));
                fields.flag.get(0).className = "flag abs flag_" + data.color_label;
                fields.attachment.css("display", data.attachment ? "" : "none");
                if (util.isUnread(data)) {
                    this.addClass("unread");
                }
                if (util.isMe(data)) {
                    this.addClass("me");
                }
                if (util.isDeleted(data)) {
                    this.addClass("deleted");
                }
            }
        },

        // simple grid-based list for portal & halo
        drawSimpleGrid: function (list) {

            // use template
            var tmpl = new VGrid.Template(),
                $div = $("<div>");

            // add template
            tmpl.add(that.main);

            _(list).each(function (data, i) {
                tmpl.getClone()
                    .update(data, i).appendTo($div).node
                        .css("position", "relative")
                        .data("object-data", data)
                        .addClass("hover");
            });

            return $div;
        }
    };

    return that;
});