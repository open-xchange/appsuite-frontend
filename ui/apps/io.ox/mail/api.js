
define("io.ox/mail/api", ["io.ox/core/cache"], function (cache) {
    
    var cache = {
        all: new cache.FlatCache("", true),
        list: new cache.FlatCache("", true),
        full: new cache.FlatCache("", true)
    };

    return ox.api.mail = {

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
                    module: "mail",
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
                folder: "default0/INBOX"
            }, options);
            
            return ox.api.http.GET({
                module: "mail",
                params: {
                    action: "all",
                    folder: o.folder,
                    columns: "601,600",
                    sort: "610", // received_date
                    order: "desc"
                }
            });
        },
        
        getList: function (ids) {
            
            // contains?
            if (!cache.list.contains(ids)) {
                // cache miss
                return ox.api.http.fixList(ids, ox.api.http.PUT({
                    module: "mail",
                    params: {
                        action: "list",
                        columns: "601,600,603,607,610"
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