
define("io.ox/contacts/api", ["io.ox/core/cache"], function (cache) {
    
    var cache = {
        all: new cache.FlatCache("", false),
        list: new cache.FlatCache("", false)
    };
    
    return ox.api.contacts = {
        
        get: function (options) {
            
            var o = $.extend({
                folder: "6",
                id: 0
            }, options);
            
            return ox.api.http.GET({
                module: "contacts",
                params: {
                    action: "get",
                    folder: o.folder,
                    id: o.id
                }
            });
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
                    columns: "20,1,502",
                    sort: "502",
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
                        columns: "20,1,500,501,502,505,520,555,556,557,569,606"
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
        
        cache: cache
    };
});