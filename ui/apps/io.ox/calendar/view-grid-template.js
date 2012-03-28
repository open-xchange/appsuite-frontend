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
    ["io.ox/calendar/util", "io.ox/core/tk/vgrid",
     "less!io.ox/calendar/style.css"], function (util, VGrid) {

    "use strict";

    var that = {

        // main grid template
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
                fields.title.text(data.title || '');
                fields.location.text(data.location || '');
                fields.time.text(util.getTimeInterval(data));
                fields.date.text(util.getDateInterval(data));
                fields.shown_as.get(0).className = "abs shown_as " + util.getShownAsClass(data);
            }
        },

        // template for labels
        label: {
            build: function () {
                this.addClass("calendar-label");
            },
            set: function (data, fields, index) {
                var d = util.getSmartDate(data.start_date);
                this.text(d);
            }
        },

        // detect new labels
        requiresLabel: function (i, data, current) {
            var d = util.getSmartDate(data.start_date);
            return (i === 0 || d !== current) ? d : false;
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
                        .data("appointment", data)
                        .addClass("hover");
            });

            return $div;
        },

        // simple click handler used by several simple grids
        hOpenDetailPopup: function (e) {

            var data = e.data || $(this).data("appointment");

            require(["io.ox/calendar/view-detail", "io.ox/core/tk/dialogs"],
                function (view, dialogs) {
                    new dialogs.ModalDialog({
                            width: 600,
                            easyOut: true
                        })
                        .append(view.draw(data))
                        .addButton("close", "Close")
                        .show();
                    data = null;
                }
            );

            return false;
        }
    };

    return that;
});