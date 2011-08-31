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
        if (matches[1]) {
            return matches[1];
        }
    }
    
    // Upload a file and store it
    // As options, we expect:
    // "folder" - The folder ID to upload the file to. This is optional and defaults to the standard files folder
    // "file" - the file object to upload
    // The method returns a deferred that is resolved once the file has been uploaded
    api.uploadFile = function (options) {
        // Alright, let's simulate a multipart formdata form
        options.folder = options.folder || config.get("folder.infostore");
        // TODO: This might make more sense in http.js
        var formData = new FormData();
        formData.append("file", options.file);
        formData.append("json", "{folder_id: "+options.folder+"}");
        var deferred = new $.Deferred();
        
        $.ajax({
           url: ox.ajaxRoot+"/infostore?action=new&session="+ox.session,
           data: formData,
           cache: false,
           contentType: false,
           processData: false,
           type: 'POST',
           success: function(data){
               deferred.resolve(fallbackForOX6BackendREMOVEME(data));
           }
        });
        
        return deferred;
    };
    
    return api;
    
});