define("extensions/halo/appointments/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/contact:renderer").extend({
        handles: function (type) {
            return type === "calendar";
        },
        draw: function  ($node, providerName, appointments) {
            if (appointments.length === 0) {
                return;
            }
            var $list = $("<ul/>").appendTo($node);
            _(appointments).each(function (appointment) {
                $list.append($("<li/>").text(appointment.title));
            });
        }
    });
    
    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        enhances: function (type) {
            return type === "calendar";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "calendar";
        }
    });
});