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

define("plugins/halo/appointments/register",
    ["io.ox/core/extensions", "gettext!plugins/halo"], function (ext, gt) {

    "use strict";

    // Taken From Calendar API
    var DAY = 60000 * 60 * 24;

    ext.point("io.ox/halo/contact:renderer").extend({
        id: "appointments",
        handles: function (type) {
            return type === "com.openexchange.halo.appointments";
        },
        draw: function  ($node, providerName, appointments) {

            var deferred = new $.Deferred();

            if (appointments.length === 0) {
                deferred.resolve();
                return deferred;
            }

            // TODO: unify with portal code (copy/paste right now)
            require(
                ["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                function (dialogs, viewGrid) {
                    $node.append($("<div/>").addClass("widget-title clear-title").text(gt("Shared Appointments")));
                    viewGrid.drawSimpleGrid(appointments).appendTo($node);

                    new dialogs.SidePopup()
                        .delegate($node, ".vgrid-cell", function (popup, e, target) {
                            var data = target.data("appointment");
                            require(["io.ox/calendar/view-detail"], function (view) {
                                popup.append(view.draw(data));
                                data = null;
                            });
                        });

                    deferred.resolve();
                }
            );

            return deferred;
        }
    });

    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        id: "request-appointments",
        enhances: function (type) {
            return type === "com.openexchange.halo.appointments";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "calendar";
            request.params.start = _.now();
            request.params.end = _.now() + 10 * DAY;
            request.params.columns = "1,20,200,201,202,220,221,400,401,402";
        }
    });
});
