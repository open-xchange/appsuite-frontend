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

define("io.ox/portal/mail/register",
    ["io.ox/core/extensions"], function (ext, api) {
    
    "use strict";
    
    ext.point("io.ox/portal/widget").extend({
        id: "mail",
        index: 300,
        load: function () {
            var loading = new $.Deferred();
            require(["io.ox/mail/api"], function (api) {
                api.getAll()
                    .done(function (ids) {
                        api.getList(ids.slice(0, 5))
                            .done(loading.resolve)
                            .fail(loading.reject);
                    })
                    .fail(loading.reject);
            });
            return loading;
        },
        draw: function (list) {
            
            var deferred = new $.Deferred(),
                $node = this;
            
            $node.addClass("io-ox-portal-mail")
                .append(
                    $("<div/>").addClass("clear-title")
                        .text("Your Inbox")
                );
            
            if (list.length === 0) {
                
                $node.append("<div><b>No mails at all!</b></div>");
                deferred.resolve();
                
            } else {
                
                require(
                    ["io.ox/core/tk/dialogs", "io.ox/mail/view-grid-template"],
                    function (dialogs, viewGrid) {
                        
                        viewGrid.drawSimpleGrid(list).appendTo($node);
                        
                        new dialogs.SidePopup(600)
                            .delegate($node, ".vgrid-cell", function (popup) {
                                var data = $(this).data("object-data");
                                require(["io.ox/mail/view-detail", "io.ox/mail/api"], function (view, api) {
                                    api.get(data).done(function (data) {
                                        popup.append(
                                            view.draw(data).removeClass("page")
                                        );
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
});