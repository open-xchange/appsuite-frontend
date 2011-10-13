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

define("io.ox/portal/appointments/register", ["io.ox/core/extensions"], function (ext) {
    
    "use strict";
    
    var appointmentPortal = {
        id: "appointments",
        index: 100,
        load: function () {
            var loading = new $.Deferred();
            require(["io.ox/calendar/api"], function (api) {
                api.getAll()
                    .done(function (ids) {
                        api.getList(ids.slice(0, 10))
                            .done(loading.resolve)
                            .fail(loading.reject);
                    })
                    .fail(loading.reject); // This should be easier
            });
            return loading;
        },
        draw: function (appointments) {
            var deferred = new $.Deferred(),
            $node = this;
            $node.addClass("io-ox-portal-appointments");
            $node.append($("<div/>").addClass("clear-title").text("Appointments"));
            if (appointments.length === 0) {
                $node.append("<h2>You don't have any appointments in the near future. Go take a walk!</h2>");
                deferred.resolve();
                return deferred;
            }
            require(["io.ox/calendar/util"], function (calendarUtil) {
                $node.append("<h2>Your next " + appointments.length + " appointments</h2>");
                var $list = $("<ul/>").appendTo($node);
                _(appointments).each(function (appointment) {
                    var description = appointment.title + " (" + calendarUtil.getDateInterval(appointment) + " " + calendarUtil.getTimeInterval(appointment) + ")";
                    var $entry = $("<li/>").text(description)
                        .click(function () {
                            // open dialog
                            require(["io.ox/calendar/view-detail", "io.ox/core/dialogs"], function (view, dialogs) {
                                new dialogs.ModalDialog({
                                        width: 600,
                                        easyOut: true
                                    })
                                    .append(view.draw(appointment))
                                    .addButton("close", "Close")
                                    .show();
                            });
                            return false;
                        })
                        .appendTo($list);
                });
                deferred.resolve();
            });
            return deferred;
        }
    };
    
    ext.point("io.ox/portal/widget").extend(appointmentPortal);
});