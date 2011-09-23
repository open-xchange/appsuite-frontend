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
    
    var getDate = function (timestamp) {
        var d = new Date(timestamp);
        return _.pad(d.getUTCDate(), 2) + "." + _.pad(d.getUTCMonth() + 1, 2) + "." + d.getUTCFullYear();
    };
    
    var getTime = function (timestamp) {
        var d = new Date(timestamp);
        return _.pad(d.getUTCHours(), 2) + ":" + _.pad(d.getUTCMinutes(), 2);
    };
    
    var getInterval = function (data) {
        if (data.full_time) {
            return "Whole day";
        } else {
            return getTime(data.start_date) + " - " + getTime(data.end_date);
        }
    };
    
    var draw = function (data) {
        
        if (!data) {
            return $();
        }
        
        var list = data.participants, $i = list.length,
            participants = $i > 1 ? $("<div>").addClass("participants") : $(),
            note = data.note ? $("<div>").addClass("note").text(data.note) : $();
        
        var node = $("<div>")
            .addClass("calendar-detail")
            .append(
                $("<div>").addClass("date")
                .append(
                   $("<span>").addClass("interval").text(getInterval(data))
                )
                .append($("<br>"))
                .append(
                   $("<span>").addClass("day").text(getDate(data.start_date))
                )
            )
            .append(
                $("<div>")
                .append($("<span>").addClass("title").text(data.title))
                .append($("<br>"))
                .append($("<span>").addClass("location").text(data.location))
            )
            .append(participants)
            .append(note);
        
        // has participants?
        if ($i > 1) {
            note.hide();
            participants.busy();
            // get user API
            require(["io.ox/core/users"], function (api) {
                var ids = _(list)
                    .select(function (obj) {
                        // select internal users only
                        return obj.type === 1;
                    })
                    .map(function (obj) {
                        // reduce to id
                        return obj.id;
                    });
                api.getList(ids).done(function (data) {
                    // loop over internal users
                    var list = $("<div>").addClass("participant-list");
                    _(data).each(function (obj) {
                        list.append(
                           $("<div>").addClass("participant person").text(obj.display_name || "HURZ")
                        );
                    });
                    participants.idle()
                        .append(list)
                        .append($("<div>").addClass("participants-clear"));
                    note.show();
                });
            });
        }
        
        return node;
    };
    
    return {
        getTime: getTime,
        getDate: getDate,
        getInterval: getInterval,
        draw: draw
    };
});