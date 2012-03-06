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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("plugins/halo/mail/register",
    ["io.ox/core/extensions"], function (ext) {

    "use strict";

    ext.point("io.ox/halo/contact:renderer").extend({
        id: "mail",
        handles: function (type) {
            return type === "com.openexchange.halo.mail";
        },
        draw: function  ($node, providerName, mail) {

            var deferred = new $.Deferred();

            $node.append(
                $("<div/>").addClass("widget-title clear-title").text("Recent e-mail conversations")
            );

            if (mail.length === 0) {

                $node.append("<div/>").text("No e-mails seem to have been exchanged previously.");
                deferred.resolve();

            } else {
                // TODO: unify with portal code (copy/paste right now)
                require(
                    ["io.ox/core/tk/dialogs", "io.ox/mail/view-grid-template", "io.ox/mail/api"],
                    function (dialogs, viewGrid, api) {
                        var sent = [];
                        var received = [];
                        viewGrid.drawSimpleGrid(mail).appendTo($node);

                        new dialogs.SidePopup()
                            .delegate($node, ".vgrid-cell", function (popup) {

                                var msgData = $(this).data("objectData");
                                api.get(msgData).done(function (data) {
                                    require(["io.ox/mail/view-detail"], function (view) {
                                        popup.append(view.draw(data).removeClass("page"));
                                        data = null;
                                    });
                                });
                            });

                        deferred.resolve();
                    }
                );
            }

            return deferred;
        }
    });

    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        id: "request-mail",
        enhances: function (type) {
            return type === "com.openexchange.halo.mail";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "mail";
            request.params.limit = 10;
            request.params.columns = "102,600,601,602,603,604,605,606,607,608,609,610,611,612,614,652";
        }
    });
});