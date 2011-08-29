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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * 
 */

define("io.ox/files/api", ["io.ox/core/http", "io.ox/core/api-factory", "io.ox/core/config"], function (http, ApiFactory, config) {
   
    // generate basic API
    var api = ApiFactory({
        module: "infostore",
        requests: {
            all: {
                action: "all",
                folder: config.get("folder.infostore"),
                columns: "20,1",
                sort: "700",
                order: "asc"
            },
            list: {
                action: "list",
                columns: "20,1,700,701,702,703,704,705,706,707,709,711"
            },
            get: {
                action: "get"
            },
            search: {
                action: "search",
                columns: "20,1",
                sort: "700",
                order: "asc",
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });
    
    return api;
    
});