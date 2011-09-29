define("extensions/halo/appointments/register", ["io.ox/core/extensions", "io.ox/core/dialogs"], function (ext, dialogs) {
    // Taken From Calendar API
    var DAY = 60000 * 60 * 24;
    
  
    ext.point("io.ox/halo/contact:renderer").extend({
        id: "appointments",
        handles: function (type) {
            return type === "com.openexchange.halo.appointments";
        },
        draw: function  ($node, providerName, appointments) {
            if (appointments.length === 0) {
                return;
            }
            var $list = $("<ul/>").appendTo($node);
            _(appointments).each(function (appointment) {
                var $entry = $("<li/>").text(appointment.title).click(function () {
                    new dialogs.ModalDialog().text(appointment.title).setUnderlayAction("ok").setDefaultAction("ok").show();
                    return false;
                });
                $list.append($entry);
            });
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