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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * 
 */

define("extensions/halo/main", ["extensions/halo/api", "io.ox/core/extensions"], function (api, ext) {
    var haloAPI = null;
    
    var main = {
        show: null
    };
    
    function initialisedShow (data) {
        var app = ox.ui.createApp({
                title: data.display_name || "Halo"
                //icon: "apps/extensions/halo/halo.png"
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
                });
                
            // Trigger Server Halo API
            var investigations = haloAPI.investigate(data);
            _(investigations).each(function (promise, providerName) {
                var $node = $("<div/>");
                $node.busy();
                win.nodes.main.append($node);
                
                promise.done(function (response) {
                    $node.idle();
                    api.viewer.draw($node, providerName, response);
                });
            });
                
            win.show();
        });
        
        app.launch();
    }
    
    main.show = function (data) {
        api.init().done(function (halo) {
            haloAPI = halo;
            main.show = initialisedShow;
            main.show(data);
        });
    };
       
    return main;
});
