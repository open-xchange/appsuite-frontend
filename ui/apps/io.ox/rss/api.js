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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 *
 */

define("io.ox/rss/api",
    ["io.ox/core/http",
     "io.ox/core/event",
     "io.ox/core/config",
     "io.ox/core/api/user"], function (http, Events, config, userAPI) {

    "use strict";
    var api = {
        get: function (feedUrl) {
            return http.GET({
                module: "rss",
                params: {
                    feedUrl: feedUrl
                }
            });
        },
        getMany: function (urls, params) {
            params = params || {};
            var defaults = {
                sort: 'date',
                order: 'desc',
                limit: 100 //not supported yet: manually spliced in plugins/portal/rss/register
            };
            return http.PUT({
                module: "rss",
                params: $.extend({}, defaults, params),
                data: {
                    feedUrl: urls
                }
            });
        }
    };

    return api;
});
