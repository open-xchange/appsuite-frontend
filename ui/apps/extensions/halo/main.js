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

define("extensions/halo/main", ["extensions/halo/api", "io.ox/core/extensions", "css!extensions/halo/style.css"], function (api, ext) {
    
    function show(data) {
        
        var app = ox.ui.createApp({
            title: data.display_name || "Halo"
        });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({});
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            win.nodes.main.css({overflow: "auto"});
            // Trigger Server Halo API
            var $busyIndicator = $("<div/>").css({"float": "left", "margin": "10px", "height": "100px"}).addClass("ray busyIndicator");
            $busyIndicator.busy();
            win.nodes.main.append($busyIndicator);

            if (api) {
                var investigations = api.halo.investigate(data);
                var drawingFinished = [];
                _(investigations).each(function (promise, providerName) {
                    var $node = $("<div/>").css({"float": "left", "margin": "5px", "min-width": "100px"}).addClass("ray");
                    win.nodes.main.append($node);
                    var drawn = new $.Deferred();
                    drawingFinished.push(drawn);
                    promise.done(function (response) {
                        var $newNode = $("<div/>").css({"float": "left", "margin": "10px"}).addClass("ray done");
                        var deferred = api.viewer.draw($newNode, providerName, response);
                        if (deferred) {
                            deferred.done(function () {
                                $node.imagesLoaded(function () {
                                    $node.after($newNode);
                                    $node.remove();
                                    win.nodes.main.masonry("reload");
                                    drawn.resolve();
                                });
                            });
                        } else {
                            win.nodes.main.masonry("reload");
                            $node.imagesLoaded(function () {
                                win.nodes.main.masonry("reload");
                                drawn.resolve();
                            });
                        }
                    });
                });
                $.when.apply($, drawingFinished).done(function () {
                    $busyIndicator.remove();
                    win.nodes.main.masonry("reload");
                });
                win.nodes.main.masonry({
                    itemSelector : '.ray',
                    columnWidth: 100,
                    isAnimated : true
                });
            }
            
            win.show();
            $busyIndicator.css("width", win.nodes.main.width() + "px");
        });
        
        app.launch();
    }
    
    return {
        show: show
    };
});
