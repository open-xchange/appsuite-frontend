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
 *
 */

define("io.ox/contacts/api",
    ["io.ox/core/http", "io.ox/core/api/factory"], function (http, apiFactory) {
    
    "use strict";
    
    // generate basic API
    var api = apiFactory({
        module: "contacts",
        requests: {
            all: {
                action: "all",
                folder:  "11179",//6
                columns: "20,1,500,502",
                sort: "607", // magic field
                order: "asc"
            },
            list: {
                action: "list",
                columns: "20,1,500,501,502,505,520,555,556,557,569,602"
            },
            get: {
                action: "get"
            },
            search: {
                action: "search",
                columns: "20,1,500,502,602",
                sort: "607",
                order: "asc",
                getData: function (query) {
                    return {
                        first_name: query,
                        last_name: query,
                        email1: query,
                        email2: query,
                        email3: query,
                        orSearch: true
                    };
                }
            }
        }
    });
    
    api.newContact = function (formdata) {
                        return http.PUT({module: "contacts", params: {action: "new"}, data: formdata, datatype: "text"})
                        .done(_.lfo(function () {
                            api.caches.all.clear();
                            api.caches.list.clear();
                            api.trigger("refresh.all");
                        }))
                        .fail(function () {
                            console.log("connection lost");
                        }); //what to do if fails?
                    };
                    
    api.editContact =  function (formdata) {
        //console.log(formdata);
                            return http.PUT({module: "contacts", params: {action: "update", id: formdata.id, folder: formdata.folderId, timestamp: formdata.timestamp},
                             data: formdata, datatype: "text"})
                            .done(_.lfo(function () {
                                api.caches.all.clear();
                                api.caches.get.clear();
                                api.caches.list.clear();
                                api.trigger("refresh.all");
                            }))
                            .fail(function () {
                                console.log("connection lost");
                            }); //what to do if fails?
                        };
                        
    api.deleteContact =  function (formdata) {
                                console.log(formdata);
                                return http.PUT({module: "contacts", params: {action: "delete", timestamp: formdata.last_modified},
                                data: {folder: formdata.folder_id, id: formdata.id}, datatype: "text"})
                               .done(_.lfo(function () {
                                    api.caches.all.clear();
                                    api.caches.list.clear();
                                    api.trigger("refresh.all");
                                }))
                               .fail(function () {
                                    console.log("connection lost");
                                }); //what to do if fails?
                                //alert("weg");
                            };
                 
    return api;
    
});