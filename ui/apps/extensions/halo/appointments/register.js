define("extensions/halo/appointments/register", ["io.ox/core/extensions", "io.ox/core/lightbox"], function (ext, lightbox) {
    // Taken From Calendar API
    var DAY = 60000 * 60 * 24;
    
  
    ext.point("io.ox/halo/contact:renderer").extend({
        id: "appointments",
        handles: function (type) {
            return type === "com.openexchange.halo.appointments";
        },
        draw: function  ($node, providerName, appointments) {
            $node.append($("<div/>").addClass("clear-title").text("Appointments"));
            if (appointments.length === 0) {
                $node.append("<div>No Appointments found.</div>");
                return;
            }
            var deferred = new $.Deferred();
            require(["io.ox/calendar/util"], function (calendarUtil) {
                var $appointmentDiv = $("<div/>").appendTo($node);
                _(appointments).each(function (appointment) {
                    var description = appointment.title + " (" + calendarUtil.getDateInterval(appointment) + " " + calendarUtil.getTimeInterval(appointment) + ")";
                    var $entry = $("<div/>").text(description).click(function () {
                        require(["io.ox/calendar/view-detail", "css!io.ox/calendar/style.css"], function (viewer) {
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
                    $appointmentDiv.append($entry);
                });
                deferred.resolve();
            });
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