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
    
    function show (data) {
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
            (function () {
                var point = ext.point("io.ox/halo/person:renderer");
                function buildRenderer($div) {
                    return function (info) {
                        if (info.data) {
                            // Alright, we've got something renderable
                            point.each(function (extension) {
                               if (extension.handles(info.type)) {
                                    var $extDiv = $("<div/>");
                                    $div.append($extDiv);
                                    var deferred = extension.render(info.data, $extDiv);
                                    if (deferred) {
                                        $extDiv.busy();
                                        deferred.done(function () {$extDiv.idle();});
                                    }
                               } 
                            });
                        }
                        if (info.token) {
                            // Alright, we need to fetch some more data
                            var $extDiv = $("<div/>");
                            $extDiv.busy();
                            $div.append($extDiv);
                            api.resolve(info.token).done(function (response) {
                                // TODO: Error Handling
                                $extDiv.idle();
                                buildRenderer($extDiv)(response.data);
                            });
                        }
                    };
                }
                var $div = $("<div/>");
                $div.busy();
                win.nodes.main.append($div);
                api.person(data).done(function (response) {
                    _(response.data).each(buildRenderer($div));
                    $div.idle();
                });
            }());
            
            ext.point("io.ox/halo/person:generic").each(function (extension) {
                var $div = $('<$div />');
                var deferred = extension.render(data, $div);
                if (deferred) {
                    $div.busy();
                    deferred.done(function () { $div.idle(); });
                }
                win.nodes.main.append($div);
            });
                
            win.show();
        });
        
        app.launch();
    }
    
    return {
        show: show
    };
});
