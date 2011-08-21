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

define("io.ox/mail/new",
    ["io.ox/mail/api", "css!io.ox/mail/style.css"], function (api) {

    // multi instance pattern
    function createInstance () {
        
        var app = ox.ui.createApp({
            title: "New E-Mail"
        });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({
                title: "New E-Mail",
                toolbar: true
            });
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            win.show();
        });
        
        return app;
    }
    
    return {
        getApp: createInstance
    };
    
});