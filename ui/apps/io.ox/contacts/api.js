
define("io.ox/contacts/api", function () {
    
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
                    columns: "1,20,502",
                    sort: "502",
                    order: "asc"
                }
            });
        },
        
        getList: function (ids) {
            
            var i = 0, item;
            for (; item = ids[i]; i++) {
                if (item.folder_id !== undefined) {
                    item.folder = item.folder_id;
                    delete item.folder_id;
                }
            }

            return ox.api.http.PUT({
                module: "contacts",
                params: {
                    action: "list",
                    columns: "1,20,502,501,555,556,557"
                },
                data: ids
            });
        }
    };
});