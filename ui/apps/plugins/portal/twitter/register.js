/* EXAMPLE:

*/

/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author  Tobias Prinz <tobias.prinz@open-xchange.com>
 */
define("plugins/portal/twitter/register", ["io.ox/core/extensions", "io.ox/oauth/proxy"], function (ext, proxy) {

    "use strict";
    ext.point("io.ox/portal/widget").extend({
        id: "facebook",
        index: 140,

        load: function () {
            var def = proxy.request({api: "facebook", url: "https://api.twitter.com/statuses/home_timeline"});
            return def;
        },

        draw: function (timeline) {
            var self = this;
            self.append($("<div>").addClass("clear-title").text("Twitter"));

            var count = 0;
            _(timeline).each(function (tweet) {
                var tweets;
                self.append(tweets);
            });

            return $.Deferred().resolve();
        }
    });
    
    
});
