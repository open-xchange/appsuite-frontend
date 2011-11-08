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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/applications/view-installed",
    ["io.ox/core/api/apps", "io.ox/applications/view-common"], function (api, view) {
    
    'use strict';
    
    return {
        
        draw: function () {
            
            var node = $("<div>")
                .append(
                    $("<div>").addClass("clear-title")
                    .text("Installed applications")
                );
                
            // get apps
            api.getInstalled('installed').done(function (list) {
                var apps = $("<div>").addClass("apps");
                _(list).each(function (data) {
                    apps.append(view.drawApp(data));
                });
                node.append(apps);
            });
            
            return node;
        }
    };
});