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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/oauth/proxy', ["io.ox/core/http"], function (http) {
    "use strict";
    
    var that = {
        request: function (options) {
            var params = {};
            if (options.api) {
                params.api = options.api;
                delete options.api;
            }
            
            if (options.account) {
                params.account = options.account;
                delete options.account;
            }
            return http.PUT({
                module: "oauth/proxy",
                params: params,
                data: options
            });
        }
    };
    
    
    return that;
});