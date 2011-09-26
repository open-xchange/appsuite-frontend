define("extensions/halo/appointments/register", ["io.ox/core/extensions", "io.ox/core/dialogs"], function (ext, dialogs) {
    ext.point("io.ox/halo/contact:renderer").extend({
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
        enhances: function (type) {
            return type === "com.openexchange.halo.appointments";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "calendar";
        }
    });
});