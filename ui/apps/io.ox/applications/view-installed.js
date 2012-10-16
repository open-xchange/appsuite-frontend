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

        draw: function (context) {

            var node = $("<div>")
                .append(
                    $("<div>").addClass("clear-title")
                    .text("Installed applications")
                )
                .append(
                    $("<p>").text(
                        'Your favorite applications, designated by ' + "\u2605" +
                        ', are always shown in the top left navigation bar. ' +
                        'This allows a faster start of your favorites.'
                    )
                );

            // get apps
            var apps = $("<div>").addClass("apps");
            
            api.getInstalled('installed').done(function (installed) {
                _(installed).each(function (data) {
                    apps.append(view.drawApp(data, context));
                });
                node.children().eq(1).after(apps);
            });
            
            return node;
        }
    };
});