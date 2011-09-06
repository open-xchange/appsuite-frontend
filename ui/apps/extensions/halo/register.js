/**
 * 
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
 * 
 */

define("extensions/halo/register", ["io.ox/core/extensions"], function (ext) {
    
    var reg = ext.registry;
    
    reg.point("io.ox/core/person:action").register({
        index: 10,
        label: "Halo",
        action: function (data) {
            
            var win = ox.ui.createWindow({
                chromeless: true
            });
            
            win.nodes.main.append(
                    $("<h1/>").text("Halo of " + data.displayName)
                )
                .bind("click", function () {
                    win.destroy();
                    win = null;
                });
            
            win.show();
        }
    });
});