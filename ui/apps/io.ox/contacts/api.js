
define("io.ox/contacts/api", ["io.ox/core/cache"], function (cache) {
    
    var cache = {
        all: new cache.FlatCache("contactAll", false),
        list: new cache.FlatCache("contactList", false),
        full: new cache.FlatCache("contactFull", true)
    };

    return ox.api.contacts = {

        get: function (options) {

            var o = $.extend({
                folder: "6",
                id: 0
            }, options);
            
            var key = { folder_id: o.folder, id: o.id };

            // contains?
            if (!cache.full.contains(key)) {
                // cache miss
                return ox.api.http.GET({
                    module: "contacts",
                    params: {
                        action: "get",
                        folder: o.folder,
                        id: o.id
                    }
                })
                .done(function (data) {
                    cache.full.add(data);
                });
            } else {
                // cache hit
                return $.Deferred().resolve(cache.full.get(key));
            }
        },
        
        getAll: function (options) {
            
            var o = $.extend({
                folder: "6"
            }, options);
            
            return ox.api.http.GET({
                module: "contacts",
                params: {
                    action: "all",
                    folder: o.folder,
                    columns: "20,1,500,502",
                    sort: "607", // magic field
                    order: "asc"
                }
            });
        },
        
        getList: function (ids) {
            
            // contains?
            if (!cache.list.contains(ids)) {
                // cache miss
                return ox.api.http.fixList(ids, ox.api.http.PUT({
                    module: "contacts",
                    params: {
                        action: "list",
                        columns: "20,1,500,501,502,505,520,555,556,557,569,602"
                    },
                    data: ox.api.http.simplify(ids)
                }))
                .done(function (data) {
                    cache.list.addArray(data);
                });
            } else {
                // cache hit
                return $.Deferred().resolve(cache.list.get(ids));
            }
        },
        
        search: function (query) {
            // search via pattern
            return ox.api.http.PUT({
                module: "contacts",
                params: {
                    action: "search",
                    columns: "20,1,500,502,602",
                    sort: "607",
                    order: "asc"
                },
                data: {
                    first_name: query,
                    last_name: query,
                    email1: query,
                    email2: query,
                    email3: query,
                    orSearch: true
                }
            });
        },
        
        cache: cache
    };
});