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

define("extensions/halo/main", ["io.ox/contacts/base", "css!io.ox/contacts/style.css"], function (base) {

    function show (data) {
        
        var app = ox.ui.createApp({
                title: data.display_name || "Halo",
                icon: "apps/extensions/halo/halo.png"
            });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({
                chromeless: true
            });
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            win.nodes.main
                .bind("click", function () {
                    win.close();
                    win = null;
                })
                .append(
                    base.draw(data)
                );
            
            win.show();
        });
        
        app.launch();
    }
    
    return {
        show: show
    };
});
