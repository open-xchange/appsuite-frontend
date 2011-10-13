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

//TODO: remove this global stuff
var tmp = _(ox.serverConfig.extensions.portal)
    .map(function (obj) {
        "use strict";
        return "extensions/" + obj + "/register";
    });

define("io.ox/portal/main", ["io.ox/core/extensions", "css!io.ox/portal/style.css"].concat(tmp), function (ext) {
    
    "use strict";
    
    // application object
    var app = ox.ui.createApp(),
        // app window
        win;
    // launcher
    app.setLauncher(function () {
        
        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "Portal",
            toolbar: true
        }));
        
        win.nodes.main.addClass("io-ox-portal").css({overflow: "auto"});
        
        
        //TODO: Add Configurability
        ext.point("io.ox/portal/widget").each(function (extension) {
            
            var $node = $("<div/>").addClass("io-ox-portal-widget");
            $node.busy();
            win.nodes.main.append($node);
            var loadingData =  extension.invoke("load");
            if (loadingData) {
                loadingData.done(function (data) {
                    $node.idle();
                    var $newNode = $("<div/>").addClass("io-ox-portal-widget");
                    var drawingDone = extension.invoke("draw", $newNode, [data]);
                    if (drawingDone) {
                        drawingDone.done(function () {
                            $node.after($newNode);
                            $node.remove();
                            //win.nodes.main.masonry("reload");
                            $newNode.imagesLoaded(function () {
                                //win.nodes.main.masonry("reload");
                            });
                        });
                    }
                });
            } else {
                $node.remove(); // Shrug
            }
        });
        
        
        // go!
        win.show();

        // win.nodes.main.masonry({
        //             itemSelector : '.io-ox-portal-widget',
        //             columnWidth: win.nodes.main.width() / 3,
        //             isAnimated : true
        //         });
    });
    
    
    // TODO: Resize
    
    return {
        getApp: app.getInstance
    };
});