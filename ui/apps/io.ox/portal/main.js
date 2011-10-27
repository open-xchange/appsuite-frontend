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
        
        var resize = function () {
            
            var nodes = win.nodes.main.find(".io-ox-portal-widget"),
                availWidth = win.nodes.main.width(),
                cols = Math.max(1, availWidth / 400 >> 0),
                width = 100 / cols,
                i = 0, $i = nodes.length, last;
            for (; i < $i; i++) {
                last = i % cols === cols - 1;
                nodes.eq(i).css({
                    width: width - (last ? 0 : 2) + "%",
                    marginRight: last ? "0%": "2%"
                });
            }
        };
        
        //TODO: Add Configurability
        ext.point("io.ox/portal/widget").each(function (extension) {
            
            var $node = $("<div>")
                .addClass("io-ox-portal-widget")
                .busy()
                .appendTo(win.nodes.main);
            
            extension.invoke("load")
                .done(function (data) {
                    var drawingDone = extension.invoke("draw", $node, [data]);
                    if (drawingDone) {
                        drawingDone.done(function () {
                            $node.idle();
                        });
                    } else {
                        $node.idle();
                    }
                })
                .fail(function (e) {
                    $node.idle().text(String(e.error));
                });
        });
        
        // go!
        win.show(function () {
            $(window).bind("resize", resize);
            resize();
        });
    });
    
    
    // TODO: Resize
    
    return {
        getApp: app.getInstance
    };
});