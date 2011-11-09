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

define("extensions/halo/register", ["io.ox/core/extensions"], function (ext) {
    
    "use strict";
    
    ext.point("io.ox/core/person:action").extend({
        index: 10,
        id: "default",
        label: "Halo",
        action: function (data, e) {
            // get all extensions
            var tmp = _(ox.serverConfig.extensions.halo)
                .map(function (obj) {
                    return "extensions/" + obj + "/register";
                });
            // require detail view, dialogs & all halo extensions
            require(
                ["extensions/halo/view-detail", "io.ox/core/tk/dialogs",
                 "io.ox/core/api/user"
                ].concat(tmp), function (view, dialogs) {
                    new dialogs.SidePopup()
                        .show(e, function (popup) {
                            popup.append(view.draw(data));
                        });
                }
            );
        }
    });
    
    ext.point("io.ox/testing/suite").extend({
        id: "default",
        file: "extensions/halo/config-test",
        title: "Halo Config"
    });
});