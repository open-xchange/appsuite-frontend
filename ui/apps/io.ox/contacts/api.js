
define("io.ox/contacts/api", function () {
    
    var cache = {
        all: new ox.api.cache.FlatCache("", false),
        list: new ox.api.cache.FlatCache("", false)
    };
    
    return ox.api.contacts = {
        
        getAll: function (options) {
            
            var o = $.extend({
                folder: "6"
            }, options);
            
            return ox.api.http.GET({
                module: "contacts",
                params: {
                    action: "all",
                    folder: String(o.folder),
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
                        columns: "20,1,500,501,502,505,555,556,557"
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