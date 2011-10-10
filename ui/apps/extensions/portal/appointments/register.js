/*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
*
* Copyright (C) Open-Xchange Inc., 2006-2011
* Mail: info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*
*/

define("io.ox/portal/appointments/register", ["io.ox/core/extensions"], function (ext) {
   
    var appointmentPortal = {
        id: "appointments",
        index: 100,
        load: function () {
            var loading = new $.Deferred();
            require(["io.ox/calendar/api"], function (api) {
                var getAll = api.getAll();
                getAll.fail(loading.reject); // This should be easier
                getAll.done(function (ids) {
                    var loadFirstTen = api.getList(ids.slice(0, 10));
                    loadFirstTen.fail(loading.reject);
                    loadFirstTen.done(loading.resolve);
                });
            });
            return loading;
        },
        draw: function (appointments) {
            var deferred = new $.Deferred(),
            $node = this;
            $node.addClass("io-ox-portal-appointments");
            $node.append("<h1>Appointments</h1>");
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
                    var $entry = $("<li/>").text(description).click(function () {
                        require(["io.ox/calendar/view-detail", "io.ox/core/lightbox", "css!io.ox/calendar/style.css"], function (viewer, lightbox) {
                            new lightbox.Lightbox({
                                getGhost: function () {
                                    return $entry;
                                },
                                buildPage: function () {
                                    return viewer.draw(appointment);
                                }
                            }).show();
                        });
                        return false;
                    });
                    $list.append($entry);
                });
                deferred.resolve();
            });
            return deferred;
        }
    };
    
    ext.point("io.ox/portal/widget").extend(appointmentPortal);
});