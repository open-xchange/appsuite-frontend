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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("plugins/halo/view-detail",
    ["plugins/halo/api", "io.ox/core/extensions",
     "css!plugins/halo/style.css"], function (api, ext) {

    "use strict";

    return {

        draw: function (data) {

            var $container = $("<div>").addClass("io-ox-halo");

            if (api) {
                var investigations = api.halo.investigate(data),
                    drawingFinished = [];
                _(investigations).each(function (promise, providerName) {

                    var $node = $("<div/>")
                            .css({"min-width": "100px"})
                            .addClass("ray")
                            .busy()
                            .appendTo($container),
                        drawn = new $.Deferred();

                    drawingFinished.push(drawn);
                    promise.done(function (response) {
                        $node.idle();
                        var deferred = api.viewer.draw($node, providerName, response);
                        if (deferred) {
                            deferred.done(drawn.resolve);
                        } else {
                            drawn.resolve();
                        }
                    });
                });
            }

            return $container;
        }
    };
});