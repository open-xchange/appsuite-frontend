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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */
 

define("plugins/portal/appointments/register", [
    "io.ox/core/extensions",
    "io.ox/core/date",
    "gettext!plugins/portal/appointments",
    "less!plugins/portal/appointments/style.css"
], function (ext, date, gt) {

    "use strict";
 
 
    //this should be in our date library. And it could probably be done much nicer, e.g. using two lists
    var timespan = function (timestamp1, timestamp2) {
        var delta = timestamp1 - timestamp2;
        var unit = gt("In %s milliseconds");
        if (delta / 1000 > 1) {
            delta = delta / 1000;
            unit = gt("In %s seconds");
        }
        if (delta / 60 > 1) {
            delta = delta / 60;
            unit = gt("In %s minutes");
        }
        if (delta / 60 > 1) {
            delta = delta / 60;
            unit = gt("In %s hours");
        }
        if (delta / 24 > 1) {
            delta = delta / 24;
            unit = gt("In %s days");
        }
        if (delta / 7 > 1) {
            delta = delta / 7;
            unit = gt("In %s weeks");
        }
        return unit.replace("%s", Math.round(delta));
    };
    
    var loadTile = function () {
        var loadingTile = new $.Deferred();
        require(["io.ox/calendar/api"], function (api) {
            api.getAll()
                .done(function (ids) {
                    api.getList(ids.slice(0, 10))
                        .done(loadingTile.resolve)
                        .fail(loadingTile.reject);
                })
                .fail(loadingTile.reject); // This should be easier
        });
        return loadingTile;
    };
    var drawTile = function (appointments, $node) {
        var startSpan = new date.Local();
        var endSpan = startSpan + (24 * 60 * 60 * 1000);

        var nextAppointments = _(appointments).filter(function (app) {
            return app.start_date > endSpan || app.end_date < startSpan;
        });

        var today = new date.Local().format(date.DATE);

        if (appointments.length > 0) {
            var nextApp = appointments[0];
            var deltaT = timespan(nextApp.start_date, new Date().getTime());
            $('<div>').html(gt("Next") + ": <b>" + nextApp.title + '</b> (' + deltaT + ')').appendTo($node);
        }
    };

    var appointmentPortal = {
        id: "appointments",
        index: 100,
        tileWidth: 1,
        tileHeight: 2,
        title: gt('Appointments'),
        preview: function () {
            var deferred = $.Deferred();
            loadTile().done(function (appointments) {
                var $node = $('<div>');
                drawTile(appointments, $node);
                deferred.resolve($node);
            });
            return deferred;
        },
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

            $node.addClass("io-ox-portal-appointments")
                .append(
                    $("<div/>").addClass("clear-title").text("Appointments")
                );

            if (appointments.length === 0) {
                $node.append("<div><b>" + gt("You don't have any appointments in the near future. Go take a walk!") + "</b></div>");
                deferred.resolve();
            } else {
                require(
                    ["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                    function (dialogs, viewGrid) {

                        viewGrid.drawSimpleGrid(appointments).appendTo($node);

                        new dialogs.SidePopup()
                            .delegate($node, ".vgrid-cell", function (popup) {
                                var data = $(this).data("appointment");
                                require(["io.ox/calendar/view-detail"], function (view) {
                                    popup.append(view.draw(data));
                                    data = null;
                                });
                            });

                        deferred.resolve();
                    }
                );
            }
            return deferred;
        },
        post: function (ext) {
            var self = this;
            require(["io.ox/calendar/api"], function (api) {
                api.on('refresh.all', function () {
                    ext.load().done(_.bind(ext.draw, self));
                });
            });
        }
    };

    ext.point("io.ox/portal/widget").extend(appointmentPortal);
});
