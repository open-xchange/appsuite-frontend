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
            
            $node.addClass("io-ox-portal-appointments")
                .append(
                    $("<div/>").addClass("clear-title").text("Appointments")
                );
            
            if (appointments.length === 0) {
                
                $node.append("<div><b>You don't have any appointments in the near future. Go take a walk!</b></div>");
                deferred.resolve();
                
            } else {
                
                require(
                    ["io.ox/calendar/util",
                     "io.ox/core/tk/vgrid",
                     "io.ox/calendar/view-grid-template",
                     "css!io.ox/calendar/style.css"
                    ], function (util, VGrid, gridTemplate) {
                    
                    // use template
                    var tmpl = new VGrid.Template(),
                        $div = $("<div>");
                    
                    // add template
                    tmpl.add(gridTemplate.main);
                    
                    var fnClick = function (e) {
                        // open dialog
                        require(["io.ox/calendar/view-detail", "io.ox/core/tk/dialogs"], function (view, dialogs) {
                            new dialogs.ModalDialog({
                                    width: 600,
                                    easyOut: true
                                })
                                .append(view.draw(e.data))
                                .addButton("close", "Close")
                                .show();
                        });
                        return false;
                    };
                    
                    _(appointments).each(function (data, i) {
                        tmpl.getClone()
                            .update(data, i).appendTo($div)
                            .node.css("position", "relative")
                            .bind("click", data, fnClick);
                    });
                    
                    $node.append($div);
                    deferred.resolve();
                });
            }
            return deferred;
        }
    };
    
    ext.point("io.ox/portal/widget").extend(appointmentPortal);
});