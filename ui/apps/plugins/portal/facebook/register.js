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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>, Tobias Prinz <tobias.prinz@open-xchange.com>
 */
define("plugins/portal/facebook/register", ["io.ox/core/extensions", "io.ox/oauth/proxy"], function (ext, proxy) {

    "use strict";
    
    ext.point("io.ox/portal/widget").extend({
        id: "facebook",
        index: 1,

        load: function () {
            console.log("LOADED FB");
            var def = proxy.request({api: "facebook", url: "https://graph.facebook.com/me/feed"});
            console.log(def);
            return def;
        },

        draw: function (wall) {
            console.log("DRAWING FB", wall);
            var self = this;

            _(wall).each(function (post) {
                var title = post.message || post.story;
                self.append($("<h1>").text(title));
            });
            
            console.log(self);

            return $.Deferred().resolve();
        }
    });
    
    
});
