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

    function fallbackForOX6BackendREMOVEME (htmlpage) {
        // Extract the JSON text
        var matches = /\((\{.*?\})\)/.exec(htmlpage);
        return matches && matches[1] ? JSON.parse(matches[1]) : {};
    }
    
    // Upload a file and store it
    // As options, we expect:
    // "folder" - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // "file" - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadFile = function (options) {
        
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: config.get("folder.infostore")
        }, options || {});
        
        // TODO: This might make more sense in http.js
        var formData = new FormData();
        formData.append("file", options.file);
        formData.append("json", "{folder_id: " + options.folder + "}");
        
        // TODO: (remove comment)
        // moved some logic into http.api -> UPLOAD for FormData
        return http.UPLOAD({
                module: "infostore",
                params: { action: "new" },
                data: formData,
                dataType: "text"
            })
            .pipe(function (data) {
                // clear folder cache
                api.caches.all.remove(options.folder);
                return fallbackForOX6BackendREMOVEME(data);
            });
        // TODO: remove comment
        // learned just some days ago: instead of wrapping deferred
        // to manipulate the result you can use the pipe concept
    };
    
    return api;
    
});