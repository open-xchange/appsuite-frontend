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
 * 
 */
 
 
 // TODO: Add Caching

define("io.ox/files/api", function () {
   
   return ox.api.files = {
       
       getAll: function (folderId) {
           return ox.api.http.GET({
               module: "infostore",
               params: {
                   action: "all",
                   folder: folderId || ox.api.config.get("folder.infostore"),
                   columns: "20,1",
                   sort: "700",
                   order: "asc"
               }
           });
       },
       
       getList: function (ids) {
           return ox.api.http.fixList(ids, ox.api.http.PUT({
               module: "infostore",
               params: {
                   action: "list",
                   columns: "20,1,700,701,702,703,704,705,706,707,709,711"
               },
               data: ox.api.http.simplify(ids)
           }));
       },
         
       get: function (folderId, id) {
           return ox.api.http.GET({
               module: "infostore",
               params: {
                   action: "get",
                   folder: id,
                   id: id
               }
           });
       },
       
       search: function (query) {
           // search via pattern
           return ox.api.http.PUT({
               module: "infostore",
               params: {
                   action: "search",
                   columns: "20,1",
                   sort: "700",
                   order: "asc"
               },
               data: { pattern: query }
           });
       }
   };
});